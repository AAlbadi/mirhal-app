import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { X, Mail, Lock, User, Phone, ArrowRight, Loader, Apple } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
    initialMode?: 'signin' | 'signup';
    onForgotPassword?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialMode = 'signin', onForgotPassword }) => {
    const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
    const [method, setMethod] = useState<'email' | 'phone'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const emailTrimmed = email.trim();
        const passwordTrimmed = password.trim();
        const nameTrimmed = name.trim();

        try {
            if (method === 'phone') {
                // Phone auth implementation later
                alert('Phone auth coming in next step');
                setLoading(false);
                return;
            }

            if (mode === 'signin') {
                await signInWithEmail(emailTrimmed, passwordTrimmed);
            } else {
                if (!nameTrimmed) {
                    throw new Error('Name is required');
                }
                await signUpWithEmail(emailTrimmed, passwordTrimmed, nameTrimmed);
            }
            onClose();
        } catch (err: any) {
            console.error(err);
            // Format error message to be more user friendly
            let msg = err.message || 'An error occurred';
            msg = msg.replace('Firebase:', '').replace('auth/', '').replace('AuthApiError:', '').split('-').join(' ');

            // Handle specific Supabase errors
            if (msg.includes('invalid') && msg.includes('email')) {
                msg = 'Please enter a valid email address';
            } else if (msg.includes('already registered')) {
                msg = 'Email already in use. Please sign in.';
            } else if (msg.includes('password')) {
                msg = 'Password should be at least 6 characters';
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError('Google sign in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleAppleLogin = async () => {
        try {
            setLoading(true);
            await signInWithApple();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError('Apple sign in failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-center md:items-center md:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal / Card */}
            <div className="bg-white dark:bg-stone-900 w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-[2rem] shadow-2xl border-none md:border border-stone-200 dark:border-stone-800 relative z-10 animate-in zoom-in-95 duration-200 flex flex-col">


                {/* Close Button - Desktop & Mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 md:top-4 md:right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-20"
                >
                    <X size={24} className="text-stone-500" />
                </button>

                <div className="p-6 md:p-8 pt-8 md:pt-8 bg-white dark:bg-stone-900 h-full overflow-y-auto no-scrollbar pb-96">
                    <div className="text-center mb-6 mt-2 md:mt-0">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-orange/10 mb-3 md:hidden">
                            <User size={24} className="text-brand-orange" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white mb-1 leading-tight">
                            {mode === 'signin' ? (t('welcome') || 'Welcome') : (t('createAccount') || 'Create Account')}
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 font-medium text-sm md:text-base">
                            {mode === 'signin' ? 'Enter your details to sign in.' : 'Join the community today.'}
                        </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                        {/* Apple Button */}
                        <button
                            onClick={handleAppleLogin}
                            disabled={loading}
                            className="w-full bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-800 dark:hover:bg-stone-200 transition-all active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            <span>Apple</span>
                        </button>

                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white dark:bg-stone-800 border-2 border-stone-100 dark:border-stone-700 py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:scale-[0.98]"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            <span className="text-stone-700 dark:text-stone-200">Google</span>
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100 dark:border-stone-800"></div></div>
                        <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                            <span className="px-4 bg-white dark:bg-stone-900 text-stone-400">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-100 dark:border-stone-800 rounded-2xl focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange outline-none transition-all dark:text-white placeholder:text-stone-400 font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                <input
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-100 dark:border-stone-800 rounded-2xl focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange outline-none transition-all dark:text-white placeholder:text-stone-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-4 bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-100 dark:border-stone-800 rounded-2xl focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange outline-none transition-all dark:text-white placeholder:text-stone-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl text-center font-bold animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 mt-4 text-lg"
                        >
                            {loading ? <Loader className="animate-spin" size={24} /> : (
                                <>
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={20} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>

                    {mode === 'signin' && onForgotPassword && (
                        <button
                            onClick={onForgotPassword}
                            className="w-full text-center mt-6 text-sm font-bold text-stone-400 hover:text-brand-orange transition-colors"
                        >
                            Forgot password?
                        </button>
                    )}

                    {/* Footer Toggle */}
                    <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 text-center pb-safe">
                        <p className="text-sm font-medium text-stone-500 mb-6">
                            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                            {' '}
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="font-black text-brand-orange hover:underline ml-1"
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>

                        <div className="flex justify-center gap-6 text-[10px] uppercase font-bold text-stone-300 dark:text-stone-600 tracking-widest">
                            <button onClick={() => { onClose(); navigate('/terms'); }} className="hover:text-stone-500 dark:hover:text-stone-400 transition-colors">Terms of Service</button>
                            <span>•</span>
                            <button onClick={() => { onClose(); navigate('/privacy'); }} className="hover:text-stone-500 dark:hover:text-stone-400 transition-colors">Privacy Policy</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
