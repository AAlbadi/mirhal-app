import React, { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';

const ContactPage: React.FC = () => {
  const { lang } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const content = {
    en: {
      title: 'Contact Us',
      subtitle: 'Get in touch with the Mirhal team',
      formTitle: 'Send us a message',
      name: 'Your Name',
      email: 'Email Address',
      phone: 'Phone Number (Optional)',
      subject: 'Subject',
      message: 'Message',
      send: 'Send Message',
      sending: 'Sending...',
      successTitle: 'Message Sent!',
      successMessage: 'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      sendAnother: 'Send Another Message',

      contactInfo: 'Contact Information',
      email247: '24/7 Support Email',
      whatsapp: 'WhatsApp Support',
      phone247: '24/7 Phone Support',
      office: 'Office Hours',
      officeHours: 'Sunday - Thursday: 9:00 AM - 6:00 PM GST',
      location: 'Location',
      locationText: 'Dubai, United Arab Emirates',

      responseTime: 'Average Response Time',
      responseTimeText: 'We typically respond within 2-4 hours during business hours',
      emergencySupport: 'Support Hotline',
      emergencySupportText: 'For urgent issues or report safety concerns, call our 24/7 hotline',
    },
    ar: {
      title: 'تواصل معنا',
      subtitle: 'تواصل مع فريق مرحال',
      formTitle: 'أرسل لنا رسالة',
      name: 'اسمك',
      email: 'عنوان البريد الإلكتروني',
      phone: 'رقم الهاتف (اختياري)',
      subject: 'الموضوع',
      message: 'الرسالة',
      send: 'إرسال الرسالة',
      sending: 'جاري الإرسال...',
      successTitle: 'تم إرسال الرسالة!',
      successMessage: 'شكراً لتواصلك معنا. سنرد عليك خلال 24 ساعة.',
      sendAnother: 'إرسال رسالة أخرى',

      contactInfo: 'معلومات الاتصال',
      email247: 'البريد الإلكتروني للدعم على مدار الساعة',
      whatsapp: 'دعم واتساب',
      phone247: 'الدعم الهاتفي على مدار الساعة',
      office: 'ساعات العمل',
      officeHours: 'الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً بتوقيت الخليج',
      location: 'الموقع',
      locationText: 'دبي، الإمارات العربية المتحدة',

      responseTime: 'متوسط وقت الاستجابة',
      responseTimeText: 'نرد عادةً خلال 2-4 ساعات خلال ساعات العمل',
      emergencySupport: 'خط الدعم',
      emergencySupportText: 'للمسائل العاجلة أو الإبلاغ عن مخاوف تتعلق بالسلامة، اتصل بخط الطوارئ المتاح على مدار الساعة',
    },
  };

  const c = content[lang];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement actual email sending through backend
    console.log('Contact form submitted:', formData);

    // Simulate sending
    setTimeout(() => {
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    }, 1000);
  };

  const resetForm = () => {
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e9e1] via-[#ebe0d5] to-[#d5b9b2] pb-12 pt-48 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-brown-dark mb-4">
            {c.title}
          </h1>
          <p className="text-xl md:text-2xl text-[#6b5842] font-bold">
            {c.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10">
            <h2 className="text-3xl font-black text-brand-orange mb-6">
              {c.formTitle}
            </h2>

            {submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-brand-brown-dark mb-2">
                  {c.successTitle}
                </h3>
                <p className="text-[#6b5842] mb-6">
                  {c.successMessage}
                </p>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gradient-brown text-white rounded-full font-bold hover:scale-105 transition-all duration-300"
                >
                  {c.sendAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-brand-brown-dark font-bold mb-2">
                    {c.name}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-brand-sand-dark rounded-xl focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[#4a3626] font-bold mb-2">
                    {c.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#d5b9a5] rounded-xl focus:outline-none focus:border-[#8b6f47] transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[#4a3626] font-bold mb-2">
                    {c.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#d5b9a5] rounded-xl focus:outline-none focus:border-[#8b6f47] transition-colors"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[#4a3626] font-bold mb-2">
                    {c.subject}
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#d5b9a5] rounded-xl focus:outline-none focus:border-[#8b6f47] transition-colors"
                  >
                    <option value="">{lang === 'en' ? 'Select a subject' : 'اختر موضوعاً'}</option>
                    <option value="booking">{lang === 'en' ? 'Booking Question' : 'سؤال عن الحجز'}</option>
                    <option value="hosting">{lang === 'en' ? 'Hosting Question' : 'سؤال عن الاستضافة'}</option>
                    <option value="payment">{lang === 'en' ? 'Payment Issue' : 'مشكلة في الدفع'}</option>
                    <option value="technical">{lang === 'en' ? 'Technical Support' : 'دعم تقني'}</option>
                    <option value="feedback">{lang === 'en' ? 'Feedback' : 'ملاحظات'}</option>
                    <option value="other">{lang === 'en' ? 'Other' : 'أخرى'}</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[#4a3626] font-bold mb-2">
                    {c.message}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-[#d5b9a5] rounded-xl focus:outline-none focus:border-[#8b6f47] transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-brown text-white rounded-full font-black text-lg hover:scale-105 transition-all duration-300 shadow-depth-md"
                >
                  {c.send}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-3xl shadow-depth-xl p-8 md:p-10">
              <h2 className="text-3xl font-black text-[#8b6f47] mb-6">
                {c.contactInfo}
              </h2>

              <div className="space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4a3626] mb-1">{c.email247}</h3>
                    <a href="mailto:support@mirhal.app" className="text-[#8b6f47] hover:underline">
                      support@mirhal.app
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4a3626] mb-1">{c.whatsapp}</h3>
                    <a href="https://wa.me/971566300939" target="_blank" rel="noopener noreferrer" className="text-[#8b6f47] hover:underline">
                      +971 56 630 0939
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4a3626] mb-1">{c.phone247}</h3>
                    <a href="tel:+971566300939" className="text-[#8b6f47] hover:underline">
                      +971 56 630 0939
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4a3626] mb-1">{c.location}</h3>
                    <p className="text-[#6b5842]">{c.locationText}</p>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-brown rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4a3626] mb-1">{c.office}</h3>
                    <p className="text-[#6b5842]">{c.officeHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-brown rounded-3xl shadow-depth-xl p-8 text-white">
              <h3 className="text-2xl font-black mb-4">{c.responseTime}</h3>
              <p className="mb-6">{c.responseTimeText}</p>

              <h3 className="text-2xl font-black mb-4">{c.emergencySupport}</h3>
              <p>{c.emergencySupportText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
