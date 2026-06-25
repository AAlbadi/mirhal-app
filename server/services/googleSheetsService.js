
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const Vehicle = require('../models/Vehicle');
const Review = require('../models/Review');
const User = require('../models/User');
const Trail = require('../models/Trail');

/**
 * Sync spots from Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function syncFromGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const results = {
            total: rows.length,
            synced: 0,
            added: [],
            updated: [],
            deletedNames: [],
            deleted: 0,
            errors: []
        };

        const syncedIds = [];

        // Validate Headers
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        console.log('📄 Sheet Headers:', headers);

        const requiredHeaders = ['Name', 'Latitude', 'Longitude'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Invalid Sheet Format. Missing columns: ${missingHeaders.join(', ')}. Please use the "Export" feature first to get the correct template.`);
        }

        for (const row of rows) {
            try {
                const name = row.get('Name')?.trim();
                const nameAr = row.get('NameAr')?.trim() || '';

                // Get emoji from sheet and map back to terrain type
                const emoji = row.get('Emoji')?.trim() || '';
                let terrainType = 'Desert'; // Default

                console.log(`📍 Row ${row.rowNumber}: "${name}" - Emoji: "${emoji}"`);

                if (emoji === '🏖️') terrainType = 'Beach';
                else if (emoji === '⛰️') terrainType = 'Mountain';
                else if (emoji === '🐪') terrainType = 'Desert';
                else if (emoji === '⛺') terrainType = 'Tent Site';
                else if (emoji === '✨') terrainType = 'Glamping';

                console.log(`   ➜ Mapped to: "${terrainType}"`);

                // Legacy support: check Category column if exists (but Emoji takes precedence)
                const rawCategory = row.get('Category')?.trim();
                if (!emoji && rawCategory) {
                    terrainType = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
                }

                const locationStr = row.get('Location')?.trim();
                const city = row.get('City')?.trim() || 'Unknown';
                const locationLink = row.get('Location Link')?.trim();
                const state = row.get('State')?.trim() || 'UAE';
                const country = row.get('Country')?.trim() || 'United Arab Emirates';

                // Robust coordinate parsing (stripping any accidental spaces/letters)
                const latStr = String(row.get('Latitude') || '').replace(/[^0-9.-]/g, '');
                const lngStr = String(row.get('Longitude') || '').replace(/[^0-9.-]/g, '');
                const lat = parseFloat(latStr);
                const lng = parseFloat(lngStr);

                const description = row.get('Description')?.trim() || '';
                const descriptionAr = row.get('DescriptionAr')?.trim() || '';
                const price = parseFloat(String(row.get('Price') || '0').replace(/[^0-9.]/g, '')) || 0;

                // Multi-photo support: Check Photo 1 through Photo 6 (User specified Photo 2-6, but checking all just in case)
                // Also filtering out 'FALSE' string which seems to be appearing in the sheet
                let photos = [];
                // Check 'Photo 1' explicitly if it exists, otherwise rely on 2-6 as per user list
                const photoCols = ['Photo 1', 'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6'];

                for (const col of photoCols) {
                    const val = row.get(col);
                    if (val && typeof val === 'string' && val.trim().toUpperCase() !== 'FALSE' && val.trim() !== '') {
                        photos.push(val.trim());
                    }
                }

                // Fallback to legacy 'Photos' column if single columns are empty
                if (photos.length === 0) {
                    const legacyPhotos = row.get('Photos');
                    if (legacyPhotos && legacyPhotos.trim().toUpperCase() !== 'FALSE') {
                        photos = legacyPhotos.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }

                const features = (row.get('Features') || '').split(',').map(s => s.trim()).filter(Boolean);
                const status = (row.get('Status') || 'approved').toLowerCase().trim();

                if (!name || isNaN(lat) || isNaN(lng)) {
                    results.errors.push(`Row ${row.rowNumber}: Missing name or valid coordinates. (Lat: ${latStr}, Lng: ${lngStr})`);
                    continue;
                }

                const spotId = row.get('Spot ID')?.trim(); // Read Spot ID

                // ... (existing code for name, nameAr, emoji, etc.)

                const spotData = {
                    spotId: spotId, // Include spotId in update data
                    title: name,
                    titleAr: nameAr,
                    type: terrainType,
                    emoji: emoji || '🐪',
                    location: {
                        address: locationStr,
                        city: city,
                        state: state,
                        country: country,
                        locationLink: locationLink,
                        coordinates: { lat, lng }
                    },
                    description,
                    descriptionAr,
                    images: photos,
                    amenities: features,
                    approvalStatus: status, // This will now correctly sync 'pending', 'approved', or 'rejected'
                    price: price,
                    hostId: credentials.hostId || '658b4f3b1a2b3c4d5e6f7a8b',
                    managedBy: 'sheet',
                    year: 2024,
                    make: 'CampSpot',
                    model: 'Standard',
                    length: 1,
                    sleeps: 1,
                    price: 0
                };

                // MATCHING LOGIC: Prioritize unique Spot ID
                let existingSpot = null;
                if (spotId) {
                    existingSpot = await Vehicle.findOne({ spotId: spotId });
                }

                // Fallback: If no Spot ID or found, check by Name + Fuzzy Location
                if (!existingSpot) {
                    const tolerance = 0.001;
                    existingSpot = await Vehicle.findOne({
                        title: name,
                        'location.coordinates.lat': { $gte: lat - tolerance, $lte: lat + tolerance },
                        'location.coordinates.lng': { $gte: lng - tolerance, $lte: lng + tolerance }
                    });
                }

                let processedSpot;
                if (existingSpot) {
                    // Update existing spot
                    // Ensure we don't accidentally overwrite strict unique spotId with a different one if logic is complex, 
                    // but here we trust the sheet's ID if it matched or if we are upgrading a legacy spot to have an ID.
                    processedSpot = await Vehicle.findByIdAndUpdate(existingSpot._id, spotData, { new: true });
                    results.updated.push(name);
                } else {
                    // Create new spot
                    // If the sheet provided a Spot ID, use it. If not, the pre-save hook will generate one.
                    // IMPORTANT: If duplicate spotId error happens here, it means the sheet has duplicate IDs in different rows.
                    // We catch that error in the outer catch block.
                    processedSpot = new Vehicle(spotData);
                    await processedSpot.save();
                    results.added.push(name);
                }

                syncedIds.push(processedSpot._id);
                results.synced++;
            } catch (err) {
                results.errors.push(`Row ${row.rowNumber}: ${err.message}`);
            }
        }

        // Deletion: Remove spots managed by sheet that are NO LONGER in the sheet
        const spotsToDelete = await Vehicle.find({
            managedBy: 'sheet',
            _id: { $nin: syncedIds }
        });

        results.deletedNames = spotsToDelete.map(s => s.title);
        results.deleted = spotsToDelete.length;

        await Vehicle.deleteMany({
            _id: { $in: spotsToDelete.map(s => s._id) }
        });

        // AUTO-REPAIR: Immediately fix any coordinates that might have been 0 in the sheet
        try {
            const { runAutoRepair } = require('../utils/autoRepair');
            console.log('🔄 Triggering Post-Sync Auto-Repair...');
            await runAutoRepair();
        } catch (e) {
            console.error('Post-Sync Repair Failed:', e.message);
        }

        return results;
    } catch (error) {
        console.error('Sync Error:', error);
        throw error;
    }
}

/**
 * Export all spots to Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function exportToGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];

        // Fetch ALL spots (approved, pending, and rejected) with host info
        const spots = await Vehicle.find({}).populate('hostId', 'email').sort({ createdAt: -1 });

        // CRITICAL: Hand over control to the spreadsheet.
        // Mark all these spots as managed by the sheet in the DB.
        const spotIds = spots.map(s => s._id);
        await Vehicle.updateMany(
            { _id: { $in: spotIds } },
            { $set: { managedBy: 'sheet' } }
        );

        // Define exact headers as per admin_guide and user request
        const headers = [
            'Spot ID', 'Name', 'NameAr', 'Emoji', 'Location', 'City', 'Location Link',
            'Latitude', 'Longitude', 'Description', 'DescriptionAr',
            'Photo 2', 'Photo 3', 'Photo 4', 'Photo 5', 'Photo 6',
            'Features', 'Price', 'Contact Phone', 'Submitted By', 'Date Added', 'Status'
        ];

        // Intelligent emoji detection based on spot name and type
        const getEmoji = (spotName, type) => {
            const name = (spotName || '').toLowerCase();
            const t = (type || '').toLowerCase();

            // Beach detection
            if (name.includes('beach') || name.includes('coast') || name.includes('island') ||
                name.includes('sealine') || name.includes('fins') || name.includes('khiran') ||
                name.includes('ghariya') || name.includes('fuwairit') || name.includes('durrat') ||
                t.includes('beach') || t.includes('coast') || t.includes('sea')) {
                return '🏖️';
            }

            // Mountain detection (Jebel = mountain in Arabic)
            if (name.includes('jebel') || name.includes('mountain') || name.includes('ridge') ||
                name.includes('mutla') || name.includes('qahwan') ||
                t.includes('mountain') || t.includes('hill') || t.includes('peak')) {
                return '⛰️';
            }

            // Desert detection (default for most GCC spots)
            if (name.includes('desert') || name.includes('sakhir') || name.includes('salmi') ||
                name.includes('tree of life') || name.includes('sand') ||
                t.includes('desert') || t.includes('sand')) {
                return '🐪';
            }

            // Tent/Camping
            if (name.includes('camp') || t.includes('tent') || t.includes('camp')) return '⛺';

            // Default to desert for GCC
            return '🐪';
        };

        // Prepare rows
        const rowsToAdd = spots.map(spot => {
            const s = spot.toObject();
            const images = s.images || [];
            return {
                'Spot ID': s.spotId || '',
                'Name': s.title || '',
                'NameAr': s.titleAr || '',
                'Emoji': s.emoji || getEmoji(s.title, s.type),
                'Location': s.location?.formattedAddress || s.location?.address || '',
                'City': s.location?.city || '',
                'Location Link': s.location?.locationLink || (s.location?.coordinates ? `https://www.google.com/maps/search/?api=1&query=${s.location.coordinates.lat},${s.location.coordinates.lng}` : ''),
                'Latitude': s.location?.coordinates?.lat || '',
                'Longitude': s.location?.coordinates?.lng || '',
                'Description': s.description || '',
                'DescriptionAr': s.descriptionAr || '',
                // As per user request, cols are Photo 2..6. Mapping images[0]..images[4] to them.
                'Photo 2': images[0] || '',
                'Photo 3': images[1] || '',
                'Photo 4': images[2] || '',
                'Photo 5': images[3] || '',
                'Photo 6': images[4] || '',
                'Features': (s.amenities || []).join(', '),
                'Price': (s.type === 'PaidCamping' || s.type === 'Paid Camping') ? (s.price || 0) : 0,
                'Contact Phone': (s.type === 'PaidCamping' || s.type === 'Paid Camping') ? (s.contactPhone || '') : '',
                'Submitted By': s.hostId?.email || 'Anonymous',
                'Date Added': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '',
                'Status': s.approvalStatus || 'approved'
            };
        });

        // Clear existing rows and replace with fresh data
        await sheet.clearRows();

        // FORCE Header Update
        console.log('📄 Updating Sheet Headers:', headers);
        await sheet.setHeaderRow(headers);

        if (rowsToAdd.length > 0) {
            await sheet.addRows(rowsToAdd);
        }

        return {
            total: spots.length,
            exported: rowsToAdd.length,
            names: rowsToAdd.map(r => r.Name)
        };
    } catch (error) {
        console.error('Export Error:', error);
        throw error;
    }
}


/**
 * Export all reviews to Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function exportReviewsToGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        console.log(`📊 Exporting Review Data to: ${spreadsheetId}`);
        console.log(`👤 Using Service Account: ${credentials.client_email}`);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];

        // Fetch ALL reviews and populate related info including spotId
        const reviews = await Review.find({})
            .populate('reviewerId', 'name email')
            .populate('vehicleId', 'title spotId')
            .sort({ createdAt: -1 });

        const headers = [
            'Review ID', 'Spot ID', 'Spot Name', 'Reviewer Name', 'Reviewer Email', 'Rating',
            'Clean', 'Acc', 'Comm', 'Value', 'Terrain',
            'Comment', 'Photos', 'Status', 'Date'
        ];

        const rowsToAdd = reviews.map(review => {
            const r = review.toObject();
            return {
                'Review ID': String(r._id),
                'Spot ID': r.vehicleId?.spotId || '',
                'Spot Name': r.vehicleId?.title || 'Unknown Spot',
                'Reviewer Name': r.reviewerId?.name || 'Unknown User',
                'Reviewer Email': r.reviewerId?.email || '',
                'Rating': r.rating || 0,
                'Clean': r.cleanliness || 0,
                'Acc': r.accuracy || 0,
                'Comm': r.communication || 0,
                'Value': r.value || 0,
                'Terrain': r.terrainSuggestion || '',
                'Comment': r.comment || '',
                'Photos': (r.photos || []).join(', '),
                'Status': r.approvalStatus || 'pending',
                'Date': r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''
            };
        });

        await sheet.clearRows();
        try {
            await sheet.setHeaderRow(headers);
        } catch (e) { }

        if (rowsToAdd.length > 0) {
            await sheet.addRows(rowsToAdd);
        }

        return {
            total: reviews.length,
            exported: rowsToAdd.length,
            names: rowsToAdd.map(r => `${r['Reviewer Name']} on ${r['Spot Name']}`)
        };
    } catch (error) {
        console.error('Review Export Error:', error);
        throw error;
    }
}

/**
 * Sync review moderation from Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function syncReviewsFromGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];
        // Validate Headers for Reviews
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        const requiredHeaders = ['Review ID', 'Status'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Invalid Review Sheet. Missing columns: ${missingHeaders.join(', ')}. Please use the "Export Reviews" feature first.`);
        }

        const rows = await sheet.getRows();

        const results = {
            total: rows.length,
            updated: 0,
            names: [],
            errors: []
        };

        for (const row of rows) {
            try {
                const reviewId = row.get('Review ID')?.trim();
                const status = (row.get('Status') || 'pending').toLowerCase().trim();

                if (!reviewId) continue;

                // Update the review
                const isApproved = status === 'approved';
                const updatedReview = await Review.findByIdAndUpdate(reviewId, {
                    approvalStatus: status,
                    isPublic: isApproved
                }, { new: true }).populate('reviewerId', 'name').populate('vehicleId', 'title');

                if (updatedReview) {
                    results.updated++;
                    results.names.push(`${updatedReview.reviewerId?.name} on ${updatedReview.vehicleId?.title}`);
                }
            } catch (err) {
                results.errors.push(`Row ${row.rowNumber}: ${err.message}`);
            }
        }

        return results;
    } catch (error) {
        console.error('Review Sync Error:', error);
        throw error;
    }
}

/**
 * Sync trails from Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function syncTrailsFromGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];
        // Validate Headers for Trails
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        const requiredHeaders = ['Name', 'Location', 'Difficulty'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            throw new Error(`Invalid Trail Sheet. Missing columns: ${missingHeaders.join(', ')}. Please use the "Export Trails" feature first.`);
        }

        const rows = await sheet.getRows();

        const results = {
            total: rows.length,
            synced: 0,
            added: [],
            updated: [],
            errors: []
        };

        for (const row of rows) {
            try {
                const title = row.get('Name')?.trim();
                if (!title) continue;

                const location = row.get('Location')?.trim() || 'Unknown';
                const difficulty = row.get('Difficulty')?.trim() || 'Moderate';
                const length = row.get('Length')?.trim() || 'Unknown';
                const duration = row.get('Duration')?.trim() || 'Unknown';
                const elevation = row.get('Elevation')?.trim() || '';
                const description = row.get('Description')?.trim() || '';
                const status = (row.get('Status') || 'approved').toLowerCase().trim();

                let photos = [];
                for (let i = 1; i <= 6; i++) {
                    const p = row.get(`Photo ${i}`)?.trim();
                    if (p) photos.push(p);
                }

                // Parse waypoints if available in JSON format or simple lat,lng string (simplified for now)
                // For this MVP sync, we'll skip complex waypoint parsing unless standard format is defined

                const trailData = {
                    title,
                    location,
                    difficulty,
                    length,
                    duration,
                    elevation,
                    description,
                    photos,
                    approvalStatus: status,
                    isPublic: status === 'approved',
                    // Use a placeholder authorId if not syncing users, or the hostId from creds
                    authorId: credentials.hostId || '658b4f3b1a2b3c4d5e6f7a8b'
                };

                const existingTrail = await Trail.findOne({ title });

                if (existingTrail) {
                    await Trail.findByIdAndUpdate(existingTrail._id, trailData);
                    results.updated.push(title);
                } else {
                    const newTrail = new Trail(trailData);
                    await newTrail.save();
                    results.added.push(title);
                }
                results.synced++;
            } catch (err) {
                results.errors.push(`Row ${row.rowNumber}: ${err.message}`);
            }
        }

        return results;
    } catch (error) {
        console.error('Trail Sync Error:', error);
        throw error;
    }
}

/**
 * Export trails to Google Sheets
 * @param {string} spreadsheetId 
 * @param {object} credentials { client_email, private_key }
 */
