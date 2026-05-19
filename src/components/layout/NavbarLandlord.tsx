'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Home, Plus, BarChart3, Settings, LogOut, Bell, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import URL from '@/utilis/url/url_front';
import { notificationService, type Notification } from '@/services/notification.service';
import ContactRequestModal from '@/components/common/modals/ContactRequestModal';

const NavbarLandlord = memo(() => {
  const { t } = useTranslation();
  const { user, isLandlord } = useRole();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactNotif, setContactNotif] = useState<Notification | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !isLandlord) router.push(URL.public.home);
  }, [user, isLandlord, router]);

  // ── Notifications ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = async (notif: Notification) => {
    await notificationService.markAsRead(notif.id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    if (notif.type === 'contact_request') {
      setIsBellOpen(false);
      setContactNotif(notif);
    }
  };

  // ── Fermer menus au clic extérieur ────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) && buttonRef.current && !buttonRef.current.contains(e.target as Node)) setIsMenuOpen(false);
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setIsProfileMenuOpen(false);
      if (isBellOpen && bellRef.current && !bellRef.current.contains(e.target as Node)) setIsBellOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsMenuOpen(false); setIsProfileMenuOpen(false); setIsBellOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape); };
  }, [isMenuOpen, isProfileMenuOpen, isBellOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = async () => { await signOut({ callbackUrl: URL.public.home }); };
  const getInitial = () => user?.name?.charAt(0).toUpperCase() || 'P';
  const getFirstName = () => user?.name?.split(' ')[0] || '';

  const navigation = [
    { name: 'Tableau de bord', href: URL.landlord.dashboard, icon: BarChart3 },
    { name: 'Mes propriétés', href: URL.landlord.properties, icon: Home },
    { name: 'Ajouter une propriété', href: URL.landlord.addProperty, icon: Plus },
  ];

  if (!user) return null;

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary backdrop-blur-md border-b border-primary-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href={URL.public.home} className="text-2xl font-bold text-white hover:opacity-80 transition-opacity flex-shrink-0">
            Ludra<span className="text-secondary">-Home</span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-baseline space-x-6 ml-10">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}
                className="flex items-center text-white/70 hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                <item.icon className="h-4 w-4 mr-2" />{item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Right: cloche + profil */}
          <div className="hidden md:flex items-center space-x-3">

            {/* ── Cloche notifications ── */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setIsBellOpen(!isBellOpen)}
                className="relative p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isBellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <CheckCheck className="h-3.5 w-3.5" />Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-sm">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button key={notif.id} onClick={() => handleNotifClick(notif)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg flex-shrink-0 mt-0.5">
                              {notif.type === 'property_approved' ? '✅'
                                : notif.type === 'property_rejected' ? '❌'
                                : notif.type === 'contact_request' ? '📩'
                                : '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              {notif.type === 'contact_request' && (
                                <span className="text-xs text-primary font-medium mt-1 inline-block">Voir les coordonnées →</span>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notif.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Profil ── */}
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {getInitial()}
                </div>
                <span className="text-sm font-medium text-white">{getFirstName()}</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">Propriétaire</p>
                  </div>
                  <Link href={URL.app.profile} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsProfileMenuOpen(false)}>
                    <Settings className="h-4 w-4 mr-3" />{t('navigation.profile')}
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="h-4 w-4 mr-3" />{t('navigation.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Cloche mobile */}
            <button onClick={() => setIsBellOpen(!isBellOpen)} className="relative p-2 text-white">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button ref={buttonRef} onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div ref={menuRef} className="md:hidden absolute top-16 left-0 right-0 bg-white border-t shadow-lg z-40">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href} onClick={closeMenu}
                  className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  <item.icon className="h-5 w-5 mr-3" />{item.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Propriétaire</p>
                </div>
                <Link href={URL.app.profile} onClick={closeMenu} className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium">
                  <Settings className="h-5 w-5 mr-3" />{t('navigation.profile')}
                </Link>
                <button onClick={() => { handleLogout(); closeMenu(); }} className="flex items-center w-full text-red-600 hover:bg-red-50 px-3 py-3 rounded-md text-base font-medium">
                  <LogOut className="h-5 w-5 mr-3" />{t('navigation.logout')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bell Dropdown */}
        {isBellOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-40 border-t">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <span className="font-semibold text-gray-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary">
                  <CheckCheck className="h-3.5 w-3.5" />Tout marquer lu
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">Aucune notification</div>
              ) : (
                notifications.map((notif) => (
                  <button key={notif.id} onClick={() => handleNotifClick(notif)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">
                        {notif.type === 'property_approved' ? '✅' : notif.type === 'property_rejected' ? '❌' : notif.type === 'contact_request' ? '📩' : '🔔'}
                      </span>
                      <div>
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                        {notif.type === 'contact_request' && (
                          <span className="text-xs text-primary font-medium mt-0.5 inline-block">Voir les coordonnées →</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </nav>
    </header>

    <ContactRequestModal
      notification={contactNotif}
      onClose={() => setContactNotif(null)}
    />
  </>
  );
});

NavbarLandlord.displayName = 'NavbarLandlord';
export default NavbarLandlord;
