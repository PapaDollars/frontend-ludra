'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeSession } from '@/hooks/useSafeSession';
import { Home, TrendingUp, Users, DollarSign, PieChart, BarChart3, MapPin, Plus, Bell } from 'lucide-react';

import { landlordService } from '@/services/landlord.service';
import { Card } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import URL from '@/utilis/url/url_front';
import Link from 'next/link';

export default function DashboardLandlordPage() {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    landlordService.getStats()
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-4">Connexion requise</h2><p>Veuillez vous connecter pour accéder à votre tableau de bord.</p></Card>
      </div>
    );
  }

  const pieChartData = stats ? [
    { name: 'Disponible', value: stats.available, color: '#10B981' },
    { name: 'Occupé', value: stats.occupied, color: '#EF4444' },
    { name: 'En attente', value: stats.pending, color: '#F59E0B' },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('dashboard.welcome')}, {session.user.name}!</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('dashboard.subtitle')}</p>
        </div>

        {/* Notifications */}
        {stats?.notifications && (stats.notifications.unreadContacts > 0 || stats.notifications.pendingVisits > 0) && (
          <div className="mb-6 flex gap-4">
            {stats.notifications.unreadContacts > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2 text-blue-700">
                <Bell className="h-5 w-5" />{stats.notifications.unreadContacts} message(s) non lu(s)
              </div>
            )}
            {stats.notifications.pendingVisits > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center gap-2 text-orange-700">
                <Bell className="h-5 w-5" />{stats.notifications.pendingVisits} visite(s) en attente
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.overview')}</h2>
            <p className="text-gray-600">{t('dashboard.overview_subtitle')}</p>
          </div>
          <div className="flex gap-4">
            <Link href={URL.landlord.properties}><Button variant="outline" className="flex items-center gap-2"><Home className="h-4 w-4" />{t('dashboard.view_properties')}</Button></Link>
            <Link href={URL.landlord.addProperty}><Button className="flex items-center gap-2 bg-primary hover:bg-primary-700"><Plus className="h-4 w-4" />{t('dashboard.add_property')}</Button></Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32" />)}
          </div>
        ) : (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-white border-l-4 border-l-blue-500 shadow-sm">
                <div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('dashboard.stats.total_properties')}</p><p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p><p className="text-xs text-gray-500 mt-1">{t('dashboard.stats.properties_managed')}</p></div><Home className="h-8 w-8 text-blue-500" /></div>
              </Card>
              <Card className="p-6 bg-white border-l-4 border-l-green-500 shadow-sm">
                <div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('dashboard.stats.monthly_revenue')}</p><p className="text-2xl font-bold text-gray-900">{(stats?.monthlyRevenue ?? 0).toLocaleString('fr-FR')} FCFA</p><p className="text-xs text-gray-500 mt-1">{t('dashboard.stats.from_occupied')}</p></div><DollarSign className="h-8 w-8 text-green-500" /></div>
              </Card>
              <Card className="p-6 bg-white border-l-4 border-l-purple-500 shadow-sm">
                <div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('dashboard.stats.average_price')}</p><p className="text-2xl font-bold text-gray-900">{(stats?.averagePrice ?? 0).toLocaleString('fr-FR')} FCFA</p><p className="text-xs text-gray-500 mt-1">{t('dashboard.stats.per_month')}</p></div><TrendingUp className="h-8 w-8 text-purple-500" /></div>
              </Card>
              <Card className="p-6 bg-white border-l-4 border-l-orange-500 shadow-sm">
                <div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">{t('dashboard.stats.occupancy_rate')}</p><p className="text-2xl font-bold text-gray-900">{stats?.occupancyRate ?? 0}%</p><p className="text-xs text-gray-500 mt-1">{stats?.occupied ?? 0} {t('dashboard.stats.occupied_properties')}</p></div><Users className="h-8 w-8 text-orange-500" /></div>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><PieChart className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('dashboard.charts.status_distribution')}</h3></div>
                <div className="space-y-4">
                  {pieChartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm font-medium">{item.name}</span></div>
                      <div className="text-right"><span className="font-semibold">{item.value}</span><span className="text-sm text-gray-500 ml-2">({stats?.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><Home className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('dashboard.charts.type_distribution')}</h3></div>
                <div className="space-y-4">
                  {Object.entries(stats?.typesStats ?? {}).map(([type, count]: any) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{t(`property_types.${type}`)}</span>
                      <div className="text-right"><span className="font-semibold">{count}</span><span className="text-sm text-gray-500 ml-2">({stats?.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><MapPin className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('dashboard.charts.location_distribution')}</h3></div>
                <div className="space-y-4">
                  {Object.entries(stats?.locationStats ?? {}).map(([loc, count]: any) => (
                    <div key={loc} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{loc}</span>
                      <div className="text-right"><span className="font-semibold">{count}</span><span className="text-sm text-gray-500 ml-2">({stats?.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)</span></div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6"><BarChart3 className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{t('dashboard.charts.performance_metrics')}</h3></div>
                <div className="space-y-6">
                  {[
                    { label: t('dashboard.metrics.availability_rate'), value: stats?.availableRate ?? 0, color: 'bg-green-500' },
                    { label: t('dashboard.metrics.occupancy_rate'), value: stats?.occupancyRate ?? 0, color: 'bg-red-500' },
                    { label: t('dashboard.metrics.pending_rate'), value: stats?.pendingRate ?? 0, color: 'bg-yellow-500' },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2"><span>{m.label}</span><span className="font-semibold">{m.value}%</span></div>
                      <div className="w-full bg-gray-200 rounded-full h-2"><div className={`${m.color} h-2 rounded-full transition-all duration-300`} style={{ width: `${m.value}%` }} /></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Propriétés récentes */}
            {stats?.recentProperties?.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.recent_properties')}</h2>
                  <Link href={URL.landlord.properties}><Button variant="outline" size="sm">{t('dashboard.view_all_properties')}</Button></Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.recentProperties.map((property: any) => (
                    <Card key={property.id} className="overflow-hidden">
                      <img src={property.image} alt={property.title} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.title}</h3>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-lg font-bold text-primary">{property.price?.toLocaleString('fr-FR')} FCFA</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${property.status === 'available' ? 'bg-green-100 text-green-800' : property.status === 'occupied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{t(`property_status.${property.status}`)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
