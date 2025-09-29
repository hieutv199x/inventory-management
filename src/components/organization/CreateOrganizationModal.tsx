"use client";
import React, { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { httpClient } from '@/lib/http-client';
import { useOrganization } from '@/context/OrganizationContext';
import toast from 'react-hot-toast';

interface Props { open: boolean; onClose: () => void; }
export const CreateOrganizationModal: React.FC<Props> = ({ open, onClose }) => {
  const { switchOrg, refresh } = useOrganization();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if(!open) return null;
  const submit = async (e: React.FormEvent) => { e.preventDefault(); if(!name) return; setSubmitting(true); try { const res = await httpClient.post<any>('/organizations', { name }); toast.success('Organization created'); const newId = res?.data?.orgId || res?.orgId || res?.data?.id; await refresh(); if(newId) await switchOrg(newId); onClose(); } catch(e:any){ toast.error(e.message||'Failed to create'); } finally { setSubmitting(false); setName(''); } };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-6 space-y-5">
        <div><h2 className="text-lg font-semibold">Create Organization</h2><p className="text-xs text-gray-500 mt-1">You will become OWNER of the new organization.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-xs font-medium mb-1">Organization Name</label><input value={name} onChange={e=>setName(e.target.value)} required placeholder="e.g. Acme Ltd" className="w-full border rounded px-3 py-2 text-sm" /></div>
          <div className="flex items-center justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button><button disabled={submitting} className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded shadow disabled:opacity-50">{submitting? <Loader2 size={16} className="animate-spin"/>:<Plus size={16}/>} Create</button></div>
        </form>
      </div>
    </div>
  );
};
export default CreateOrganizationModal;
