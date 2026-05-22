export interface Property {
  id: number;
  title: string;
  type: string;
  price: number;
  location: string;
  status: 'available' | 'occupied' | 'pending';
  rating: number;
  image: string;
  images?: string[];
  beds: number;
  baths: number;
  area: number;
  featured: boolean;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  landlordId: string;
  landlord?: {
    name: string;
    avatar?: string | null;
  };
}

export type PropertyStatus = 'available' | 'occupied' | 'pending';