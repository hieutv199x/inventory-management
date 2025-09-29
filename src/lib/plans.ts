export interface PlanDefinition {
  code: string;
  name: string;
  priceMonthlyCents: number;
  priceYearlyCents?: number;
  limits: Record<string, number | null>;
  features: string[];
  description?: string;
}

export const FEATURE_KEYS = {
  MULTI_ORG: 'MULTI_ORG',
  MULTI_SHOP: 'MULTI_SHOP',
  ADVANCED_REPORTS: 'ADVANCED_REPORTS',
  BULK_OPERATIONS: 'BULK_OPERATIONS',
  BANK_ACCOUNTS: 'BANK_ACCOUNTS',
  SCHEDULER: 'SCHEDULER',
  API_ACCESS: 'API_ACCESS',
  PRIORITY_SYNC: 'PRIORITY_SYNC'
} as const;

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  { code: 'FREE', name: 'Free', priceMonthlyCents: 0, limits: { shops: 1, members: 3, ordersPerMonth: 2000 }, features: [FEATURE_KEYS.BANK_ACCOUNTS], description: 'Starter plan for testing and small sellers.' },
  { code: 'PRO', name: 'Pro', priceMonthlyCents: 4900, limits: { shops: 5, members: 15, ordersPerMonth: 50000 }, features: [FEATURE_KEYS.BANK_ACCOUNTS, FEATURE_KEYS.MULTI_SHOP, FEATURE_KEYS.BULK_OPERATIONS, FEATURE_KEYS.SCHEDULER], description: 'Scaling operations across multiple shops.' },
  { code: 'SCALE', name: 'Scale', priceMonthlyCents: 14900, limits: { shops: 20, members: 50, ordersPerMonth: 250000 }, features: [FEATURE_KEYS.BANK_ACCOUNTS, FEATURE_KEYS.MULTI_SHOP, FEATURE_KEYS.BULK_OPERATIONS, FEATURE_KEYS.SCHEDULER, FEATURE_KEYS.ADVANCED_REPORTS, FEATURE_KEYS.API_ACCESS], description: 'Advanced automation & API access for growth teams.' },
  { code: 'ENTERPRISE', name: 'Enterprise', priceMonthlyCents: 0, limits: { shops: null, members: null, ordersPerMonth: null }, features: [FEATURE_KEYS.BANK_ACCOUNTS, FEATURE_KEYS.MULTI_SHOP, FEATURE_KEYS.BULK_OPERATIONS, FEATURE_KEYS.SCHEDULER, FEATURE_KEYS.ADVANCED_REPORTS, FEATURE_KEYS.API_ACCESS, FEATURE_KEYS.PRIORITY_SYNC, FEATURE_KEYS.MULTI_ORG], description: 'Custom limits, priority syncing & support.' }
];

export function findPlan(code?: string | null) { return code ? PLAN_DEFINITIONS.find(p => p.code === code) : undefined; }
export function hasFeature(planCode: string | undefined | null, feature: string, featureOverrides?: Record<string, any>) {
  if (featureOverrides && feature in featureOverrides) return !!featureOverrides[feature];
  const plan = findPlan(planCode); if (!plan) return false; return plan.features.includes(feature);
}
