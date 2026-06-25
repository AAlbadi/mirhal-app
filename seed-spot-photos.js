
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/droobee-marketplace';

const photoSets = {
    'Desert': [
        'https://images.unsplash.com/photo-1509316785289-025f54846b6e',
        'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0',
        'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35',
        'https://images.unsplash.com/photo-1501491505116-44045bfc897e',
        'https://images.unsplash.com/photo-1523910088395-dce257bd4bb5',
        'https://images.unsplash.com/photo-1508233620467-f79f1e317a05'
    ],
    'Mountain': [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
        'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1454496522488-7a8e488e8606',
        'https://images.unsplash.com/photo-1493246507139-91e8bef99c02'
    ],
    'Beach': [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206',
        'https://images.unsplash.com/photo-1473172738948-b4823ce63344',
        'https://images.unsplash.com/photo-1505118380757-91f5f45d8de0',
        'https://images.unsplash.com/photo-1495954484717-5a9645311020',
        'https://images.unsplash.com/photo-1506929193633-63b7596db3f2'
    ],
    'Forest': [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
        'https://images.unsplash.com/photo-1448375033059-5ac382f127cb',
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8',
        'https://images.unsplash.com/photo-1511497584788-8767fe771d2b',
        'https://images.unsplash.com/photo-1501183638710-841dd1904471',
        'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d'
    ],
    'Oasis': [
        'https://images.unsplash.com/photo-1536431311719-398b6704d40f',
        'https://images.unsplash.com/photo-1544911845-1f34a3ea3db3',
        'https://images.unsplash.com/photo-1516670428252-df97bba108d1',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e',
        'https://images.unsplash.com/photo-1512100356956-c1226c37fa88',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470'
    ]
};

async function seedPhotos() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!');

        const vehicles = await mongoose.connection.db.collection('vehicles').find({}).toArray();
        console.log(`📍 Found ${vehicles.length} spots to update.`);

        for (const vehicle of vehicles) {
            const type = vehicle.type || 'Desert';
            const photos = photoSets[type] || photoSets['Desert'];

            await mongoose.connection.db.collection('vehicles').updateOne(
                { _id: vehicle._id },
                { $set: { images: photos } }
            );
            console.log(`✨ Updated ${vehicle.title} with 6 ${type} photos.`);
        }

        console.log('🎉 Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedPhotos();
