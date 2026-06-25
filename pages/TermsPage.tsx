
import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useI18n } from '../contexts/I18nContext';

const TermsPage: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-48 pb-20 px-6">
                <div className="max-w-4xl mx-auto bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-stone-100 dark:border-stone-800">
                    <h1 className="text-4xl font-black text-stone-900 dark:text-white mb-8">Terms of Service</h1>

                    <div className="prose prose-stone dark:prose-invert max-w-none space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the Mirhal marketplace (the "Platform"), you agree to comply with and be bound by these Terms of Service.
                                If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">2. The Mirhal Marketplace</h2>
                            <p>
                                Mirhal is a peer-to-peer marketplace that connects users who want to rent RVs, campers, or camping spots ("Renters") with users who have such vehicles or properties to offer ("Hosts").
                                Mirhal itself does not own, rent, or manage these vehicles or spots. We simply provide the platform to facilitate these transactions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Hosts:</strong> You are responsible for ensuring your listings are accurate, safe, and legal. You must have the right to rent out the vehicle or property.</li>
                                <li><strong>Renters:</strong> You agree to use the rented items responsibly and return them in the condition received. You operate vehicles and camp at your own risk.</li>
                                <li><strong>Paid Camping & Desert Spots:</strong> Users submitting "Paid Camping" or open desert spots acknowledge that these locations may be remote. Hosts must provide accurate coordinates and contact info. Renters must exercise caution and ensure their vehicle is suitable for the terrain.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">4. Payments and Fees</h2>
                            <p>
                                Mirhal charges a service fee for facilitating bookings. All payments are processed securely.
                                Cancellations and refunds are subject to the specific cancellation policy selected by the Host for their listing.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">5. Liability and Disclaimers</h2>
                            <p>
                                <strong>Use at Your Own Risk:</strong> Mirhal is not liable for any accidents, injuries, or damages that occur during a rental or camping trip.
                                Users are encouraged to inspect vehicles and spots before use.
                            </p>
                            <p className="mt-4">
                                <strong>No Warranty:</strong> The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy of user-generated content, including spot descriptions or photos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">6. Prohibited Activities</h2>
                            <p>
                                Users may not use the platform for illegal acts, spam, harassment, or to book transactions outside of the Mirhal platform to avoid fees.
                                We reserve the right to ban any user who violates these rules.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at <a href="mailto:support@mirhal.com" className="text-brand-orange hover:underline">support@mirhal.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsPage;
