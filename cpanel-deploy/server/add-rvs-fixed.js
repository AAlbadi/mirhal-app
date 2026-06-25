const mongoose = require('mongoose');
require('dotenv').config();

// Import the models
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');

const rvListings = [
  {
    title: 'Luxury Class A Winnebago - 2023',
    description: 'Experience ultimate comfort in this brand new luxury motorhome. Perfect for family adventures with all modern amenities including full kitchen, bathroom, and entertainment system.',
    type: 'Class A',
    year: 2023,
    make: 'Winnebago',
    model: 'Forza',
    length: 40,
    sleeps: 6,
    price: 350,
    images: [
      'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
      'https://images.unsplash.com/photo-1513415756775-41367c2a6c44?w=800'
    ],
    location: {
      coordinates: { lat: 25.2048, lng: 55.2708 },
      address: 'Dubai Marina',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '00000'
    },
    amenities: ['Full Kitchen', 'Bathroom', 'AC', 'Heating', 'WiFi', 'Solar Panels', 'Generator', 'TV', 'Awning']
  },
  {
    title: 'Compact Mercedes Sprinter Van - 2024',
    description: 'Modern camper van perfect for couples. Fuel efficient and easy to drive with clever storage solutions and comfortable sleeping arrangement.',
    type: 'Camper Van',
    year: 2024,
    make: 'Mercedes',
    model: 'Sprinter',
    length: 22,
    sleeps: 2,
    price: 180,
    images: [
      'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
      'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?w=800'
    ],
    location: {
      coordinates: { lat: 24.4539, lng: 54.3773 },
      address: 'Abu Dhabi Corniche',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      zipCode: '00000'
    },
    amenities: ['Kitchenette', 'Portable Toilet', 'AC', 'Solar Panels', 'Bike Rack']
  },
  {
    title: 'Family Thor Class C - 2022',
    description: 'Spacious family-friendly motorhome with bunk beds for kids. Great for desert camping trips with ample storage space.',
    type: 'Class C',
    year: 2022,
    make: 'Thor',
    model: 'Chateau',
    length: 31,
    sleeps: 8,
    price: 280,
    images: [
      'https://images.unsplash.com/photo-1520698857293-5d763dde010d?w=800',
      'https://images.unsplash.com/photo-1478827536114-da961b7f86a0?w=800'
    ],
    location: {
      coordinates: { lat: 25.3548, lng: 55.4212 },
      address: 'Sharjah City',
      city: 'Sharjah',
      state: 'Sharjah',
      zipCode: '00000'
    },
    amenities: ['Bunk Beds', 'Full Kitchen', 'Bathroom', 'AC', 'Outdoor Kitchen', 'Generator']
  },
  {
    title: 'Lightweight Airstream Travel Trailer - 2023',
    description: 'Iconic Airstream design with modern amenities. Lightweight and easy to tow, perfect for weekend getaways.',
    type: 'Travel Trailer',
    year: 2023,
    make: 'Airstream',
    model: 'Bambi',
    length: 16,
    sleeps: 2,
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800'
    ],
    location: {
      coordinates: { lat: 25.0769, lng: 55.1562 },
      address: 'Jumeirah Beach',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '00000'
    },
    amenities: ['Kitchenette', 'AC', 'Shower', 'WiFi']
  },
  {
    title: 'Luxury Fifth Wheel Keystone - 2023',
    description: 'Premium fifth wheel with residential features. Spacious master bedroom and full-size appliances for extended stays.',
    type: 'Fifth Wheel',
    year: 2023,
    make: 'Keystone',
    model: 'Montana',
    length: 36,
    sleeps: 6,
    price: 250,
    images: [
      'https://images.unsplash.com/photo-1513415756775-41367c2a6c44?w=800'
    ],
    location: {
      coordinates: { lat: 24.3753, lng: 54.5157 },
      address: 'Al Ain Oasis',
      city: 'Al Ain',
      state: 'Abu Dhabi',
      zipCode: '00000'
    },
    amenities: ['Master Bedroom', 'Full Kitchen', '2 Bathrooms', 'AC', 'Heating', 'Fireplace', 'Washer/Dryer']
  },
  {
    title: 'Adventure Popup Camper - 2024',
    description: 'Lightweight popup perfect for off-road adventures. Easy to tow and set up, great fuel economy.',
    type: 'Pop-up Camper',
    year: 2024,
    make: 'Forest River',
    model: 'Flagstaff',
    length: 12,
    sleeps: 4,
    price: 95,
    images: [
      'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?w=800'
    ],
    location: {
      coordinates: { lat: 25.2631, lng: 55.2972 },
      address: 'Ras Al Khor',
      city: 'Dubai',
      state: 'Dubai',
      zipCode: '00000'
    },
    amenities: ['Dining Area', 'Portable Stove', 'Storage', 'Bike Rack']
  }
];

async function addRVs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the first user as host
    const host = await User.findOne();
    if (!host) {
      console.error('❌ No users found. Please create a user first.');
      process.exit(1);
    }

    console.log('✅ Found host:', host.email);

    // Add hostId to all listings
    const listings = rvListings.map(rv => ({
      ...rv,
      hostId: host._id,
      isActive: true,
      approvalStatus: 'approved'
    }));

    // Insert vehicles
    const result = await Vehicle.insertMany(listings);
    console.log('✅ Successfully added', result.length, 'RV listings!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addRVs();
