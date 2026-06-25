
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-48 pb-20 px-6">
                <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-stone-100 dark:border-stone-800">
                    <h1 className="text-4xl font-black text-stone-900 dark:text-white mb-8">Privacy Policy</h1>

                    <div className="prose prose-stone dark:prose-invert max-w-none space-y-6">
                        <p className="lead text-lg">
                            At Mirhal, we value your trust and are committed to protecting your personal information.
                            This policy outlines how we collect, use, and share your data.
                        </p>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Account Data:</strong> Name, email, phone number, and profile picture when you sign up.</li>
                                <li><strong>Listing Data:</strong> Details about vehicles or spots you list, including location and photos.</li>
                                <li><strong>Usage Data:</strong> Information about how you use our platform, bookings made, and search history.</li>
                                <li><strong>Payment Data:</strong> Payment processing is handled by third-party secure providers (Stripe). We do not store full credit card numbers.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Data</h2>
                            <p>
                                We use your data to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Facilitate bookings and communication between Hosts and Renters.</li>
                                <li>Verify identities and ensure platform safety.</li>
                                <li>Improve our services and personalize your experience.</li>
                                <li>Send transactional emails and important updates.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">3. Data Sharing</h2>
                            <p>
                                We serve as a marketplace, so some data must be shared:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>With Hosts/Renters:</strong> Essential contact info is shared only after a confirmed booking to facilitate the meetup.</li>
                                <li><strong>With Service Providers:</strong> We use trusted third parties for payments, maps, and hosting.</li>
                                <li><strong>Legal Compliance:</strong> We may disclose data if required by law or to protect our rights.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">4. Your Rights</h2>
                            <p>
                                You have the right to access, correct, or delete your personal data. You can manage most settings directly in your account profile.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold mb-4">5. Contact</h2>
                            <p>
                                For privacy concerns, please reach us at <a href="mailto:privacy@mirhal.com" className="text-brand-orange hover:underline">privacy@mirhal.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPage;
