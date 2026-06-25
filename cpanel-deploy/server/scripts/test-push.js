const admin = require('firebase-admin');
const path = require('path');

// 1. Load Service Account
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
console.log(`Checking for credentials at: ${serviceAccountPath}`);

try {
    const serviceAccount = require(serviceAccountPath);
    console.log('✅ Credentials file found.');

    // 2. Initialize App
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase App Initialized.');
    }

    // 3. Test Sending to Topic 'all_users'
    const message = {
        notification: {
            title: 'Test Notification',
            body: 'If you see this, FCM is working correctly!',
        },
        topic: 'all_users',
    };

    console.log('Attempting to send test message to topic "all_users"...');
    admin.messaging().send(message)
        .then((response) => {
            console.log('✅ Successfully sent message:', response);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error sending message:', error);
            process.exit(1);
        });

} catch (error) {
    console.error('❌ Failed to load credentials or initialize:', error.message);
    process.exit(1);
}
