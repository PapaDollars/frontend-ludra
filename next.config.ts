import type { NextConfig } from "next";

/**
 * Anciennes routes supprimées au fil de la V2.1 (docs/V2.1_ROADMAP.md) :
 * redirection permanente pour ne pas casser les liens existants.
 */
const LEGACY_REDIRECTS = [
  // Étape 2 — Recherche & filtres (M02)
  { source: '/public/properties/list', destination: '/recherche' },
  // Étape 3 — Fiche détaillée (M03)
  { source: '/public/properties/detail/:id', destination: '/annonces/:id' },
  // Étape 5 — Publication (M06)
  { source: '/landlord/properties/add', destination: '/publier' },
  // Étape 6 — Devenir propriétaire → publication (choix Propriétaire/Agent) + certification (M06, M07)
  { source: '/application/become-landlord', destination: '/publier' },
  // Étape 10 — Mon compte (M15)
  { source: '/public/favorites', destination: '/compte/favoris' },
  { source: '/application/profile', destination: '/compte/parametres' },
  { source: '/landlord/dashboard', destination: '/compte' },
  { source: '/landlord/properties/list', destination: '/compte/annonces' },
  // Étape 11 — Back-office (M16)
  { source: '/admin/logs', destination: '/admin/journal' },
  { source: '/admin/users/:path*', destination: '/admin/utilisateurs' },
  { source: '/admin/properties/:path*', destination: '/admin/annonces' },
  // Étape 12 — Pages secondaires (§3.1)
  { source: '/public/about', destination: '/a-propos' },
  { source: '/public/contact', destination: '/aide' },
];

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Les erreurs ESLint n'empêcheront plus le build de production
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return LEGACY_REDIRECTS.map((r) => ({ ...r, permanent: true }));
  },
};

export default nextConfig;
