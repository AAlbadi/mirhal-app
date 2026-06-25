import { useAuth } from '../contexts/AuthContext';

export const useRequireAuth = () => {
    const { currentUser, openAuthModal } = useAuth();

    const requireAuth = (action: () => void) => {
        if (!currentUser) {
            openAuthModal();
            return;
        }
        action();
    };

    return requireAuth;
};
