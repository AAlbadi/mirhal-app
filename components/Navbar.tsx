import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Mountain, Search, Menu, X, User as UserIcon, LogOut, Sun, Moon, Globe, Heart, Footprints } from 'lucide-react';
import clsx from 'clsx';
import SearchBar from './SearchBar';
import CategoryBar from './CategoryBar';

import AuthModal from './AuthModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import { Category } from '../types';

interface NavbarProps {
    theme?: 'light' | 'dark';
}

const Navbar: React.FC<NavbarProps> = () => {
    const { currentUser, logout } = useAuth();
    const { t, lang, setLang, dir } = useI18n();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isThemeDark, setIsThemeDark] = useState(false);

    // Auth Modal State
    const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
    // const [showAuthModal, setShowAuthModal] = useState(false); // Managed by Context now
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [showForgotPass, setShowForgotPass] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle theme toggle
    const toggleTheme = () => {
        const newTheme = !isThemeDark;
        setIsThemeDark(newTheme);
        if (newTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleLanguage = () => {
        setLang(lang === 'en' ? 'ar' : 'en');
    };

    // Sync SearchBar with URL params
    const initialFilters = {
        location: searchParams.get('location') || '',
        type: searchParams.get('type') || '',
    };

    return (
        <nav
            className={clsx(
                'fixed z-[90] transition-all duration-500 ease-out w-full safe-pt',
                scrolled
                    ? 'top-0 md:top-4 md:left-6 md:right-6 md:mx-auto md:max-w-7xl md:rounded-[2rem] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shadow-sm md:shadow-[0_8px_30px_rgba(0,0,0,0.04)] py-0 md:py-2.5'
                    : 'top-0 left-0 right-0 bg-white md:bg-transparent py-0 md:py-6'
            )}
            dir={dir}
        >
            {/* Desktop View (Visible Only) */}
            <div className={clsx("hidden md:flex w-full px-6 justify-between items-center transition-all duration-300", scrolled ? "" : "max-w-7xl mx-auto")}>
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 group shrink-0 relative z-10">
                    <div className="bg-brand-orange text-white p-1.5 rounded-lg md:group-hover:rotate-12 transition-transform shadow-lg shadow-brand-orange/20">
                        <Mountain size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xl md:text-2xl font-black tracking-tighter text-stone-900 dark:text-white">
                        {t('brand')}
                    </span>
                </Link>

                <div className="flex-1 flex justify-center px-4">
                    <SearchBar variant="navbar" initialFilters={initialFilters} key={searchParams.toString()} />
                </div>

                <div className="flex items-center gap-4 lg:gap-6 relative z-10">
                    <button
                        onClick={toggleLanguage}
                        className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors flex items-center gap-2 font-bold text-sm"
                        title={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                    >
                        <Globe size={20} />
                        <span className="hidden lg:inline">{lang === 'en' ? 'AR' : 'EN'}</span>
                    </button>

                    <Link to="/become-host" className="bg-gradient-to-r from-brand-orange to-orange-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
                        {t('becomeHost')}
                    </Link>
                    <Link to="/saved-spots" className="text-stone-500 dark:text-stone-400 font-bold text-sm hover:text-brand-orange transition-colors">
                        <Heart size={16} className="inline mr-1" />
                        {t('savedSpotsTitle')}
                    </Link>
                    {currentUser ? (
                        <div className="relative group">
                            <Link to="/profile" className="flex items-center gap-2 p-1 pr-3 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 transition-colors">
                                <img src={currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.user_metadata?.full_name || currentUser.email || 'User')}`} className="w-8 h-8 rounded-full" />
                                <span className="font-bold text-sm truncate max-w-[80px]">{currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'}</span>
                            </Link>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 p-2 opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible transition-all">
                                {currentUser.email === 'abdulazizalbadi91@gmail.com' && (
                                    <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-stone-50 rounded-xl font-bold text-brand-orange">Admin Dashboard</Link>
                                )}
                                <Link to="/profile" className="block px-4 py-2 hover:bg-stone-50 rounded-xl font-bold">{t('myProfile')}</Link>
                                <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-xl font-bold">{t('signOut')}</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { setAuthMode('signin'); openAuthModal(); }} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                            {t('signIn')}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Unified Unified Header Block (Zero Gap, Minimized) */}
            <div className="md:hidden w-full bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 shadow-sm flex flex-col pt-0.5 pb-0.5 overflow-hidden transition-all duration-300">
                {/* Top Row: Logo & Menu Button (Shrinked & Integrated) */}
                <div className="flex justify-between items-center px-4 py-0.5 mb-0.5">
                    <Link to="/" className="flex items-center gap-1.5 group transform scale-90 origin-left">
                        <div className="bg-brand-orange text-white p-1 rounded-md">
                            <Mountain size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-base font-black tracking-tighter text-stone-900 dark:text-white">
                            {t('brand')}
                        </span>
                    </Link>

                    <button
                        className="p-1 -mr-2 text-stone-600 dark:text-stone-400 active:scale-90 transition-transform"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Second Row: Search Bar (Minimized & Centered Wide) */}
                <div className="px-3 pb-0.5">
                    <SearchBar
                        variant="navbar"
                        isFlat={true}
                        initialFilters={initialFilters}
                        key={searchParams.toString()}
                    />
                </div>

                {/* Very Subtle Divider */}
                <div className="mx-6 h-[0.5px] bg-stone-100 dark:bg-stone-800/40"></div>

                {/* Third Row: Categories (Directly Attached) */}
                <div className="px-3 py-0">
                    <CategoryBar
                        isFlat={true}
                        selected={searchParams.get('category') || (searchParams.get('type') === 'rv_services' ? Category.RV_SERVICES : (searchParams.get('type') ? searchParams.get('type')!.charAt(0).toUpperCase() + searchParams.get('type')!.slice(1) : Category.ALL))}
                        onSelect={(cat) => {
                            const newParams = new URLSearchParams(searchParams);
                            if (cat === Category.ALL) {
                                newParams.delete('category');
                                newParams.delete('type');
                            } else {
                                newParams.set('category', cat);
                                const typeId = cat === Category.RV_SERVICES ? 'rv_services' : cat.toLowerCase();
                                newParams.set('type', typeId);
                            }
                            setSearchParams(newParams);
                        }}
                    />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 p-6 flex flex-col gap-4 shadow-2xl animate-fade-in z-[100]">
                    <Link to="/become-host" onClick={() => setIsMenuOpen(false)} className="p-4 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 text-white font-black shadow-lg text-center">
                        {t('becomeHost')}
                    </Link>
                    {currentUser && (
                        <>
                            <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-white">
                                {t('myProfile')}
                            </Link>
                            <Link to="/saved-spots" onClick={() => setIsMenuOpen(false)} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-white flex items-center gap-3">
                                <Heart size={20} className="text-brand-orange" fill="currentColor" />
                                {t('savedSpotsTitle')}
                            </Link>
                        </>
                    )}
                    <div className="flex gap-4">
                        <button onClick={toggleTheme} className="flex-1 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex justify-center">
                            {isThemeDark ? <Sun /> : <Moon />}
                        </button>
                        <button onClick={toggleLanguage} className="flex-1 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex justify-center text-stone-900 dark:text-white font-bold">
                            {lang.toUpperCase()}
                        </button>
                    </div>
                    {currentUser ? (
                        <button onClick={() => { logout(); setIsMenuOpen(false); }} className="p-4 rounded-xl bg-red-50 text-red-600 font-bold">
                            {t('signOut')}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setAuthMode('signin');
                                openAuthModal();
                            }}
                            className="p-4 rounded-xl bg-brand-orange text-white font-bold"
                        >
                            {t('signIn')}
                        </button>
                    )}
                </div>
            )}

            {/* Auth Modals */}
            {isAuthModalOpen && (
                <AuthModal
                    onClose={() => closeAuthModal()}
                    initialMode={authMode}
                    onForgotPassword={() => {
                        closeAuthModal();
                        setShowForgotPass(true);
                    }}
                />
            )}

            {showForgotPass && (
                <ForgotPasswordModal
                    onClose={() => setShowForgotPass(false)}
                    onBackToLogin={() => {
                        setShowForgotPass(false);
                        setAuthMode('signin');
                        openAuthModal();
                    }}
                />
            )}
        </nav>
    );
};

export default Navbar;
