import React from 'react';
import { Share2, Check } from 'lucide-react';
import { useRequireAuth } from '../hooks/useRequireAuth';

interface ShareButtonProps {
    title: string;
    text: string;
    url?: string;
}

export default function ShareButton({ title, text, url = window.location.href }: ShareButtonProps) {
    const [copied, setCopied] = React.useState(false);
    const requireAuth = useRequireAuth();

    const handleShare = () => {
        requireAuth(async () => {
            if (navigator.share) {
                try {
                    await navigator.share({ title, text, url });
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            }
        });
    };

    return (
        <button
            onClick={handleShare}
            className="p-3 bg-brand-cream rounded-full text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors"
            title={copied ? "Copied!" : "Share this spot"}
        >
            {copied ? <Check size={20} /> : <Share2 size={20} />}
        </button>
    );
}
