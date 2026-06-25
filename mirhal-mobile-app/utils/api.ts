
import { API_URL } from '../constants/Config';

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        console.log(`[API] Fetching ${url}`);

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[API] Error ${response.status}:`, errorBody);
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`[API] Network Error:`, error);
        throw error;
    }
};
