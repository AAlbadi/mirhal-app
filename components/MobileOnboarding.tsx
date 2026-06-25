import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, X, ChevronRight, Globe, LogIn, Command, Sparkles, MapPin, Share2 } from 'lucide-react';
import clsx from 'clsx';

const MobileOnboarding: React.FC = () => {
    const { t, lang, setLang, dir } = useI18n();
    const { currentUser, openAuthModal } = useAuth();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [step, setStep] = useState(0); // 0: Welcome, 1: Language, 2: Auth, 3: Share

    useEffect(() => {
        // Show on mobile OR any Capacitor native platform (including iPads)
        const isMobile = window.innerWidth < 768;
        const isNative = window.Capacitor?.isNativePlatform();

        if (!isMobile && !isNative) return;

        // Bumped version to v3 to force show for user on new update
        const hasSeen = localStorage.getItem('mirhal_onboarding_v3');
        if (!hasSeen) {
            setTimeout(() => setIsVisible(true), 1000); // 1s delay for smooth entry after splash
        }
    }, []);

    const handleComplete = () => {
        setIsClosing(true);
        // Wait for animation to finish before unmounting
        setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem('mirhal_onboarding_v3', 'true');
        }, 700); // Match duration-700
    };

    const handleLogin = () => {
        handleComplete();
        // Small delay to let onboarding fade out before modal slides up
        setTimeout(() => {
            openAuthModal();
        }, 300);
    };

    const nextStep = () => setStep(s => s + 1);

    if (!isVisible) return null;

    return (
        <div className={clsx(
            "fixed inset-0 z-[10000] bg-stone-950 font-outfit overflow-hidden",
            isClosing ? "animate-out fade-out duration-700" : "animate-in fade-in duration-700"
        )}>
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[100vw] h-[100vw] bg-brand-orange/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[20%] -right-[20%] w-[120vw] h-[120vw] bg-emerald-500/10 rounded-full blur-[150px] animate-float" />
            </div>

            <div className="relative z-10 h-full flex flex-col p-8 safe-area-top safe-area-bottom">

                {/* Progress Bar */}
                <div className="flex gap-2 my-8 pt-safe">
                    {[0, 1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={clsx(
                                "h-1.5 flex-1 rounded-full transition-all duration-500",
                                s <= step ? "bg-brand-orange" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col justify-center">

                    {/* STEP 0: WELCOME */}
                    {step === 0 && (
                        <div className="animate-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-brand-orange rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-brand-orange/40 transform -rotate-6">
                                <Sparkles size={40} className="text-white" />
                            </div>
                            <h1 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                                {lang === 'ar' ? 'مرحباً بك في عصر التخييم الجديد' : 'Welcome to the New Era of Camping'}
                            </h1>
                            <p className="text-stone-400 text-xl font-medium leading-relaxed mb-12">
                                {lang === 'ar'
                                    ? 'استكشف أجمل المواقع في الخليج بتصميم عصري وفريد.'
                                    : 'Explore the GCC\'s most beautiful hidden gems with a 2026 ultra-modern experience.'}
                            </p>
                            <button
                                onClick={nextStep}
                                className="w-full py-5 rounded-2xl bg-white text-stone-950 font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <span>{lang === 'ar' ? 'ابدأ الاستكشاف' : 'Start Exploring'}</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* STEP 1: LANGUAGE */}
                    {step === 1 && (
                        <div className="animate-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                                {lang === 'ar' ? 'اختر لغتك المفضلة' : 'Select Your Language'}
                            </h2>
                            <p className="text-stone-400 text-lg mb-10">
                                {lang === 'ar' ? 'يمكنك تغييرها لاحقاً من الإعدادات.' : 'You can always change this later in settings.'}
                            </p>

                            <div className="grid gap-4 mb-12">
                                <button
                                    onClick={() => { setLang('ar'); }}
                                    className={clsx(
                                        "p-6 rounded-3xl border-2 flex items-center justify-between transition-all duration-300",
                                        lang === 'ar' ? "bg-brand-orange/10 border-brand-orange" : "bg-white/5 border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">🇸🇦</span>
                                        <span className="text-xl font-bold text-white">العربية</span>
                                    </div>
                                    {lang === 'ar' && <div className="w-3 h-3 bg-brand-orange rounded-full" />}
                                </button>
                                <button
                                    onClick={() => { setLang('en'); }}
                                    className={clsx(
                                        "p-6 rounded-3xl border-2 flex items-center justify-between transition-all duration-300",
                                        lang === 'en' ? "bg-brand-orange/10 border-brand-orange" : "bg-white/5 border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">🇺🇸</span>
                                        <span className="text-xl font-bold text-white">English</span>
                                    </div>
                                    {lang === 'en' && <div className="w-3 h-3 bg-brand-orange rounded-full" />}
                                </button>
                            </div>

                            <button
                                onClick={nextStep}
                                className="w-full py-5 rounded-2xl bg-brand-orange text-white font-black text-lg shadow-xl shadow-brand-orange/20 active:scale-95 transition-all"
                            >
                                {lang === 'ar' ? 'استمرار' : 'Continue'}
                            </button>
                        </div>
                    )}

                    {/* STEP 2: AUTH */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-bottom-8 duration-700">
                            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                                {lang === 'ar' ? 'تواصل مع المجتمع' : 'Connect with Us'}
                            </h2>
                            <p className="text-stone-400 text-lg mb-10">
                                {lang === 'ar' ? 'سجل دخولك لحفظ مواقعك المفضلة ومشاركة رحلاتك.' : 'Join to save your favorite spots and share your adventures.'}
                            </p>

                            <div className="grid gap-4 mb-8">
                                <button
                                    onClick={handleLogin}
                                    className="p-6 rounded-3xl bg-white text-stone-950 flex items-center gap-4 transition-all hover:scale-[1.02]"
                                >
                                    <LogIn size={24} />
                                    <div className="text-left">
                                        <div className="font-black">{lang === 'ar' ? 'تسجيل الدخول الآن' : 'Login Now'}</div>
                                        <div className="text-sm opacity-60 font-medium">{lang === 'ar' ? 'ابدأ تجربتك الكاملة' : 'Get the full experience'}</div>
                                    </div>
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="p-6 rounded-3xl bg-white/5 border border-white/10 text-white flex items-center gap-4 transition-all hover:bg-white/10"
                                >
                                    <Command size={24} />
                                    <div className="text-left">
                                        <div className="font-black">{lang === 'ar' ? 'تصفح كضيف' : 'Browse as Guest'}</div>
                                        <div className="text-sm text-stone-400 font-medium">{lang === 'ar' ? 'يمكنك التسجيل لاحقاً' : 'Join us anytime later'}</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PROMOTION / SHARE */}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-bottom-8 duration-700">
                            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/40">
                                <Share2 size={40} className="text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                                {lang === 'ar' ? 'شارك موقعك المفضل' : 'Share Your Hidden Gem'}
                            </h2>
                            <p className="text-stone-400 text-xl font-medium leading-relaxed mb-12">
                                {lang === 'ar'
                                    ? 'ساعد الآخرين في اكتشاف أماكن جديدة. شارك موقعك الأول اليوم!'
                                    : 'Help the community grow. Share your favorite camping spot and inspire others.'}
                            </p>
                            <button
                                onClick={handleComplete}
                                className="w-full py-5 rounded-2xl bg-brand-orange text-white font-black text-lg shadow-xl shadow-brand-orange/30 active:scale-95 transition-all mb-4"
                            >
                                {lang === 'ar' ? 'جاهز للانطلاق!' : 'I\'m Ready!'}
                            </button>
                            <button
                                onClick={() => { handleComplete(); navigate('/become-host'); }}
                                className="w-full py-4 text-stone-400 font-bold hover:text-white transition-colors"
                            >
                                {lang === 'ar' ? 'أريد مشاركة موقع الآن 📍' : 'I want to share a spot now 📍'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MobileOnboarding;
