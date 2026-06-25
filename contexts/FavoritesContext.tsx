import React, { createContext, useContext, useState, useEffect } from 'react';

interface FavoritesContextType {
    favorites: string[];
    toggleFavorite: (spotId: string) => void;
    isFavorite: (spotId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
    return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('mirhal_favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse favorites', e);
            }
        }
    }, []);

    const toggleFavorite = (spotId: string) => {
        setFavorites(prev => {
            const next = prev.includes(spotId)
                ? prev.filter(id => id !== spotId)
                : [...prev, spotId];
            localStorage.setItem('mirhal_favorites', JSON.stringify(next));
            return next;
        });
    };

    const isFavorite = (spotId: string) => favorites.includes(spotId);

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};
