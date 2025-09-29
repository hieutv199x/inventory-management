"use client";
import React, { useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { PLAN_DEFINITIONS, findPlan } from '@/lib/plans';
import { httpClient } from '@/lib/http-client';
import { Check, Key, Shield, AlertTriangle } from 'lucide-react';

interface LicenseInfo {
  id: string;
  key: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'PENDING';
  issuedAt: string;
  expiresAt?: string | null;
  meta?: any;
}

// Placeholder fetch – future endpoint /api/licensing will serve these
async function fetchLicenses(): Promise<LicenseInfo[]> {
  try {
    const res = await httpClient.get('/licensing');
    // expecting { data: [...] }
    return (res as any)?.data || [];
  } catch {
    return [];
  }
}

export default function LicensingPage() {
  const { organization } = useOrganization();
  const activePlan = findPlan(organization?.planId) || PLAN_DEFINITIONS[0];
  const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchLicenses().then(list => { if(mounted){ setLicenses(list); setLoading(false);} })
      .catch(e => { if(mounted){ setError('Failed to load licenses'); setLoading(false);} });
    return () => { mounted = false; };
  }, [organization?.id]);

  return (
    <div className="p-6 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Shield size={22}/> Licensing</h1>
        <p className="text-sm text-gray-500">Manage plan licensing, activation keys and entitlement limits.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4 bg-white flex flex-col gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Current Plan</div>
            <div className="mt-1 text-lg font-semibold">{activePlan.name}</div>
            <div className="text-xs text-gray-500">{activePlan.description}</div>
          </div>
          <div className="text-sm">
            {activePlan.priceMonthlyCents === 0 ? 'Free tier' : `$${(activePlan.priceMonthlyCents/100).toFixed(0)} / month`}
          </div>
          <ul className="text-xs space-y-1">
            {activePlan.features.map(f => <li key={f} className="flex items-center gap-1"><Check size={12} className="text-green-600"/> {f}</li>)}
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-white flex flex-col gap-3">
          <div className="text-xs uppercase tracking-wide text-gray-400">Usage Snapshot</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 border rounded">
              <div className="text-[10px] text-gray-500">Shops</div>
              <div className="font-semibold text-sm">—</div>
              <div className="text-[10px] text-gray-400">of {activePlan.limits.shops ?? '∞'}</div>
            </div>
            <div className="p-2 border rounded">
              <div className="text-[10px] text-gray-500">Members</div>
              <div className="font-semibold text-sm">—</div>
              <div className="text-[10px] text-gray-400">of {activePlan.limits.members ?? '∞'}</div>
            </div>
            <div className="p-2 border rounded">
              <div className="text-[10px] text-gray-500">Orders/mo</div>
              <div className="font-semibold text-sm">—</div>
              <div className="text-[10px] text-gray-400">of {activePlan.limits.ordersPerMonth ?? '∞'}</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-400">Real usage metrics coming soon.</div>
        </div>

        <div className="border rounded-lg p-4 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">Entitlements</div>
              <div className="mt-1 text-sm text-gray-600">Plan Limits</div>
            </div>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(activePlan.limits).map(([k,v]) => (
                <tr key={k} className="border-t first:border-t-0">
                  <td className="py-1 pr-2 capitalize text-gray-500">{k}</td>
                  <td className="py-1 font-medium">{v == null ? 'Unlimited' : v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Key size={18}/> License Keys</h2>
          <button className="text-sm px-3 py-1.5 rounded border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-50" disabled>Generate Key</button>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Key</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
                <th className="text-left px-3 py-2 font-medium">Issued</th>
                <th className="text-left px-3 py-2 font-medium">Expires</th>
                <th className="text-left px-3 py-2 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-500">Loading...</td></tr>}
              {error && !loading && <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-red-600">{error}</td></tr>}
              {!loading && !error && licenses.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-gray-500">No license keys yet.</td></tr>}
              {licenses.map(lic => {
                const statusColor = lic.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : lic.status === 'EXPIRED' ? 'text-gray-500 bg-gray-100' : lic.status === 'REVOKED' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
                return (
                  <tr key={lic.id} className="border-t last:border-b">
                    <td className="px-3 py-2 font-mono text-xs">{lic.key}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] px-2 py-0.5 rounded ${statusColor}`}>{lic.status}</span></td>
                    <td className="px-3 py-2 text-xs text-gray-600">{lic.issuedAt ? new Date(lic.issuedAt).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-2">
                        <button disabled className="text-blue-600 disabled:opacity-30">Revoke</button>
                        <button disabled className="text-gray-500 disabled:opacity-30">Copy</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          <AlertTriangle size={14} className="mt-0.5"/>
          <div>License key generation & validation API not yet implemented. This UI is a scaffold—wire it to /api/licensing endpoints when backend is ready.</div>
        </div>
      </section>
    </div>
  );
}
