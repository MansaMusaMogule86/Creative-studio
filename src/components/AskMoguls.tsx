import { useEffect, useId, useRef, useState } from 'react';
import { match, type Match } from '../lib/intent';

type Msg = { role: 'you' | 'moguls'; text: string; result?: Match };

const EXAMPLES = [
  'How can AI automate my business?',
  'I need a premium website.',
  'How can I generate more leads?',
  'Can you build a custom SaaS platform?',
];

export const prefill = (slugs: string[]) => {
  // The form may hydrate after this fires (client:visible), so leave it a note too.
  (window as unknown as { __mogulsPrefill?: string[] }).__mogulsPrefill = slugs;
  window.dispatchEvent(new CustomEvent('moguls:prefill', { detail: slugs }));
  document.getElementById('contact')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

export default function AskMoguls() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [shown, setShown] = useState(false);
  const panelId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  // Stay out of the hero's way; appear once the visitor starts exploring.
  useEffect(() => {
    const on = () => setShown(scrollY > innerHeight * 0.6);
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) { setOpen(false); launcherRef.current?.focus(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const result = match(text);
    const reply = result.services.length
      ? result.confident
        ? `That sounds like ${result.division?.name}. These services are the closest fit:`
        : 'I found a possible match. Have a look, or describe the challenge in a little more detail:'
      : 'I couldn’t match that to a service. Try naming the outcome you want, such as more enquiries, a new app or automating a process. You can also write to the team directly.';
    setMsgs((m) => [...m, { role: 'you', text }, { role: 'moguls', text: reply, result }]);
    setInput('');
  };

  return (
    <div className="ask" data-open={open} data-shown={shown || open}>
      <button ref={launcherRef} type="button" className="ask__launch" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        <span className="ask__dot" aria-hidden="true" />
        <span className="ask__label">{open ? 'Close' : 'Ask Moguls'}</span>
      </button>

      <section id={panelId} className="ask__panel" aria-label="Ask Moguls service finder" hidden={!open}>
        <header className="ask__head">
          <p className="ask__title">Ask Moguls</p>
          <p className="ask__honest">Service finder: matches your words to our services. It is not a live AI model, and nothing you type is sent anywhere.</p>
        </header>

        <div className="ask__log" ref={logRef} role="log" aria-live="polite">
          {msgs.length === 0 && (
            <div className="ask__intro">
              <p>Describe your business challenge and I’ll point you to the right part of the universe.</p>
              <ul className="ask__examples">
                {EXAMPLES.map((q) => <li key={q}><button type="button" onClick={() => ask(q)}>{q}</button></li>)}
              </ul>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg msg--${m.role}`}>
              <p>{m.text}</p>
              {m.result && m.result.services.length > 0 && (
                <>
                  <ul className="msg__services">
                    {m.result.services.map((s) => (
                      <li key={s.slug} style={{ ['--ink-d' as string]: s.ink }}>
                        <a href={`/universe/${s.division}#${s.slug}`}><strong>{s.title}</strong><span>{s.divisionName}</span></a>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="msg__cta" onClick={() => { setOpen(false); prefill(m.result!.services.map((s) => s.slug)); }}>
                    Start a project with these →
                  </button>
                </>
              )}
              {m.result && m.result.services.length === 0 && (
                <button type="button" className="msg__cta" onClick={() => { setOpen(false); prefill([]); }}>Go to the inquiry form →</button>
              )}
            </div>
          ))}
        </div>

        <form className="ask__form" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <label className="sr-only" htmlFor={`${panelId}-q`}>Describe your challenge</label>
          <textarea
            id={`${panelId}-q`} ref={inputRef} rows={2} value={input} maxLength={400}
            placeholder="e.g. We lose enquiries after hours"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
          />
          <button type="submit" className="ask__send" disabled={!input.trim()}>
            <span className="sr-only">Find services</span><span aria-hidden="true">↑</span>
          </button>
        </form>
      </section>
    </div>
  );
}
