import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { Mountain, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const { t, dir } = useI18n();

  return (
    <footer className="bg-stone-950 text-white py-8 md:py-12 border-t border-stone-800" dir={dir}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Simplified Single Row Layout */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange text-white p-2 rounded-xl">
              <Mountain size={20} strokeWidth={2.5} />
            </div>
            <span className="serif-heading text-xl font-bold">{t('brand')}</span>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/help" className="text-stone-400 hover:text-brand-orange transition-colors">
              {t('helpCenter')}
            </Link>
            <Link to="/about" className="text-stone-400 hover:text-brand-orange transition-colors">
              {t('about')}
            </Link>
            <Link to="/contact" className="text-stone-400 hover:text-brand-orange transition-colors">
              {t('contact')}
            </Link>
            <Link to="/privacy" className="text-stone-400 hover:text-brand-orange transition-colors">
              {t('privacy')}
            </Link>
            <Link to="/terms" className="text-stone-400 hover:text-brand-orange transition-colors">
              {t('terms')}
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            <a
              href="https://x.com/mirhal_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-stone-900 border border-stone-800 hover:bg-brand-orange hover:border-brand-orange text-stone-400 hover:text-white transition-all group"
            >
              <Twitter size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">mirhal_app</span>
            </a>
            <a
              href="https://instagram.com/mirhal_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-stone-900 border border-stone-800 hover:bg-brand-orange hover:border-brand-orange text-stone-400 hover:text-white transition-all group"
            >
              <Instagram size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">mirhal_app</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-stone-900 text-center">
          <p className="text-stone-500 text-sm">
            © {new Date().getFullYear()} Mirhal Inc. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
