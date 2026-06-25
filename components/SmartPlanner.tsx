import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Compass } from 'lucide-react';
import { getSmartSuggestions } from '../services/geminiService';
import { RecommendedSpot } from '../types';
import { useI18n } from '../contexts/I18nContext';

interface SmartPlannerProps {
    theme?: 'light' | 'dark';
}

const SmartPlanner: React.FC<SmartPlannerProps> = ({ theme = 'light' }) => {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<RecommendedSpot[]>([]);

    const handlePlan = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const results = await getSmartSuggestions(query);
            setSuggestions(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-40 px-4">
            <div className="max-w-7xl mx-auto rounded-[5rem] p-12 md:p-28 border luxury-shadow relative overflow-hidden transition-all duration-500 bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800">
                <div className="absolute top-0 right-0 w-[900px] h-[900px] blur-[250px] rounded-full -mr-[450px] -mt-[450px] bg-brand-orange/20"></div>

                <div className="relative z-10 text-center mb-24">
                    <div className="inline-flex items-center gap-4 px-10 py-5 rounded-[2rem] bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-2xl font-black mb-12">
                        <Sparkles size={32} />
                        {t('aiConcierge')}
                    </div>
                    <h2 className="serif-heading text-6xl md:text-8xl font-bold mb-10 leading-tight text-stone-900 dark:text-white">{t('serenityQuery')}</h2>
                    <p className="text-stone-500 text-3xl md:text-4xl max-w-5xl mx-auto leading-relaxed font-medium">
                        {t('plannerSubtitle')}
                    </p>
                </div>

                <div className="max-w-5xl mx-auto relative mb-24">
                    <textarea
                        rows={2}
                        placeholder={t('plannerPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full border-2 rounded-[3.5rem] px-12 py-12 focus:outline-none focus:border-brand-orange transition-all text-3xl shadow-inner resize-none font-medium bg-stone-50 border-stone-200 text-stone-900 dark:bg-black dark:border-stone-800 dark:text-white"
                    />
                    <button
                        onClick={handlePlan}
                        disabled={loading}
                        className={`mt-10 w-full md:w-auto md:absolute right-10 top-1/2 md:-translate-y-1/2 bg-brand-orange hover:bg-orange-700 text-white px-16 py-8 rounded-[2.5rem] flex items-center justify-center gap-5 text-3xl font-black transition-all disabled:opacity-50 shadow-2xl active:scale-95`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={40} /> : <Send size={40} />}
                        {t('consultConcierge')}
                    </button>
                </div>

                {suggestions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 animate-fade-in">
                        {suggestions.map((spot, i) => (
                            <div key={i} className="p-16 rounded-[4.5rem] border transition-all group flex flex-col items-center text-center bg-stone-50 border-stone-200 dark:bg-black dark:border-stone-800">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-brand-orange text-white flex items-center justify-center mb-10 shadow-2xl group-hover:scale-110 transition-transform">
                                    <Compass size={48} strokeWidth={2.5} />
                                </div>
                                <h4 className="serif-heading text-4xl font-bold mb-6 leading-tight text-stone-900 dark:text-white">{spot.title}</h4>
                                <div className="text-lg font-black text-brand-orange uppercase tracking-[0.3em] mb-8">{spot.vibe}</div>
                                <p className="text-stone-500 text-2xl leading-relaxed mb-6 font-medium">{spot.reason}</p>
                                <div className="text-xl font-bold text-brand-orange uppercase">{t('freeEntry')}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default SmartPlanner;
