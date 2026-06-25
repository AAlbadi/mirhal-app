import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Map, Calendar } from 'lucide-react';

const TripsPage: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="pt-48 pb-24 px-6 min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                <Map size={48} className="text-brand-orange" />
            </div>
            <h1 className="serif-heading text-4xl font-black mb-4 text-stone-900 dark:text-white">
                {t('noTrips') || 'No trips booked... yet!'}
            </h1>
            <p className="text-stone-500 text-lg max-w-md mx-auto mb-8 leading-relaxed">
                {t('startExploring') || 'Time to dust off your boots and find your next adventure. The desert is calling.'}
            </p>
            <a
                href="/"
                className="bg-brand-orange text-white px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
            >
                <Calendar size={20} />
                {t('exploreSpots') || 'Explore Spots'}
            </a>
        </div>
    );
};

export default TripsPage;
