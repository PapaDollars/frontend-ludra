// types/users.ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: 'user' | 'landlord' | 'admin' | 'proprietaire';
  avatar?: string;
  whatsapp?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  adminPermissions?: string[];
  createdAt: string;
  updatedAt: string;
}