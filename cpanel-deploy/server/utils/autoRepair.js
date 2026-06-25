const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const https = require('https');

// HARDCODED KEY to ensure it works even if env is missing
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDS-obxqXfEmjuprJfpZtXVKkM-uonGBlM';

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

async function runAutoRepair() {
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        log('🔧 [Auto-Repair] Starting diagnosis...');

        // Log DB Connection State
        log(`Create Connection State: ${mongoose.connection.readyState}`);

        // Find vehicles with explicit 0,0 or missing coordinates
        const query = {
            $or: [
                { 'location.coordinates.lat': 0 },
                { 'location.coordinates.lng': 0 },
                { 'location.coordinates': { $exists: false } },
                { 'location.coordinates': null }
            ]
        };

        const totalVehicles = await Vehicle.countDocuments({});
        const vehicles = await Vehicle.find(query);

        log(`📊 DB Status: Total Vehicles: ${totalVehicles}, Invalid/Zero Coords: ${vehicles.length}`);

        if (vehicles.length === 0) {
            log('✅ [Auto-Repair] No invalid spots found. System believes all are correct.');

            // DIAGNOSTIC: List first 3 spots to see what they look like
            const sample = await Vehicle.find().limit(3);
            log('🔎 Sample of existing spots:');
            sample.forEach(s => log(`   - ${s.title}: [${s.location?.coordinates?.lat}, ${s.location?.coordinates?.lng}]`));

            return { success: true, count: 0, logs };
        }

        log(`🚑 [Auto-Repair] Attempting to fix ${vehicles.length} spots...`);

        for (const v of vehicles) {
            const addressToGeocode = v.location.formattedAddress || v.location.address || v.location.city || v.location.country;

            if (!addressToGeocode) {
                log(`⚠️ Skipping "${v.title}" (No address/city found)`);
                continue;
            }

            log(`📍 Processing: "${v.title}" (addr: ${addressToGeocode})...`);

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
                log(`   ✅ Fixed (API): [${result.lat}, ${result.lng}]`);
                await new Promise(r => setTimeout(r, 200));

            } catch (error) {
                log(`   ⚠️ API Failed (${error.message}). Trying Fallback...`);

                // Fallback Logic
                const searchStr = addressToGeocode.toLowerCase();
                let match = null;
                let matchName = '';

                for (const [key, coords] of Object.entries(FALLBACK_LOCATIONS)) {
                    if (searchStr.includes(key)) {
                        match = coords;
                        matchName = key;
                        break;
                    }
                }

                if (match) {
                    const jitterLat = match.lat + (Math.random() - 0.5) * 0.05;
                    const jitterLng = match.lng + (Math.random() - 0.5) * 0.05;
                    v.location.coordinates = { lat: jitterLat, lng: jitterLng };
                    await v.save();
                    log(`   ✅ Fixed (Fallback): [${jitterLat.toFixed(4)}, ${jitterLng.toFixed(4)}] (matched "${matchName}")`);
                } else {
                    log(`   ❌ Failed: No fallback for "${addressToGeocode}"`);
                }
            }
        }
        log('🎉 [Auto-Repair] Complete.');
        return { success: true, count: vehicles.length, logs };

    } catch (err) {
        log(`❌ [Auto-Repair] CRITICAL ERROR: ${err.message}`);
        return { success: false, error: err.message, logs };
    }
}

module.exports = { runAutoRepair };
