"use client";
import React from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { hasFeature } from '@/lib/plans';

interface FeatureGateProps { feature: string; fallback?: React.ReactNode; children: React.ReactNode; inline?: boolean; }
export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, fallback, children, inline }) => {
  const { organization } = useOrganization();
  const enabled = hasFeature(organization?.planId, feature, organization?.featureOverrides);
  if (enabled) return <>{children}</>;
  return fallback || (<div className={inline? 'text-xs text-gray-500':'p-4 border rounded bg-yellow-50 text-sm text-yellow-800'}>This feature requires an upgrade.</div>);
};
export default FeatureGate;
