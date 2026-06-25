import { useEffect, useState } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../utils/api';

export const usePushNotifications = () => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Only run on native platforms (iOS/Android) where Capacitor Push is supported
        // Or if we want to support Web Push later (requires different setup)
        if (!Capacitor.isNativePlatform()) {
            console.log('Push Notifications: Web environment detected. Native Push skipped (this is expected on Web).');
            return;
        }

        const initPush = async () => {
            try {
                // Request permission
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('Push Notifications: Permission denied');
                    return;
                }

                // Register with FCM/APNs
                await PushNotifications.register();

                // Listeners
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push Notifications: Token received:', token.value);
                    setToken(token.value);

                    // Send to backend to subscribe to 'all_users' topic
                    try {
                        const apiUrl = getApiUrl();
                        await fetch(`${apiUrl}/api/notifications/subscribe`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: token.value })
                        });
                        console.log('Push Notifications: Registered with backend.');
                    } catch (error) {
                        console.error('Push Notifications: Backend registration failed:', error);
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push Notifications: Registration error:', error);
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push Notifications: Received:', notification);
                    // You can show a local toast here if needed, or let OS handle it
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push Notifications: Action performed:', notification);
                    // Handle deep links or navigation if/when needed
                });

            } catch (error) {
                console.error('Push Notifications: Initialization failed', error);
            }
        };

        initPush();

        // Cleanup (Capacitor plugins typically don't have easy 'removeListener' that works same way, but good practice if needed)
        // For Push, listeners are global.

    }, []);

    return { token };
};
