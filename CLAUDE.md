# CLAUDE.md: Mansas Moguls website

- Read `README.md` and `docs/creative-directions.md` first.
- **No deployment, paid services or live AI inference without explicit approval.** Never put API keys in frontend code.
- **Official emblem:** the golden crowned M (`brand-source/crowned-m-master.png`, never modified). Never redraw it, swap the crown or set the M in a font. Regenerate assets with `pnpm brand:assets`. The liquid-glass sculpture is the artistic centrepiece, not the logo.
- **Gold** is an accent (about 5–10%): lines, light, borders and the single primary CTA. Never a black-and-gold theme. Gold text uses `--gold-text`.
- Don't push or deploy without explicit approval.
- **No invented facts.** That means no clients, testimonials, statistics, awards, contact details or social handles. Placeholders must be labelled as placeholders.
- Never present a scripted feature as AI. Ask Moguls is a keyword matcher until a real backend is approved.
- Brand strings live in `src/config/brand.ts`, and divisions and services in `src/data/divisions.ts`.
- Keep it light-themed and use the tokens in `src/styles/global.css`.
- Accessibility: WCAG 2.1 AA. Respect `prefers-reduced-motion`. Never hijack scrolling.
- Before pushing, run `pnpm check`, `pnpm build`, then `pnpm preview` and `pnpm qa` (all local; there is no CI).
- **After any full check or verification run**, review `docs/LAUNCH-CHECKLIST.md` (A–Z), mark each item with evidence (✅ / ⚠ / ❌ / ⏳ owner input) and remind the owner of what remains open.
