import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Upload, Trash2, Star, Lock } from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface ReviewModalProps {
    spotId: string;
    spotName: string;
    onClose: () => void;
    onSubmit: () => void;
}

// Optimized Amenities List for GCC/Camping
const AMENITIES = [
    { id: 'restroom', emoji: '🚻', label: 'Restroom' },
    { id: 'parking', emoji: '🅿️', label: 'Parking' },
    { id: 'prayer', emoji: '🕌', label: 'Prayer Area' }, // GCC Specific
    { id: 'firepit', emoji: '🔥', label: 'Fire Pit' },
    { id: 'bbq', emoji: '🍖', label: 'BBQ Area' },
    { id: 'water', emoji: '💧', label: 'Water' },
    { id: 'shade', emoji: '🌳', label: 'Shade' }, // Critical for region
    { id: '4x4', emoji: '🚙', label: '4x4 Access' }, // Critical for region
    { id: 'tent_rental', emoji: '⛺', label: 'Tent Rental' },
    { id: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family Section' }, // Cultural relevance
    { id: 'fenced', emoji: '🧱', label: 'Privacy Fence' }, // Cultural relevance
    { id: 'electric', emoji: '⚡', label: 'Electric' },
    { id: 'wifi', emoji: '📶', label: 'WiFi' },
    { id: 'security', emoji: '🔒', label: 'Security' },
    { id: 'camels', emoji: '🐪', label: 'Camel Rides' }, // Regional
    { id: 'dunes', emoji: '🏜️', label: 'Sand Dunes' }, // Regional
];

const ReviewModal: React.FC<ReviewModalProps> = ({ spotId, spotName, onClose, onSubmit }) => {
    const { currentUser } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const toggleAmenity = (amenityId: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenityId)
                ? prev.filter(id => id !== amenityId)
                : [...prev, amenityId]
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files: File[] = Array.from(e.target.files);

        if (photos.length + files.length > 6) {
            alert('Maximum 6 photos allowed');
            return;
        }

        const validFiles = files.filter(file =>
            ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
        );

        if (validFiles.length !== files.length) {
            alert('Only JPG, PNG, and WebP images are allowed');
        }

        setPhotos(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setPhotoPreviews(prev => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Updated to use the new Supabase-based util
    const uploadPhotos = async (): Promise<string[]> => {
        if (!currentUser) return [];
        const { uploadMultipleImages } = await import('../utils/uploadImage');
        return await uploadMultipleImages(photos, 'reviews', currentUser.id);
    };

    const handleSubmit = async () => {
        if (!currentUser) {
            alert('Please log in to submit a review');
            return;
        }
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (!comment.trim()) {
            alert('Please write a review');
            return;
        }

        try {
            setUploading(true);
            setSubmitError('');

            // Upload photos first if any
            const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

            // Get Supabase Token
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token;

            const apiUrl = getApiUrl();

            const response = await fetch(`${apiUrl}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Use Supabase Token
                },
                body: JSON.stringify({
                    vehicleId: spotId,
                    rating,
                    comment,
                    selectedAmenities,
                    photos: photoUrls,
                    reviewType: 'vehicle'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('SERVER ERROR DETAILS:', errorData); // Make it visible in console
                throw new Error(errorData.message || JSON.stringify(errorData) || 'Failed to submit review');
            }
            onSubmit();
            onClose();
        } catch (error: any) {
            console.error('Review submission error:', error);
            // Log the full backend error response if available for debugging
            if (error.message === 'Failed to submit review') {
                // Generic error handling
            }
            setSubmitError(error.message);
        } finally {
            setUploading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-stone-50 dark:bg-stone-900 rounded-[2rem] max-w-sm w-full p-8 relative shadow-2xl border border-stone-200 dark:border-stone-800 text-center">
                    <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-orange">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-2">Login Required</h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
                        Please log in to share your experience.
                    </p>
                    <button onClick={onClose} className="w-full bg-stone-200 hover:bg-stone-300 text-stone-800 py-3 rounded-xl font-bold transition-all">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    // Compact Layout
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 dark:border-stone-800 relative">

                {/* Header - Fixed */}
                <div className="p-4 md:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <img
                            src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}`}
                            alt="User"
                            className="w-12 h-12 rounded-full border-2 border-brand-orange"
                        />
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-stone-900 dark:text-white">Write a Review</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400">for <span className="font-bold text-brand-orange">{spotName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={24} className="text-stone-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">

                    {/* Rating */}
                    <div className="flex flex-col items-center">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Rate your stay</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="hover:scale-110 transition-transform p-1"
                                >
                                    <Star
                                        size={40}
                                        className={`${star <= (hoverRating || rating) ? 'fill-brand-orange text-brand-orange' : 'text-stone-200 dark:text-stone-800'}`}
                                        fill={star <= (hoverRating || rating) ? "currentColor" : "none"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amenities - Grid Compact */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Available Amenities</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {AMENITIES.map((amenity) => (
                                <button
                                    key={amenity.id}
                                    onClick={() => toggleAmenity(amenity.id)}
                                    className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${selectedAmenities.includes(amenity.id)
                                        ? 'border-brand-orange bg-brand-orange/5'
                                        : 'border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                                        }`}
                                >
                                    <span className="text-2xl">{amenity.emoji}</span>
                                    <span className={`text-[10px] font-bold text-center leading-tight ${selectedAmenities.includes(amenity.id) ? 'text-brand-orange' : 'text-stone-500 dark:text-stone-400'}`}>
                                        {amenity.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Photos - Compact Horizontal Scroll or Grid */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Photos ({photos.length}/6)</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {photos.length < 6 && (
                                <label className="shrink-0 w-24 h-24 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange hover:bg-brand-orange/5 transition-all">
                                    <Upload size={20} className="text-stone-400 mb-1" />
                                    <span className="text-[10px] font-bold text-stone-500">Add</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            )}
                            {photoPreviews.map((preview, index) => (
                                <div key={index} className="shrink-0 w-24 h-24 relative group">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl border border-stone-200" />
                                    <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Your Experience</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What made your stay special?"
                            className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl p-4 text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-brand-orange/50 transition-all min-h-[120px] resize-none text-sm"
                            maxLength={2000}
                        />
                    </div>

                    {submitError && (
                        <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg text-center">
                            {submitError}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div className="p-4 md:p-6 border-t border-stone-100 dark:border-stone-800 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={uploading || rating === 0 || !comment.trim()}
                        className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-base md:text-lg hover:shadow-lg hover:shadow-brand-orange/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                    >
                        {uploading ? 'Publishing...' : 'Submit Review'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReviewModal;
