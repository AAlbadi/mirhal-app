
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

// Define schemas here to ensure they match exactly and avoid import issues
const reviewSchema = new mongoose.Schema({
    reviewerId: mongoose.Schema.Types.ObjectId,
    revieweeId: mongoose.Schema.Types.ObjectId,
    vehicleId: mongoose.Schema.Types.ObjectId,
    reviewType: String,
    rating: Number,
    comment: String,
    photos: [String],
    approvalStatus: String,
    isPublic: Boolean,
    cleanliness: Number,
    communication: Number,
    accuracy: Number,
    value: Number
}, { timestamps: true });

async function seedReviews() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log(`📡 Connecting to MongoDB...`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected successfully.');

        const User = mongoose.connection.db.collection('users');
        const Vehicle = mongoose.connection.db.collection('vehicles');
        const Review = mongoose.model('Review', reviewSchema);

        const users = await User.find({}).limit(5).toArray();
        const vehicles = await Vehicle.find({}).limit(5).toArray();

        console.log(`📈 Found ${users.length} users and ${vehicles.length} vehicles.`);

        if (users.length < 1 || vehicles.length === 0) {
            console.error('❌ Not enough users or vehicles. Please seed them first.');
            process.exit(1);
        }

        const fakeReviewsData = [
            {
                comment: "This spot was absolutely magical! The sunset view is unmatched. We had a great time with the firepit.",
                rating: 5,
                photos: ["https://images.unsplash.com/photo-1445307806294-bff7f67ff225", "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7"]
            },
            {
                comment: "Very quiet and peaceful. The instructions were clear and the place was clean.",
                rating: 4,
                photos: ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d"]
            },
            {
                comment: "Good experience overall, but it was a bit windy. Make sure to bring extra stakes for your tent!",
                rating: 4,
                photos: []
            },
            {
                comment: "Unbelievable location. Felt like we were on another planet. 10/10 would visit again.",
                rating: 5,
                photos: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"]
            },
            {
                comment: "Nice spot but bit far from the city. Beautiful stars at night though.",
                rating: 3,
                photos: []
            }
        ];

        console.log('🧪 Generating reviews...');
        const reviews = [];
        for (let i = 0; i < 20; i++) {
            const reviewer = users[Math.floor(Math.random() * users.length)];
            const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
            const template = fakeReviewsData[Math.floor(Math.random() * fakeReviewsData.length)];

            reviews.push({
                reviewerId: reviewer._id,
                revieweeId: vehicle.hostId || reviewer._id, // fallback
                vehicleId: vehicle._id,
                reviewType: 'vehicle',
                rating: template.rating,
                comment: template.comment,
                photos: template.photos,
                approvalStatus: i % 3 === 0 ? 'pending' : 'approved', // Mix of pending and approved
                isPublic: i % 3 !== 0,
                cleanliness: 5,
                communication: 5,
                accuracy: 5,
                value: 5
            });
        }

        await Review.insertMany(reviews);
        console.log(`✅ Seeded ${reviews.length} reviews successfully!`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedReviews();
