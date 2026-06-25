
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { fetchAPI } from '../utils/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
    mongoUser: any;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    getToken: async () => null,
    mongoUser: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [mongoUser, setMongoUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Optionally fetch mongo user profile
                try {
                    // Check if currentUser is still valid/signed in before getting token
                    if (currentUser.email) {
                        const token = await currentUser.getIdToken();
                        const profile = await fetchAPI('/users/profile', { headers: { Authorization: `Bearer ${token}` } });
                        setMongoUser(profile.user || profile);
                    }
                } catch (e: any) {
                    console.error("Failed to fetch user profile", e.message || e);
                    // Silently fail for profile fetch to allow app usage
                }
            } else {
                setMongoUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const getToken = async () => {
        if (!user) return null;
        return user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, mongoUser, loading, signOut, getToken }}>
            {children}
        </AuthContext.Provider>
    );
};
