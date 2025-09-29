"use client";
import React, { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const OrgSwitcher: React.FC = () => {
  const { organization, memberships, switchOrg, loading } = useOrganization();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  // No creation flow here per requirement; only show switcher when >1 org

  if (!loading && memberships.length <= 1) {
    return null; // Hide entire switcher when user has zero or one organization
  }

  const doSwitch = async (orgId: string) => {
    if (orgId === organization?.id) { setOpen(false); return; }
    setSwitchingId(orgId);
    try {
      await switchOrg(orgId);
      // Force revalidation / refetch of server components & client caches
      try {
        router.refresh();
      } catch {}
      // Hard reload fallback to ensure all stale org-scoped state is cleared
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 50);
    } finally {
      setSwitchingId(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        disabled={loading}
        onClick={() => setOpen(o=>!o)}
        className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[140px] truncate font-medium">{organization ? organization.slug : (loading? 'Loading...' : 'No Org')}</span>
        <ChevronsUpDown size={14} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 z-50 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-1">
          <div className="max-h-72 overflow-y-auto">
            {memberships.map(m => {
              const active = organization?.id === m.orgId;
              const pending = switchingId === m.orgId;
              return (
                <button
                  key={m.orgId}
                  onClick={() => doSwitch(m.orgId)}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${active ? 'bg-blue-50 dark:bg-blue-900/30 font-medium' : ''}`}
                >
                  {pending ? <Loader2 size={14} className="animate-spin"/> : active ? <Check size={14} className="text-blue-600"/> : <span className="w-[14px]"/>}
                  <span className="flex-1 truncate">{m.name || m.slug}</span>
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{m.role}</span>
                </button>
              );
            })}
            {memberships.length === 0 && !loading && (
              <div className="px-2 py-2 text-xs text-gray-500">No organizations</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSwitcher;
