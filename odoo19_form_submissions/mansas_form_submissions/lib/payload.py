# Part of the Mansas Moguls form submissions module. License LGPL-3.
"""Validation for website inquiry payloads.

These rules mirror the website's ``src/lib/leads/schema.ts`` and
``src/lib/leads/spam.ts`` so that Odoo enforces the same contract as the form
and the website's server route. The module is pure Python (no Odoo imports)
so the rules stay easy to read and test.

Envelope sent by the website's server route (POST body)::

    {
      "submission": { ...the exact JSON the browser posted to /api/leads... },
      "meta": {
        "source_url": "https://mansasmoguls.com",   # optional
        "client_ip_hash": "<64 hex chars>",          # optional, salted SHA-256
        "user_agent": "Mozilla/5.0 ...",             # optional
        "received_at": "2026-11-18T10:00:00.000Z"    # optional, ISO 8601
      }
    }
"""
import re
import unicodedata
from datetime import datetime, timezone

# Field limits (schema.ts LIMITS).
LIMITS = {
    'name': 120,
    'email': 254,
    'company': 160,
    'description': 4000,
    'phone': 32,
    'services': 20,
}

# Budget labels as the website sends them, mapped to stable selection keys.
BUDGETS = [
    ('undisclosed', 'Prefer not to say'),
    ('under_10k', 'Under USD 10k'),
    ('10k_25k', 'USD 10k–25k'),
    ('25k_75k', 'USD 25k–75k'),
    ('75k_150k', 'USD 75k–150k'),
    ('above_150k', 'Above USD 150k'),
]
BUDGET_BY_LABEL = {label: key for key, label in BUDGETS}

CHANNELS = [
    ('email', 'Email'),
    ('phone', 'Phone'),
    ('video', 'Video call'),
]
CHANNEL_KEYS = {key for key, _label in CHANNELS}

ATTRIBUTION_KEYS = (
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'landing_path', 'referrer_origin',
)
SUBMISSION_KEYS = frozenset({
    'name', 'email', 'company', 'services', 'description', 'budget', 'contact',
    'phone', 'submissionId', 'startedAt', 'website', 'attribution',
})
ENVELOPE_KEYS = frozenset({'submission', 'meta'})
META_KEYS = frozenset({'source_url', 'client_ip_hash', 'user_agent', 'received_at'})

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')
PHONE_RE = re.compile(r'^\+?[\d\s()-]{7,20}$', re.ASCII)
UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', re.I)
SLUG_RE = re.compile(r'^[a-z0-9][a-z0-9-]{0,63}$')
IP_HASH_RE = re.compile(r'^[0-9a-f]{64}$')
URL_RE = re.compile(r'^https?://[^\s/$.?#][^\s]*$', re.I)
# C0 control characters except tab, LF and CR, plus DEL (schema.ts `str`).
CONTROL_RE = re.compile('[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]')

# Spam timing (spam.ts MIN_FILL_MS / MAX_FILL_MS).
MIN_FILL_MS = 3000
MAX_FILL_MS = 24 * 60 * 60 * 1000

INVALID_REQUEST = 'Invalid request.'


class PayloadError(Exception):
    """Raised when the payload is invalid. ``errors`` maps field to message."""

    def __init__(self, errors):
        super().__init__(INVALID_REQUEST)
        self.errors = errors


def clean_str(value):
    """NFC-normalise, strip control characters and trim. Non-strings become ''."""
    if not isinstance(value, str):
        return ''
    return CONTROL_RE.sub('', unicodedata.normalize('NFC', value)).strip()


def _validate_fields(v):
    """Field rules, identical to ``validateFields`` in schema.ts."""
    e = {}
    name = v['name']
    if len(name) < 2:
        e['name'] = 'Please enter your name.'
    elif len(name) > LIMITS['name']:
        e['name'] = f"Please keep your name under {LIMITS['name']} characters."
    email = v['email']
    if not EMAIL_RE.match(email) or len(email) > LIMITS['email']:
        e['email'] = 'Enter an email address like name@company.com.'
    if len(v['company']) > LIMITS['company']:
        e['company'] = f"Please keep the company name under {LIMITS['company']} characters."
    services = v['services']
    if not services:
        e['services'] = 'Choose at least one area you are interested in.'
    elif len(services) > LIMITS['services'] or any(not SLUG_RE.match(s) for s in services):
        e['services'] = 'Choose services from the list.'
    d = v['description']
    if len(d) < 20:
        e['description'] = 'Tell us a little more: at least 20 characters.'
    elif len(d) > LIMITS['description']:
        e['description'] = f"Please keep the description under {LIMITS['description']} characters."
    if v['budget'] not in BUDGET_BY_LABEL:
        e['budget'] = 'Choose a budget range from the list.'
    if v['contact'] not in CHANNEL_KEYS:
        e['contact'] = 'Choose a contact method.'
    if v['contact'] == 'phone' and not PHONE_RE.match(v['phone']):
        e['phone'] = 'Enter a phone number, including the country code.'
    return e


