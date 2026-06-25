
import { initializeApp } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyCPIv0b3IZHRL2mGwxDPaFwc8SfZl5-RfM",
    authDomain: "mirhal-marketplac.firebaseapp.com",
    projectId: "mirhal-marketplac",
    storageBucket: "mirhal-marketplac.firebasestorage.app",
    messagingSenderId: "371043899495",
    appId: "1:371043899495:web:f59ab5efbf96b8cdf29cc2",
    measurementId: "G-35VC37P3ED"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
// @ts-ignore
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export default app;
