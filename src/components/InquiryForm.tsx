import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { divisions } from '../data/divisions';

type Values = {
  name: string; email: string; company: string; services: string[];
  description: string; budget: string; contact: 'email' | 'phone' | 'video'; phone: string;
};
type Errors = Partial<Record<keyof Values, string>>;

const BUDGETS = ['Prefer not to say', 'Under USD 10k', 'USD 10k–25k', 'USD 25k–75k', 'USD 75k–150k', 'Above USD 150k'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ENDPOINT = import.meta.env.PUBLIC_INQUIRY_ENDPOINT as string | undefined;

const empty: Values = { name: '', email: '', company: '', services: [], description: '', budget: BUDGETS[0], contact: 'email', phone: '' };

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Enter an email address like name@company.com.';
  if (v.services.length === 0) e.services = 'Choose at least one area you are interested in.';
  if (v.description.trim().length < 20) e.description = 'Tell us a little more: at least 20 characters.';
  if (v.contact === 'phone' && !/^\+?[\d\s()-]{7,20}$/.test(v.phone.trim())) e.phone = 'Enter a phone number, including the country code.';
  return e;
}

export default function InquiryForm() {
  const [v, setV] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'validated' | 'error'>('idle');
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
    const payload = { ...v, submittedAt: new Date().toISOString(), source: 'website' };
    if (!ENDPOINT) {
      setState('validated');
    } else {
      setState('sending');
      try {
        const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        setState(r.ok ? 'sent' : 'error');
      } catch { setState('error'); }
    }
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
        <button type="button" className="btn btn--ghost" onClick={() => { setV(empty); setState('idle'); }}>Start another inquiry</button>
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

      {state === 'error' && <p className="f-err" role="alert">Something went wrong while sending. Please try again.</p>}
      <div className="f-actions">
        <button type="submit" className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send inquiry'} <span className="arrow" aria-hidden="true">→</span></button>
        <p className="f-note"><span aria-hidden="true">*</span> Required. We only use these details to reply to you.</p>
      </div>
    </form>
  );
}
