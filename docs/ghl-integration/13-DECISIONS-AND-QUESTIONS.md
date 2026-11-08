# 13 · Decisions and questions

Only items that can't be determined from the repository.

| ID | Decision | Options / note | Blocks |
|---|---|---|---|
| **D-01** | **Hosting platform** | Vercel, Netlify, Cloudflare Pages/Workers, or a Node server. Determines the Astro adapter, secrets store, rate-limit storage and fallback queue | Steps 1–10 |
| **D-02** | **Production domain** | Needed for `SITE_URL`, SSL and `LEADS_ALLOWED_ORIGINS` | Launch |
| **D-03** | **HighLevel account** | Which sub-account (location); who creates the Private Integration Token and with which scopes; is a sandbox or test location available? | Steps 4–7 |
| **D-04** | **People and routing** | Owner per division, sales lead, notification channels (email/app/SMS), business hours and time zone | WF-01/05 |
| **D-05** | **Legal and consent** | Target markets (UAE only? EU/UK?), registration (mainland vs DIFC/ADGM), privacy policy and terms authorship, marketing opt-in wording, retention period | Form v2, launch |
| **D-06** | **Booking** | Discovery call yes/no; length; staff; meeting tool; embed vs link | WF-02 |
| **D-07** | **Analytics provider** | Cookieless vs GA4 with consent mode; ad pixels now or later | Step 9 |
| **D-08** | **Bot protection service** | Honeypot + rate limit only, or also Turnstile/hCaptcha (third-party service) | Step 2 |
| D-09 | Public contact details | Email, phone, WhatsApp, office address to show on the site | Footer and contact |
| D-10 | Onboarding tooling | Contract/e-signature, invoicing, PM tool for delivery | WF-04 |
| D-11 | Pipeline stages | Accept the 8-stage Sales pipeline (merged *Contacting*, won/lost as status) and the separate Onboarding pipeline? | GHL setup |
| D-12 | Budget bands and currency | Keep USD bands, or switch to AED? | Form and fields |
| D-13 | Emblem rights | Confirm ownership of the crowned-M artwork | Launch |
