/**
 * Migration Script - Generate Spot IDs for Existing Spots
 * 
 * This script:
 * 1. Finds all spots without spotId
 * 2. Generates sequential IDs based on creation date
 * 3. Updates each spot using updateOne (bypasses validation)
 * 4. Logs all changes
 */

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

async function migrateSpotIds() {
    try {
        console.log('🚀 Starting Spot ID migration...\n');

        // Find all vehicles without spotId
        const spotsWithoutId = await Vehicle.find({ spotId: { $exists: false } }).sort({ createdAt: 1 });
        const totalSpots = await Vehicle.countDocuments();
        const spotsWithId = await Vehicle.countDocuments({ spotId: { $exists: true } });

        console.log(`📊 Database Status:`);
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);
        console.log(`   Total Spots: ${totalSpots}`);
        console.log(`   With Spot ID: ${spotsWithId}`);
        console.log(`   Without Spot ID: ${spotsWithoutId.length}\n`);

        if (spotsWithoutId.length === 0) {
            console.log('✅ All spots already have Spot IDs!');
            return { migrated: 0, total: totalSpots };
        }

        console.log(`🔄 Migrating ${spotsWithoutId.length} spots...\n`);

        let counter = spotsWithId; // Start from existing count
        const updates = [];

        for (const spot of spotsWithoutId) {
            counter++;
            const spotId = `SPOT-${String(counter).padStart(4, '0')}`;

            // Use updateOne to bypass validation - allows adding spotId even if coordinates are missing
            await Vehicle.updateOne(
                { _id: spot._id },
                { $set: { spotId: spotId } }
            );

            updates.push({
                name: spot.title,
                spotId: spotId,
                _id: spot._id.toString()
            });

            console.log(`✓ ${spotId} → ${spot.title}`);
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`📊 Final Status:`);
        console.log(`   Migrated: ${updates.length} spots`);
        console.log(`   Total with Spot ID: ${await Vehicle.countDocuments({ spotId: { $exists: true } })}`);

        // Log summary to file for reference
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, 'migration-log.json');

        fs.writeFileSync(logPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            database: mongoose.connection.db.databaseName,
            migrated: updates.length,
            updates: updates
        }, null, 2));

        console.log(`\n📝 Migration log saved to: ${logPath}`);

        return { migrated: updates.length, total: totalSpots };

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/droobee-marketplace';
    console.log(`🔌 Connecting to: ${uri}\n`);

    mongoose.connect(uri)
        .then(() => {
            console.log('✅ Connected to MongoDB\n');
            return migrateSpotIds();
        })
        .then((result) => {
            console.log(`\n✅ Script complete - ${result.migrated} spots migrated`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { migrateSpotIds };
