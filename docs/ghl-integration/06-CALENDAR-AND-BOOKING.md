# 06 · Calendar and booking

## Current state (VERIFIED)
There are **no booking CTAs, calendars or booking embeds** on the site. Grep of `src/` for `booking` and `calendly` returns nothing. The form only records a *preferred* contact method, which includes "Video call" (`src/components/InquiryForm.tsx:164`).

## Recommendation (PROPOSED)
- **Launch:** after a successful inquiry, show **"Book a discovery call"**. It links to (or embeds on a separate page) a **GHL calendar booking page**, set in `PUBLIC_DISCOVERY_BOOKING_URL`. HighLevel then handles time zones, availability, confirmations, reminders and rescheduling natively. The contact matches on email, so the booking joins the same contact.
- **Not at launch:** a custom booking UI using the calendar API (`GET /calendars/{calendarId}/free-slots`, `POST /calendars/events/appointments`, scopes `calendars.readonly` and `calendars/events.write`, per the official scopes page). It adds significant complexity and its only gain is look-and-feel.

## Consultation types (NEEDS CONFIRMATION)
| Type | Suggested length | For |
|---|---|---|
| Discovery call | 30 min | New enquiries, any division |
| Strategy session | 60 min | Qualified leads (invite-only link, not public) |

## Configuration checklist (owner input required)
| Item | Decision needed |
|---|---|
| Calendar owner(s) and staff assignment (round-robin or by division) | **Yes** |
| Working hours and time zone (Gulf Standard Time assumed, UTC+4) | **Yes** |
| Buffer, minimum notice and booking window | **Yes** |
| Meeting location (Google Meet / Zoom / phone) | **Yes** |
| Intake questions on the booking form (keep 0–2; the inquiry already captured the brief) | **Yes** |
| Confirmation and reminder content (24 h, 1 h) | **Yes** |
| Reschedule and cancel links | GHL default (confirm) |
| No-show handling | One follow-up task for the owner (WF-02); no automated chasing |
| Opportunity update | Booking → *Discovery Scheduled*; cancellation → *Contacting* (WF-02) |
| Embedding on site | Iframe on a dedicated `/book` page, or link-out. The iframe needs an accessible title and its own privacy review |

No staff schedules or availability have been invented.
