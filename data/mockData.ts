
import type { User, SpotListing, Review } from '../types';
import { Category } from '../types';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Abdullah Al-Farsi', avatarUrl: 'https://i.pravatar.cc/150?u=user1', isVerified: true, isSuperhost: true, rating: 4.9, reviewCount: 34 },
  { id: 'user2', name: 'Fatima Al-Marzooqi', avatarUrl: 'https://i.pravatar.cc/150?u=user2', isVerified: true, rating: 4.7, reviewCount: 12 },
  { id: 'user3', name: 'Mohammed Khan', avatarUrl: 'https://i.pravatar.cc/150?u=user3', isVerified: false, rating: 4.5, reviewCount: 5 },
  { id: 'user4', name: 'Noor Al-Balushi', avatarUrl: 'https://i.pravatar.cc/150?u=user4', isVerified: true, rating: 4.8, reviewCount: 21 },
];

export const mockSpots: SpotListing[] = [
  {
    id: 'spot1',
    name: 'Al Qudra Desert',
    location: 'Dubai, UAE',
    coordinates: { lat: 24.8750, lng: 55.3200 },
    rating: 4.8,
    reviewCount: 1240,
    photos: ['https://images.unsplash.com/photo-1545105511-9252c7104b2b?auto=format&fit=crop&q=80'],
    features: ['Lake', 'Cycling Track', 'Pet Friendly', 'Fire Pit'],
    description: 'Iconic dunes and lakes near Dubai; popular free desert camping. Accessible by 2WD on firm sand, 4x4 for deeper dunes.',
    hostId: 'system',
    category: Category.DESERT,
    approvalStatus: 'approved'
  },
  {
    id: 'spot2',
    name: 'Jebel Shams',
    location: 'Ad Dakhiliyah, Oman',
    coordinates: { lat: 23.2066, lng: 57.2034 },
    rating: 5.0,
    reviewCount: 3000,
    photos: ['https://images.unsplash.com/photo-1565551225574-d4b8f04c6436?auto=format&fit=crop&q=80'],
    features: ['Hiking', 'Views', 'Cold Weather', 'Stargazing'],
    description: 'Highest mountain in Oman with dramatic Grand Canyon views. 4x4 recommended.',
    hostId: 'system',
    category: Category.MOUNTAIN,
    approvalStatus: 'approved'
  }
];

export const MOCK_REVIEWS: Review[] = [];
