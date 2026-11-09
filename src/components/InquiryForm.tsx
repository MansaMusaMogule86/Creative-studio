import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { divisions } from '../data/divisions';
import { withBoundary } from './IslandBoundary';
import { BUDGETS, validateFields, type Attribution, type FieldErrors, type LeadFields, type LeadPayload } from '../lib/leads/schema';

type Values = LeadFields;
type Errors = FieldErrors;

// Same-origin Vercel Function by default; PUBLIC_INQUIRY_ENDPOINT can override it.
const ENDPOINT = (import.meta.env.PUBLIC_INQUIRY_ENDPOINT as string | undefined) || '/api/leads';

const empty: Values = { name: '', email: '', company: '', services: [], description: '', budget: BUDGETS[0], contact: 'email', phone: '' };
const validate = validateFields;

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)));

/** First-touch attribution for this visit: UTM tags, landing path, external referrer origin. */
function readAttribution(): Attribution {
  try {
    const saved = sessionStorage.getItem('mm_attr');
    if (saved) return JSON.parse(saved) as Attribution;
  } catch { /* storage blocked */ }
  const a: Attribution = {};
  const q = new URLSearchParams(location.search);
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) { const v = q.get(k); if (v) a[k] = v.slice(0, 200); }
  a.landing_path = location.pathname.slice(0, 200);
  try { const r = document.referrer && new URL(document.referrer); if (r && r.origin !== location.origin) a.referrer_origin = r.origin; } catch { /* bad referrer */ }
  try { sessionStorage.setItem('mm_attr', JSON.stringify(a)); } catch { /* storage blocked */ }
  return a;
}

