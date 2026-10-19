// lib/adminPermissions.ts — Permissions back-office (M16). Le serveur reste seul juge (RBAC §6.1).
import type { AdminPermission } from '@/types';

export const ADMIN_PERMISSIONS: { value: AdminPermission; label: string }[] = [
  { value: 'manage_users', label: 'Utilisateurs (voir, modifier, désactiver)' },
  { value: 'add_admin', label: 'Créer des administrateurs et attribuer des permissions' },
  { value: 'manage_properties', label: 'Modération des annonces' },
  { value: 'add_property', label: 'Publier pour le compte d’un utilisateur' },
  { value: 'review_kyc', label: 'Vérifications KYC et preuves (formation, habilitation)' },
  { value: 'moderate_reviews', label: 'Modération des avis' },
  { value: 'handle_reports', label: 'Traitement des signalements' },
  { value: 'view_payments', label: 'Consultation des paiements' },
  { value: 'manage_payments', label: 'Rapprochement des paiements' },
  { value: 'manage_settings', label: 'Paramètres produit (prix, plans, classement, catégories)' },
  { value: 'view_audit', label: 'Journal d’audit' },
];

interface AdminLike {
  role?: string;
  adminPermissions?: string[];
}

export const isAdminRole = (u?: AdminLike | null) => u?.role === 'admin' || u?.role === 'proprietaire';

/** `proprietaire` (compte principal) a toutes les permissions. */
export function hasPermission(u: AdminLike | null | undefined, perm: AdminPermission): boolean {
  if (!u) return false;
  if (u.role === 'proprietaire') return true;
  return u.role === 'admin' && (u.adminPermissions ?? []).includes(perm);
}
