const mongoose = require('mongoose');

const trailSchema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Moderate', 'Hard', 'Extreme'],
        default: 'Moderate'
    },
    length: {
        type: String, // e.g. "10.4 km"
        required: true
    },
    duration: {
        type: String, // e.g. "3-4 hrs"
        required: true
    },
    elevation: {
        type: String, // e.g. "450m"
    },
    description: {
        type: String,
        required: true,
        maxlength: 3000
    },
    photos: [{
        type: String // URLs
    }],
    waypoints: [{
        name: String,
        type: { type: String, default: 'Point' }, // e.g. Start, View, End
        coordinates: {
            lat: Number,
            lng: Number
        }
    }],
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likes: {
        type: Number,
        default: 0
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

trailSchema.index({ approvalStatus: 1, isPublic: 1 });

module.exports = mongoose.model('Trail', trailSchema);
