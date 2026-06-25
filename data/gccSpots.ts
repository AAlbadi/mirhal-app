
import { SpotListing, Category } from '../types';

export const gccSpots: SpotListing[] = [
    // UAE
    {
        id: 'uae-1',
        name: 'Al Qudra Desert',
        location: 'Dubai, UAE',
        description: 'Iconic dunes and lakes near Dubai; popular free desert camping. Accessible by 2WD on firm sand, 4x4 for deeper dunes.',
        rating: 4.8,
        reviewCount: 1240,
        photos: ['https://images.unsplash.com/photo-1545105511-9252c7104b2b?auto=format&fit=crop&q=80'],
        category: Category.DESERT,
        features: ['Lake', 'Cycling Track', 'Pet Friendly', 'Fire Pit'],
        coordinates: { lat: 24.8750, lng: 55.3200 },
        hostId: 'system'
    },
    {
        id: 'uae-2',
        name: 'Al Marmoom Desert Reserve',
        location: 'Dubai, UAE',
        description: 'Quiet reserve with wide open desert spaces. 4x4 recommended.',
        rating: 4.7,
        reviewCount: 850,
        photos: ['https://images.unsplash.com/photo-1512453979798-5ea904f92545?auto=format&fit=crop&q=80'],
        category: Category.DESERT,
        features: ['Wildlife', 'Stargazing', 'Family Friendly'],
        coordinates: { lat: 24.8315, lng: 55.4172 },
        hostId: 'system'
    },
    {
        id: 'uae-3',
        name: 'Fossil Rock',
        location: 'Sharjah, UAE',
        description: 'Rocky desert landmark surrounded by dunes. Requires 4x4.',
        rating: 4.9,
        reviewCount: 500,
        photos: ['https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80'],
        category: Category.DESERT,
        features: ['Hiking', 'Fossils', 'Dune Bashing'],
        coordinates: { lat: 25.1236, lng: 55.8703 },
        hostId: 'system'
    },
    {
        id: 'oman-21',
        name: 'Jebel Shams',
        location: 'Ad Dakhiliyah, Oman',
        description: 'Highest mountain in Oman with dramatic Grand Canyon views. 4x4 recommended.',
        rating: 5.0,
        reviewCount: 3000,
        photos: ['https://images.unsplash.com/photo-1565551225574-d4b8f04c6436?auto=format&fit=crop&q=80'],
        category: Category.MOUNTAIN,
        features: ['Hiking', 'Views', 'Cold Weather', 'Stargazing'],
        coordinates: { lat: 23.2066, lng: 57.2034 },
        hostId: 'system'
    }
];
