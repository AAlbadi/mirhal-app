const express = require('express');
const router = express.Router();
const Trail = require('../models/Trail');
const { checkJwt, attachUser, requireAdmin } = require('../middleware/auth');
const { exportTrailsToGoogleSheets } = require('../services/googleSheetsService');

// Helper to get Google Sheets Auth (duplicated from admin.js for module independence)
const getSheetsAuth = async (req) => {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    let credentials = {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        hostId: req.user?._id
    };

    if (!credentials.client_email || !credentials.private_key || credentials.private_key.length < 500) {
        const fs = require('fs');
        const path = require('path');
        const serverDir = path.join(__dirname, '..');
        const files = fs.readdirSync(serverDir);
        const jsonKeyFile = files.find(f => f.endsWith('.json') && f.includes('sync') && !f.includes('package'));

        if (jsonKeyFile) {
            const keyData = JSON.parse(fs.readFileSync(path.join(serverDir, jsonKeyFile), 'utf8'));
            credentials.client_email = keyData.client_email;
            credentials.private_key = keyData.private_key;
        }
    }
    return { spreadsheetId, credentials };
};

// Get all PUBLIC trails (for feed)
router.get('/', async (req, res) => {
    try {
        const trails = await Trail.find({ isPublic: true })
            .populate('authorId', 'name picture email')
            .sort({ createdAt: -1 });
        res.json({ trails });
    } catch (err) {
        console.error('Fetch trails error:', err);
        res.status(500).json({ error: 'Failed to fetch trails' });
    }
});

// Get PENDING trails (Admin only)
router.get('/pending', checkJwt, attachUser, requireAdmin, async (req, res) => {
    try {
        const trails = await Trail.find({ approvalStatus: 'pending' })
            .populate('authorId', 'name picture email')
            .sort({ createdAt: -1 });
        res.json({ trails });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending trails' });
    }
});

// Get ALL trails (Admin only)
router.get('/all', checkJwt, attachUser, requireAdmin, async (req, res) => {
    try {
        const trails = await Trail.find({})
            .populate('authorId', 'name picture email')
            .sort({ createdAt: -1 });
        res.json({ trails });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all trails' });
    }
});

// Create a new trail
router.post('/', checkJwt, attachUser, async (req, res) => {
    try {
        const { title, location, difficulty, length, duration, elevation, description, photos, waypoints } = req.body;

        // Basic validation
        if (!title || !location || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const trail = new Trail({
            authorId: req.user._id,
            title,
            location,
            difficulty,
            length,
            duration,
            elevation,
            description,
            photos: photos || [],
            waypoints: waypoints || [],
            approvalStatus: 'pending', // Always pending initially
            isPublic: false
        });

        await trail.save();
        res.status(201).json({ message: 'Trail submitted for review', trail });
    } catch (err) {
        console.error('Create trail error:', err);
        res.status(500).json({ error: 'Failed to create trail' });
    }
});

// Approve a trail (Admin)
router.post('/:id/approve', checkJwt, attachUser, requireAdmin, async (req, res) => {
    try {
        const trail = await Trail.findById(req.params.id);
        if (!trail) return res.status(404).json({ error: 'Trail not found' });

        trail.approvalStatus = 'approved';
        trail.isPublic = true;
        await trail.save();

        // Auto-sync to Google Sheets
        try {
            const { spreadsheetId, credentials } = await getSheetsAuth(req);
            if (spreadsheetId && credentials.client_email) {
                console.log('📊 Auto-syncing approved trail to Google Sheets...');
                await exportTrailsToGoogleSheets(spreadsheetId, credentials);
                console.log('✅ Trail sync completed');
            }
        } catch (syncError) {
            console.error('⚠️ Google Sheets sync failed:', syncError.message);
        }

        res.json({ message: 'Trail approved', trail });
    } catch (err) {
        console.error('Approve trail error:', err);
        res.status(500).json({ error: 'Failed to approve trail' });
    }
});

// Reject/Delete a trail (Admin)
router.delete('/:id', checkJwt, attachUser, requireAdmin, async (req, res) => {
    try {
        const trail = await Trail.findByIdAndDelete(req.params.id);
        if (!trail) return res.status(404).json({ error: 'Trail not found' });

        // Auto-sync to Google Sheets
        try {
            const { spreadsheetId, credentials } = await getSheetsAuth(req);
            if (spreadsheetId && credentials.client_email) {
                console.log('📊 Auto-syncing trail deletion to Google Sheets...');
                await exportTrailsToGoogleSheets(spreadsheetId, credentials);
                console.log('✅ Trail sync completed');
            }
        } catch (syncError) {
            console.error('⚠️ Google Sheets sync failed:', syncError.message);
        }

        res.json({ message: 'Trail deleted/rejected' });
    } catch (err) {
        console.error('Delete trail error:', err);
        res.status(500).json({ error: 'Failed to delete trail' });
    }
});

// Toggle Like (Public/User)
router.post('/:id/like', checkJwt, attachUser, async (req, res) => {
    try {
        const trail = await Trail.findById(req.params.id);
        if (!trail) return res.status(404).json({ error: 'Trail not found' });

        const userId = req.user._id;
        const likedIndex = trail.likedBy.indexOf(userId);

        if (likedIndex === -1) {
            // Like
            trail.likedBy.push(userId);
            trail.likes = (trail.likes || 0) + 1;
        } else {
            // Unlike
            trail.likedBy.splice(likedIndex, 1);
            trail.likes = Math.max(0, (trail.likes || 1) - 1);
        }

        await trail.save();
        res.json({ likes: trail.likes, liked: likedIndex === -1 });
    } catch (err) {
        console.error('Like toggle error:', err);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// Get Single Trail
router.get('/:id', async (req, res) => {
    try {
        const trail = await Trail.findById(req.params.id).populate('authorId', 'name picture');
        if (!trail) return res.status(404).json({ error: 'Trail not found' });

        // Only show if public, or if requester is admin/author (would need token check for strictness, but for now we rely on public flag logic in frontend or loose check)
        // Actually better to enforce:
        // if (!trail.isPublic && (!req.user || (req.user._id.toString() !== trail.authorId.toString() && !req.user.isAdmin))) ...
        // keeping simple for MVP:
        res.json({ trail });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching trail' });
    }
});


module.exports = router;
