'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeSession } from '@/hooks/useSafeSession';
import { Plus, Home, Building2 } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { propertyService } from '@/services/property.service';
import PropertyUpgradeCard from '@/components/common/card/PropertyUpgradeCard';
import PropertyFilters from '@/components/common/_others/PropertyFilters';
import EditPropertyModal from '@/components/common/modals/EditPropertyModal';
import DeletePropertyModal from '@/components/common/modals/DeletePropertyModal';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { Property } from '@/types/property';
import Link from 'next/link';
import URL from '@/utilis/url/url_front';
import Pagination, { ITEMS_PER_PAGE } from '@/components/common/_others/Pagination';

export default function AllPropertiesPage() {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();

  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', location: '', type: '', priceRange: '', beds: '', baths: '', status: '', landlord: '' });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllProperties({ status: filters.status || undefined, page: currentPage, limit: ITEMS_PER_PAGE });
      let data: any[] = res.data || [];
      if (filters.search) data = data.filter((p) => p.title?.toLowerCase().includes(filters.search.toLowerCase()));
      if (filters.type) data = data.filter((p) => p.type === filters.type);
      if (filters.location) data = data.filter((p) => p.location === filters.location);
      if (filters.landlord) data = data.filter((p) => p.landlordId === filters.landlord);
      setProperties(data);
      setTotal(res.pagination?.total || data.length);
    } catch { setProperties([]); } finally { setLoading(false); }
  }, [filters, currentPage]);

  useEffect(() => { if (session) fetchProperties(); }, [session, fetchProperties]);

  const stats = { total: properties.length, available: properties.filter((p) => p.status === 'available').length, occupied: properties.filter((p) => p.status === 'occupied').length, pending: properties.filter((p) => p.status === 'pending').length };

  const handleSaveProperty = async (updated: Property) => {
    try {
      const fd = new FormData();
      Object.entries(updated).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, String(v)); });
      await propertyService.update(String(updated.id), fd);
      setIsEditModalOpen(false); setEditingProperty(null); fetchProperties();
    } catch (err: any) { alert(err.message); }
  };

  const handleApprove = async (propertyId: string) => {
    try {
      await adminService.updatePropertyStatus(propertyId, { status: 'available' });
      fetchProperties();
    } catch (err: any) { alert(err.message); }
  };

  const handleReject = async (propertyId: string) => {
    try {
      await adminService.updatePropertyStatus(propertyId, { isActive: false });
      fetchProperties();
    } catch (err: any) { alert(err.message); }
  };

  const handleReactivate = async (propertyId: string) => {
    try {
      await adminService.updatePropertyStatus(propertyId, { isActive: true, status: 'available' });
      fetchProperties();
    } catch (err: any) { alert(err.message); }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPropertyId) return;
    try {
      await adminService.deleteProperty(deletingPropertyId);
      setIsDeleteModalOpen(false); setDeletingPropertyId(null); fetchProperties();
    } catch (err: any) { alert(err.message); }
  };

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-4">Accès non autorisé</h2><p>Vous n&apos;avez pas les permissions nécessaires.</p></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('admin_properties.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('admin_properties.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center bg-white border-l-4 border-l-blue-500"><div className="text-2xl font-bold">{loading ? '…' : stats.total}</div><div className="text-gray-600">{t('admin_properties.stats.total')}</div></Card>
          <Card className="p-6 text-center bg-white border-l-4 border-l-green-500"><div className="text-2xl font-bold">{loading ? '…' : stats.available}</div><div className="text-gray-600">{t('admin_properties.stats.available')}</div></Card>
          <Card className="p-6 text-center bg-white border-l-4 border-l-red-500"><div className="text-2xl font-bold">{loading ? '…' : stats.occupied}</div><div className="text-gray-600">{t('admin_properties.stats.occupied')}</div></Card>
          <Card className="p-6 text-center bg-white border-l-4 border-l-yellow-500"><div className="text-2xl font-bold">{loading ? '…' : stats.pending}</div><div className="text-gray-600">{t('admin_properties.stats.pending')}</div></Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Link href={URL.admin.dashboard}><Button variant="outline" className="flex items-center gap-2"><Building2 className="h-5 w-5" />{t('admin_users.back_dashboard')}</Button></Link>
          <Link href={URL.landlord.addProperty}><Button className="flex items-center gap-2"><Plus className="h-5 w-5" />{t('admin_properties.add_property')}</Button></Link>
        </div>

        <PropertyFilters filters={filters} onFiltersChange={setFilters} onResetFilters={() => { setFilters({ search: '', location: '', type: '', priceRange: '', beds: '', baths: '', status: '', landlord: '' }); setCurrentPage(1); }} showStatusFilter={true} searchPlaceholder="admin_properties.search_placeholder" showViewToggle={true} viewMode={viewMode} onViewModeChange={setViewMode} />

        <div className="mb-6"><p className="text-gray-600">{t('admin_properties.results_count', { count: total })}</p></div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-72" />)}</div>
        ) : properties.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
              {properties.map((property, index) => (
                <PropertyUpgradeCard key={property.id} property={property} index={index} showFavorite={false} showStatus={true} showActions={true} onEdit={(p: any) => { setEditingProperty(p); setIsEditModalOpen(true); }} onDelete={(id: any) => { setDeletingPropertyId(String(id)); setIsDeleteModalOpen(true); }} onApprove={handleApprove} onReject={handleReject} onReactivate={handleReactivate} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-8" />
          </>
        ) : (
          <Card className="text-center py-12"><div className="text-gray-500"><Home className="h-12 w-12 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">{t('admin_properties.no_properties')}</h3><p className="mb-4">{t('admin_properties.no_properties_description')}</p></div></Card>
        )}

        <EditPropertyModal property={editingProperty} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingProperty(null); }} onSave={handleSaveProperty} />
        <DeletePropertyModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingPropertyId(null); }} onConfirm={handleConfirmDelete} />
      </div>
    </div>
  );
}
