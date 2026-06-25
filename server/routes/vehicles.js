const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { checkJwt, requireHost } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all vehicles (public)
router.get('/', async (req, res) => {
  try {
    const { type, city, location, minPrice, maxPrice, sleeps, page = 1, limit = 1000, lat, lng, radius = 100 } = req.query;

    const query = {
      isActive: true,
      approvalStatus: 'approved' // Only show approved vehicles to public
    };

    let sortOptions = { createdAt: -1 };
    let useProximitySearch = false;

    if (type) query.type = type;

    // Proximity-based search if coordinates are provided
    if (lat && lng) {
      useProximitySearch = true;
      const radiusInKm = Number(radius);
      const radiusInRadians = radiusInKm / 6378.1; // Earth's radius in km

      query['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
        }
      };
    }
    // Flexible location text search - search across city, state, country, or formattedAddress
    else if (location || city) {
      const searchTerm = location || city;
      query.$or = [
        { 'location.city': new RegExp(searchTerm, 'i') },
        { 'location.state': new RegExp(searchTerm, 'i') },
        { 'location.country': new RegExp(searchTerm, 'i') },
        { 'location.formattedAddress': new RegExp(searchTerm, 'i') },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (sleeps) query.sleeps = { $gte: Number(sleeps) };

    // Use aggregation pipeline for proximity-based sorting when coordinates are provided
    let vehicles;
    let total;

    if (useProximitySearch && lat && lng) {
      // Use aggregation to sort by distance
      const aggregationPipeline = [
        { $match: query },
        {
          $addFields: {
            distance: {
              $sqrt: {
                $add: [
                  {
                    $pow: [
                      { $subtract: ['$location.coordinates.lng', Number(lng)] },
                      2
                    ]
                  },
                  {
                    $pow: [
                      { $subtract: ['$location.coordinates.lat', Number(lat)] },
                      2
                    ]
                  }
                ]
              }
            }
          }
        },
        { $sort: { distance: 1, createdAt: -1 } },
        { $skip: (Number(page) - 1) * Number(limit) },
        { $limit: Number(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'hostId',
            foreignField: '_id',
            as: 'hostInfo'
          }
        },
        {
          $addFields: {
            hostId: {
              $arrayElemAt: [
                {
                  $map: {
                    input: '$hostInfo',
                    as: 'host',
                    in: {
                      _id: '$$host._id',
                      name: '$$host.name',
                      picture: '$$host.picture',
                      rating: '$$host.rating',
                      hostProfile: '$$host.hostProfile'
                    }
                  }
                },
                0
              ]
            }
          }
        },
        { $project: { hostInfo: 0 } }
      ];

      vehicles = await Vehicle.aggregate(aggregationPipeline);
      total = await Vehicle.countDocuments(query);
    } else {
      // Regular query without proximity sorting
      vehicles = await Vehicle.find(query)
        .populate('hostId', 'name picture rating hostProfile')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort(sortOptions);

      total = await Vehicle.countDocuments(query);
    }

    // Helper to transform vehicle for frontend (Flattening location data)
    const transformVehicle = (v) => {
      const obj = v.toObject ? v.toObject() : v;

      // PARANOID COORDINATE EXTRACTION
      let safeCoords = { lat: 0, lng: 0 };
      if (obj.location && obj.location.coordinates) {
        const rawLat = obj.location.coordinates.lat;
        const rawLng = obj.location.coordinates.lng;

        if (rawLat !== undefined && rawLng !== undefined) {
          safeCoords = {
            lat: Number(rawLat),
            lng: Number(rawLng)
          };
        }
      }

      return {
        ...obj,
        location: obj.location?.formattedAddress || obj.location?.address || 'Unknown Location',
        locationAr: obj.location?.addressAr,
        city: obj.location?.city,
        state: obj.location?.state,
        country: obj.location?.country,
        coordinates: safeCoords // Guaranteed to be an object with numbers
      };
    };

    const transformedVehicles = vehicles.map(transformVehicle);

    res.json({
      vehicles: transformedVehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      proximitySearch: useProximitySearch,
    });
  } catch (error) {
    console.error('CRITICAL GET VEHICLES ERROR:', error);
    console.error(error.stack);
    res.status(500).json({ error: 'Failed to fetch vehicles', details: error.message, stack: error.stack });
  }
});

// Routes moved to bottom to avoid hijacking (e.g. /host/my-vehicles)

// Create new vehicle (public/anonymous allowed)
router.post(
  '/',
  // checkJwt removed to allow anonymous
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    // Expanded list to match frontend exactly
    body('type').isIn(['Class A', 'Class B', 'Class C', 'Travel Trailer', 'Fifth Wheel', 'Camper Van', 'Toy Hauler', 'Pop-up Camper', 'Camping Spot', 'Desert', 'Beach', 'Mountain', 'Rv Services', 'PaidCamping', 'Istiraha']).withMessage('Invalid vehicle type'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    // Made sleeps and year optional/robust as they might be inferred
    body('sleeps').optional().isInt({ min: 1 }),
    body('year').optional().isInt({ min: 1950 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Vehicle Validation Errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      console.log('Creating vehicle (Anonymous or User)');

      // --- AUTO-TRANSLATION (The Free Way) ---
      let { title, description, location } = req.body;
      let titleAr = req.body.titleAr;
      let descriptionAr = req.body.descriptionAr;
      let locationAr = req.body.locationAr;

      // Only attempt translation if complementary fields are missing
      if (!titleAr || !descriptionAr) {
        try {
          // Dynamic import for the library if it's ESM only, but google-translate-api-x handles CJS usually.
          // Using standard require as per project style.
          const { translate } = require('google-translate-api-x');

          // Heuristic: Check if input contains Arabic characters
          const isArabic = /[\u0600-\u06FF]/.test(title + description);
          const targetLang = isArabic ? 'en' : 'ar';

          console.log(`🌍 Auto-translating content to ${targetLang}...`);

          // Parallel translations
          const [transTitle, transDesc] = await Promise.all([
            translate(title, { to: targetLang, autoCorrect: true }),
            translate(description, { to: targetLang, autoCorrect: true })
          ]);

          // Also translate location address if it's a string
          let transLocation = null;
          if (location && typeof location.address === 'string') {
            transLocation = await translate(location.address, { to: targetLang });
          } else if (typeof location === 'string') {
            transLocation = await translate(location, { to: targetLang });
          }

          if (isArabic) {
            // Input was Arabic, we generated English
            // Wait, usually the primary fields are for the storage default. 
            // In this schema: 'title' is generic (usually En), 'titleAr' is Arabic.
            // If input is Arabic, we should store it in titleAr AND title? 
            // Or store Arabic in titleAr and English in title.

            // Standardizing: 
            // If input is Arabic: title=English(Gen), titleAr=Arabic(Original)
            // If input is English: title=English(Original), titleAr=Arabic(Gen)

            // However, the schema 'title' is required.
            if (!req.body.titleAr) { // If user didn't explicitly send titleAr
              // If input IS Arabic, we map input to Ar fields, and generated to En fields
              // But typically client sends to 'title'.
              // Let's just fill the missing `Ar` field if input is En, 
              // OR fill `title` (En) if input is Ar? 
              // Let's keep it simple: Fill the *other* one.

              if (targetLang === 'ar') {
                titleAr = transTitle.text;
                descriptionAr = transDesc.text;
                if (transLocation) locationAr = transLocation.text;
              } else {
                // Target is English (Input was Arabic)
                // We mistakenly received Arabic in 'title'. 
                // Swap them? No, 'title' is the primary key. 
                // Let's just store Arabic in titleAr (copy original) and English in title (generated)?
                // No, that changes user intent. 
                // Better: Store Original in 'title', Generated in 'titleAr' (if target is Ar)
                // If target is En, it means 'title' is currently Arabic.
                // We should probably store the English version in 'title'?? No, 'title' should be the display name.
                // Let's just ensure titleAr is populated.
                titleAr = title; // The original Arabic
                // Actually, if title is Arabic, keep it in title? 
                // UI logic: displayName = (lang === 'ar' && spot.titleAr) ? spot.titleAr : spot.title;
                // So if I am in English mode, I want 'title' to be English.
                // So if input is Arabic, I should MOVE it to titleAr, and put generated English in title?
                // YES.

                title = transTitle.text; // Generated English
                description = transDesc.text; // Generated English
                // titleAr = Original Arabic
                titleAr = req.body.title;
                descriptionAr = req.body.description;

                if (transLocation) {
                  locationAr = (typeof location === 'string') ? location : location.address;
                  // location object update
                  if (typeof location === 'object') {
                    location.address = transLocation.text;
                    location.addressAr = locationAr;
                  }
                }
              }
            }
          } else {
            // Input is English (Target Ar)
            titleAr = transTitle.text;
            descriptionAr = transDesc.text;
            if (transLocation) locationAr = transLocation.text;
          }

          console.log('✅ Auto-translation successful');

        } catch (transError) {
          console.warn('⚠️ Auto-translation failed (proceeding without it):', transError.message);
        }
      }

      // ----------------------------------------


      let hostId = undefined;
      let managedBy = 'user-submission';

      // OPTIONAL AUTH: Check for Bearer token to link spot to user
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const jwt = require('jsonwebtoken');
          const jwksClient = require('jwks-rsa');

          if (!process.env.SUPABASE_URL) console.warn('Missing SUPABASE_URL for optional auth');

          const client = jwksClient({
            jwksUri: `${process.env.SUPABASE_URL || 'https://unknown.supabase.co'}/auth/v1/.well-known/jwks.json`,
            cache: true,
            rateLimit: true
          });

          function getKey(header, callback) {
            client.getSigningKey(header.kid, function (err, key) {
              if (err) return callback(err);
              var signingKey = key.publicKey || key.rsaPublicKey;
              callback(null, signingKey);
            });
          }

          let decodedToken = null;
          try {
            decodedToken = await new Promise((resolve, reject) => {
              jwt.verify(token, getKey, { algorithms: ['RS256', 'HS256', 'ES256'] }, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
              });
            });
          } catch (eccErr) {
            // Fallback to secret
            if (process.env.SUPABASE_JWT_SECRET) {
              decodedToken = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
            } else {
              throw eccErr;
            }
          }

          const User = require('../models/User');
          const user = await User.findOne({ supabaseUid: decodedToken.sub });
          if (user) {
            hostId = user._id;
            managedBy = 'host';
            console.log('✅ Linked spot to user:', user.email);
          }
        } catch (authError) {
          console.error('⚠️ Optional auth check failed:', authError.message);
          // Continue as anonymous
        }
      }

      const vehicleData = {
        ...req.body,
        title, // Potentially translated English
        description, // Potentially translated English
        titleAr, // Populated Arabic
        descriptionAr, // Populated Arabic
        hostId,
        managedBy,
        approvalStatus: 'pending', // Require admin approval
        isActive: true
      };

      // Update location object if we have a translation
      if (locationAr && vehicleData.location) {
        if (typeof vehicleData.location === 'object') {
          vehicleData.location.addressAr = locationAr;
        }
      }

      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();

      res.status(201).json({
        message: 'Vehicle listed successfully',
        vehicle,
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      console.error('Error stack:', error.stack);
      console.error('Request body:', req.body);
      res.status(500).json({ error: 'Failed to create vehicle listing', details: error.message });
    }
  }
);

// Moved put logic to bottom

// Moved delete logic to bottom

// Get host's vehicles
router.get('/host/my-vehicles', checkJwt, requireHost, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ hostId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ vehicles });
  } catch (error) {
    console.error('Get host vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch your vehicles' });
  }
});

