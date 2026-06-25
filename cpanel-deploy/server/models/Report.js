const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    spotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    spotName: {
        type: String,
        required: true
    },
    reporterId: { // Optional: if we want to track who reported it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String, // 'Inappropriate Content', 'Spam', etc.
        required: true
    },
    details: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: String // Admin email or ID
});

module.exports = mongoose.model('Report', reportSchema);
