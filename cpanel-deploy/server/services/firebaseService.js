const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// REQUIRES: serviceAccountKey.json in the server root
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

let isInitialized = false;

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log('✅ Firebase Admin Initialized successfully.');
    } else {
        console.warn('⚠️ serviceAccountKey.json not found. Push Notifications will be mocked.');
    }
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
}

/**
 * Send a notification to a specific topic
 * @param {string} topic - The topic name (e.g., 'all_users')
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
const sendToTopic = async (topic, title, body) => {
    if (!isInitialized) {
        console.log(`[MOCK] Sending push to topic "${topic}": ${title} - ${body}`);
        return { success: true, mock: true };
    }

    const message = {
        notification: {
            title,
            body,
        },
        topic: topic,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('✅ Successfully sent message:', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Error sending message:', error);
        throw error;
    }
};

/**
 * Subscribe tokens to a topic
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {string} topic - The topic name
 */
const subscribeToTopic = async (tokens, topic) => {
    if (!isInitialized || tokens.length === 0) {
        return { success: true, count: 0 };
    }

    try {
        const response = await admin.messaging().subscribeToTopic(tokens, topic);
        console.log(`✅ Subscribed ${response.successCount} tokens to topic "${topic}"`);
        return response;
    } catch (error) {
        console.error('❌ Error subscribing to topic:', error);
        throw error;
    }
};

module.exports = {
    sendToTopic,
    subscribeToTopic,
    isInitialized: () => isInitialized
};
