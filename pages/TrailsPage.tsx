import React, { useState, useEffect } from 'react';
import { Footprints, Map, Navigation, Clock, Thermometer, User, Plus, Search, Share2, Heart, Filter, MapPin } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import { Trail } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TrailsPage: React.FC = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { getIdToken, currentUser, mongoUser } = useAuth();
    const [trails, setTrails] = useState<Trail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [liking, setLiking] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrails = async () => {
            try {
                const apiUrl = getApiUrl();
                const res = await fetch(`${apiUrl}/api/trails`);
                if (res.ok) {
                    const data = await res.json();
                    setTrails(data.trails || []);
                } else {
                    setError('Failed to load trails');
                }
            } catch (err) {
                console.error('Error loading trails:', err);
                setError('Error loading trails');
            } finally {
                setLoading(false);
            }
        };

        fetchTrails();
    }, []);

    const handleLike = async (e: React.MouseEvent, trailId: string) => {
        e.stopPropagation();
        if (!currentUser) {
            alert('Please sign in to like trails!');
            return;
        }
        if (liking) return;

        setLiking(trailId);

        // Optimistic Update
        const previousTrails = [...trails];
        setTrails(prev => prev.map(t => {
            if (t._id === trailId) {
                const isLiked = t.likedBy?.includes(mongoUser?._id || '');
                return {
                    ...t,
                    likes: isLiked ? (t.likes - 1) : (t.likes + 1),
                    likedBy: isLiked
                        ? t.likedBy?.filter(id => id !== mongoUser?._id)
                        : [...(t.likedBy || []), mongoUser?._id || '']
                };
            }
            return t;
        }));

        try {
            const token = await getIdToken();
            const apiUrl = getApiUrl();
            const res = await fetch(`${apiUrl}/api/trails/${trailId}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to like');
            }

            // Sync with actual server data to be safe
            const data = await res.json();
            setTrails(prev => prev.map(t =>
                t._id === trailId ? {
                    ...t, likes: data.likes, likedBy: data.liked
                        ? [...(t.likedBy || []).filter(id => id !== mongoUser?._id), mongoUser?._id || ''] // Ensure added
                        : (t.likedBy || []).filter(id => id !== mongoUser?._id) // Ensure removed
                } : t
            ));

        } catch (err) {
            console.error('Like error:', err);
            // Revert on error
            setTrails(previousTrails);
            alert('Could not like trail. Please try again.');
        } finally {
            setLiking(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center pt-48">
                <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-stone-950 pb-24 pt-48 md:pt-40 font-outfit">
            <div className="max-w-md mx-auto px-4 md:max-w-2xl lg:max-w-4xl">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-500 dark:from-white dark:to-stone-400 tracking-tighter mb-1">
                            {t('trails') || 'Hiking Paths'}
                        </h1>
                        <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">
                            Discover {trails.length}+ community trails
                        </p>
                    </div>
                    <Link to="/trails/new" className="w-12 h-12 bg-brand-orange text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20 hover:scale-105 transition-transform hover:rotate-90 duration-300">
                        <Plus size={24} strokeWidth={3} />
                    </Link>
                </div>

                {/* Trail Feed */}
                {trails.length === 0 ? (
                    <div className="text-center py-20 bg-stone-50 dark:bg-stone-900 rounded-[2rem]">
                        <Footprints size={48} className="mx-auto text-stone-300 mb-4" />
                        <h3 className="text-xl font-black text-stone-900 dark:text-white mb-2">No trails found</h3>
                        <p className="text-stone-500 text-sm">Be the first to share a path!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {trails.map(trail => {
                            const isHard = trail.difficulty === 'Hard' || trail.difficulty === 'Extreme';
                            const isModerate = trail.difficulty === 'Moderate';
                            const colorClass = isHard ? 'red' : isModerate ? 'orange' : 'green';
                            const bgGradient = isHard
                                ? 'from-red-500/10 to-transparent'
                                : isModerate
                                    ? 'from-orange-500/10 to-transparent'
                                    : 'from-green-500/10 to-transparent';
                            const isLiked = trail.likedBy?.includes(mongoUser?._id || '');

                            return (
                                <div
                                    key={trail._id}
                                    onClick={() => navigate(`/trails/${trail._id}`)}
                                    className={`relative bg-white dark:bg-stone-900 rounded-[1.5rem] p-3 shadow-lg shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-stone-800 hover:scale-[1.01] transition-all cursor-pointer group overflow-hidden`}
                                >
                                    {/* Subtle Color Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

                                    <div className="relative h-48 rounded-[1.25rem] overflow-hidden mb-3">
                                        <img
                                            src={trail.photos?.[0] || trail.image || 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80&w=800'}
                                            alt={trail.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

                                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-xl ${isHard ? 'bg-red-500 text-white' : isModerate ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                                            } shadow-lg`}>
                                            {trail.difficulty}
                                        </div>

                                        <button
                                            onClick={(e) => handleLike(e, trail._id)}
                                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-90 ${isLiked ? 'bg-red-500 text-white shadow-red-500/30 shadow-lg' : 'bg-black/20 text-white hover:bg-black/40'
                                                }`}
                                        >
                                            <Heart size={14} fill={isLiked ? "currentColor" : "none"} strokeWidth={3} />
                                        </button>

                                        <div className="absolute bottom-3 left-3 text-white">
                                            <h3 className="text-xl font-black leading-tight mb-0.5">{trail.title}</h3>
                                            <div className="flex items-center gap-1.5 opacity-90 font-medium text-xs">
                                                <MapPin size={12} />
                                                {trail.location}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-1 pb-1">
                                        <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3 mb-3">
                                            <div className="flex flex-col items-center flex-1 border-r border-stone-100 dark:border-stone-700">
                                                <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Dist</div>
                                                <div className="text-sm font-black text-stone-900 dark:text-white">{trail.length}</div>
                                            </div>
                                            <div className="flex flex-col items-center flex-1 border-r border-stone-100 dark:border-stone-700">
                                                <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Time</div>
                                                <div className="text-sm font-black text-stone-900 dark:text-white">{trail.duration}</div>
                                            </div>
                                            <div className="flex flex-col items-center flex-1">
                                                <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold">Elev</div>
                                                <div className="text-sm font-black text-stone-900 dark:text-white">{trail.elevation || '0m'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pl-1">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={trail.authorId?.picture || trail.authorId?.avatarUrl || 'https://i.pravatar.cc/150'}
                                                    alt={trail.authorId?.name || 'Unknown'}
                                                    className="w-8 h-8 rounded-full border border-white dark:border-stone-700 shadow-sm"
                                                />
                                                <div>
                                                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Added by</div>
                                                    <div className="text-xs font-bold text-stone-900 dark:text-white">{trail.authorId?.name || 'Explorer'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-stone-500 font-bold bg-white dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-100 dark:border-stone-700 shadow-sm text-xs">
                                                <Heart size={12} className={isLiked ? "text-red-500 fill-red-500" : "text-stone-300"} />
                                                <span>{trail.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default TrailsPage;
