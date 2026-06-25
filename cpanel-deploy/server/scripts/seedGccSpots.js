require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

const gccSpots = [
    // UAE
    {
        name: 'Al Qudra Desert',
        nameAr: 'صحراء القدرة',
        location: 'Dubai, UAE',
        locationAr: 'دبي، الإمارات',
        description: 'Iconic dunes and lakes near Dubai; popular free desert camping. Accessible by 2WD on firm sand, 4x4 for deeper dunes.',
        descriptionAr: 'كثبان رملية وبحيرات أيقونية بالقرب من دبي؛ تخييم صحراوي مجاني شهير. يمكن الوصول إليه بسيارات الدفع الثنائي على الرمال الصلبة، والدفع الرباعي للرمال العميقة.',
        price: 0,
        rating: 4.8,
        reviews: 1240,
        image: 'https://images.unsplash.com/photo-1545105511-9252c7104b2b?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Lake', 'Cycling Track', 'Pet Friendly', 'Fire Pit'],
        coordinates: { lat: 24.8750, lng: 55.3200 }
    },
    {
        name: 'Al Marmoom Desert Reserve',
        nameAr: 'محمية المرموم الصحراوية',
        location: 'Dubai, UAE',
        locationAr: 'دبي، الإمارات',
        description: 'Quiet reserve with wide open desert spaces. 4x4 recommended.',
        descriptionAr: 'محمية هادئة بمساحات صحراوية واسعة. يوصى باستخدام سيارات الدفع الرباعي.',
        price: 0,
        rating: 4.7,
        reviews: 850,
        image: 'https://images.unsplash.com/photo-1512453979798-5ea904f92545?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Wildlife', 'Stargazing', 'Family Friendly'],
        coordinates: { lat: 24.8315, lng: 55.4172 }
    },
    {
        name: 'Fossil Rock',
        nameAr: 'صخرة الأحافير',
        location: 'Sharjah, UAE',
        locationAr: 'الشارقة، الإمارات',
        description: 'Rocky desert landmark surrounded by dunes. Requires 4x4.',
        descriptionAr: 'معلم صحراوي صخري محاط بالكثبان الرملية. يتطلب سيارة دفع رباعي.',
        price: 0,
        rating: 4.9,
        reviews: 500,
        image: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Hiking', 'Fossils', 'Dune Bashing'],
        coordinates: { lat: 25.1236, lng: 55.8703 }
    },
    {
        name: 'Pink Rock',
        nameAr: 'الصخرة الوردية',
        location: 'Sharjah, UAE',
        locationAr: 'الشارقة، الإمارات',
        description: 'Famous for its pinkish hue sand and rock formations. Great for off-roading.',
        descriptionAr: 'تشتهر برمالها ذات اللون الوردي وتكويناتها الصخرية. رائعة للقيادة على الطرق الوعرة.',
        price: 0,
        rating: 4.6,
        reviews: 320,
        image: 'https://images.unsplash.com/photo-1546519638-68e109498bb8?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Off-road', 'Photography', 'Views'],
        coordinates: { lat: 25.1052, lng: 55.8654 }
    },
    {
        name: 'Al Wathba Fossil Dunes',
        nameAr: 'كثبان الوثبة الأحفورية',
        location: 'Abu Dhabi, UAE',
        locationAr: 'أبو ظبي، الإمارات',
        description: 'Unique fossilized sand dunes creating otherworldly structures.',
        descriptionAr: 'كثبان رملية متحجرة فريدة تخلق هياكل من عالم آخر.',
        price: 0,
        rating: 4.9,
        reviews: 2100,
        image: 'https://images.unsplash.com/photo-1627400392331-5079435b5a76?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Photography', 'Walking Trails', 'Eco-tourism'],
        coordinates: { lat: 24.2186, lng: 54.6023 }
    },
    {
        name: 'Jebel Jais Foothills',
        nameAr: 'سفوح جبل جيس',
        location: 'Ras Al Khaimah, UAE',
        locationAr: 'رأس الخيمة، الإمارات',
        description: 'Camping at the base of the highest peak in the UAE. Cooler temperatures.',
        descriptionAr: 'تخييم عند قاعدة أعلى قمة في الإمارات. درجات حرارة أكثر برودة.',
        price: 0,
        rating: 4.8,
        reviews: 1500,
        image: 'https://images.unsplash.com/photo-1596700549221-69273c090382?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Hiking', 'Views', 'Cool Weather'],
        coordinates: { lat: 25.9444, lng: 56.1489 }
    },
    {
        name: 'UAQ Mangrove Beach',
        nameAr: 'شاطئ القرم أم القيوين',
        location: 'Umm Al Quwain, UAE',
        locationAr: 'أم القيوين، الإمارات',
        description: 'Beautiful beach camping next to mangrove forests. Pet friendly.',
        descriptionAr: 'تخييم شاطئي جميل بجوار غابات القرم. صديق للحيوانات الأليفة.',
        price: 0,
        rating: 4.5,
        reviews: 900,
        image: 'https://images.unsplash.com/photo-1601633513364-16a30c51859b?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Beach', 'Swimming', 'Kayaking', 'Pet Friendly'],
        coordinates: { lat: 25.5704, lng: 55.5750 }
    },

    // OMAN
    {
        name: 'Jebel Shams',
        nameAr: 'جبل شمس',
        location: 'Ad Dakhiliyah, Oman',
        locationAr: 'الداخلية، عمان',
        description: 'Highest mountain in Oman with dramatic Grand Canyon views. 4x4 recommended.',
        descriptionAr: 'أعلى جبل في عمان مع إطلالات درامية على الوادي الكبير. يوصى بالدفع الرباعي.',
        price: 0,
        rating: 5.0,
        reviews: 3000,
        image: 'https://images.unsplash.com/photo-1565551225574-d4b8f04c6436?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Hiking', 'Views', 'Cold Weather', 'Stargazing'],
        coordinates: { lat: 23.2066, lng: 57.2034 }
    },
    {
        name: 'Wadi Shab',
        nameAr: 'وادي شاب',
        location: 'Tiwi, Oman',
        locationAr: 'طيوي، عمان',
        description: 'Famous wadi with emerald green pools and a hidden cave waterfall.',
        descriptionAr: 'وادي شهير ببرك الزمرد الخضراء وشلال الكهف المخفي.',
        price: 0,
        rating: 4.9,
        reviews: 4500,
        image: 'https://images.unsplash.com/photo-1594241777085-3de382218779?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Swimming', 'Hiking', 'Waterfall'],
        coordinates: { lat: 22.8350, lng: 59.2400 }
    },
    {
        name: 'Wahiba Sands',
        nameAr: 'رمال وهيبة',
        location: 'Ash Sharqiyah, Oman',
        locationAr: 'الشرقية، عمان',
        description: 'Vast desert with towering dunes and Bedouin culture.',
        descriptionAr: 'صحراء شاسعة بكثبان رملية شاهقة وثقافة بدوية.',
        price: 0,
        rating: 4.8,
        reviews: 1200,
        image: 'https://images.unsplash.com/photo-1549303350-f1c5034c4f36?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Dune Bashing', 'Culture', 'Camels'],
        coordinates: { lat: 22.3833, lng: 58.7000 }
    },

    // SAUDI ARABIA
    {
        name: 'Edge of the World',
        nameAr: 'حافة العالم',
        location: 'Riyadh, Saudi Arabia',
        locationAr: 'الرياض، السعودية',
        description: 'Dramatic cliffs dropping off into the plain below. Spectacular views.',
        descriptionAr: 'منحدرات درامية تسقط في السهل أدناه. مناظر خلابة.',
        price: 0,
        rating: 4.9,
        reviews: 2500,
        image: 'https://images.unsplash.com/photo-1628198751503-4f93310708c0?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Views', 'Hiking', 'Geology'],
        coordinates: { lat: 24.9307, lng: 46.5651 }
    },
    {
        name: 'Umluj Coast',
        nameAr: 'شاطئ أملج',
        location: 'Tabuk, Saudi Arabia',
        locationAr: 'تبوك، السعودية',
        description: 'Known as the Maldives of Saudi Arabia with crystal clear waters.',
        descriptionAr: 'تُعرف بمالديف السعودية بمياهها الكريستالية الصافية.',
        price: 0,
        rating: 4.8,
        reviews: 1100,
        image: 'https://images.unsplash.com/photo-1590499092446-042878d6556e?auto=format&fit=crop&q=80',
        category: 'Class B',
        features: ['Beach', 'Snorkeling', 'Island Hopping'],
        coordinates: { lat: 25.0431, lng: 37.2685 }
    }
];

