import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Rafraîchir les données utilisateur toutes les 5 minutes
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        emailOrPhone: { label: 'Email ou téléphone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrPhone || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailOrPhone: credentials.emailOrPhone,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.status === 403 && data?.code === 'ACCOUNT_DISABLED') {
            throw new Error('ACCOUNT_DISABLED:' + (data.message || 'Votre compte a été restreint.'));
          }

          // Erreur serveur (variable manquante, Firestore indisponible…) : ne pas la faire passer pour un mauvais mot de passe
          if (res.status >= 500) {
            console.error('[NextAuth] Erreur serveur au login:', res.status, data?.message);
            throw new Error('SERVER_UNAVAILABLE');
          }

          if (!res.ok || !data.success) {
            console.error('[NextAuth] Login échoué:', res.status, data?.message);
            return null;
          }

          return {
            id: data.data.user.id,
            name: data.data.user.name,
            email: data.data.user.email,
            phone: data.data.user.phone,
            role: data.data.user.role,
            avatar: data.data.user.avatar,
            emailVerified: data.data.user.emailVerified,
            phoneVerified: data.data.user.phoneVerified,
            city: data.data.user.city,
            whatsapp: data.data.user.whatsapp || null,
            adminPermissions: data.data.user.adminPermissions || [],
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          };
        } catch (err) {
          // Messages destinés à l'écran de connexion : on les laisse passer
          if (err instanceof Error && (err.message.startsWith('ACCOUNT_DISABLED:') || err.message === 'SERVER_UNAVAILABLE')) throw err;
          console.error('[NextAuth] Erreur réseau vers le backend:', err);
          throw new Error('SERVER_UNAVAILABLE'); // backend injoignable (ex. en cours de réveil)
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: any) {
      // Premier sign-in : initialiser tous les champs
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.avatar = user.avatar;
        token.emailVerified = user.emailVerified;
        token.phoneVerified = user.phoneVerified;
        token.city = user.city;
        token.whatsapp = user.whatsapp || null;
        token.adminPermissions = user.adminPermissions || [];
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.lastRefreshed = Date.now();
        return token;
      }

      // Rafraîchissement périodique depuis le backend (sans déconnexion)
      const elapsed = Date.now() - (token.lastRefreshed as number || 0);
      if (elapsed > REFRESH_INTERVAL_MS) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              const fresh = data.data;
              token.role              = fresh.role              ?? token.role;
              token.adminPermissions  = fresh.adminPermissions  ?? token.adminPermissions;
              token.phone             = fresh.phone             ?? token.phone;
              token.avatar            = fresh.avatar            ?? token.avatar;
              token.city              = fresh.city              ?? token.city;
              token.whatsapp          = fresh.whatsapp          ?? token.whatsapp;
              token.emailVerified     = fresh.emailVerified     ?? token.emailVerified;
              token.phoneVerified     = fresh.phoneVerified     ?? token.phoneVerified;
            }
          }
        } catch {
          // Échec silencieux : on garde les données existantes
        }
        token.lastRefreshed = Date.now();
      }

      return token;
    },

    async session({ session, token }: any) {
      session.user.id               = token.id;
      session.user.role             = token.role;
      session.user.phone            = token.phone;
      session.user.avatar           = token.avatar;
      session.user.emailVerified    = token.emailVerified;
      session.user.phoneVerified    = token.phoneVerified;
      session.user.city             = token.city;
      session.user.whatsapp         = token.whatsapp || null;
      session.user.adminPermissions = token.adminPermissions || [];
      session.accessToken           = token.accessToken;
      session.refreshToken          = token.refreshToken;
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
