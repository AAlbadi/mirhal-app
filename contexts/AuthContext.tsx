import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getApiUrl } from '../utils/api';
import { User, Session } from '@supabase/supabase-js';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    Capacitor: any;
  }
}

interface AuthContextType {
  currentUser: User | null;
  mongoUser: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mongoUser, setMongoUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    console.log("Supabase Auth: Setting up listener...");

    // Check for hash redirect (OAuth)
    const hasAuthRedirect = window.location.hash && window.location.hash.includes('access_token');
    if (hasAuthRedirect) {
      console.log("🔄 Detected OAuth redirect hash. Waiting for session processing...");
    }

    const isNative = Capacitor.isNativePlatform();

    // Initialize Capgo Social Login only on native if needed, or if plugin supports web initialization
    const initSocialLogin = async () => {
      try {
        await SocialLogin.initialize({
          google: {
            webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '',
          },
        });
        console.log("✅ Capgo Social Login Initialized");
      } catch (e) {
        console.warn("⚠️ Capgo Init Warning:", e);
      }
    };
    initSocialLogin();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If we have a redirect hash but no session yet, DON'T finish loading. 
      // Wait for onAuthStateChange to handle it.
      if (!session && hasAuthRedirect) {
        console.log("⏳ Session not found yet, but hash exists. Waiting for auth state change...");
        return;
      }
      handleSession(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Supabase Auth Change:", _event, session?.user?.email);
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: Session | null) => {
    setCurrentUser(session?.user ?? null);
    if (session?.user) {
      if (!mongoUser || mongoUser.email !== session.user.email) {
        await syncUserWithBackend(session.user);
      } else {
        setLoading(false);
      }
    } else {
      setMongoUser(null);
      setLoading(false);
    }
  };

  // Ref to prevent race conditions in sync
  const syncInProgress = React.useRef(false);

  // Soft-fail wrapper for backend sync to prevent login blocking
  const syncUserWithBackend = async (user: User) => {
    if (syncInProgress.current) {
      console.log("⏳ Sync already in progress, skipping duplicate call.");
      return;
    }

    try {
      syncInProgress.current = true;
      console.log("🚀 Syncing Supabase user with backend...");
      const apiUrl = getApiUrl();

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.warn("⚠️ No access token available for backend sync, skipping.");
        return;
      }

      const userData = {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        picture: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        provider: user.app_metadata?.provider || 'email',
        uid: user.id,
        platform: Capacitor.getPlatform() // 'web', 'ios', or 'android'
      };

      console.log(`🔗 calling ${apiUrl}/api/auth/register`);

      // Add timeout to fetch to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Backend sync success:", data);
          if (data.user) {
            setMongoUser(data.user);
          }
        } else {
          const errorText = await res.text();
          console.error("❌ Backend sync failed:", res.status, errorText);
          // Don't throw here, just log it. The user effectively has "offline mode" access or just supabase access.
        }
      } catch (fetchError) {
        console.error("❌ Backend connection error (possibly offline):", fetchError);
        // Soft fail
      }

    } catch (err) {
      console.error('❌ Critical backend registration error:', err);
    } finally {
      // ALWAYS ensure loading is false so the app un-freezes
      setLoading(false);
      syncInProgress.current = false;
    }
  };

  // HYBRID LOGIN STRATEGY:
  // - Web: Use Supabase Standard OAuth (Redirect Flow) to avoid hashing/nonce issues.
  // - Native: Use Capgo SocialLogin (Native UI) + signInWithIdToken.
  const signInWithGoogle = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (!isNative) {
        // --- WEB FLOW ---
        console.log("👉 Using Supabase Web OAuth Flow for Google...");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin, // e.g. http://localhost:3000
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });
        if (error) throw error;
        // The user will be redirected to Google, then back to the app. 
        // The auth state change listener will pick up the session.
        return;
      }

      // --- NATIVE FLOW ---
      console.log("👉 [1/2] Capgo SocialLogin.login(google) [NATIVE]...");
      const res = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile']
        }
      });

      if ((res.result as any).idToken) {
        console.log("✅ [2/2] Got ID Token from Google, signing in to Supabase...");
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: (res.result as any).idToken,
        });
        if (error) throw error;
      } else {
        throw new Error("No ID Token returned from SocialLogin");
      }

    } catch (error) {
      console.error("❌ Error during Google sign-in:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error during Email sign-in:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error during Sign up:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error during password reset:", error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();

      if (!isNative) {
        console.log("👉 Signing in with Apple (Web)...");
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: window.location.origin,
          }
        });
        if (error) throw error;
      } else {
        console.log("👉 Signing in with Apple (Native)...");
        const res = await SocialLogin.login({
          provider: 'apple',
          options: {
            scopes: ['email', 'name']
          }
        });

        if ((res.result as any).idToken) {
          console.log("✅ Got ID Token from Apple, signing in to Supabase...");
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'apple',
            token: (res.result as any).idToken,
          });
          if (error) throw error;
        } else {
          throw new Error("No ID Token returned from Apple Login");
        }
      }
    } catch (error) {
      console.error("❌ Error during Apple sign-in:", error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      console.log("👉 Signing in with Facebook...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error during Facebook sign-in:", error);
      throw error;
    }
  };

  const signInWithTwitter = async () => {
    try {
      console.log("👉 Signing in with Twitter...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("❌ Error during Twitter sign-in:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();

      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        await SocialLogin.logout({ provider: 'google' }).catch(() => { });
      }

      setMongoUser(null);
      setCurrentUser(null);
    } catch (error) {
      console.error("❌ Error during logout:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      const apiUrl = getApiUrl();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("No access token available");

      // Call backend to delete user data
      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete account: ${errorText}`);
      }

      // Delete Supabase auth user
      const { error } = await supabase.auth.admin.deleteUser(currentUser!.id);
      if (error) {
        console.warn("⚠️ Supabase user deletion warning:", error);
      }

      // Sign out
      await logout();
    } catch (error) {
      console.error("❌ Error during account deletion:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      mongoUser,
      loading,
      signInWithGoogle,
      signInWithApple,
      signInWithFacebook,
      signInWithTwitter,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout,
      deleteAccount,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};
