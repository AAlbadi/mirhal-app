import React, { useState } from 'react';
import { X, Flag, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface ReportModalProps {
    onClose: () => void;
    spotId: string;
    spotName: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, spotId, spotName }) => {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) {
            setError('Please select a reason');
            return;
        }

        try {
            setLoading(true);
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    spotId,
                    spotName,
                    reason,
                    details,
                    timestamp: new Date().toISOString()
                })
            });

            if (res.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError('Failed to submit report. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-8 w-full max-w-md text-center animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Report Submitted</h3>
                    <p className="text-stone-500 font-medium">Thank you for helping keep our community safe. We will review this listing shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="px-6 py-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                            <Flag size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-xl font-black text-stone-900 dark:text-white">Report Listing</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-full transition-colors">
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm font-medium text-stone-500">
                        Why are you reporting <span className="text-stone-900 dark:text-white font-bold">{spotName}</span>?
                    </p>

                    <div className="space-y-3">
                        {['Inappropriate Content', 'Spam or Scam', 'Inaccurate Location/Info', 'Safety Concerns', 'Other'].map((r) => (
                            <label key={r} className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-all has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange/5">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={r}
                                    checked={reason === r}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="accent-brand-orange w-5 h-5 bg-stone-200"
                                />
                                <span className="font-bold text-stone-700 dark:text-stone-200 text-sm">{r}</span>
                            </label>
                        ))}
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Additional Details (Optional)</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Please provide specific details..."
                            className="w-full h-24 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border-2 border-stone-100 dark:border-stone-700 outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all text-sm font-medium dark:text-white resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
