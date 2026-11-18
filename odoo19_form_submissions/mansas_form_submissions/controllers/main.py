# Part of the Mansas Moguls form submissions module. License LGPL-3.
"""Public API that receives website contact-form submissions.

POST /api/mansas/v1/form-submissions
    Authorization: Bearer <key generated in Odoo>
    Content-Type: application/json
    Body: {"submission": {...}, "meta": {...}}  (see lib/payload.py)

GET  /api/mansas/v1/ping
    Authorization: Bearer <key>
    Checks connectivity and the key without creating anything.

Every response is JSON with ``ok`` and, on failure, a machine-readable ``code``
that matches the codes the website's own /api/leads route already uses.
Logs record outcomes only, never names, emails, phones or message text.
"""
import json
import logging
import time

from psycopg2 import IntegrityError

from odoo import fields, http
from odoo.exceptions import ValidationError
from odoo.http import request

from ..lib.payload import PayloadError, check_spam, parse_envelope

_logger = logging.getLogger(__name__)

MAX_BODY_BYTES = 16 * 1024
PARAM_IP_LIMIT = 'mansas_form_submissions.ip_rate_limit_per_minute'
PARAM_MIN_FILL_MS = 'mansas_form_submissions.min_fill_ms'
DEFAULT_IP_LIMIT = 5


class FormSubmissionController(http.Controller):

    # ── helpers ────────────────────────────────────────────────────────────
    @staticmethod
    def _json(status, body, extra_headers=None):
        headers = [('Cache-Control', 'no-store'), ('X-Content-Type-Options', 'nosniff')]
        headers += extra_headers or []
        return request.make_json_response(body, headers=headers, status=status)

    def _done(self, status, body, outcome, t0, key=None, **extra):
        _logger.info(
            'form-submission outcome=%s status=%s ms=%d key=%s %s',
            outcome, status, (time.monotonic() - t0) * 1000,
            key.key_index if key else '-',
            ' '.join(f'{k}={v}' for k, v in extra.items()))
        hdrs = [('WWW-Authenticate', 'Bearer realm="mansas-form-submissions"')] if status == 401 else None
        if status == 429:
            hdrs = [('Retry-After', '60')]
        return self._json(status, body, hdrs)

    @staticmethod
    def _bearer():
        auth = request.httprequest.headers.get('Authorization', '')
        scheme, _sep, token = auth.partition(' ')
        return token.strip() if scheme.lower() == 'bearer' else ''

    def _int_param(self, key, default):
        try:
            value = int(request.env['ir.config_parameter'].sudo().get_param(key, default))
        except (TypeError, ValueError):
            return default
        return value if value >= 0 else default

    # ── routes ─────────────────────────────────────────────────────────────
    @http.route('/api/mansas/v1/ping', type='http', auth='public', methods=['GET'],
                csrf=False, save_session=False)
    def ping(self, **_kw):
        t0 = time.monotonic()
        key = request.env['mansas.form.api.key'].sudo()._authenticate(self._bearer())
        if not key:
            return self._done(401, {'ok': False, 'code': 'unauthorized'}, 'ping-unauthorized', t0)
        return self._done(200, {'ok': True, 'website': key.name}, 'ping', t0, key)

    @http.route('/api/mansas/v1/form-submissions', type='http', auth='public', methods=['POST'],
                csrf=False, save_session=False)
    def create_submission(self, **_kw):
        t0 = time.monotonic()
        try:
            return self._create_submission(t0)
        except Exception:  # noqa: BLE001 - never leak a stack trace to the caller
            request.env.cr.rollback()
            _logger.exception('form-submission outcome=server-error')
            return self._json(500, {'ok': False, 'code': 'server_error'})

    def _create_submission(self, t0):
        httpreq = request.httprequest
        env = request.env

        # 1. Authenticate before reading or parsing anything else.
        key = env['mansas.form.api.key'].sudo()._authenticate(self._bearer())
        if not key:
            return self._done(401, {'ok': False, 'code': 'unauthorized'}, 'unauthorized', t0)

        # 2. Transport checks.
        if 'application/json' not in (httpreq.headers.get('Content-Type') or ''):
            return self._done(415, {'ok': False, 'code': 'unsupported_media_type'}, 'content-type', t0, key)
        if (httpreq.content_length or 0) > MAX_BODY_BYTES:
            return self._done(413, {'ok': False, 'code': 'too_large'}, 'too-large', t0, key)
        data = httpreq.get_data(cache=False)
        if len(data) > MAX_BODY_BYTES:
            return self._done(413, {'ok': False, 'code': 'too_large'}, 'too-large', t0, key)
        try:
            raw = json.loads(data)
        except (ValueError, UnicodeDecodeError):
            return self._done(400, {'ok': False, 'code': 'bad_json'}, 'bad-json', t0, key)

        # 3. Validation (same rules as the website).
        try:
            submission, meta = parse_envelope(raw)
        except PayloadError as e:
            return self._done(422, {'ok': False, 'code': 'invalid', 'errors': e.errors}, 'invalid', t0, key,
                              fields=','.join(sorted(e.errors)))

        sid = submission['submission_id']
        key.sudo().write({'last_used_at': fields.Datetime.now()})

        # 4. Spam: answer like a success so bots learn nothing; store nothing.
        min_fill = self._int_param(PARAM_MIN_FILL_MS, 3000)
        reason = check_spam(submission, int(time.time() * 1000), min_fill_ms=min_fill)
        if reason:
            return self._done(202, {'ok': True}, 'spam', t0, key, reason=reason, id=sid)

        Submission = env['mansas.form.submission'].sudo().with_context(
            active_test=False, mail_create_nosubscribe=True)

        # 5. Idempotency: a retried submission is acknowledged, not duplicated.
        existing = Submission.search([('submission_id', '=', sid)], limit=1)
        if existing:
            return self._done(200, {'ok': True, 'duplicate': True, 'reference': existing.name},
                              'duplicate', t0, key, id=sid)

        # 6. Rate limits: per key (all visitors) and per visitor IP hash.
        if Submission._count_recent([('api_key_id', '=', key.id)]) >= key.rate_limit_per_minute:
            return self._done(429, {'ok': False, 'code': 'rate_limited'}, 'rate-limited-key', t0, key)
        ip_hash = meta.get('client_ip_hash')
        ip_limit = self._int_param(PARAM_IP_LIMIT, DEFAULT_IP_LIMIT)
        if ip_hash and ip_limit and Submission._count_recent([('client_ip_hash', '=', ip_hash)]) >= ip_limit:
            return self._done(429, {'ok': False, 'code': 'rate_limited'}, 'rate-limited-ip', t0, key)

        # 7. Store.
        vals = Submission._prepare_from_api(submission, meta, raw['submission'], key)
        try:
            with env.cr.savepoint():
                record = Submission.create(vals)
                record.flush_recordset()
        except (IntegrityError, ValidationError):
            # Lost a race with a concurrent retry of the same submission.
            existing = Submission.search([('submission_id', '=', sid)], limit=1)
            if existing:
                return self._done(200, {'ok': True, 'duplicate': True, 'reference': existing.name},
                                  'duplicate', t0, key, id=sid)
            raise
        return self._done(201, {'ok': True, 'id': record.id, 'reference': record.name},
                          'accepted', t0, key, id=sid, ref=record.name)
