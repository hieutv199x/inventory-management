"use client";
import React, { useEffect, useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, Building2, Check, Plus } from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import toast from 'react-hot-toast';

interface OrgRow { orgId: string; name: string; slug: string; role: string; status: string; }
export const OrgSelectionModal: React.FC = () => {
  const { needsSelection, memberships, switchOrg } = useOrganization();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localOrgs, setLocalOrgs] = useState<OrgRow[]>([]);
  useEffect(()=>{ setLocalOrgs(memberships.map(m=>({ orgId: m.orgId, name: m.name, slug: m.slug, role: m.role, status: m.status }))); }, [memberships]);
  if(!needsSelection) return null;
  const createAndSelect = async (e: React.FormEvent) => { e.preventDefault(); if(!name) return; setCreating(true); try { const res = await httpClient.post<any>(`/organizations`, { name }); toast.success('Organization created'); const newId = res?.data?.orgId || res?.orgId || res?.data?.id; if(newId) await switchOrg(newId); } catch(e:any){ toast.error(e.message||'Failed to create organization'); } finally { setCreating(false);} };
  const choose = async (orgId: string) => { setLoading(true); try { await switchOrg(orgId);} finally { setLoading(false);} };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-6 space-y-6">
        <div><h2 className="text-xl font-semibold flex items-center gap-2"><Building2 size={20}/> Select Organization</h2><p className="text-sm text-gray-500 mt-1">You belong to multiple organizations. Choose one to continue.</p></div>
        <div className="max-h-64 overflow-y-auto space-y-2 -mx-1 px-1">
          {localOrgs.map(o => (
            <button key={o.orgId} onClick={()=>choose(o.orgId)} disabled={loading} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">
              <div><div className="font-medium text-sm flex items-center gap-2">{o.name} <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{o.role}</span></div><div className="text-xs text-gray-500">{o.slug}</div></div>
              <Check size={16} className="opacity-0 group-hover:opacity-100" />
            </button>
          ))}
          {localOrgs.length===0 && <div className="text-xs text-gray-500">No organizations yet.</div>}
        </div>
        <form onSubmit={createAndSelect} className="space-y-3 border-t pt-4">
          <div><label className="block text-xs font-medium mb-1">Or create new</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="New organization name" className="w-full border rounded px-3 py-2 text-sm" required /></div>
          <button disabled={creating} className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">{creating? <Loader2 size={16} className="animate-spin"/>:<Plus size={16}/>} Create & Select</button>
        </form>
      </div>
    </div>
  );
};
export default OrgSelectionModal;
