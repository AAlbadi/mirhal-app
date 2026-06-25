import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertTriangle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
    onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose }) => {
    const { deleteAccount } = useAuth();
    const navigate = useNavigate();
    const [confirmText, setConfirmText] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await deleteAccount();
            // Redirect to homepage after successful deletion
            navigate('/');
        } catch (err: any) {
            console.error('Delete account error:', err);
            setError(err.message || 'Failed to delete account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-red-200 dark:border-red-900">

                {/* Header */}
                <div className="relative bg-red-50 dark:bg-red-900/20 p-8 border-b border-red-100 dark:border-red-900">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        <X size={20} className="text-stone-500" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-red-900 dark:text-red-100">
                                Delete Account
                            </h2>
                            <p className="text-red-700 dark:text-red-300 font-medium">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-6 space-y-3">
                        <p className="text-stone-700 dark:text-stone-300 font-medium">
                            Deleting your account will permanently remove:
                        </p>
                        <ul className="space-y-2 text-stone-600 dark:text-stone-400 ml-4">
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>All your submitted camping spots and listings</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>Your reviews and ratings (will be anonymized)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>Your favorites and saved spots</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>Your profile and account information</span>
                            </li>
                        </ul>
                    </div>

                    {/* Reason (Optional) */}
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                            Reason for leaving (optional)
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white"
                        >
                            <option value="">Select a reason...</option>
                            <option value="not_useful">Not useful anymore</option>
                            <option value="privacy">Privacy concerns</option>
                            <option value="alternative">Found alternative</option>
                            <option value="technical">Technical issues</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Confirmation Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                            Type <span className="text-red-600 dark:text-red-400 font-black">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            placeholder="DELETE"
                            className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl focus:ring-2 focus:ring-red-500/50 outline-none transition-all dark:text-white font-bold"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-6 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || confirmText !== 'DELETE'}
                            className="flex-1 py-3 px-6 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Account'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
