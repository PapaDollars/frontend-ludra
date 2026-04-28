'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSafeSession } from '@/hooks/useSafeSession';
import { History, User, Building2, CheckCircle, XCircle, ShieldOff, Shield, Trash2, Edit, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import { adminService } from '@/services/admin.service';
import URL from '@/utilis/url/url_front';

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  approve_property:    { label: 'Approuvée (1ère fois)',  icon: CheckCircle, color: 'text-green-700',  bg: 'bg-green-100' },
  reactivate_property: { label: 'Réactivée',              icon: CheckCircle, color: 'text-teal-700',   bg: 'bg-teal-100' },
  deactivate_property: { label: 'Désactivée',             icon: XCircle,     color: 'text-orange-700', bg: 'bg-orange-100' },
  delete_property:     { label: 'Supprimée',              icon: Trash2,      color: 'text-red-700',    bg: 'bg-red-100' },
  update_property:     { label: 'Modifiée',               icon: Edit,        color: 'text-blue-700',   bg: 'bg-blue-100' },
  activate_user:       { label: 'Compte activé',          icon: Shield,      color: 'text-green-700',  bg: 'bg-green-100' },
  deactivate_user:     { label: 'Compte désactivé',       icon: ShieldOff,   color: 'text-orange-700', bg: 'bg-orange-100' },
  delete_user:         { label: 'Utilisateur supprimé',   icon: Trash2,      color: 'text-red-700',    bg: 'bg-red-100' },
  promote_landlord:    { label: 'Promu propriétaire',     icon: Building2,   color: 'text-purple-700', bg: 'bg-purple-100' },
  demote_user:         { label: 'Rétrogradé locataire',   icon: User,        color: 'text-gray-700',   bg: 'bg-gray-100' },
};

const ACTION_FILTERS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'approve_property', label: 'Approbations (1ère fois)' },
  { value: 'reactivate_property', label: 'Réactivations' },
  { value: 'deactivate_property', label: 'Désactivations propriété' },
  { value: 'delete_property', label: 'Suppressions propriété' },
  { value: 'activate_user', label: 'Activations compte' },
  { value: 'deactivate_user', label: 'Désactivations compte' },
  { value: 'delete_user', label: 'Suppressions compte' },
  { value: 'promote_landlord', label: 'Promotions propriétaire' },
];

export default function AdminLogsPage() {
  const { data: session } = useSafeSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const LIMIT = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminLogs({ page, limit: LIMIT, action: actionFilter || undefined });
      setLogs(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { setLogs([]); } finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { if (session) fetchLogs(); }, [session, fetchLogs]);

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-4">Accès non autorisé</h2></Card>
      </div>
    );
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={URL.admin.dashboard}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Historique des actions admin
              </h1>
              <p className="text-gray-500 text-sm mt-1">{total} action(s) enregistrée(s)</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Filtre par action */}
        <div className="mb-6">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Liste des logs */}
        <Card className="overflow-hidden bg-white border border-gray-100">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">Aucune action enregistrée</p>
              <p className="text-sm mt-1">Les actions admin apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log, i) => {
                const config = ACTION_CONFIG[log.action] || {
                  label: log.action, icon: History, color: 'text-gray-700', bg: 'bg-gray-100',
                };
                const Icon = config.icon;
                return (
                  <div key={log.id || i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {/* Icône action */}
                    <div className={`${config.bg} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-sm text-gray-700 font-medium truncate">{log.targetName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.targetType === 'property' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {log.targetType === 'property' ? 'Propriété' : 'Utilisateur'}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{log.details}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          Par <span className="font-medium text-gray-600">{log.adminName}</span>
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Précédent
            </Button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
