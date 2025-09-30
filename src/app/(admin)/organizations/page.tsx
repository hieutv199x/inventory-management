'use client';
import React, { useEffect, useState } from 'react';
import { httpClient } from '@/lib/http-client';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, UserPlus, Shield, RefreshCw, Users, Trash2, Building2, CheckCircle2, Circle, Plus, Edit2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Member {
    id: string;
    userId: string;
    role: string;
    inviteStatus: string;
    createdAt: string;
    user: { id: string; name: string; username: string; role: string; isActive: boolean };
}

interface OrgSummary {
    orgId: string;
    membershipId: string;
    role: string;
    name: string;
    slug: string;
    status: string;
    active: boolean;
}

const roleLabels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    OPERATOR: 'Operator',
    ACCOUNTANT: 'Accountant',
    VIEWER: 'Viewer',
    DEV: 'Developer',
    SUPER_ADMIN: 'Super Admin'
};

export default function OrganizationsMembersPage() {
    const { organization, memberships, loading: orgLoading, switchOrg, isSuperAdmin } = useOrganization();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [username, setUsername] = useState('');
    // Role selection removed: new members are always created as ADMIN within their organization
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<OrgSummary[]>([]);
    const [orgLoadingList, setOrgLoadingList] = useState(true);
    const [creatingOrg, setCreatingOrg] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState('ACTIVE');
    const [view, setView] = useState<'orgs' | 'members'>('orgs');

    const loadMembers = async () => {
        setLoading(true);
        try {
            const res = await httpClient.get<{ data: Member[] }>('/organizations/members');
            setMembers(res.data);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load members');
        } finally { setLoading(false); }
    };

    const loadOrgs = async () => {
        setOrgLoadingList(true);
        try {
            const res = await httpClient.get<{ data: OrgSummary[] }>('/organizations');
            setOrgs(res.data);
        } catch (e: any) {
            toast.error(e.message || 'Failed to load organizations');
        } finally { setOrgLoadingList(false); }
    };

    useEffect(() => { loadOrgs(); }, []);
    useEffect(() => { if (!orgLoading && organization && view === 'members') loadMembers(); }, [orgLoading, organization?.id, view]);

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        setAdding(true);
        try {
            await httpClient.post('/organizations/members', { username });
            toast.success('Member added');
            setUsername('');
            loadMembers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to add member');
        } finally { setAdding(false); }
    };

    const changeRole = async (memberId: string, newRole: string) => {
        setUpdatingMemberId(memberId);
        try {
            await httpClient.patch(`/organizations/members/${memberId}`, { role: newRole });
            toast.success('Role updated');
            loadMembers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update role');
        } finally { setUpdatingMemberId(null); }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('Remove this member?')) return;
        setUpdatingMemberId(memberId);
        try {
            await httpClient.delete(`/organizations/members/${memberId}`);
            toast.success('Member removed');
            loadMembers();
        } catch (e: any) {
            toast.error(e.message || 'Failed to remove member');
        } finally { setUpdatingMemberId(null); }
    };

    const currentMembership = memberships.find(m => m.orgId === organization?.id);
    // New rule: only super admin can view/manage members list
    const canManage = !!organization && isSuperAdmin;

    const createOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOrgName) return;
        setCreatingOrg(true);
        try {
            await httpClient.post('/organizations', { name: newOrgName });
            toast.success('Organization created');
            setNewOrgName('');
            await loadOrgs();
        } catch (e: any) {
            toast.error(e.message || 'Failed to create organization');
        } finally { setCreatingOrg(false); }
    };

    const startEditOrg = (org: OrgSummary) => {
        setEditingOrgId(org.orgId);
        setEditName(org.name);
        setEditStatus(org.status);
    };

    const saveOrgEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOrgId) return;
        try {
            await httpClient.patch(`/organizations/${editingOrgId}`, { name: editName, status: editStatus });
            toast.success('Organization updated');
            setEditingOrgId(null);
            await loadOrgs();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update organization');
        }
    };

    const cancelEdit = () => { setEditingOrgId(null); };

    const switchTo = async (orgId: string) => {
        try {
            await switchOrg(orgId);
            toast.success('Switched organization');
            await loadOrgs();
            if (view === 'members') await loadMembers();
        } catch (e: any) {
            toast.error(e.message || 'Switch failed');
        }
    };


    useEffect(() => {
        if (view === 'members') loadMembers();
    }, [view, organization]);


    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => setView('orgs')} className={`text-sm px-3 py-1.5 rounded border ${view === 'orgs' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}>Organizations</button>
                {isSuperAdmin && <button disabled={!organization} onClick={() => setView('members')} className={`text-sm px-3 py-1.5 rounded border ${view === 'members' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50 disabled:opacity-40'}`}>Members</button>}
            </div>

            {view === 'orgs' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold flex items-center gap-2"><Building2 size={22} /> Organizations</h1>
                        <button onClick={loadOrgs} className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-gray-50"><RefreshCw size={16} /> Refresh</button>
                    </div>

                    {isSuperAdmin && (
                        <form onSubmit={createOrg} className="bg-white p-4 border rounded flex flex-col md:flex-row gap-3 items-start md:items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium mb-1">New Organization Name</label>
                                <input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Acme Inc" />
                            </div>
                            <button disabled={creatingOrg} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-blue-700 disabled:opacity-50">
                                {creatingOrg ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create
                            </button>
                        </form>
                    )}

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orgLoadingList && <div className="col-span-full text-sm text-gray-500"><Loader2 className="animate-spin inline mr-2" />Loading organizations...</div>}
                        {!orgLoadingList && orgs.length === 0 && <div className="col-span-full text-sm text-gray-500">No organizations yet.</div>}
                        {orgs.map(o => {
                            const editing = editingOrgId === o.orgId;
                            return (
                                <div key={o.orgId} className={`border rounded p-4 space-y-3 relative ${o.active ? 'ring-2 ring-blue-500' : ''}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        {editing ? (
                                            <form onSubmit={saveOrgEdit} className="flex-1 space-y-2">
                                                <input className="w-full border rounded px-2 py-1 text-sm" value={editName} onChange={e => setEditName(e.target.value)} />
                                                <select className="w-full border rounded px-2 py-1 text-sm" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                                    <option value="ACTIVE">ACTIVE</option>
                                                    <option value="SUSPENDED">SUSPENDED</option>
                                                    <option value="CLOSED">CLOSED</option>
                                                </select>
                                                <div className="flex gap-2 pt-1">
                                                    <button type="submit" className="text-xs px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                                                    <button type="button" onClick={cancelEdit} className="text-xs px-3 py-1 border rounded">Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 font-medium text-sm">
                                                    {o.active ? <CheckCircle2 className="text-blue-600" size={16} /> : <Circle size={14} className="text-gray-400" />}
                                                    {o.name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">Slug: {o.slug}</div>
                                                <div className="text-xs mt-1"><span className={`px-2 py-0.5 rounded ${o.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : o.status === 'SUSPENDED' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>{o.status}</span> • Role: {o.role}</div>
                                            </div>
                                        )}
                                        {!editing && (
                                            <div className="flex flex-col gap-2">
                                                {!o.active && <button onClick={() => switchTo(o.orgId)} className="text-xs px-3 py-1 border rounded hover:bg-gray-50">Switch</button>}
                                                {['OWNER', 'ADMIN'].includes(o.role) && <button onClick={() => startEditOrg(o)} className="text-xs inline-flex items-center gap-1 px-2 py-1 border rounded hover:bg-gray-50"><Edit2 size={12} />Edit</button>}
                                                <button onClick={() => { switchTo(o.orgId); setView('members'); }} className="text-xs px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Members</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2"><Shield size={14} /> Creating an organization grants you OWNER role automatically.</div>
                </div>
            )}

            {view === 'members' && isSuperAdmin && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <button onClick={() => setView('orgs')} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-1"><ArrowLeft size={14} /> Back</button>
                            <h1 className="text-2xl font-semibold flex items-center gap-2"><Users size={20} /> Members</h1>
                            {organization ? <p className="text-sm text-gray-500">Org: {organization.slug} ({organization.status})</p> : <p className="text-sm text-red-600">Select an organization first.</p>}
                        </div>
                        <button onClick={loadMembers} className="inline-flex items-center gap-2 text-sm px-3 py-2 border rounded hover:bg-gray-50"><RefreshCw size={16} /> Refresh</button>
                    </div>

                    {canManage && organization && (
                        <CreateAdminForm onSuccess={loadMembers} />
                    )}

                    <div className="bg-white border rounded overflow-hidden">
                        {organization && (
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="text-left p-2 font-medium">User</th>
                                    <th className="text-left p-2 font-medium">Username</th>
                                    <th className="text-left p-2 font-medium">System Role</th>
                                    <th className="text-left p-2 font-medium">Org Role</th>
                                    <th className="text-left p-2 font-medium">Status</th>
                                    <th className="text-left p-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={6} className="p-4 text-center text-gray-500"><Loader2 className="animate-spin inline" /> Loading...</td></tr>
                                )}
                                {!loading && members.length === 0 && (
                                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">No members</td></tr>
                                )}
                                {members.map(m => {
                                    const canEdit = canManage && m.role !== 'OWNER';
                                    return (
                                        <tr key={m.id} className="border-t">
                                            <td className="p-2 font-medium">{m.user.name || m.user.username}</td>
                                            <td className="p-2">{m.user.username}</td>
                                            <td className="p-2 text-xs"><span className="inline-block px-2 py-0.5 rounded bg-gray-100">{m.user.role}</span></td>
                                            <td className="p-2">
                                                {canEdit ? (
                                                    <select disabled={updatingMemberId === m.id} value={m.role} onChange={e => changeRole(m.id, e.target.value)} className="border rounded px-2 py-1 text-xs">
                                                        {Object.keys(roleLabels).filter(r => r !== 'OWNER').map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                                                    </select>
                                                ) : <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-xs">{roleLabels[m.role] || m.role}</span>}
                                            </td>
                                            <td className="p-2 text-xs">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${m.user.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{m.user.isActive ? 'Active' : 'Inactive'}</span>
                                            </td>
                                            <td className="p-2 text-xs">
                                                {canEdit && (
                                                    <button disabled={updatingMemberId === m.id} onClick={() => removeMember(m.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50">
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 pt-2">
                        <Shield size={14} /> Changes take effect immediately. Owner cannot be reassigned here.
                    </div>
                </div>
            )}
        </div>
    );
}

function CreateAdminForm({ onSuccess }: { onSuccess: () => void }) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) return;
        setSubmitting(true);
        try {
            const body: any = { username };
            if (password) body.password = password;
            if (name) body.name = name;
            const res = await httpClient.post('/organizations/admins', body);
            toast.success('Admin created');
            setUsername(''); setPassword(''); setName('');
            onSuccess();
            if (res?.data?.tempPassword) {
                toast((t)=> <div className="text-xs">Temp password: <strong>{res.data.tempPassword}</strong></div>, { duration: 8000 });
            }
        } catch (e:any) {
            toast.error(e.message || 'Failed to create admin');
        } finally { setSubmitting(false); }
    };
    return (
        <form onSubmit={submit} className="bg-white border rounded p-4 flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1">Username</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" placeholder="unique login" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Password (optional)</label>
                <input value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="auto-generate if blank" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="Display name" />
            </div>
            <div className="flex items-end h-full pt-1">
                <button disabled={submitting} className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? <Loader2 className="animate-spin" size={16}/> : <UserPlus size={16}/> } Create Admin
                </button>
            </div>
            <div className="text-xs text-gray-500 pt-1 md:pt-6">Creates a system user (if new) and assigns ADMIN membership.</div>
        </form>
    );
}
