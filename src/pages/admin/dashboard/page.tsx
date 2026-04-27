'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeSession } from '@/hooks/useSafeSession';
import { Home, TrendingUp, Users, DollarSign, Building2, PieChart, MapPin, History } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import URL from '@/utilis/url/url_front';
import Link from 'next/link';

export default function DashboardAdminPage() {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    adminService.getGlobalStats()
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-4">Accès non autorisé</h2><p>Vous n&apos;avez pas les permissions nécessaires.</p></Card>
      </div>
    );
  }

  const p = stats?.properties || {};
  const u = stats?.users || {};
  const pieChartData = [
    { name: 'Disponible', value: p.available ?? 0, color: '#10B981' },
    { name: 'Occupé', value: p.occupied ?? 0, color: '#EF4444' },
    { name: 'En attente', value: p.pending ?? 0, color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('admin_dashboard.welcome')}, {session.user.name}!</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('admin_dashboard.subtitle')}</p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-2xl font-bold text-gray-900">{t('admin_dashboard.overview')}</h2><p className="text-gray-600">{t('admin_dashboard.overview_subtitle')}</p></div>
          <div className="flex gap-4">
            <Link href={URL.admin.properties}><Button variant="outline" className="flex items-center gap-2"><Building2 className="h-4 w-4" />{t('admin_dashboard.view_properties')}</Button></Link>
            <Link href={URL.admin.users}><Button variant="outline" className="flex items-center gap-2"><Users className="h-4 w-4" />{t('admin_dashboard.view_users')}</Button></Link>
            <Link href={URL.admin.logs}><Button variant="outline" className="flex items-center gap-2"><History className="h-4 w-4" />Historique</Button></Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="col-span-4 grid grid-cols-4 gap-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32" />)}</div></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('admin_dashboard.stats.total_properties')}</p><p className="text-2xl font-bold">{p.total ?? 0}</p><p className="text-xs text-gray-500 mt-1">{t('admin_dashboard.stats.properties_platform')}</p></div><Building2 className="h-8 w-8 text-blue-500" /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('admin_dashboard.stats.total_users')}</p><p className="text-2xl font-bold">{u.total ?? 0}</p><p className="text-xs text-gray-500 mt-1">{u.landlords ?? 0} {t('admin_dashboard.stats.landlords')}</p></div><Users className="h-8 w-8 text-green-500" /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-purple-500 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('admin_dashboard.stats.monthly_revenue')}</p><p className="text-2xl font-bold">{(p.monthlyRevenue ?? 0).toLocaleString('fr-FR')} FCFA</p><p className="text-xs text-gray-500 mt-1">{t('admin_dashboard.stats.platform_revenue')}</p></div><DollarSign className="h-8 w-8 text-purple-500" /></div></Card>
              <Card className="p-6 bg-white border-l-4 border-l-orange-500 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('admin_dashboard.stats.occupancy_rate')}</p><p className="text-2xl font-bold">{p.occupancyRate ?? 0}%</p><p className="text-xs text-gray-500 mt-1">{p.occupied ?? 0} {t('admin_dashboard.stats.occupied_properties')}</p></div><TrendingUp className="h-8 w-8 text-orange-500" /></div></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><PieChart className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('admin_dashboard.charts.status_distribution')}</h3></div>
                <div className="space-y-4">
                  {pieChartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm font-medium">{item.name}</span></div>
                      <div className="text-right"><span className="font-semibold">{item.value}</span><span className="text-sm text-gray-500 ml-2">({p.total > 0 ? Math.round((item.value / p.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><Home className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('admin_dashboard.charts.type_distribution')}</h3></div>
                <div className="space-y-4">
                  {Object.entries(p.typesStats ?? {}).map(([type, count]: any) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{t(`property_types.${type}`)}</span>
                      <div className="text-right"><span className="font-semibold">{count}</span><span className="text-sm text-gray-500 ml-2">({p.total > 0 ? Math.round((count / p.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><MapPin className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('admin_dashboard.charts.location_distribution')}</h3></div>
                <div className="space-y-4">
                  {Object.entries(p.locationStats ?? {}).map(([loc, count]: any) => (
                    <div key={loc} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{loc}</span>
                      <div className="text-right"><span className="font-semibold">{count}</span><span className="text-sm text-gray-500 ml-2">({p.total > 0 ? Math.round((count / p.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><Users className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('admin_dashboard.charts.user_distribution')}</h3></div>
                <div className="space-y-4">
                  {[['Total utilisateurs', u.total ?? 0], ['Propriétaires', u.landlords ?? 0], ['Locataires', u.regularUsers ?? 0], ['Admins', u.admins ?? 0]].map(([label, val], i) => (
                    <div key={i} className="flex items-center justify-between"><span className="text-sm font-medium">{label}</span><span className="font-semibold">{val}</span></div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
