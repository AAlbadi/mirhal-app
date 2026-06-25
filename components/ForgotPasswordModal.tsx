import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, CheckCircle, ArrowRight, Loader } from 'lucide-react';

interface ForgotPasswordModalProps {
    onClose: () => void;
    onBackToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onBackToLogin }) => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message.replace('Firebase:', '').replace('auth/', '').split('-').join(' '));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10"
                >
                    <X size={20} className="text-stone-500" />
                </button>

                <div className="p-8 pb-6">
                    <div className="text-center mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors ${success ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-brand-orange/10 text-brand-orange'}`}>
                            {success ? <CheckCircle size={28} /> : <Mail size={28} />}
                        </div>
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
                            {success ? 'Check your email' : 'Reset Password'}
                        </h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed px-2">
                            {success
                                ? `We sent a link to ${email} with instructions to reset your password.`
                                : 'Enter the email associated with your account and we\'ll send you a link to reset your password.'
                            }
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 outline-none transition-all dark:text-white placeholder:text-stone-400 text-sm"
                                required
                            />

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-3.5 rounded-2xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? <Loader className="animate-spin" size={18} /> : <span>Send Instructions</span>}
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={onBackToLogin}
                            className="w-full bg-brand-orange text-white py-3.5 rounded-2xl font-semibold text-sm shadow-sm hover:opacity-90 transition-all"
                        >
                            Back to Sign In
                        </button>
                    )}

                    {!success && (
                        <button
                            onClick={onBackToLogin}
                            className="w-full text-center mt-6 text-sm font-medium text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowRight size={16} className="rotate-180" /> Back to Sign In
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
