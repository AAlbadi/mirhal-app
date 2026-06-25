
import { Platform } from 'react-native';

const LOCALHOST_ANDROID = 'http://10.0.2.2:5001';
const LOCALHOST_IOS = 'http://localhost:5001';

// You can execute `ifconfig` (mac/linux) or `ipconfig` (windows) to find your local IP 
// and replace this for physical device testing.
// Example: const LOCAL_IP = 'http://192.168.1.15:5001';
const LOCAL_IP_ADDRESS = '192.168.1.x'; // CHANGE THIS TO YOUR MACHINE'S LOCAL IP
const LOCAL_IP = `http://${LOCAL_IP_ADDRESS}:5001`;

// Set this to true if you are testing on a real device
const USE_LOCAL_IP = false;

export const API_URL = USE_LOCAL_IP
    ? LOCAL_IP
    : Platform.select({
        android: LOCALHOST_ANDROID,
        ios: LOCALHOST_IOS,
        default: LOCALHOST_IOS,
    });
