"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { httpClient } from '@/lib/http-client';

interface MembershipSummary {
  orgId: string;
  role: string;
  slug: string;
  name: string;
  status: string;
}

interface OrgData {
  id: string;
  slug: string;
  status: string;
  planId?: string | null;
  featureOverrides?: any;
}

interface OrgContextValue {
  organization: OrgData | null;
  memberships: MembershipSummary[];
  loading: boolean;
  needsSelection: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refresh: () => Promise<void>;
  openCreateModal?: () => void;
  closeCreateModal?: () => void;
  isSuperAdmin: boolean;
}

const OrganizationContext = createContext<OrgContextValue | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrgData | null>(null);
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);
  const [needsSelection, setNeedsSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
  const res = await httpClient.get<{ data: { org: OrgData | null; memberships: MembershipSummary[]; needsSelection: boolean; superAdmin?: boolean } }>(`/org-context`);
  setOrganization(res.data.org);
  setMemberships(res.data.memberships);
  setNeedsSelection(res.data.needsSelection);
  setIsSuperAdmin(!!res.data.superAdmin);
    } catch (e) {
      console.error('Failed to load organization context', e);
    } finally {
      setLoading(false);
    }
  };

  const switchOrg = async (orgId: string) => {
    await httpClient.post(`/org-context/switch`, { orgId });
    await load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organization, memberships, loading, needsSelection, switchOrg, refresh: load, isSuperAdmin }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}
