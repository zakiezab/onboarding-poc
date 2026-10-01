// POC placeholders. Per your instruction: use a manager name actually found
// in the HR documents where one exists for that department; otherwise fall
// back to a role title (never an invented name). No document anywhere names
// a "buddy" — Mobiz's plans don't have that role — so buddyName stays a
// random invented placeholder for every department.
const BUDDY_NAMES = ['Priya', 'Danish', 'Mei Ling', 'Hakim'];

export function randomBuddyName(): string {
  return BUDDY_NAMES[Math.floor(Math.random() * BUDDY_NAMES.length)];
}

// Department list — managerName now sourced from the real company org chart
// (assets/org_chart.pdf, a BambooHR export; see lib/org-chart.ts for the full
// transcribed roster and DEPARTMENT_MANAGER_ID for the department → real
// manager mapping OrgChartFlow renders against). Superseded the earlier
// placeholder list, which had guessed at or omitted several of these because
// the source HR docs alone didn't name a manager. Department *labels* here
// stay as the POC's own names — content/departments/<slug>.md slugs depend
// on them — even though the real chart uses different department names for
// the same teams (see the per-entry comment).
//
// managerName sourcing, checked against the real chart:
// - Cloud & Infrastructure: real dept is "Systems Engineering" → Cloud
//   Engineering. Muhammad Saad, Manager, Cloud Engineering.
// - Project Management: real dept is "Project Management" under Sales
//   Engineering. Vladimir Blatin, Director, Sales Engineering, is the one
//   organizationally over that whole PM group (title doesn't say "PM", but
//   the reporting line does).
// - Sales & Customer Success: real dept is "Management Consulting" →
//   Customer Success. Naseer Ahmed, Senior Director, Digital Transformation,
//   manages the Customer Success Managers.
// - Security Operations: real dept is "Systems Engineering" → SOC. Ammad Ud
//   Din, SOC Manager — the earlier doc-only placeholder excluded him as "not
//   an assignable existing manager, himself a new hire"; the real chart now
//   shows him as the actual SOC Manager with his own reports.
// - Service Desk: real dept is "Systems Engineering" → Service Desk. Hassan
//   Naqvi, Service Desk Manager.
// - Creative & Multimedia: real dept is "Innovation COE" → Design. Zakie
//   Zabar, Head of Design — unchanged, the original doc had this right.
export const DEPARTMENTS = [
  { label: 'Cloud & Infrastructure', role: 'a new team member', managerName: 'Muhammad Saad' },
  { label: 'Project Management', role: 'a new team member', managerName: 'Vladimir Blatin' },
  { label: 'Sales & Customer Success', role: 'a new team member', managerName: 'Naseer Ahmed' },
  { label: 'Security Operations', role: 'a new team member', managerName: 'Ammad Ud Din' },
  { label: 'Service Desk', role: 'a new team member', managerName: 'Hassan Naqvi' },
  { label: 'Creative & Multimedia', role: 'a new team member', managerName: 'Zakie Zabar' },
] as const;