def parse_submission(raw):
    """Strict parse of the browser payload. Returns a normalised dict or raises PayloadError."""
    if not isinstance(raw, dict):
        raise PayloadError({'_form': INVALID_REQUEST})
    if set(raw) - SUBMISSION_KEYS:
        raise PayloadError({'_form': INVALID_REQUEST})

    services = []
    if isinstance(raw.get('services'), list):
        for s in raw['services']:
            if isinstance(s, str):
                s = s.strip()
                if s not in services:
                    services.append(s)

    fields = {
        'name': clean_str(raw.get('name')),
        'email': clean_str(raw.get('email')).lower(),
        'company': clean_str(raw.get('company')),
        'services': services,
        'description': clean_str(raw.get('description')),
        'budget': clean_str(raw.get('budget')) or BUDGETS[0][1],
        'contact': clean_str(raw.get('contact')) or 'email',
        'phone': clean_str(raw.get('phone')),
    }
    errors = _validate_fields(fields)

    submission_id = clean_str(raw.get('submissionId')).lower()
    if not UUID_RE.match(submission_id):
        errors['_form'] = INVALID_REQUEST

    started_at = raw.get('startedAt')
    if isinstance(started_at, bool) or not isinstance(started_at, (int, float)) or started_at != started_at:
        started_at = 0
    elif started_at in (float('inf'), float('-inf')):
        started_at = 0

    attribution = {}
    if isinstance(raw.get('attribution'), dict):
        for k in ATTRIBUTION_KEYS:
            val = clean_str(raw['attribution'].get(k))[:200]
            if val:
                attribution[k] = val

    if errors:
        raise PayloadError(errors)

    if fields['contact'] != 'phone':
        fields['phone'] = fields['phone'] if fields['phone'] and PHONE_RE.match(fields['phone']) else ''

    fields.update({
        'submission_id': submission_id,
        'started_at_ms': int(started_at),
        'honeypot': clean_str(raw.get('website')),
        'attribution': attribution,
        'budget_key': BUDGET_BY_LABEL[fields['budget']],
    })
    return fields


def parse_meta(raw):
    """Optional server-side metadata from the website. Unknown keys are rejected."""
    if raw is None:
        return {}
    if not isinstance(raw, dict) or set(raw) - META_KEYS:
        raise PayloadError({'_form': INVALID_REQUEST})
    meta = {}
    url = clean_str(raw.get('source_url'))
    if url:
        if len(url) > 2048 or not URL_RE.match(url):
            raise PayloadError({'_form': INVALID_REQUEST})
        meta['source_url'] = url
    ip_hash = clean_str(raw.get('client_ip_hash')).lower()
    if ip_hash:
        if not IP_HASH_RE.match(ip_hash):
            raise PayloadError({'_form': INVALID_REQUEST})
        meta['client_ip_hash'] = ip_hash
    ua = clean_str(raw.get('user_agent'))
    if ua:
        meta['user_agent'] = ua[:300]
    received = clean_str(raw.get('received_at'))
    if received:
        meta['received_at'] = parse_iso_datetime(received)
    return meta


def parse_envelope(raw):
    """Parse ``{"submission": {...}, "meta": {...}}``. Returns (submission, meta)."""
    if not isinstance(raw, dict) or 'submission' not in raw or set(raw) - ENVELOPE_KEYS:
        raise PayloadError({'_form': INVALID_REQUEST})
    return parse_submission(raw['submission']), parse_meta(raw.get('meta'))


def parse_iso_datetime(value):
    """ISO 8601 → naive UTC datetime (Odoo stores UTC). Returns None if unparseable."""
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def check_spam(submission, now_ms, min_fill_ms=MIN_FILL_MS, max_fill_ms=MAX_FILL_MS):
    """Same checks as spam.ts. Returns None, 'honeypot', 'too-fast' or 'stale'."""
    if submission['honeypot']:
        return 'honeypot'
    started = submission['started_at_ms']
    elapsed = now_ms - started
    if not started or elapsed < min_fill_ms:
        return 'too-fast'
    if elapsed > max_fill_ms:
        return 'stale'
    return None
