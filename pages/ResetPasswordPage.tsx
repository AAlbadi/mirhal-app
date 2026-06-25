import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const ResetPasswordPage: React.FC = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Check if we have a session (the link should have logged us in)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError("Invalid or expired reset link. Please try again.");
            }
        });
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-stone-900 w-full max-w-md p-8 rounded-3xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Password Reset!</h2>
                    <p className="text-stone-500 dark:text-stone-400 mb-6">Your password has been successfully updated. You will be redirected shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-stone-500" />
                        </button>
                        <h1 className="text-2xl font-black text-stone-900 dark:text-white">Reset Password</h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                            <div className="min-w-[20px] pt-0.5">⚠️</div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">New Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-brand-orange rounded-xl outline-none transition-all font-medium text-stone-900 dark:text-white"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3 bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-brand-orange rounded-xl outline-none transition-all font-medium text-stone-900 dark:text-white"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
