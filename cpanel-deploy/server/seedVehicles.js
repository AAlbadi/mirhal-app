require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// GCC cities with coordinates
const gccCities = [
  // UAE
  { city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
  { city: 'Abu Dhabi', state: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4539, lng: 54.3773 },
  { city: 'Sharjah', state: 'Sharjah', country: 'United Arab Emirates', lat: 25.3463, lng: 55.4209 },
  { city: 'Ajman', state: 'Ajman', country: 'United Arab Emirates', lat: 25.4052, lng: 55.5136 },
  { city: 'Ras Al Khaimah', state: 'Ras Al Khaimah', country: 'United Arab Emirates', lat: 25.7896, lng: 55.9432 },
  { city: 'Fujairah', state: 'Fujairah', country: 'United Arab Emirates', lat: 25.1288, lng: 56.3265 },
  { city: 'Al Ain', state: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.2075, lng: 55.7447 },

  // Saudi Arabia
  { city: 'Riyadh', state: 'Riyadh Province', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { city: 'Jeddah', state: 'Makkah Province', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925 },
  { city: 'Dammam', state: 'Eastern Province', country: 'Saudi Arabia', lat: 26.4207, lng: 50.0888 },
  { city: 'Mecca', state: 'Makkah Province', country: 'Saudi Arabia', lat: 21.3891, lng: 39.8579 },
  { city: 'Medina', state: 'Medina Province', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692 },
  { city: 'Khobar', state: 'Eastern Province', country: 'Saudi Arabia', lat: 26.2172, lng: 50.1971 },
  { city: 'Dhahran', state: 'Eastern Province', country: 'Saudi Arabia', lat: 26.2361, lng: 50.0393 },

  // Kuwait
  { city: 'Kuwait City', state: 'Capital Governorate', country: 'Kuwait', lat: 29.3759, lng: 47.9774 },
  { city: 'Salmiya', state: 'Hawalli Governorate', country: 'Kuwait', lat: 29.3336, lng: 48.0533 },
  { city: 'Hawalli', state: 'Hawalli Governorate', country: 'Kuwait', lat: 29.3329, lng: 48.0289 },

  // Qatar
  { city: 'Doha', state: 'Doha Municipality', country: 'Qatar', lat: 25.2854, lng: 51.5310 },
  { city: 'Al Wakrah', state: 'Al Wakrah Municipality', country: 'Qatar', lat: 25.1714, lng: 51.5996 },
  { city: 'Al Rayyan', state: 'Al Rayyan Municipality', country: 'Qatar', lat: 25.2919, lng: 51.4244 },

  // Bahrain
  { city: 'Manama', state: 'Capital Governorate', country: 'Bahrain', lat: 26.2285, lng: 50.5860 },
  { city: 'Riffa', state: 'Southern Governorate', country: 'Bahrain', lat: 26.1300, lng: 50.5550 },
  { city: 'Muharraq', state: 'Muharraq Governorate', country: 'Bahrain', lat: 26.2572, lng: 50.6119 },

  // Oman
  { city: 'Muscat', state: 'Muscat Governorate', country: 'Oman', lat: 23.5880, lng: 58.3829 },
  { city: 'Salalah', state: 'Dhofar Governorate', country: 'Oman', lat: 17.0151, lng: 54.0924 },
  { city: 'Sohar', state: 'North Al Batinah Governorate', country: 'Oman', lat: 24.3477, lng: 56.7085 },
  { city: 'Nizwa', state: 'Ad Dakhiliyah Governorate', country: 'Oman', lat: 22.9333, lng: 57.5333 },
];

// Vehicle data
const vehicleTypes = ['Class A', 'Class B', 'Class C', 'Travel Trailer', 'Fifth Wheel', 'Camper Van', 'Toy Hauler', 'Pop-up Camper'];

const makes = [
  'Thor', 'Winnebago', 'Airstream', 'Forest River', 'Jayco',
  'Coachmen', 'Keystone', 'Mercedes-Benz', 'Ford', 'Ram',
  'Chevrolet', 'Tiffin', 'Newmar', 'Entegra', 'Grand Design'
];

const models = [
  'Palazzo', 'Sprinter', 'Flying Cloud', 'Georgetown', 'Redhawk',
  'Freelander', 'Greyhawk', 'Chateau', 'Reflection', 'Montana',
  'Avalanche', 'Cougar', 'Cornerstone', 'Tuscany', 'Dutch Star'
];

const amenities = [
  'Air Conditioning', 'Heating', 'Kitchen', 'Bathroom', 'Shower',
  'Refrigerator', 'Microwave', 'Stove', 'Oven', 'TV',
  'WiFi', 'Generator', 'Solar Panels', 'Awning', 'Outdoor Kitchen',
  'Bike Rack', 'Storage', 'Slide-outs', 'Backup Camera', 'GPS'
];

const placeholderImages = [
  'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
  'https://images.unsplash.com/photo-1464347601390-25e55a6b5f5c?w=800',
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800'
];

// Host IDs from database
const hostIds = [
  '6918a8c1ad659db2bd53c062',
  '6918aea2e075f58b497fc3b4'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAmenities() {
  const count = getRandomNumber(5, 12);
  const shuffled = [...amenities].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomImages() {
  const count = getRandomNumber(3, 5);
  const shuffled = [...placeholderImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedVehicles() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing test vehicles (keep the first 3 if you want)
    const existingCount = await Vehicle.countDocuments();
    console.log(`📊 Existing vehicles: ${existingCount}`);

    console.log('🌱 Generating 100 random vehicles...');

    const vehicles = [];

    for (let i = 0; i < 100; i++) {
      const location = getRandomElement(gccCities);
      const type = getRandomElement(vehicleTypes);
      const make = getRandomElement(makes);
      const model = getRandomElement(models);
      const year = getRandomNumber(2015, 2024);
      const sleeps = getRandomNumber(2, 8);
      const length = getRandomNumber(18, 45);

      // Price varies by vehicle type and year
      let basePrice = 200;
      if (type === 'Class A') basePrice = 600;
      else if (type === 'Class B' || type === 'Camper Van') basePrice = 350;
      else if (type === 'Class C') basePrice = 450;
      else if (type === 'Fifth Wheel') basePrice = 400;

      const yearFactor = (year - 2015) / 9; // 0 to 1 range
      const price = Math.round(basePrice + (basePrice * yearFactor * 0.5) + getRandomNumber(-50, 50));

      const vehicle = {
        hostId: new mongoose.Types.ObjectId(getRandomElement(hostIds)),
        title: `${year} ${make} ${model} - ${type} in ${location.city}`,
        description: `Beautiful ${year} ${make} ${model} ${type} available for rent in ${location.city}, ${location.country}. Perfect for family adventures and road trips across the GCC. This well-maintained RV sleeps ${sleeps} people comfortably and comes equipped with all the amenities you need for a memorable journey. Experience the freedom of the open road with this reliable and spacious vehicle.`,
        type: type,
        year: year,
        make: make,
        model: model,
        length: length,
        sleeps: sleeps,
        price: price,
        location: {
          address: `${getRandomNumber(1, 999)} ${location.city} Street`,
          city: location.city,
          state: location.state,
          country: location.country,
          zipCode: String(getRandomNumber(10000, 99999)),
          formattedAddress: `${location.city}, ${location.state}, ${location.country}`,
          coordinates: {
            lat: location.lat + (Math.random() - 0.5) * 0.1, // Add slight variation
            lng: location.lng + (Math.random() - 0.5) * 0.1
          }
        },
        images: getRandomImages(),
        amenities: getRandomAmenities(),
        rules: `1. No smoking inside the vehicle\n2. Pets allowed with prior approval\n3. Maximum ${sleeps} occupants\n4. Return with full fuel tank\n5. Clean before return\n6. Report any damages immediately\n7. Follow all traffic laws\n8. No off-road driving without permission`,
        availability: new Map(),
        isActive: true,
        approvalStatus: 'approved',
        approvedBy: new mongoose.Types.ObjectId(hostIds[0]),
        approvedAt: new Date(Date.now() - getRandomNumber(1, 30) * 24 * 60 * 60 * 1000), // Random date in last 30 days
        rating: {
          average: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5 to 5.0
          count: getRandomNumber(0, 50)
        }
      };

      vehicles.push(vehicle);
    }

    console.log('💾 Inserting vehicles into database...');
    await Vehicle.insertMany(vehicles);

    console.log(`✅ Successfully created 100 test vehicles!`);
    console.log(`📊 Total vehicles in database: ${await Vehicle.countDocuments()}`);

    // Show breakdown by country
    const uaeCount = await Vehicle.countDocuments({ 'location.country': 'United Arab Emirates' });
    const saudiCount = await Vehicle.countDocuments({ 'location.country': 'Saudi Arabia' });
    const kuwaitCount = await Vehicle.countDocuments({ 'location.country': 'Kuwait' });
    const qatarCount = await Vehicle.countDocuments({ 'location.country': 'Qatar' });
    const bahrainCount = await Vehicle.countDocuments({ 'location.country': 'Bahrain' });
    const omanCount = await Vehicle.countDocuments({ 'location.country': 'Oman' });

    console.log('\n📍 Distribution by country:');
    console.log(`   UAE: ${uaeCount}`);
    console.log(`   Saudi Arabia: ${saudiCount}`);
    console.log(`   Kuwait: ${kuwaitCount}`);
    console.log(`   Qatar: ${qatarCount}`);
    console.log(`   Bahrain: ${bahrainCount}`);
    console.log(`   Oman: ${omanCount}`);

    await mongoose.connection.close();
    console.log('👋 Database connection closed');

  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    process.exit(1);
  }
}

seedVehicles();
