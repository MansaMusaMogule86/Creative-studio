# 07 · Automation workflows (PROPOSED)

Full specification: `workflow-specifications.json`. Workflows are **configured in the GHL workflow builder by people**. The website only creates the contact and opportunity. Trigger and action names must be matched to the GHL UI (NEEDS CONFIRMATION).

## Global rules
- **Consent:** no marketing message unless `mm_consent_marketing = true`. Replies to the visitor's own enquiry and booking messages they requested count as transactional.
- **Suppression:** DND, the tag `mm:do-not-contact`, qualification = spam.
- **No loops:** a workflow never adds the tag or stage that triggers itself. Re-entry is off by default.
- **People move stages.** Automation only moves stages on booking and cancellation events.
- **Quiet hours and business days:** Gulf Standard Time (NEEDS CONFIRMATION).

## Flows
| ID | Trigger | Main steps | Exit / suppression |
|---|---|---|---|
| WF-01 New lead intake | Opportunity created at *New Lead* (or tag `mm:web-inquiry`) | Route owner (WF-05) → notify owner → acknowledgement email → task "first contact within 1 business day" → escalate if still *New Lead* after 1 business day | Stage moves; won/lost; spam |
| WF-02 Discovery booking | Appointment booked on the Discovery calendar | Move to *Discovery Scheduled* → confirmation → reminders at 24 h and 1 h. No-show: one owner task. Cancel: back to *Contacting* | Appointment completed (owner moves on manually) |
| WF-03 Proposal follow-up | Stage → *Proposal Sent* | Owner tasks at +3 and +7 business days; notify the owner at +14 | Stage change; won/lost |
| WF-04 Client onboarding | Sales opportunity status → won | Create an Onboarding opportunity (if none open) → welcome email → intake link → internal tasks | Onboarding complete |
| WF-05 Division routing | Inside WF-01 | Division → owner map; *multiple* → sales lead | Fallback: sales lead |
| WF-06 Re-engagement | *Contacting* with no activity for 10 business days | **One** follow-up email; after 10 more days set lost (no-response) | Any reply; max 1 message |
| WF-07 Spam handling | Owner sets qualification = spam | Lost + `mm:do-not-contact` + remove from workflows | — |

## The intake chain, end to end
Submission → server validation → contact upsert (email) → idempotency check → opportunity create (or note append) → tags → **WF-01** (owner, notification, acknowledgement, follow-up task).

Retries happen in the server layer, not in workflows (see `08`).
