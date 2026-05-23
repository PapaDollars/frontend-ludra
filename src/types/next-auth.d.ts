import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      phone?: string;
      avatar?: string | null;
      city?: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      adminPermissions?: string[];
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    phone?: string;
    avatar?: string | null;
    city?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    adminPermissions?: string[];
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role: string;
    phone?: string;
    avatar?: string | null;
    city?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    adminPermissions?: string[];
    accessToken?: string;
    refreshToken?: string;
    lastRefreshed?: number;
  }
}
