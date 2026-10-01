# Cloud & Infrastructure

Source: Azure Cloud Engineer Onboarding Action Plan. Names of individuals have
been removed and role references generalised per the team-overview format —
the source is a single new hire's 90-day plan, not a department roster.

<!-- spoken -->
The Cloud & Infrastructure team runs day-to-day Azure operations for Mobiz's
CSP and MSP clients, and delivers the bigger project work on top of that —
landing zone builds and cloud migrations. Day to day means access requests,
monitoring, backups, and change management, all logged through ServiceNow.
The project side means Enterprise-Scale Landing Zone design and deployment,
or a discovery-through-migration engagement, run against Microsoft's
reference architecture and built with Terraform.

You won't be on a project right away. You'll work alongside a Team Lead and
senior engineers, starting with the operational side of the business: getting
access to client environments, learning the ticketing queue, and shadowing a
senior engineer on live tickets before touching anything yourself. Once
you're comfortable running routine operations independently — usually by
week four or five — you rotate onto an active client project as a shadow,
then start owning small, reviewed pieces of it.

Your first week is entirely about environment access and observation: get
your Azure and Partner Center access confirmed, inventory your assigned
clients' environments, and shadow at least two client tickets end to end
before you change anything yourself.
<!-- /spoken -->

## Reference

Not read aloud, but available when the new hire asks a question.

- **Engagement models**: Mobiz runs both ECIF-funded and AMMP-based Microsoft
  engagements. Which one applies to a project shapes its scope, funding, and
  reporting obligations — ask your Team Lead which applies to a given client.
- **Tooling**: Terraform and Azure Verified Modules (AVM) for landing zone
  deployments — the team consumes AVM modules rather than hand-rolling
  Terraform. Azure Monitor, Log Analytics, and Veeam for operations.
- **Guardrails**: no Policy, RBAC, or network change goes to a production
  client environment without a peer or Team Lead review — minimum 24-hour
  review window outside approved emergencies. Every change is logged with
  rationale, expected impact, and a rollback plan.
- **Milestones**: Day 30 — navigating client environments and the knowledge
  base independently. Day 45 — owning the routine service request queue
  within SLA. Day 60 — first reviewed project deliverable. Day 90 —
  independent ownership of a project workstream, end to end.
