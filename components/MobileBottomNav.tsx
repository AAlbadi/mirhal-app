import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Heart, User, Map, Plus, Footprints, Home, Calendar } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import clsx from 'clsx';

const MobileBottomNav: React.FC<{ hide?: boolean }> = ({ hide }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { t } = useI18n();

    // Hide the nav if prop is true OR if we are on a detail page
    const isDetailPage = location.pathname.includes('/spot/') || (location.pathname.includes('/trails/') && location.pathname !== '/trails' && location.pathname !== '/trails/new');

    if (hide || isDetailPage) return null;

    const tabs = [
        { id: 'explore', label: t('explore') || 'Explore', icon: Search, path: '/' },
        { id: 'wishlists', label: t('wishlists') || 'Wishlists', icon: Heart, path: '/saved-spots' },
        { id: 'share', label: '', icon: Plus, path: '/become-host', isSpecial: true },
        { id: 'trails', label: t('trails') || 'Trails', icon: Footprints, path: '/trails' },
        { id: 'profile', label: t('profile') || 'Profile', icon: User, path: '/profile' },
    ];

    return (
        <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[100] bg-stone-950 border-t border-stone-800 flex justify-between items-center px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] pt-3 pb-[env(safe-area-inset-bottom,20px)] min-h-[85px] safe-bottom-padding">
            {tabs.map((tab) => {
                const isActive = location.pathname === tab.path;
                const Icon = tab.icon;

                if (tab.isSpecial) {
                    return (
                        <div key={tab.id} className="relative -top-8 group flex flex-col items-center">
                            <button
                                onClick={() => navigate(tab.path)}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange to-orange-600 flex items-center justify-center shadow-[0_8px_30px_rgba(249,115,22,0.5)] border-4 border-stone-900 dark:border-stone-800 hover:scale-110 active:scale-95 transition-all duration-300 relative z-10 group-hover:shadow-[0_0_40px_rgba(249,115,22,0.7)]"
                            >
                                <div className="absolute inset-0 rounded-full bg-white/20 blur-sm opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <Icon size={32} color="white" strokeWidth={3} className="relative z-20 drop-shadow-md" />
                            </button>
                            <span className="absolute top-[4.5rem] text-[10px] font-bold tracking-widest uppercase text-brand-orange drop-shadow-md opacity-90 animate-in fade-in slide-in-from-top-1 duration-300">
                                Share
                            </span>
                        </div>
                    );
                }

                const isTrails = tab.id === 'trails';

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className={clsx(
                            "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative rounded-full active:bg-white/5 h-full",
                            isActive
                                ? (isTrails ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-brand-orange")
                                : "text-stone-400 hover:text-stone-200"
                        )}
                    >
                        {isActive && (
                            <div className={clsx(
                                "absolute top-0 w-8 h-1 rounded-b-full",
                                isTrails ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-brand-orange shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                            )} />
                        )}
                        <Icon
                            size={24}
                            strokeWidth={isActive ? 2.5 : 2}
                            fill={isActive && (tab.id === 'wishlists' || isTrails) ? "currentColor" : "none"}
                        />
                        <span className="text-[9px] font-black tracking-tight uppercase opacity-70 mt-1">
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default MobileBottomNav;
