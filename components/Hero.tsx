
import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import SearchBar, { SearchFilters } from './SearchBar';

interface HeroProps {
    theme?: 'light' | 'dark';
    onSearch?: (filters: SearchFilters) => void;
}

const Hero: React.FC<HeroProps> = ({ theme = 'light', onSearch }) => {
    const { t } = useI18n();

    return (
        <section className="relative min-h-[85vh] flex items-center justify-center pt-32 pb-20 px-4 z-20">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=2500"
                    alt="Majestic Wilderness"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-stone-50 dark:to-stone-950"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto text-center px-4 w-full">
                <h1 className="serif-heading text-7xl md:text-[9rem] font-bold mb-8 tracking-tighter text-white drop-shadow-2xl leading-none">
                    {t('explore')} <br />
                    <span className="text-brand-orange italic">{t('extraordinary')}</span>
                </h1>
                <p className="text-2xl md:text-4xl text-white/95 mb-16 max-w-4xl mx-auto font-medium drop-shadow-md leading-relaxed animate-fade-in">
                    {t('heroSubtitle')}
                </p>

                {/* Search Interface */}
                <div className="max-w-5xl mx-auto animate-slide-up relative z-[100]">
                    <SearchBar onSearch={onSearch} />
                </div>
            </div>
        </section>
    );
};

export default Hero;
