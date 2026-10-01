// Company figures, real — pulled from the "Mobizinc at a glance" fact block
// that appears verbatim in both the PM and Sales & CS onboarding guides, not
// invented. (Org chart data used to live here as a placeholder tree; it's
// now the real company roster in lib/org-chart.ts, rendered by
// components/OrgChartFlow.tsx.)

export const COMPANY_FACTS = [
  { label: 'People', value: '170+', detail: 'professionals, 15+ delivery centers' },
  { label: 'Clients', value: '90+', detail: 'across industries, 30+ Fortune 500' },
  { label: 'Value delivered', value: '$2B+', detail: 'for clients to date' },
  { label: 'Operations', value: '24/7', detail: '365 days a year' },
  { label: 'Microsoft', value: '9', detail: 'advanced specializations' },
  { label: 'Assurance', value: 'ISO', detail: 'triple certified' },
] as const;
