
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isVerified: boolean;
  isSuperhost?: boolean;
  rating: number;
  reviewCount: number;
}

export interface SpotListing {
  id: string;
  name: string;
  nameAr?: string;
  location: string;
  locationAr?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  locationLink?: string;
  rating: number;
  reviewCount: number;
  photos: string[];
  features: string[];
  description: string;
  descriptionAr?: string;
  host?: {
    name: string;
    email: string;
    picture?: string;
  };
  hostId: string;
  category: Category;
  type?: string;
  emoji?: string;
  price?: number;
  contactPhone?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface Review {
  _id: string;
  vehicleId: string;
  reviewerId: {
    _id: string;
    name: string;
    photoURL?: string;
    avatarUrl?: string; // Legacy support
  };
  rating: number;
  comment: string;
  photos?: string[];
  selectedAmenities?: string[];
  approvalStatus?: string;
  createdAt: string;
}

export enum Category {
  ALL = 'All Spots',
  DESERT = 'Desert',
  BEACH = 'Beach',
  MOUNTAIN = 'Mountain',
  RV_SERVICES = 'Rv Services',
  TENTS = 'Tent Sites',
  RVS = 'RV Spots',
  PAID_CAMPING = 'Paid Camping',
}

export const FEATURES = [
  'Pet Friendly',
  'WiFi',
  'Fire Pit',
  'Waterfront',
  'Kayaks',
  'Hot Tub',
  'AC',
  'Heater',
  'Kitchen',
  'Hiking',
  '4x4 Access',
  'Beach Front',
  'Shaded Area'
];

export interface RecommendedSpot {
  title: string;
  reason: string;
  vibe: string;
  estimatedPrice?: string;
}

export interface Trail {
  _id: string;
  id?: string;
  authorId: {
    _id: string;
    name: string;
    picture?: string;
    avatarUrl?: string;
  };
  title: string;
  location: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  length: string;
  duration: string;
  elevation: string;
  description: string;
  photos: string[];
  image?: string;
  waypoints?: {
    id?: string | number;
    name: string;
    type: string;
    coordinates?: { lat: number; lng: number };
  }[];
  likes: number;
  likedBy?: string[];
  isPublic: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
