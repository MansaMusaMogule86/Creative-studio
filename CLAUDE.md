# CLAUDE.md: Mansas Moguls website

- Read `README.md` and `docs/creative-directions.md` first.
- **No deployment, paid services or live AI inference without explicit approval.** Never put API keys in frontend code.
- The identity is a **proposal**. Never replace approved brand assets or call this identity final.
- **No invented facts.** That means no clients, testimonials, statistics, awards, contact details or social handles. Placeholders must be labelled as placeholders.
- Never present a scripted feature as AI. Ask Moguls is a keyword matcher until a real backend is approved.
- Brand strings live in `src/config/brand.ts`, and divisions and services in `src/data/divisions.ts`.
- Keep it light-themed and use the tokens in `src/styles/global.css`.
- Accessibility: WCAG 2.1 AA. Respect `prefers-reduced-motion`. Never hijack scrolling.
- Before pushing, run `pnpm check`, `pnpm build`, then `pnpm preview` and `pnpm qa` (all local; there is no CI).
