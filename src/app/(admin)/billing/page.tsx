"use client";
import React from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { PLAN_DEFINITIONS, findPlan } from '@/lib/plans';
import { Check } from 'lucide-react';
import FeatureGate from '@/components/organization/FeatureGate';

export default function BillingPage() {
  const { organization } = useOrganization();
  const activePlan = findPlan(organization?.planId);
  return (
    <div className="p-6 space-y-8">
      <div><h1 className="text-2xl font-semibold">Billing & Plan</h1><p className="text-sm text-gray-500 mt-1">Manage subscription, limits and feature access.</p></div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_DEFINITIONS.map(plan => { const isActive = plan.code === activePlan?.code; return (
          <div key={plan.code} className={`border rounded-lg p-4 flex flex-col gap-4 ${isActive? 'ring-2 ring-blue-500':''}`}>
            <div><div className="flex items-center justify-between"><h2 className="font-medium text-sm flex items-center gap-2">{plan.name} {isActive && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Current</span>}</h2><div className="text-sm font-semibold">{plan.priceMonthlyCents===0? 'Free': `$${(plan.priceMonthlyCents/100).toFixed(0)}/mo`}</div></div><p className="text-xs text-gray-500 mt-1 min-h-[32px]">{plan.description}</p></div>
            <ul className="space-y-1 text-xs flex-1">{plan.features.map(f => <li key={f} className="flex items-center gap-1"><Check size={12} className="text-green-600"/> {f}</li>)}</ul>
            <button disabled={isActive} className={`text-sm w-full py-2 rounded border ${isActive? 'bg-gray-100 text-gray-500 cursor-default':'hover:bg-blue-600 hover:text-white border-blue-600 text-blue-600'}`}>{isActive? 'Selected':'Choose Plan'}</button>
          </div> );})}
      </div>
      <div className="space-y-4"><h2 className="font-semibold text-lg">Usage</h2><div className="grid md:grid-cols-3 gap-4"><div className="p-4 border rounded bg-white flex flex-col gap-1"><div className="text-xs text-gray-500">Orders (month)</div><div className="text-lg font-semibold">—</div><div className="text-[10px] text-gray-400">Coming soon</div></div><div className="p-4 border rounded bg-white flex flex-col gap-1"><div className="text-xs text-gray-500">Active Shops</div><div className="text-lg font-semibold">—</div><div className="text-[10px] text-gray-400">Coming soon</div></div><div className="p-4 border rounded bg-white flex flex-col gap-1"><div className="text-xs text-gray-500">Members</div><div className="text-lg font-semibold">—</div><div className="text-[10px] text-gray-400">Coming soon</div></div></div></div>
      <div className="space-y-2"><h2 className="font-semibold text-lg">Feature Preview</h2><FeatureGate feature="ADVANCED_REPORTS" fallback={<div className="p-4 border rounded bg-gray-50 text-sm text-gray-600">Upgrade to unlock advanced reports.</div>}><div className="p-4 border rounded bg-white text-sm">Advanced reports dashboard placeholder</div></FeatureGate></div>
    </div>
  );
}
