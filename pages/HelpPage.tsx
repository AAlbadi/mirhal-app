
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useI18n } from '../contexts/I18nContext';

const HelpPage: React.FC = () => {
  const { t } = useI18n();

  const faqs = [
    {
      q: "How do I book a spot?",
      a: "Simply search for your desired location, choose a listing, select your dates, and click 'Request to Book'. The host will review your request."
    },
    {
      q: "Is insurance included?",
      a: "For RV rentals, basic insurance options are available during checkout. For camping spots, you are responsible for your own safety and equipment."
    },
    {
      q: "How do Paid Camping spots work?",
      a: "These are exclusive spots managed by locals. When you book, you get the precise coordinates and the host's contact info to arrange access."
    },
    {
      q: "Can I cancel my booking?",
      a: "Yes, cancellation policies vary by host. Check the listing details for specific terms (Flexible, Moderate, or Strict)."
    },
    {
      q: "How do I become a host?",
      a: "Click 'Become a Host' in the menu, fill out your listing details, upload photos, and submit. Our team will review your listing before it goes live."
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-48 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-4">How can we help?</h1>
            <p className="text-xl text-stone-500">Frequently asked questions and support.</p>
          </header>

          <div className="grid gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white dark:bg-stone-900 rounded-[2rem] p-8 shadow-lg border border-stone-100 dark:border-stone-800 transition-all hover:shadow-xl">
                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-3">{faq.q}</h3>
                <p className="text-stone-600 dark:text-stone-300">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-brand-orange/10 rounded-[3rem] p-12">
            <h2 className="text-2xl font-black text-brand-orange mb-4">Still need help?</h2>
            <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-lg mx-auto">
              Our support team is available 24/7 to assist you with any issues or questions.
            </p>
            <a href="mailto:support@mirhal.com" className="inline-block bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/30">
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpPage;
