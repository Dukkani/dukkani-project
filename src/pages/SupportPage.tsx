import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  Mail, 
  Clock, 
  HeadphonesIcon,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SupportPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const supportWhatsApp = "218921361748";

  const handleWhatsAppSupport = () => {
    const message = i18n.language === 'ar' 
      ? 'مرحباً، أحتاج مساعدة في منصة دكاني'
      : 'Hello, I need help with Dukkani platform';
    const whatsappUrl = `https://wa.me/${supportWhatsApp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const faqs = [
    {
      question: t('support.faq.q1'),
      answer: t('support.faq.a1')
    },
    {
      question: t('support.faq.q2'),
      answer: t('support.faq.a2')
    },
    {
      question: t('support.faq.q3'),
      answer: t('support.faq.a3')
    },
    {
      question: t('support.faq.q4'),
      answer: t('support.faq.a4')
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HeadphonesIcon className="mx-auto h-16 w-16 mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              {t('support.title')}
            </h1>
            <p className="text-xl opacity-90">
              {t('support.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('support.contact')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* WhatsApp Support */}
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('support.whatsapp')}
              </h3>
              <p className="text-gray-600 mb-4">
                {supportWhatsApp}
              </p>
              <button
                onClick={handleWhatsAppSupport}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {i18n.language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
              </button>
            </div>

            {/* Email Support */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('support.email')}
              </h3>
              <p className="text-gray-600 mb-4">
                dukkani2026@gmail.com
              </p>
              <a
                href="mailto:dukkani2026@gmail.com"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-block"
              >
                {i18n.language === 'ar' ? 'إرسال إيميل' : 'Send Email'}
              </a>
            </div>
          </div>

          {/* Working Hours */}
          <div className="mt-8 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('support.hours')}
            </h3>
            <p className="text-gray-600">
              {t('support.hours.time')}
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <HelpCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('support.faq')}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            {i18n.language === 'ar' 
              ? 'لم تجد إجابة لسؤالك؟ تواصل معنا مباشرة'
              : "Didn't find an answer to your question? Contact us directly"
            }
          </p>
          <button
            onClick={handleWhatsAppSupport}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {i18n.language === 'ar' ? 'تواصل معنا الآن' : 'Contact Us Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;