async function seed() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        // Find a user to act as host
        const host = await User.findOne({});
        if (!host) {
            console.error('❌ No user found in DB. Create a user first.');
            process.exit(1);
        }

        console.log(`👤 Using host: ${host.email}`);

        // Transform GCC spots to Vehicle schema
        const vehiclesData = gccSpots.map(spot => {
            const parts = spot.location.split(',');
            const city = parts[0] ? parts[0].trim() : 'Unknown';
            const country = parts[1] ? parts[1].trim() : 'GCC';

            return {
                hostId: host._id,
                title: spot.name,
                titleAr: spot.nameAr,
                description: spot.description,
                descriptionAr: spot.descriptionAr,
                type: spot.category,
                year: 2024,
                make: 'Nature',
                model: 'Spot',
                length: 0,
                sleeps: 4,
                price: spot.price || 0,
                location: {
                    address: spot.location,
                    addressAr: spot.locationAr,
                    city: city,
                    state: city,
                    country: country,
                    coordinates: spot.coordinates
                },
                images: [spot.image],
                amenities: spot.features,
                isActive: true,
                approvalStatus: 'approved', // Auto-approved
                approvedBy: host._id,
                approvedAt: new Date(),
                rating: {
                    average: spot.rating,
                    count: spot.reviews
                }
            };
        });

        console.log('🗑️ Clearing existing vehicles...');
        await Vehicle.deleteMany({});

        console.log('💾 Inserting 12 GCC Spots...');
        await Vehicle.insertMany(vehiclesData);

        console.log('✅ Seeding complete!');
        await mongoose.connection.close();
    } catch (err) {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    }
}

seed();
