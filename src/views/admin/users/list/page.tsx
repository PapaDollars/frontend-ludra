'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeSession } from '@/hooks/useSafeSession';
import { Users, UserPlus, Mail, Phone, Calendar, Shield, Edit, Trash2, Search, Filter, MoreVertical } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import { User } from '@/types/users';
import Link from 'next/link';
import URL from '@/utilis/url/url_front';
import Pagination, { ITEMS_PER_PAGE } from '@/components/common/_others/Pagination';
import EditUserModal from '@/components/common/modals/EditUserModal';
import DeleteConfirmationModal from '@/components/common/modals/DeleteUserModal';
import UserDetailModal from '@/components/common/modals/UserDetailModal';

export default function UsersPage() {
  const { t } = useTranslation();
  const { data: session } = useSafeSession();

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [filters, setFilters] = useState({ search: '', role: '', verified: '' });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ role: filters.role || undefined, search: filters.search || undefined, page: currentPage, limit: ITEMS_PER_PAGE });
      setUsers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [filters, currentPage]);

  useEffect(() => { if (session) fetchUsers(); }, [session, fetchUsers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (openMenuId && !(e.target as Element).closest('.menu-container')) setOpenMenuId(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const stats = { total, admins: users.filter((u) => u.role === 'admin').length, landlords: users.filter((u) => u.role === 'landlord').length, regularUsers: users.filter((u) => u.role === 'user').length, emailVerified: users.filter((u) => u.emailVerified).length, phoneVerified: users.filter((u) => u.phoneVerified).length };

  const handleSaveUser = async (updated: User) => {
    console.log('Save user:', updated);
    setIsEditModalOpen(false); setEditingUser(null); fetchUsers();
  };

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    setIsDeleting(true);
    try {
      await adminService.deleteUser(deletingUserId);
      setIsDeleteModalOpen(false); setDeletingUserId(null); fetchUsers();
    } catch (err: any) { alert(err.message); }
    finally { setIsDeleting(false); }
  };

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-semibold mb-4">Accès non autorisé</h2><p>Vous n&apos;avez pas les permissions nécessaires.</p></Card>
      </div>
    );
  }

  const deletingUser = users.find((u) => u.id === deletingUserId);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('admin_users.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('admin_users.subtitle')}</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Link href={URL.admin.dashboard}><Button variant="outline" className="flex items-center gap-2"><Shield className="h-5 w-5" />{t('admin_users.back_dashboard')}</Button></Link>
          <Link href={URL.admin.addUser}><Button className="flex items-center gap-2"><UserPlus className="h-5 w-5" />{t('admin_users.add_user')}</Button></Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
          {[['blue-500', stats.total, 'admin_users.stats.total'], ['purple-500', stats.admins, 'admin_users.stats.admins'], ['green-500', stats.landlords, 'admin_users.stats.landlords'], ['orange-500', stats.regularUsers, 'admin_users.stats.users'], ['teal-500', stats.emailVerified, 'admin_users.stats.email_verified'], ['indigo-500', stats.phoneVerified, 'admin_users.stats.phone_verified']].map(([color, val, label], i) => (
            <Card key={i} className={`p-6 text-center bg-white border-l-4 border-l-${color}`}><div className="text-2xl font-bold">{loading ? '…' : val}</div><div className="text-gray-600">{t(label as string)}</div></Card>
          ))}
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input type="text" placeholder={t('admin_users.search_placeholder')} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2"><Filter className="h-5 w-5" />{t('admin_users.filters.title')}</Button>
          </div>
          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('admin_users.filters.role')}</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                  <option value="">{t('admin_users.filters.all_roles')}</option>
                  <option value="admin">{t('admin_users.roles.admin')}</option>
                  <option value="landlord">{t('admin_users.roles.landlord')}</option>
                  <option value="user">{t('admin_users.roles.user')}</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t('admin_users.filters.verification')}</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" value={filters.verified} onChange={(e) => setFilters({ ...filters, verified: e.target.value })}>
                  <option value="">{t('admin_users.filters.all_users')}</option>
                  <option value="email">{t('admin_users.filters.email_verified')}</option>
                  <option value="phone">{t('admin_users.filters.phone_verified')}</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => { setFilters({ search: '', role: '', verified: '' }); setCurrentPage(1); }} className="flex-1">{t('admin_users.reset_filters')}</Button>
                <Button onClick={() => setShowFilters(false)} className="flex-1">{t('admin_users.apply_filters')}</Button>
              </div>
            </div>
          )}
        </Card>

        <div className="mb-6"><p className="text-gray-600">{t('admin_users.results_count', { count: total })}</p></div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-20" />)}</div>
        ) : users.length > 0 ? (
          <>
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { setSelectedUser(user); setIsDetailModalOpen(true); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1" onClick={(e) => e.stopPropagation()}>
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" /> : <Users className="h-6 w-6 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1"><Mail className="h-4 w-4" /><span>{user.email}</span>{user.emailVerified && <span className="text-green-600">✓</span>}</div>
                          <div className="flex items-center gap-1"><Phone className="h-4 w-4" /><span>{user.phone}</span>{user.phoneVerified && <span className="text-green-600">✓</span>}</div>
                          <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /><span>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'landlord' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{t(`admin_users.roles.${user.role}`)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Actif' : 'Inactif'}</span>
                      <div className="relative menu-container">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}><MoreVertical className="h-5 w-5 text-gray-600" /></button>
                        {openMenuId === user.id && (
                          <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border py-2 z-10 min-w-[160px]">
                            <button onClick={() => { setEditingUser(user); setIsEditModalOpen(true); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Edit className="h-4 w-4" />{t('common.edit')}</button>
                            <button onClick={() => { setDeletingUserId(user.id); setIsDeleteModalOpen(true); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="h-4 w-4" />{t('common.delete')}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-8" />
          </>
        ) : (
          <Card className="text-center py-12"><div className="text-gray-500"><Users className="h-12 w-12 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">{t('admin_users.no_users')}</h3><p className="mb-4">{t('admin_users.no_users_description')}</p><Link href={URL.admin.addUser}><Button className="flex items-center gap-2 mx-auto"><UserPlus className="h-5 w-5" />{t('admin_users.add_first_user')}</Button></Link></div></Card>
        )}

        <UserDetailModal user={selectedUser} isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedUser(null); }} onEdit={setEditingUser as any} onDelete={(id: any) => { setDeletingUserId(String(id)); setIsDeleteModalOpen(true); }} showActions={true} />
        <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} />
        <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingUserId(null); }} onConfirm={handleConfirmDelete} isDeleting={isDeleting} title={t('admin_users.delete_user')} message={deletingUser ? t('admin_users.delete_confirmation', { name: deletingUser.name }) : t('admin_users.delete_confirmation_generic')} />
      </div>
    </div>
  );
}