async function exportTrailsToGoogleSheets(spreadsheetId, credentials) {
    try {
        const serviceAccountAuth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];

        const trails = await Trail.find({}).populate('authorId', 'name email').sort({ createdAt: -1 });

        const headers = [
            'Name', 'Location', 'Difficulty', 'Length', 'Duration',
            'Elevation', 'Description', 'Submitted By', 'Photo 1', 'Photo 2', 'Photo 3',
            'Status'
        ];

        const rowsToAdd = trails.map(trail => {
            const t = trail.toObject();
            const images = t.photos || [];
            return {
                'Name': t.title || '',
                'Location': t.location || '',
                'Difficulty': t.difficulty || 'Moderate',
                'Length': t.length || '',
                'Duration': t.duration || '',
                'Elevation': t.elevation || '',
                'Description': t.description || '',
                'Submitted By': t.authorId?.email || '',
                'Photo 1': images[0] || '',
                'Photo 2': images[1] || '',
                'Photo 3': images[2] || '',
                'Status': t.approvalStatus || 'pending'
            };
        });

        await sheet.clearRows();
        try {
            await sheet.setHeaderRow(headers);
        } catch (e) { }

        if (rowsToAdd.length > 0) {
            await sheet.addRows(rowsToAdd);
        }

        return {
            total: trails.length,
            exported: rowsToAdd.length
        };
    } catch (error) {
        console.error('Trail Export Error:', error);
        throw error;
    }
}

module.exports = {
    syncFromGoogleSheets,
    exportToGoogleSheets,
    exportReviewsToGoogleSheets,
    syncReviewsFromGoogleSheets,
    syncTrailsFromGoogleSheets,
    exportTrailsToGoogleSheets
};
