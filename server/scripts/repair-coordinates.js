require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const https = require('https');

// HARDCODED KEY from COMPLETE_PRODUCTION.env to ensure it works
// (User might not have put it in .env yet)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDS-obxqXfEmjuprJfpZtXVKkM-uonGBlM';

function geocode(address) {
    return new Promise((resolve, reject) => {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'OK' && json.results && json.results.length > 0) {
                        const loc = json.results[0].geometry.location;
                        resolve({ lat: loc.lat, lng: loc.lng, formatted: json.results[0].formatted_address });
                    } else {
                        reject(new Error(json.status || 'UNKNOWN_ERROR'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}

// FALLBACK LOCATIONS (If API Key fails due to referral restrictions)
const FALLBACK_LOCATIONS = {
    'dubai': { lat: 25.2048, lng: 55.2708 },
    'abu dhabi': { lat: 24.4539, lng: 54.3773 },
    'sharjah': { lat: 25.3463, lng: 55.4209 },
    'riyadh': { lat: 24.7136, lng: 46.6753 },
    'jeddah': { lat: 21.5433, lng: 39.1728 },
    'dammam': { lat: 26.4207, lng: 50.0888 },
    'doha': { lat: 25.2854, lng: 51.5310 },
    'qatar': { lat: 25.3548, lng: 51.1839 },
    'manama': { lat: 26.2285, lng: 50.5860 },
    'bahrain': { lat: 26.0667, lng: 50.5577 },
    'kuwait': { lat: 29.3117, lng: 47.4818 },
    'muscat': { lat: 23.5859, lng: 58.4059 },
    'oman': { lat: 21.4735, lng: 55.9754 },
    'salalah': { lat: 17.0151, lng: 54.0924 },
    'uae': { lat: 23.4241, lng: 53.8478 },
    'saudi': { lat: 23.8859, lng: 45.0792 },
    'ksa': { lat: 23.8859, lng: 45.0792 }
};

async function repair() {
    try {
        console.log('🔧 Starting Coordinate Repair...');
        if (!process.env.MONGODB_URI) {
            console.error('❌ Missing MONGODB_URI');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        // Find vehicles with explicit 0,0 or missing coordinates
        const query = {
            $or: [
                { 'location.coordinates.lat': 0 },
                { 'location.coordinates.lng': 0 },
                { 'location.coordinates': { $exists: false } }
            ]
        };

        const vehicles = await Vehicle.find(query);
        console.log(`🚑 Found ${vehicles.length} vehicles with invalid/zero coordinates.`);

        for (const v of vehicles) {
            const addressToGeocode = v.location.formattedAddress || v.location.address || v.location.city || v.location.country;

            if (!addressToGeocode) {
                console.log(`⚠️ Skipping ${v.title} (No address found)`);
                continue;
            }

            console.log(`📍 Processing: "${addressToGeocode}" for ${v.title}...`);

            try {
                // Try Online Geocoding First
                const result = await geocode(addressToGeocode);

                v.location.coordinates = {
                    lat: result.lat,
                    lng: result.lng
                };

                if (!v.location.formattedAddress) {
                    v.location.formattedAddress = result.formatted;
                }

                await v.save();
                console.log(`   ✅ Fixed (API): [${result.lat}, ${result.lng}]`);

                await new Promise(r => setTimeout(r, 200));

            } catch (error) {
                console.warn(`   ⚠️ API Failed (${error.message}). Trying Offline Fallback...`);

                // Fallback Logic
                const searchStr = addressToGeocode.toLowerCase();
                let match = null;

                for (const [key, coords] of Object.entries(FALLBACK_LOCATIONS)) {
                    if (searchStr.includes(key)) {
                        match = coords;
                        break;
                    }
                }

                if (match) {
                    // Jitter the coordinates slightly so they don't stack perfectly on top of each other
                    const jitterLat = match.lat + (Math.random() - 0.5) * 0.05;
                    const jitterLng = match.lng + (Math.random() - 0.5) * 0.05;

                    v.location.coordinates = { lat: jitterLat, lng: jitterLng };
                    await v.save();
                    console.log(`   ✅ Fixed (Fallback): [${jitterLat.toFixed(4)}, ${jitterLng.toFixed(4)}] matched "${searchStr}"`);
                } else {
                    console.error(`   ❌ Failed: Could not find location for "${addressToGeocode}"`);
                }
            }
        }

        console.log('🎉 Repair complete!');
        process.exit(0);

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

repair();
