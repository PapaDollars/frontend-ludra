'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import URL from '@/utilis/url/url_front';

import { formatShortStamp } from '@/utilis/format';
import { ADMIN_PERMISSIONS } from '@/lib/adminPermissions';
import { KYC_STATUS_LABEL } from '@/lib/kycRequirements';
import { adminService } from '@/services/admin.service';
import type { AdminPermission, AdminUser } from '@/types';
import { Pill } from '@/components/ui/Pill';
import { Modal } from '@/components/ui/Modal';
import { SelectInput } from '@/components/ui/Form';
import { useToast } from '@/components/ui/Toast';
import { AdminCard, AdminGate, AdminHeader, DecisionDialog, EmptyRow, useAdminGuard } from '@/components/admin/AdminParts';

const ROLE = { user: 'Utilisateur', landlord: 'Propriétaire / agent', admin: 'Administrateur', proprietaire: 'Compte principal' } as const;

/** Utilisateurs : suspension motivée, rôles et permissions admin (séparées par rôle). */
export default function AdminUsersPage() {
  const guard = useAdminGuard(['manage_users']);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<{ role: AdminUser['role']; perms: AdminPermission[] }>({ role: 'user', perms: [] });
  const { show: showToast, node: toastNode } = useToast();

  const load = useCallback(() => {
    adminService.users({ q: q || undefined, role: role || undefined }).then((p) => setRows(p.items)).catch(() => setRows([]));
  }, [q, role]);
  useEffect(() => { if (guard.allowed) { const t = setTimeout(load, 200); return () => clearTimeout(t); } }, [guard.allowed, load]);

  const toggleActive = async (u: AdminUser, reason?: string) => {
    await adminService.updateUser(guard.actor, u.id, { isActive: !u.isActive }, reason);
    showToast(u.isActive ? 'Compte suspendu' : 'Compte réactivé');
    load();
  };

  const saveRole = async () => {
    if (!editing) return;
    try {
      await adminService.updateUser(guard.actor, editing.id, { role: draft.role, adminPermissions: draft.role === 'admin' ? draft.perms : [] });
      showToast('Rôle et permissions mis à jour');
      setEditing(null);
      load();
    } catch (e) { showToast(e instanceof Error ? e.message : 'Modification impossible'); }
  };

  return (
    <AdminGate guard={guard}>
      <AdminHeader title="Utilisateurs" subtitle="Suspension avec motif ; rôles et permissions réservés à la permission « add_admin »." />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="sr-only">Rechercher</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou e-mail…" className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand" />
        </label>
        <label htmlFor="role-filter" className="sr-only">Rôle</label>
        <SelectInput id="role-filter" value={role} onChange={(e) => setRole(e.target.value)} className="!w-auto h-10">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectInput>
      </div>

      <AdminCard>
        {rows === null ? <EmptyRow>Chargement…</EmptyRow> : rows.length === 0 ? <EmptyRow>Aucun utilisateur.</EmptyRow> : (
          <ul className="divide-y divide-slate-100">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-medium text-navy">{u.name} {!u.isActive && <Pill tone="danger-soft">Suspendu</Pill>}</p>
                  <p className="text-xs text-slate-500">{u.email} · {ROLE[u.role]} · KYC {KYC_STATUS_LABEL[u.kycStatus].toLowerCase()} · inscrit {formatShortStamp(u.createdAt)}</p>
                  {u.role === 'admin' && u.adminPermissions.length > 0 && <p className="text-[11px] text-slate-400">Permissions : {u.adminPermissions.join(', ')}</p>}
                </div>
                {u.role !== 'proprietaire' && (
                  <div className="flex gap-2">
                    {guard.can('add_property') && u.isActive && (
                      <Link href={`${URL.v2.publish}?for=${encodeURIComponent(u.id)}&forName=${encodeURIComponent(u.name)}`} className="h-8 px-3 inline-flex items-center rounded-lg border border-slate-200 text-xs font-semibold text-navy">Publier pour</Link>
                    )}
                    {guard.can('add_admin') && (
                      <button type="button" onClick={() => { setEditing(u); setDraft({ role: u.role, perms: u.adminPermissions }); }} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-navy">Rôle</button>
                    )}
                    {u.isActive
                      ? <button type="button" onClick={() => setSuspending(u)} className="h-8 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-600">Suspendre</button>
                      : <button type="button" onClick={() => toggleActive(u)} className="h-8 px-3 rounded-lg border border-trust text-xs font-semibold text-trust">Réactiver</button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {suspending && (
        <DecisionDialog open onOpenChange={(o) => { if (!o) setSuspending(null); }} title={`Suspendre ${suspending.name}`}
          description="L'utilisateur est déconnecté et ne peut plus publier ni écrire."
          options={[{ value: 'suspend', label: 'Suspendre le compte', negative: true }]}
          onConfirm={(_, reason) => toggleActive(suspending, reason)} />
      )}

      <Modal open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }} title={`Rôle — ${editing?.name ?? ''}`}
        footer={<button type="button" onClick={saveRole} className="w-full h-11 rounded-lg bg-brand text-white text-sm font-semibold">Enregistrer</button>}>
        <div className="flex flex-col gap-3">
          <label htmlFor="edit-role" className="text-xs font-medium text-slate-500">Rôle</label>
          <SelectInput id="edit-role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as AdminUser['role'] })}>
            <option value="user">Utilisateur</option>
            <option value="landlord">Propriétaire / agent</option>
            <option value="admin">Administrateur</option>
          </SelectInput>
          {draft.role === 'admin' && (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-xs font-medium text-slate-500">Permissions</legend>
              {ADMIN_PERMISSIONS.map((p) => (
                <label key={p.value} className="flex items-start gap-2 text-sm text-navy">
                  <input type="checkbox" className="mt-1" checked={draft.perms.includes(p.value)}
                    onChange={(e) => setDraft({ ...draft, perms: e.target.checked ? [...draft.perms, p.value] : draft.perms.filter((x) => x !== p.value) })} />
                  {p.label}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      </Modal>
      {toastNode}
    </AdminGate>
  );
}
