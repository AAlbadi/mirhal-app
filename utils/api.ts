export const getApiUrl = () => {
    // 1. Check if running in Capacitor Native - ALWAYS PRIORITIZE PRODUCTION FOR APP STORE
    // @ts-ignore
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        console.log('📱 Native Platform detected. Connecting to Production API: https://mirhal.app');
        return 'https://mirhal.app';
    }

    // 2. Explicit VITE_API_URL env var (set in Vercel / .env) - highest priority for web
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('placeholder')) {
        console.log('🔗 Using API URL from env:', envUrl);
        return envUrl;
    }

    // 3. If in production and on mirhal.app, use same origin
    if (typeof window !== 'undefined' && window.location.hostname.includes('mirhal.app')) {
        console.log('🌍 Live Site detected: https://mirhal.app');
        return 'https://mirhal.app';
    }

    // 4. Development web / localhost
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:5001`;
    }

    return 'http://localhost:5001';
};
