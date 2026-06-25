import React, { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import BecomeHostForm from '../components/BecomeHostForm';
import { Tent, Flame, Car, Droplets, Fuel, Wrench, ShieldCheck, Users, Sparkles, MapPin, Zap } from 'lucide-react';
import clsx from 'clsx';

const BecomeHostPage: React.FC = () => {
    const { t, lang, dir } = useI18n();
    const { currentUser } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    const isAr = lang === 'ar';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-black text-stone-900 dark:text-white font-sans overflow-x-hidden selection:bg-brand-orange selection:text-white" dir={dir}>

            {/* 2026 Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-60 dark:opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-400/30 rounded-full blur-[120px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-brand-orange/20 rounded-full blur-[100px] animate-float mix-blend-multiply dark:mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[30vw] h-[30vw] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse-slow delay-1000 mix-blend-multiply dark:mix-blend-screen"></div>
            </div>

            <div className="relative z-10 pt-32 md:pt-48 pb-24 px-0 md:px-0">

                {/* Hero Section */}
                <div className="max-w-7xl mx-auto text-center mb-12 md:mb-24 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass-card border-white/20 mb-6 md:mb-8 animate-fade-in-up">
                        <Sparkles size={14} className="text-brand-orange animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-orange">
                            {isAr ? 'مجتمع مرحال' : 'The Mirhal Community'}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-8xl font-black mb-4 md:mb-8 leading-[1.1] tracking-tight animate-fade-in-up delay-100 dark:text-white">
                        {isAr ? (
                            <>
                                شارك <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500">مغامراتك</span>
                                <br /> واصنع وجهات <span className="italic text-stone-400 font-serif">لا تُنسى</span>
                            </>
                        ) : (
                            <>
                                Share Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500">World.</span>
                                <br /> Host the <span className="italic text-stone-400 font-serif">Unforgettable.</span>
                            </>
                        )}
                    </h1>

                    <p className="text-lg md:text-2xl font-medium text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200 px-4">
                        {isAr
                            ? 'حوّل مساحتك أو خبرتك إلى محطة أساسية للمسافرين. نحن نبني شبكة استكشاف حديثة في الخليج.'
                            : 'Transform your space or knowledge into an essential stop. We are building the modern exploration network of the GCC.'}
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 mb-24 px-4">

                    {/* Card 1: What to Share (Major Visual) */}
                    <div className="md:col-span-8 bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                        <div className="absolute top-0 right-0 p-32 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-orange/20 transition-all duration-700"></div>

                        <h2 className="text-3xl font-black mb-8 flex items-center gap-4 relative z-10">
                            <div className="bg-brand-orange text-white p-3 rounded-2xl shadow-lg shadow-brand-orange/30">
                                <Tent size={24} strokeWidth={3} />
                            </div>
                            {isAr ? 'ماذا يمكنك مشاركته؟' : 'What You Can Share'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                    {isAr ? 'مواقع المبيت' : 'Stays & Spots'}
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">🏜️</span>
                                        <span className="font-bold text-lg">{isAr ? 'صحراء وكثبان' : 'Desert & Dunes'}</span>
                                    </li>
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">🏖️</span>
                                        <span className="font-bold text-lg">{isAr ? 'شواطئ خاصة' : 'Private Beaches'}</span>
                                    </li>
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">⛰️</span>
                                        <span className="font-bold text-lg">{isAr ? 'قمم جبلية' : 'Mountain Peaks'}</span>
                                    </li>
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">🏕️</span>
                                        <span className="font-bold text-lg">{isAr ? 'استراحة / تخييم مدفوع' : 'Paid Camping / Istiraha'}</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-200 dark:border-stone-800 pb-2">
                                    {isAr ? 'خدمات الطريق' : 'Road Services'}
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">💧</span>
                                        <span className="font-bold text-lg">{isAr ? 'نقاط مياه' : 'Water Refill'}</span>
                                    </li>
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">⛽</span>
                                        <span className="font-bold text-lg">{isAr ? 'محطات طاقة' : 'Power Stations'}</span>
                                    </li>
                                    <li className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-default">
                                        <span className="text-2xl">🚐</span>
                                        <span className="font-bold text-lg">{isAr ? 'خدمات الـ RV' : 'RV Specifics'}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Impact / Why */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        <div className="flex-1 bg-gradient-to-br from-brand-orange to-orange-600 rounded-[2.5rem] p-8 shadow-2xl shadow-brand-orange/30 text-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 bg-repeat bg-[length:100px_100px]"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                                <Zap size={40} className="mb-4 animate-pulse-slow" fill="currentColor" />
                                <h3 className="text-4xl font-black mb-2">200+</h3>
                                <p className="font-bold opacity-90 text-sm uppercase tracking-widest">
                                    {isAr ? 'مستضيف نشط' : 'Active Hosts'}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Form Section - Floating Card for Desktop, Flat for Mobile */}
                <div className="max-w-5xl mx-auto md:px-4 relative z-20 -mt-10 md:mt-0">
                    <div className="bg-transparent md:bg-white md:dark:bg-stone-900 md:rounded-[3rem] md:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] md:dark:shadow-none md:border border-stone-100 dark:border-stone-800 p-0 md:p-14 relative overflow-hidden">

                        {/* Decorative Top Border (Desktop only) */}
                        <div className="hidden md:block absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50"></div>

                        <div className="text-center mb-8 md:mb-12 px-4">
                            <span className="inline-block py-1 px-3 md:px-4 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 md:mb-4">
                                {isAr ? 'ابدأ الآن' : 'Start Now'}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black mb-2 md:mb-4 dark:text-white leading-tight">
                                {currentUser ? (isAr ? 'أضف وجهتك الجديدة' : 'Add Your New Destination') : (isAr ? 'انضم كشريك' : 'Join as a Host')}
                            </h2>
                        </div>

                        <BecomeHostForm />

                        <div className="mt-8 md:mt-12 pt-8 border-t border-stone-100 dark:border-stone-800 text-center px-4">
                            <p className="text-stone-400 text-xs md:text-sm font-medium flex items-center justify-center gap-2">
                                <Users size={14} />
                                {isAr ? 'أكثر من 5000 مسافر يبحثون عن أماكن الآن' : 'Over 5,000 travelers are looking for spots right now'}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BecomeHostPage;
