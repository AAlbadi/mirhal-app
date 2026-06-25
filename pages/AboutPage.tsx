import React from 'react';
import { useI18n } from '../contexts/I18nContext';

const WelcomeVideo = () => {
  const { t } = useI18n();
  return (
    <div className="relative h-screen">
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="/welcome.mp4"
        autoPlay
        loop
        muted
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col justify-center items-center">
        <img src="/logo.svg" alt="Mirhal Logo" className="w-48 h-48 mb-4" />
        <h1 className="text-white text-6xl font-black">{t('brand')}</h1>
        <h2 className="text-white text-4xl font-black">مرحال</h2>
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { t, lang } = useI18n();

  const content = {
    en: {
      title: 'About Mirhal',
      subtitle: 'Your Premier Free Camping Marketplace in the GCC',
      mission: 'Our Mission',
      missionText: 'Mirhal is revolutionizing the way people explore the Gulf region by connecting spot contributors with adventure-seekers. We believe everyone should have access to the freedom of the open road and the beauty of nature.',
      vision: 'Our Vision',
      visionText: 'To become the most trusted community-driven camping platform across the GCC, making outdoor adventures accessible, safe, and unforgettable for everyone.',
      whyDroobee: 'Why Mirhal?',
      reason1Title: 'Trusted Community',
      reason1Text: 'Every shared spot is verified by our team to ensure quality and safety.',
      reason2Title: 'Premium Experience',
      reason2Text: 'We use high-quality imagery and detailed community reviews to help you find the perfect spot.',
      reason3Title: 'Secure Platform',
      reason3Text: 'Our platform is built with security and privacy in mind, ensuring a safe experience for all.',
      reason4Title: 'Regional Expertise',
      reason4Text: 'We understand the unique needs of explorers in the Gulf region and provide localized support.',
      coverage: 'Coverage Area',
      coverageText: 'Mirhal operates across all GCC countries including UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, and Oman. Our community includes hundreds of breathtaking free spots.',
      team: 'Our Team',
      teamText: 'We\'re a passionate team of outdoor enthusiasts and technology experts dedicated to making your adventures memorable. Our team is always here to help.',
      joinUs: 'Join the Mirhal Community',
      joinText: 'Whether you want to share a hidden gem or book your next adventure, we\'re here to make it happen.',
    },
    ar: {
      title: 'عن مرحال',
      subtitle: 'سوقك الرائد لمواقع التخييم المجانية في دول مجلس التعاون الخليجي',
      mission: 'مهمتنا',
      missionText: 'مرحال تُحدث ثورة في طريقة استكشاف الناس لمنطقة الخليج من خلال ربط المساهمين بالمواقع مع الباحثين عن المغامرة. نؤمن بأن الجميع يجب أن يحصلوا على حرية الاستكشاف وجمال الطبيعة.',
      vision: 'رؤيتنا',
      visionText: 'أن نصبح المنصة الأكثر موثوقية لمواقع التخييم المدفوعة من قبل المجتمع في دول مجلس التعاون الخليجي، مما يجعل مغامرات الهواء الطلق متاحة وآمنة ولا تُنسى للجميع.',
      whyDroobee: 'لماذا مرحال؟',
      reason1Title: 'مجتمع موثوق',
      reason1Text: 'يتم التحقق من كل موقع مشارك من قبل فريقنا لضمان الجودة والسلامة.',
      reason2Title: 'تجربة متميزة',
      reason2Text: 'نستخدم صوراً عالية الجودة ومنصة سهلة الاستخدام لمساعدتك في العثور على الموقع المثالي.',
      reason3Title: 'منصة آمنة',
      reason3Text: 'تم بناء منصتنا مع مراعاة الأمان والخصوصية لضمان تجربة آمنة للجميع.',
      reason4Title: 'خبرة إقليمية',
      reason4Text: 'نفهم الاحتياجات الفريدة للمستكشفين في منطقة الخليج ونقدم دعماً محلياً.',
      coverage: 'منطقة التغطية',
      coverageText: 'مرحال تعمل في جميع دول مجلس التعاون الخليجي بما في ذلك الإمارات والسعودية والكويت وقطر والبحرين وعمان. يشمل مجتمعنا مئات المواقع المجانية المذهلة.',
      team: 'فريقنا',
      teamText: 'نحن فريق شغوف من عشاق الهواء الطلق وخبراء التكنولوجيا المتفانين في جعل مغامراتك لا تُنسى. فريقنا موجود دائماً للمساعدة.',
      joinUs: 'انضم إلى مجتمع مرحال',
      joinText: 'سواء كنت ترغب في مشاركة جوهرة مخفية أو العثور على مغامرتك القادمة، نحن هنا لتحقيق ذلك.',
    },
  };

  const c = content[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e9e1] via-[#ebe0d5] to-[#d5b9b2]">
      <WelcomeVideo />
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-brown-dark mb-4">
              {c.title}
            </h1>
            <p className="text-xl md:text-2xl text-[#6b5842] font-bold">
              {c.subtitle}
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-brand-orange mb-4">
              {c.mission}
            </h2>
            <p className="text-lg text-brand-brown-dark leading-relaxed">
              {c.missionText}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-[#8b6f47] mb-4">
              {c.vision}
            </h2>
            <p className="text-lg text-[#4a3626] leading-relaxed">
              {c.visionText}
            </p>
          </div>

          {/* Why DROOBEE */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-[#8b6f47] mb-8">
              {c.whyDroobee}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reason 1 */}
              <div className="bg-gradient-brown p-6 rounded-2xl">
                <h3 className="text-xl font-black text-white mb-3">
                  {c.reason1Title}
                </h3>
                <p className="text-white/90">
                  {c.reason1Text}
                </p>
              </div>

              {/* Reason 2 */}
              <div className="bg-gradient-brown p-6 rounded-2xl">
                <h3 className="text-xl font-black text-white mb-3">
                  {c.reason2Title}
                </h3>
                <p className="text-white/90">
                  {c.reason2Text}
                </p>
              </div>

              {/* Reason 3 */}
              <div className="bg-gradient-brown p-6 rounded-2xl">
                <h3 className="text-xl font-black text-white mb-3">
                  {c.reason3Title}
                </h3>
                <p className="text-white/90">
                  {c.reason3Text}
                </p>
              </div>

              {/* Reason 4 */}
              <div className="bg-gradient-brown p-6 rounded-2xl">
                <h3 className="text-xl font-black text-white mb-3">
                  {c.reason4Title}
                </h3>
                <p className="text-white/90">
                  {c.reason4Text}
                </p>
              </div>
            </div>
          </div>

          {/* Coverage */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-[#8b6f47] mb-4">
              {c.coverage}
            </h2>
            <p className="text-lg text-[#4a3626] leading-relaxed">
              {c.coverageText}
            </p>
          </div>

          {/* Team */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-[#8b6f47] mb-4">
              {c.team}
            </h2>
            <p className="text-lg text-[#4a3626] leading-relaxed">
              {c.teamText}
            </p>
          </div>

          {/* Join Us CTA */}
          <div className="bg-gradient-brown rounded-3xl shadow-depth-xl p-8 md:p-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {c.joinUs}
            </h2>
            <p className="text-lg text-white/90 mb-6">
              {c.joinText}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/become-host"
                className="px-8 py-4 bg-white text-brand-orange rounded-full font-black text-lg hover:bg-brand-sand transition-all duration-300 hover:scale-105 shadow-depth-md"
              >
                {lang === 'en' ? 'Become a Host' : 'كن مضيفاً'}
              </a>
              <a
                href="/"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-black text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                {lang === 'en' ? 'Browse Spots' : 'تصفح المواقع'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
