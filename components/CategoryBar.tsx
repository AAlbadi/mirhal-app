import React from 'react';
import { Tent, Waves, Mountain, Sun, Home, Compass, Truck, Star } from 'lucide-react';
import clsx from 'clsx';
import { Category } from '../types';
import { useI18n } from '../contexts/I18nContext';

interface CategoryBarProps {
    selected: string;
    onSelect: (cat: string) => void;
    theme?: 'light' | 'dark';
    isFlat?: boolean; // New prop for unified header
}

const CategoryBar: React.FC<CategoryBarProps> = ({ selected, onSelect, theme = 'light', isFlat = false }) => {
    const { t } = useI18n();
    const categories = [
        { name: Category.ALL, key: 'catAll', emoji: '🗺️' },
        { name: Category.RV_SERVICES, key: 'catServices', emoji: '🚐' }, // Moved to 2nd position
        { name: Category.PAID_CAMPING, key: 'catPaidCamping', emoji: '🏕️' }, // Paid Camping / Istiraha
        { name: Category.DESERT, key: 'catDesert', emoji: '🐪' },
        { name: Category.BEACH, key: 'catBeach', emoji: '🏖️' },
        { name: Category.MOUNTAIN, key: 'catMountain', emoji: '⛰️' },
    ];

    return (
        <div className={clsx(
            "flex items-center gap-2 overflow-x-auto no-scrollbar font-outfit",
            isFlat ? "pt-0 pb-1" : "pt-0 md:pt-1 pb-1 md:pb-4"
        )}>
            {categories.map((cat) => {
                const isRv = cat.name === Category.RV_SERVICES;
                const isSelected = selected === cat.name;

                return (

                    <button
                        key={cat.name}
                        onClick={() => onSelect(cat.name)}
                        className={clsx(
                            "group flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full whitespace-nowrap transition-all duration-300 border-2 text-xs md:text-sm font-black tracking-wide",
                            isSelected
                                ? (isRv
                                    ? "bg-stone-900 border-stone-900 text-brand-orange shadow-lg shadow-stone-900/30" // RV Special: Black w/ Orange Text
                                    : "bg-brand-orange border-brand-orange text-white shadow-lg shadow-brand-orange/30") // Active: Vibrant Orange
                                : "bg-white border-stone-100 text-stone-900 hover:border-stone-900 hover:bg-stone-900 hover:text-white shadow-sm dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300"
                        )}
                    >
                        <div className={clsx(
                            "text-lg md:text-xl transition-transform duration-400",
                            isSelected ? "scale-110" : "scale-100 md:group-hover:scale-110"
                        )}>
                            {cat.emoji}
                        </div>
                        <span className="tracking-tight">{t(cat.key as any)}</span>
                    </button>
                );
            })}
        </div >
    );
};

export default CategoryBar;
