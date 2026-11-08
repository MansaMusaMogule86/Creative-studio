# 05 · Pipelines and opportunities (PROPOSED)

## Evaluation of the proposed 11 stages
| Proposed | Verdict | Reason |
|---|---|---|
| New Lead | **Keep** | Website entry point |
| Contact Attempted + Contacted | **Merge into "Contacting"** | Attempts are activities (calls, emails, tasks), not pipeline positions. Two stages double the manual moves and blur reporting |
| Discovery Scheduled | **Keep** | Can be moved automatically by a booking (WF-02) |
| Discovery Completed | **Keep** | |
| Qualified | **Keep** | Set expected value and close date here |
| Proposal Preparation | **Keep** ("Proposal in Preparation") | |
| Proposal Sent | **Keep** | Triggers WF-03 follow-up tasks |
| Negotiation | **Keep** | |
| Won / Lost | **Use opportunity status, not stages** | HighLevel opportunities carry a `status` (create requires it; allowed values NEEDS CONFIRMATION, expected open/won/lost/abandoned). Status keeps won/lost reporting clean |

### Pipeline 1: `Sales — New Business`
`New Lead → Contacting → Discovery Scheduled → Discovery Completed → Qualified → Proposal in Preparation → Proposal Sent → Negotiation`, plus the status **won / lost** (lost requires `mm_opp_lost_reason`).

### Pipeline 2: `Client Onboarding` (separate, recommended)
`Kickoff Scheduled → Intake Received → Access & Assets → Onboarding Complete`.
It is created by WF-04 when a sales opportunity is won. It is separate because it has a different owner, a different SLA and a different meaning of "done".

### Delivery
Not in GHL. Use the project-management tool (NEEDS CONFIRMATION which one), linked from the onboarding opportunity.

## Opportunity rules
| Rule | Specification |
|---|---|
| Name | `{Company or full name} — {Division or "Multi-division"} inquiry` |
| Owner | Assigned by division routing (WF-05). Fallback: sales lead |
| Expected revenue (`monetaryValue`) | **Not set by the website.** The owner sets it at *Qualified* |
| Close date | Set by the owner at *Qualified* (field availability NEEDS CONFIRMATION) |
| Service categorisation | `mm_opp_division` + `mm_opp_services` |
| Lost reasons | budget · timing · chose-competitor · no-response · not-a-fit · other |
| Duplicate prevention | One open Sales opportunity per contact per 10-minute window or per `mm_submission_id`. Repeat enquiries within the window become notes. A genuinely new enquiry later creates a new opportunity |
| Accidental stage changes | The website **only ever creates** at *New Lead*; it never moves stages. Automation moves only *New Lead → Discovery Scheduled* (booking) and *Discovery Scheduled → Contacting* (cancellation). Every other move is manual. Consider GHL permissions so only owners or managers can mark won/lost (NEEDS CONFIRMATION) |
| Qualification | `mm_opp_qualification`: unreviewed → qualified / not-a-fit / spam |
