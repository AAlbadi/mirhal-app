require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
// @ts-ignore
const { translate } = require('google-translate-api-x');

async function migrate() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const vehicles = await Vehicle.find({});
        console.log(`🚙 Found ${vehicles.length} vehicles to check.`);

        for (const v of vehicles) {
            let modified = false;

            // Check if titleAr is missing
            if (!v.titleAr && v.title) {
                try {
                    console.log(`Creating Arabic title for: ${v.title}`);
                    const res = await translate(v.title, { to: 'ar', autoCorrect: true });
                    v.titleAr = res.text;
                    modified = true;
                    // Add delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {
                    console.error(`Failed to translate title for ${v.title}:`, e.message);
                }
            }

            // Check if descriptionAr is missing
            if (!v.descriptionAr && v.description) {
                try {
                    console.log(`Creating Arabic description for: ${v.title}`);
                    const res = await translate(v.description, { to: 'ar', autoCorrect: true });
                    v.descriptionAr = res.text;
                    modified = true;
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {
                    console.error(`Failed to translate desc for ${v.title}:`, e.message);
                }
            }

            // Check if locationAr is missing
            if (v.location && v.location.address && !v.location.addressAr) {
                try {
                    console.log(`Creating Arabic location for: ${v.location.address}`);
                    const res = await translate(v.location.address, { to: 'ar' });
                    v.location.addressAr = res.text;
                    modified = true;
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {
                    console.error(`Failed to translate location for ${v.title}:`, e.message);
                }
            }

            if (modified) {
                await v.save();
                console.log(`✅ Updated ${v.title}`);
            } else {
                console.log(`Skipping ${v.title} (already complete)`);
            }
        }

        console.log('🎉 Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

migrate();
