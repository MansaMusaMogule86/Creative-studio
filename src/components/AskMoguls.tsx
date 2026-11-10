import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { match, type Match } from '../lib/intent';
import { isScrollLocked, lockScroll, unlockScroll } from '../scripts/scroll-lock';
import { withBoundary } from './IslandBoundary';

type Msg = { role: 'you' | 'moguls'; text: string; result?: Match };

const EXAMPLES = [
  'How can AI automate my business?',
  'I need a premium website.',
  'How can I generate more leads?',
  'Can you build a custom SaaS platform?',
];

// Narrow screens and short (landscape) screens get a viewport-filling modal.
// Wider screens keep the original floating, non-modal panel.
const FULLSCREEN_QUERY = '(max-width: 767px), (max-height: 520px)';
const TEXTAREA_MAX_PX = 120; // about four lines, then the field scrolls internally
const NEAR_BOTTOM_PX = 48;

export const prefill = (slugs: string[]) => {
  // The form may hydrate after this fires (client:visible), so leave it a note too.
  (window as unknown as { __mogulsPrefill?: string[] }).__mogulsPrefill = slugs;
  window.dispatchEvent(new CustomEvent('moguls:prefill', { detail: slugs }));
  document.getElementById('contact')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
};

function AskMoguls() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [shown, setShown] = useState(false);
  const [nearForm, setNearForm] = useState(false);
  const [overControl, setOverControl] = useState(false);
  const panelId = useId();
  const titleId = `${panelId}-title`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<null | 'modal' | 'panel'>(null);
  const stickRef = useRef(true);
  // While focus is (being) returned to the launcher it must stay visible,
  // even if it floats over another control; released on blur.
  const keepLauncherRef = useRef(false);
  const vvCleanupRef = useRef<(() => void) | null>(null);

  // ── Keep the modal sized to the *visible* viewport (above the keyboard). ──
  // Only height/top are set; nothing else translates the dialog, so it can
  // never move twice. Only the conversation area loses height.
  const startViewportSync = useCallback(() => {
    const d = dialogRef.current;
    const vv = window.visualViewport;
    if (!d || !vv) return;
    const sync = () => {
      const wasAtBottom = stickRef.current;
      d.style.setProperty('--vvh', `${vv.height}px`);
      d.style.setProperty('--vvt', `${vv.offsetTop}px`);
      d.dataset.keyboard = String(window.innerHeight - vv.height > 120);
      if (wasAtBottom && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    vvCleanupRef.current = () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      d.style.removeProperty('--vvh');
      d.style.removeProperty('--vvt');
      delete d.dataset.keyboard;
    };
  }, []);

  // Synchronous teardown, so callers (e.g. "Start a project") can scroll
  // the page immediately afterwards without the restore undoing it.
  const teardown = useCallback((restoreFocus: boolean) => {
    const mode = activeRef.current;
    if (!mode) return;
    activeRef.current = null;
    vvCleanupRef.current?.();
    vvCleanupRef.current = null;
    if (mode === 'modal') unlockScroll();
    setOpen(false);
    if (restoreFocus) {
      // The launcher is hidden while the dialog is open and becomes focusable
      // only after React re-renders, so retry for a few frames.
      const opener = openerRef.current;
      const target = opener?.isConnected ? opener : launcherRef.current;
      if (target === launcherRef.current) { keepLauncherRef.current = true; setOverControl(false); }
      let tries = 0;
      const attempt = () => {
        if (!target || document.activeElement === target || tries++ > 10) return;
        if (getComputedStyle(target).visibility !== 'hidden') target.focus({ preventScroll: true });
        requestAnimationFrame(attempt);
      };
      requestAnimationFrame(attempt);
    }
  }, []);

  const closeChat = useCallback((restoreFocus = true) => {
    // Close first (synchronous) so the page is no longer inert, then release
    // the lock and return focus.
    if (dialogRef.current?.open) dialogRef.current.close();
    teardown(restoreFocus);
  }, [teardown]);

  const openChat = useCallback((opener?: HTMLElement | null) => {
    const d = dialogRef.current;
    if (!d || activeRef.current) return;
    openerRef.current = opener ?? launcherRef.current;
    const full = matchMedia(FULLSCREEN_QUERY).matches;
    setFullscreen(full);
    if (full) {
      lockScroll();
      d.showModal(); // top layer: above the header, background inert, Escape → cancel
      activeRef.current = 'modal';
      startViewportSync();
      // No autofocus on touch screens: the keyboard opens only when the
      // visitor taps the input. Focus the dialog itself so screen readers
      // announce the title.
      d.focus({ preventScroll: true });
    } else {
      d.show();
      activeRef.current = 'panel';
      inputRef.current?.focus({ preventScroll: true });
    }
    stickRef.current = true;
    setOpen(true);
  }, [startViewportSync]);

  // The hero's "Ask Moguls" card opens this too (passes itself as opener).
  useEffect(() => {
    const on = (e: Event) => openChat((e as CustomEvent<{ opener?: HTMLElement }>).detail?.opener ?? null);
    addEventListener('moguls:ask-open', on);
    return () => removeEventListener('moguls:ask-open', on);
  }, [openChat]);

  // Native close paths (Escape on the modal → 'cancel' → 'close').
  useEffect(() => {
<<<<<<< HEAD
    const on = () => setShown(scrollY > innerHeight * 0.6);
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  // Step aside while a [data-ask-avoid] block passes under the launcher (the viewport's bottom band).
  const [avoid, setAvoid] = useState(false);
  useEffect(() => {
    const el = document.querySelector('[data-ask-avoid]');
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setAvoid(e.isIntersecting), { rootMargin: '-85% 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [msgs]);
=======
    const d = dialogRef.current;
    if (!d) return;
    // 'close' is dispatched asynchronously; ignore it if the dialog was
    // already reopened (e.g. after a rotation across the breakpoint).
    const onClose = () => { if (!d.open) teardown(true); };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, [teardown]);

  // Escape for the non-modal desktop panel (no native 'cancel' there).
>>>>>>> 5e49c3be3a66488a30263b9746e3b68808291436
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && activeRef.current === 'panel') closeChat(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [closeChat]);

  // Rotation / resize across the breakpoint while open: reopen in the right mode.
  useEffect(() => {
    const mq = matchMedia(FULLSCREEN_QUERY);
    const onChange = () => {
      if (!activeRef.current) return;
      const opener = openerRef.current;
      closeChat(false);
      requestAnimationFrame(() => openChat(opener));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [closeChat, openChat]);

  // Launcher visibility: stay out of the hero, and out of the inquiry form's
  // way on small screens (it would otherwise cover fields above the keyboard).
  useEffect(() => {
    // Fade out whenever the launcher would sit on top of a tappable control.
    let raf = 0;
    const CONTROL = 'a, button, summary, input, textarea, select, label, [role="tab"]';
    const checkOverlap = () => {
      raf = 0;
      const l = launcherRef.current;
      if (!l || activeRef.current) return;
      if (keepLauncherRef.current) { setOverControl(false); return; }
      const r = l.getBoundingClientRect();
      const pts: [number, number][] = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.top + 4], [r.left + 4, r.bottom - 4], [r.right - 4, r.bottom - 4]];
      setOverControl(pts.some(([x, y]) => document.elementsFromPoint(x, y).some((el) => !l.contains(el) && !el.closest('.ask') && el.matches(CONTROL))));
    };
    const on = () => {
      if (isScrollLocked()) return;
      setShown(scrollY > innerHeight * 0.6);
      if (!raf) raf = requestAnimationFrame(checkOverlap);
    };
    on(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on);
    const contact = document.getElementById('contact');
    const io = contact ? new IntersectionObserver(([e]) => setNearForm(e.isIntersecting && matchMedia('(max-width: 767px)').matches), { rootMargin: '0px 0px -30% 0px' }) : null;
    if (contact && io) io.observe(contact);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); io?.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // Auto-scroll only the conversation, and only if the visitor is at the
  // bottom (or just sent a message) — never pull them away from older messages.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const justSent = msgs[msgs.length - 2]?.role === 'you';
    if (stickRef.current || justSent) requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; stickRef.current = true; });
  }, [msgs]);

  const onLogScroll = () => {
    const log = logRef.current;
    if (log) stickRef.current = log.scrollHeight - log.scrollTop - log.clientHeight < NEAR_BOTTOM_PX;
  };

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  };

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
    requestAnimationFrame(resizeInput);
  };

  const toForm = (slugs: string[]) => {
    closeChat(false);
    prefill(slugs);
  };

  return (
<<<<<<< HEAD
    <div className="ask" data-open={open} data-shown={shown || open} data-avoid={avoid}>
      <button ref={launcherRef} type="button" className="ask__launch" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
=======
    <div className="ask" data-open={open} data-shown={(shown && !nearForm && !overControl) || open} data-fullscreen={fullscreen}>
      <button
        ref={launcherRef} type="button" className="ask__launch"
        aria-haspopup="dialog" aria-expanded={open} aria-controls={panelId}
        onClick={(e) => (activeRef.current ? closeChat() : openChat(e.currentTarget))}
        onBlur={() => { keepLauncherRef.current = false; }}
      >
>>>>>>> 5e49c3be3a66488a30263b9746e3b68808291436
        <span className="ask__dot" aria-hidden="true" />
        <span className="ask__label">{open ? 'Close Ask Moguls' : 'Ask Moguls'}</span>
      </button>

      <dialog ref={dialogRef} id={panelId} className="ask__panel" aria-labelledby={titleId} tabIndex={-1}>
        <header className="ask__head">
          <div className="ask__headrow">
            <h2 className="ask__title" id={titleId}>Ask Moguls</h2>
            <button type="button" className="ask__close" onClick={() => closeChat()}>
              <span aria-hidden="true" className="ask__x" />
              <span className="sr-only">Close Ask Moguls</span>
            </button>
          </div>
          <p className="ask__honest">Service finder: matches your words to our services. It is not a live AI model, and nothing you type is sent anywhere.</p>
        </header>

        <div className="ask__log" ref={logRef} role="log" aria-live="polite" onScroll={onLogScroll}>
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
                        <a href={`/universe/${s.division}/#${s.slug}`}><strong>{s.title}</strong><span>{s.divisionName}</span></a>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="msg__cta" onClick={() => toForm(m.result!.services.map((s) => s.slug))}>
                    Start a project with these →
                  </button>
                </>
              )}
              {m.result && m.result.services.length === 0 && (
                <button type="button" className="msg__cta" onClick={() => toForm([])}>Go to the inquiry form →</button>
              )}
            </div>
          ))}
        </div>

        <form className="ask__form" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <label className="sr-only" htmlFor={`${panelId}-q`}>Describe your challenge</label>
          <textarea
            id={`${panelId}-q`} ref={inputRef} rows={1} value={input} maxLength={400}
            placeholder="e.g. We lose enquiries after hours"
            onChange={(e) => { setInput(e.target.value); resizeInput(); }}
            onKeyDown={(e) => {
              // Enter sends on devices with a physical keyboard; on touch
              // keyboards Enter adds a line and the send button sends.
              if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer: fine)').matches) { e.preventDefault(); ask(input); }
            }}
          />
          <button type="submit" className="ask__send" disabled={!input.trim()} aria-label="Find services">
            <span aria-hidden="true">↑</span>
          </button>
        </form>
      </dialog>
    </div>
  );
}

// The service finder is optional: if it fails, render nothing rather than a broken widget.
export default withBoundary(AskMoguls, 'ask-moguls', null);
