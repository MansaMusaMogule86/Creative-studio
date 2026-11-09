// Inquiry validation shared by the browser form and the server route, so the
// rules can never drift apart. The server additionally normalises input,
// rejects unknown keys and checks service slugs against src/data/divisions.ts.
import { allServices } from '../../data/divisions';

export const BUDGETS = ['Prefer not to say', 'Under USD 10k', 'USD 10k–25k', 'USD 25k–75k', 'USD 75k–150k', 'Above USD 150k'] as const;
export const CHANNELS = ['email', 'phone', 'video'] as const;
export type Channel = (typeof CHANNELS)[number];

export const LIMITS = { name: 120, email: 254, company: 160, description: 4000, phone: 32, services: 20 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SERVICE_SLUGS = new Set(allServices.map((s) => s.slug));

export type LeadFields = {
  name: string; email: string; company: string; services: string[];
  description: string; budget: string; contact: Channel; phone: string;
};
export type FieldErrors = Partial<Record<keyof LeadFields, string>>;

/** Field rules, as shown inline in the form. */
export function validateFields(v: LeadFields): FieldErrors {
  const e: FieldErrors = {};
  const name = v.name.trim();
  if (name.length < 2) e.name = 'Please enter your name.';
  else if (name.length > LIMITS.name) e.name = `Please keep your name under ${LIMITS.name} characters.`;
  const email = v.email.trim();
  if (!EMAIL.test(email) || email.length > LIMITS.email) e.email = 'Enter an email address like name@company.com.';
  if (v.company.trim().length > LIMITS.company) e.company = `Please keep the company name under ${LIMITS.company} characters.`;
  if (v.services.length === 0) e.services = 'Choose at least one area you are interested in.';
  else if (v.services.length > LIMITS.services || v.services.some((s) => !SERVICE_SLUGS.has(s))) e.services = 'Choose services from the list.';
  const d = v.description.trim();
  if (d.length < 20) e.description = 'Tell us a little more: at least 20 characters.';
  else if (d.length > LIMITS.description) e.description = `Please keep the description under ${LIMITS.description} characters.`;
  if (!(BUDGETS as readonly string[]).includes(v.budget)) e.budget = 'Choose a budget range from the list.';
  if (!(CHANNELS as readonly string[]).includes(v.contact)) e.contact = 'Choose a contact method.';
  if (v.contact === 'phone' && !PHONE.test(v.phone.trim())) e.phone = 'Enter a phone number, including the country code.';
  return e;
}

export type Attribution = Partial<Record<'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content' | 'landing_path' | 'referrer_origin', string>>;
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'landing_path', 'referrer_origin'] as const;

/** What the browser sends to /api/leads. */
export type LeadPayload = LeadFields & {
  submissionId: string;
  /** ms since epoch when the visitor started the form (spam timing check). */
  startedAt: number;
  /** Honeypot: a hidden field real visitors never fill in. */
  website: string;
  attribution: Attribution;
};

export type Lead = LeadFields & { submissionId: string; startedAt: number; honeypot: string; attribution: Attribution };

const ALLOWED = new Set(['name', 'email', 'company', 'services', 'description', 'budget', 'contact', 'phone', 'submissionId', 'startedAt', 'website', 'attribution']);
// eslint-disable-next-line no-control-regex -- deliberately strips control characters
const str = (x: unknown) => (typeof x === 'string' ? x.normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '');

export type ParseResult = { ok: true; lead: Lead } | { ok: false; errors: FieldErrors & { _form?: string } };

/** Server-side parse: strict shape, normalised strings, same field rules. */
export function parseLead(raw: unknown): ParseResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: { _form: 'Invalid request.' } };
  const o = raw as Record<string, unknown>;
  const unknownKeys = Object.keys(o).filter((k) => !ALLOWED.has(k));
  if (unknownKeys.length) return { ok: false, errors: { _form: 'Invalid request.' } };
  const services = Array.isArray(o.services) ? [...new Set(o.services.filter((s): s is string => typeof s === 'string').map((s) => s.trim()))] : [];
  const fields: LeadFields = {
    name: str(o.name), email: str(o.email).toLowerCase(), company: str(o.company), services,
    description: str(o.description), budget: str(o.budget) || BUDGETS[0],
    contact: (str(o.contact) || 'email') as Channel, phone: str(o.phone),
  };
  const errors: FieldErrors & { _form?: string } = validateFields(fields);
  const submissionId = str(o.submissionId);
  if (!UUID.test(submissionId)) errors._form = 'Invalid request.';
  const startedAt = typeof o.startedAt === 'number' && Number.isFinite(o.startedAt) ? o.startedAt : 0;
  const attribution: Attribution = {};
  if (o.attribution && typeof o.attribution === 'object' && !Array.isArray(o.attribution)) {
    for (const k of ATTR_KEYS) {
      const val = str((o.attribution as Record<string, unknown>)[k]).slice(0, 200);
      if (val) attribution[k] = val;
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  if (fields.contact !== 'phone') fields.phone = fields.phone && PHONE.test(fields.phone) ? fields.phone : '';
  return { ok: true, lead: { ...fields, submissionId, startedAt, honeypot: str(o.website), attribution } };
}
