import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Review } from '../types';

interface ReviewCardProps {
    review: Review;
}

const AMENITY_EMOJIS: Record<string, string> = {
    restroom: '🚻',
    parking: '🅿️',
    firepit: '🔥',
    water: '💧',
    shade: '🌳',
    wifi: '📶',
    electric: '⚡',
    picnic: '🧺',
    trails: '🥾',
    showers: '🚿',
    swimming: '🏊',
    fishing: '🎣',
    petfriendly: '🐕',
    accessible: '♿',
    trash: '🗑️',
    security: '🔒',
};

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const reviewerName = review.reviewerId?.name || 'Explorer';
    const reviewerInitial = reviewerName[0] || 'E';
    const reviewerPhoto = review.reviewerId?.photoURL || review.reviewerId?.avatarUrl;

    // Generate a consistent pastel color based on the name
    const getAvatarColor = (name: string) => {
        const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const avatarBg = getAvatarColor(reviewerName);

    return (
        <div className="group relative p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            {/* Decorative Background Blob */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl group-hover:bg-brand-orange/10 transition-colors duration-500" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        {reviewerPhoto && !reviewerPhoto.includes('ui-avatars') ? (
                            <img
                                src={reviewerPhoto}
                                alt={reviewerName}
                                className="w-16 h-16 rounded-full object-cover border-[3px] border-white shadow-lg ring-2 ring-brand-orange/20 group-hover:ring-brand-orange/50 transition-all"
                            />
                        ) : (
                            <div className={`w-16 h-16 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white`}>
                                {reviewerInitial}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                            {/* Optional: Add a small icon here like a verified badge if applicable */}
                        </div>
                    </div>
                    <div>
                        <div className="font-black text-xl text-stone-900 tracking-tight mb-0.5 group-hover:text-brand-orange transition-colors">
                            {reviewerName}
                        </div>
                        <div className="text-sm font-bold text-stone-400">
                            {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-2xl shadow-lg shadow-stone-900/20 transform group-hover:scale-105 transition-transform">
                        <Star size={18} className="text-brand-orange fill-brand-orange" />
                        <span className="font-black text-xl tracking-tight">{review.rating}</span>
                    </div>
                </div>
            </div>

            {/* Amenities Badges */}
            {review.selectedAmenities && review.selectedAmenities.length > 0 && (
                <div className="relative flex flex-wrap gap-2 mb-6">
                    {review.selectedAmenities.map(amenityId => (
                        AMENITY_EMOJIS[amenityId] && (
                            <span
                                key={amenityId}
                                className="px-4 py-2 bg-stone-50 hover:bg-brand-orange/10 text-stone-600 hover:text-brand-orange rounded-xl text-2xl border border-stone-100 transition-colors cursor-default"
                                title={amenityId}
                            >
                                {AMENITY_EMOJIS[amenityId]}
                            </span>
                        )
                    ))}
                </div>
            )}

            {/* Comment */}
            <p className="relative text-xl text-stone-600 leading-relaxed font-medium mb-8 pl-4 border-l-4 border-brand-orange/20 group-hover:border-brand-orange transition-colors">
                "{review.comment}"
            </p>

            {/* Photos - Modern Grid */}
            {review.photos && review.photos.length > 0 && (
                <div className={`grid gap-3 ${review.photos.length === 1 ? 'grid-cols-1' : review.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {review.photos.map((photo, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedPhoto(photo)}
                            className={`relative rounded-3xl overflow-hidden group/photo border border-stone-100 shadow-sm hover:shadow-xl transition-all ${review.photos && review.photos.length >= 3 && index === 0 ? 'md:col-span-2 md:row-span-2 aspect-video md:aspect-auto' : 'aspect-square'
                                }`}
                        >
                            <img
                                src={photo}
                                alt="Review"
                                className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/10 transition-colors" />
                        </button>
                    ))}
                </div>
            )}

            {/* Photo Lightbox */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button className="absolute top-8 right-8 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all backdrop-blur-md">
                        <X size={32} />
                    </button>
                    <img
                        src={selectedPhoto}
                        alt="Review"
                        className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl object-contain animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default ReviewCard;
