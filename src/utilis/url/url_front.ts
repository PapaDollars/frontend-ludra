export const URL = {
  auth: {
    login: '/auth/login',
    /** Connexion puis retour sur `returnTo` (paramètre lu par la page de login et RequireAuth). */
    loginThen: (returnTo: string) => `/auth/login?redirect=${encodeURIComponent(returnTo)}`,
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },

  // ── LUDRA HOME V2.1 (docs/V2.1_ROADMAP.md) ──
  v2: {
    feed: '/',
    search: '/recherche',
    immobilier: '/immobilier',
    personnel: '/personnel',
    services: '/services',
    listing: (id: string) => `/annonces/${id}`,
    candidate: (id: string) => `/personnel/candidats/${id}`,
    candidatePlans: '/personnel/abonnements',
    recruiterPlans: '/personnel/forfaits',
    shortlist: '/personnel/shortlist',
    serviceProvider: (id: string) => `/services/prestataires/${id}`,
    serviceCategory: (code: string) => `/services/${code}`,
    messages: '/messages',
    conversation: (id: string) => `/messages/${id}`,
    publish: '/publier',
    account: '/compte',
    notifications: '/notifications',
    about: '/a-propos',
    help: '/aide',
    favorites: '/compte/favoris',
    payments: '/compte/paiements',
    receipt: (id: string) => `/compte/paiements/recu/${id}`,
    myItems: '/compte/annonces',
    settings: '/compte/parametres',
    certification: '/compte/certification',
    subscriptions: '/compte/abonnements',
    reviews: (userId: string) => `/avis/${userId}`,
    myReviews: '/compte/avis',
  },

  // Back-office V2.1 (M16)
  admin: {
    dashboard: '/admin/dashboard',
    listings: '/admin/annonces',
    kyc: '/admin/verifications',
    payments: '/admin/paiements',
    reports: '/admin/signalements',
    proofs: '/admin/personnel',
    users: '/admin/utilisateurs',
    settings: '/admin/parametres',
    audit: '/admin/journal',
  }
} as const;

export default URL;