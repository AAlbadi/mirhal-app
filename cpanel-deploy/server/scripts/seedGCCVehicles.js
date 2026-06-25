require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

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

const vehicleTypes = ['Class A', 'Class B', 'Class C', 'Travel Trailer', 'Fifth Wheel', 'Camper Van', 'Toy Hauler', 'Pop-up Camper'];
const makes = ['Thor', 'Winnebago', 'Airstream', 'Forest River', 'Jayco', 'Coachmen', 'Keystone', 'Mercedes-Benz', 'Ford', 'Ram'];
const models = ['Palazzo', 'Sprinter', 'Flying Cloud', 'Georgetown', 'Redhawk', 'Freelander', 'Greyhawk', 'Chateau', 'Reflection', 'Montana'];
const amenitiesList = ['Air Conditioning', 'Heating', 'Kitchen', 'Bathroom', 'Shower', 'Refrigerator', 'Microwave', 'Stove', 'Oven', 'TV', 'WiFi', 'Generator', 'Solar Panels', 'Awning'];
const placeholderImages = [
    'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=800',
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
    'https://images.unsplash.com/photo-1464347601390-25e55a6b5f5c?w=800',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800'
];

const TEST_HOST_ID = '6903341f9e1713f546fb98b8';

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedVehicles() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mirhal-marketplace';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Clean existing test vehicles first if we want
        // await Vehicle.deleteMany({ hostId: TEST_HOST_ID });

        const vehicles = [];
        for (let i = 0; i < 100; i++) {
            const location = getRandomElement(gccCities);
            const type = getRandomElement(vehicleTypes);
            const make = getRandomElement(makes);
            const model = getRandomElement(models);
            const year = getRandomNumber(2015, 2024);
            const price = getRandomNumber(200, 1500);

            vehicles.push({
                hostId: new mongoose.Types.ObjectId(TEST_HOST_ID),
                title: `${year} ${make} ${model} - ${type} in ${location.city}`,
                description: `Experience the luxury of this ${year} ${make} ${model}, perfect for your next GCC adventure. This ${type} is fully equipped with modern amenities and ready for comfortable travels in ${location.city}.`,
                type: type,
                year: year,
                make: make,
                model: model,
                length: getRandomNumber(18, 45),
                sleeps: getRandomNumber(2, 8),
                price: price,
                location: {
                    address: `${getRandomNumber(1, 999)} ${location.city} Street`,
                    city: location.city,
                    state: location.state,
                    country: location.country,
                    zipCode: String(getRandomNumber(10000, 99999)),
                    formattedAddress: `${location.city}, ${location.state}, ${location.country}`,
                    coordinates: {
                        lat: location.lat + (Math.random() - 0.5) * 0.1,
                        lng: location.lng + (Math.random() - 0.5) * 0.1
                    }
                },
                images: [getRandomElement(placeholderImages), getRandomElement(placeholderImages)],
                amenities: amenitiesList.sort(() => 0.5 - Math.random()).slice(0, 6),
                rules: "No smoking inside. Pets allowed with prior notice.",
                isActive: true,
                approvalStatus: 'approved',
                rating: { average: 4.5 + Math.random() * 0.5, count: getRandomNumber(5, 50) }
            });
        }

        await Vehicle.insertMany(vehicles);
        console.log('✅ Successfully seeded 100 GCC vehicles');
        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error seeding vehicles:', error);
        process.exit(1);
    }
}

seedVehicles();