// ============ ID-BASED ROUTES (Bottom to avoid parameter hijacking) ============

// Get single vehicle (public)
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('hostId', 'name picture email hostProfile');

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Helper to transform vehicle for frontend (Flattening location data)
    const transformVehicle = (v) => {
      const obj = v.toObject ? v.toObject() : v;

      // PARANOID COORDINATE EXTRACTION
      let safeCoords = { lat: 0, lng: 0 };
      if (obj.location && obj.location.coordinates) {
        const rawLat = obj.location.coordinates.lat;
        const rawLng = obj.location.coordinates.lng;

        if (rawLat !== undefined && rawLng !== undefined) {
          safeCoords = {
            lat: Number(rawLat),
            lng: Number(rawLng)
          };
        }
      }

      return {
        ...obj,
        location: obj.location?.formattedAddress || obj.location?.address || 'Unknown Location',
        locationAr: obj.location?.addressAr,
        city: obj.location?.city,
        state: obj.location?.state,
        country: obj.location?.country,
        coordinates: safeCoords
      };
    };

    res.json({ vehicle: transformVehicle(vehicle) });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Update vehicle (host only, own vehicles)
router.put('/:id', checkJwt, requireHost, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if user owns this vehicle
    if (vehicle.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update your own vehicles' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...req.body,
          approvalStatus: 'pending', // Force re-approval
          hostId: req.user._id // Ensure hostId doesn't change
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle,
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// Delete vehicle (host only, own vehicles)
router.delete('/:id', checkJwt, requireHost, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if user owns this vehicle
    if (vehicle.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own vehicles' });
    }

    // Soft delete - just mark as inactive
    vehicle.isActive = false;
    await vehicle.save();

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

module.exports = router;