function InquiryForm() {
  const [v, setV] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'validated' | 'error' | 'limited'>('idle');
  const submissionId = useRef(newId());
  const startedAt = useRef(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const attribution = useRef<Attribution>({});
  useEffect(() => { attribution.current = readAttribution(); }, []);
  const id = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Prefill from Ask Moguls, a service "Inquire" link, or ?service=a,b
  useEffect(() => {
    const apply = (slugs: string[]) => {
      const valid = slugs.filter((s) => divisions.some((d) => d.services.some((x) => x.slug === s)));
      if (valid.length) setV((p) => ({ ...p, services: [...new Set([...p.services, ...valid])] }));
    };
    const q = new URLSearchParams(location.search).get('service');
    if (q) apply(q.split(','));
    const pending = (window as unknown as { __mogulsPrefill?: string[] }).__mogulsPrefill;
    if (pending) apply(pending);
    const onPrefill = (e: Event) => apply((e as CustomEvent<string[]>).detail);
    addEventListener('moguls:prefill', onPrefill);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-inquire]');
      if (a) apply([a.dataset.inquire!]);
    };
    document.addEventListener('click', onClick);
    return () => { removeEventListener('moguls:prefill', onPrefill); document.removeEventListener('click', onClick); };
  }, []);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const toggle = (slug: string) => set('services', v.services.includes(slug) ? v.services.filter((s) => s !== slug) : [...v.services, slug]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const payload: LeadPayload = {
      ...v, submissionId: submissionId.current, startedAt: startedAt.current,
      website: honeypot.current?.value ?? '', attribution: attribution.current,
    };
    setState('sending');
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = (await r.json().catch(() => ({}))) as { code?: string; errors?: Errors };
      if (r.ok) setState('sent');
      else if (r.status === 422 && body.errors && Object.keys(body.errors).some((k) => k !== '_form')) {
        setErrors(body.errors); setState('idle');
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      } else if (r.status === 429) setState('limited');
      // No delivery backend here (local preview, or not configured yet): say so honestly.
      else if (r.status === 404 || r.status === 405 || body.code === 'not_configured') setState('validated');
      else setState('error');
    } catch { setState('error'); }
    requestAnimationFrame(() => doneRef.current?.focus());
  };

  const err = (k: keyof Values) => errors[k] ? { 'aria-invalid': true, 'aria-describedby': `${id}-${k}-err` } : {};
  const errEl = (k: keyof Values) => errors[k] && <p className="f-err" id={`${id}-${k}-err`}>{errors[k]}</p>;
  const errorList = Object.entries(errors).filter(([, m]) => m);

  if (state === 'sent' || state === 'validated') {
    return (
      <div className="f-done" ref={doneRef} tabIndex={-1} role="status">
        <span className="f-done__mark" aria-hidden="true" />
        <h3>{state === 'sent' ? `Thank you, ${v.name.split(' ')[0]}.` : 'Your inquiry is ready.'}</h3>
        {state === 'sent' ? (
          <p>We’ve received your inquiry and will reply by {v.contact === 'phone' ? 'phone' : v.contact === 'video' ? 'email to arrange a video call' : 'email'}.</p>
        ) : (
          <p><strong>Prototype mode:</strong> everything checked out, but this preview isn’t connected to an inbox or CRM yet, so <strong>nothing was sent</strong>. Once an endpoint is configured, this form delivers inquiries to the team.</p>
        )}
        <button type="button" className="btn btn--ghost" onClick={() => { setV(empty); setState('idle'); submissionId.current = newId(); startedAt.current = Date.now(); }}>Start another inquiry</button>
      </div>
    );
  }

  return (
    <form className="f" noValidate onSubmit={submit}>
      {errorList.length > 0 && (
        <div className="f-summary" ref={summaryRef} tabIndex={-1} role="alert">
          <p>Please check {errorList.length === 1 ? 'one field' : `${errorList.length} fields`}:</p>
          <ul>{errorList.map(([k, m]) => <li key={k}><a href={`#${id}-${k}`}>{m}</a></li>)}</ul>
        </div>
      )}

      <div className="f-row">
        <div className="f-field">
          <label htmlFor={`${id}-name`}>Name <span aria-hidden="true">*</span></label>
          <input id={`${id}-name`} autoComplete="name" required value={v.name} onChange={(e) => set('name', e.target.value)} {...err('name')} />
          {errEl('name')}
        </div>
        <div className="f-field">
          <label htmlFor={`${id}-email`}>Business email <span aria-hidden="true">*</span></label>
          <input id={`${id}-email`} type="email" autoComplete="email" required value={v.email} onChange={(e) => set('email', e.target.value)} {...err('email')} />
          {errEl('email')}
        </div>
      </div>
      <div className="f-field">
        <label htmlFor={`${id}-company`}>Company <span className="f-opt">optional</span></label>
        <input id={`${id}-company`} autoComplete="organization" value={v.company} onChange={(e) => set('company', e.target.value)} />
      </div>

      <fieldset className="f-field f-services" id={`${id}-services`} {...(errors.services ? { 'aria-describedby': `${id}-services-err` } : {})}>
        <legend>What are you interested in? <span aria-hidden="true">*</span></legend>
        {divisions.map((d) => (
          <details key={d.slug} className="f-div" style={{ ['--ink-d' as string]: d.ink, ['--a' as string]: d.palette[0] }} open={d.services.some((s) => v.services.includes(s.slug)) || undefined}>
            <summary>
              <span>{d.name}</span>
              <small>{d.services.filter((s) => v.services.includes(s.slug)).length || ''}</small>
            </summary>
            <div className="f-chips">
              {d.services.map((s) => (
                <label key={s.slug} className="f-chip">
                  <input type="checkbox" checked={v.services.includes(s.slug)} onChange={() => toggle(s.slug)} />
                  <span>{s.title}</span>
                </label>
              ))}
            </div>
          </details>
        ))}
        {errEl('services')}
      </fieldset>

      <div className="f-field">
        <label htmlFor={`${id}-description`}>Project description <span aria-hidden="true">*</span></label>
        <textarea id={`${id}-description`} rows={5} required value={v.description} maxLength={4000}
          placeholder="What are you trying to achieve, and by when?" onChange={(e) => set('description', e.target.value)} {...err('description')} />
        {errEl('description')}
      </div>

      <div className="f-row">
        <div className="f-field">
          <label htmlFor={`${id}-budget`}>Budget range <span className="f-opt">optional</span></label>
          <select id={`${id}-budget`} value={v.budget} onChange={(e) => set('budget', e.target.value)}>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <fieldset className="f-field">
          <legend>Preferred contact method</legend>
          <div className="f-seg">
            {(['email', 'phone', 'video'] as const).map((c) => (
              <label key={c}><input type="radio" name={`${id}-contact`} checked={v.contact === c} onChange={() => set('contact', c)} /><span>{c === 'video' ? 'Video call' : c[0].toUpperCase() + c.slice(1)}</span></label>
            ))}
          </div>
        </fieldset>
      </div>
      {v.contact === 'phone' && (
        <div className="f-field">
          <label htmlFor={`${id}-phone`}>Phone number <span aria-hidden="true">*</span></label>
          <input id={`${id}-phone`} type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} {...err('phone')} />
          {errEl('phone')}
        </div>
      )}

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
      <div className="f-hp" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input ref={honeypot} id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      {state === 'error' && <p className="f-err" role="alert">Something went wrong while sending. Please try again in a moment.</p>}
      {state === 'limited' && <p className="f-err" role="alert">Too many attempts in a short time. Please wait a minute, then send again.</p>}
      <div className="f-actions">
        <button type="submit" className="btn btn--gold" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send inquiry'} <span className="arrow" aria-hidden="true">→</span></button>
        <p className="f-note"><span aria-hidden="true">*</span> Required. We only use these details to reply to you.</p>
      </div>
    </form>
  );
}

export default withBoundary(InquiryForm, 'inquiry-form', (
  <div className="f-done" role="alert">
    <h3>The inquiry form didn’t load.</h3>
    <p>Please refresh the page and try again.</p>
  </div>
));
