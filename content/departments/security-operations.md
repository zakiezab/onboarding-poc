# Security Operations

Source: three onboarding action plans covering the SOC Analyst, SOC Engineer,
and SOC Manager tracks. Names of individuals have been removed — this section
merges three separate people's 90-day plans into one team overview, since no
single source document describes the team as a whole. One of the three source
files is misnamed ("Onboarding Plan SOC Engineer.docx") but its actual content
is a SOC Analyst (L1/L2) plan; flagged to HR for correction, not fixed here by
guessing at what the real Engineer plan would say.

<!-- spoken -->
Security Operations is being built from scratch — this is a genuinely new
function, not an established team you're joining mid-stream. It covers
alert triage and investigation, detection engineering and tuning, and the
formal SOPs a SOC needs to run safely, all built out for Mobiz's clients
alongside the internal Sentinel and Defender environment.

The team is a SOC Manager, a SOC Engineer, and one or more Analysts, working
in Microsoft Sentinel and Defender XDR. Because there was no existing bench
to shadow when this team started, a lot of the documentation — the
escalation matrix, the shift handover process, the tuning change log — is
itself a first-90-days deliverable, not something handed to you on day one.

The team's live client work centers on Telgian, including reducing its
false-positive rate and clearing an asset-inconsistency backlog, alongside
building out the internal SOC's own detection library and use cases from
the ground up.

Your first week is entirely orientation: get your Sentinel, Defender, and
ServiceNow access confirmed, walk the incident queue and current detection
rules, and learn the escalation and shift handover SOPs before you triage
anything live. Every early escalation, tuning change, or client-facing
finding gets reviewed by the SOC Manager before it goes anywhere.
<!-- /spoken -->

## Reference

Not read aloud, but available when the new hire asks a question.

- **Never** implement a detection tuning change on a live client directly —
  every change goes through the FP/Tuning Feedback SOP for sign-off, with a
  minimum 24-hour review window.
- **Never** close an incident as a false positive without documenting the
  reasoning in Sentinel and, where a ticket exists, in ServiceNow.
- **Milestones**: Day 30 — independently triaging routine incidents. Day 45
  — owning escalation and documentation for a shift without prompting. Day
  60 — independently handling triage and escalation within SLA. Day 90 —
  detection-tuning recommendations consistently approved with only minor
  edits.
- **Mandatory SOPs** (SOC Manager track): Shift Handover, Escalation &
  Severity, Tuning & Detection Change Control, New Hire Onboarding, Client
  Onboarding, Incident Response & Post-Incident Review, On-Call & Coverage,
  Reporting & Executive Communication, and Knowledge Management — each one
  requires sign-off from both the Engineer and Analyst before it counts as
  complete.
