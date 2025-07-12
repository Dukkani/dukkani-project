// App Configuration Constants
export const APP_CONFIG = {
  name: 'دكاني - Dukkani',
  version: '1.0.0',
  description: 'منصة إنشاء المتاجر الإلكترونية في ليبيا',
  url: import.meta.env.VITE_APP_URL || 'https://dukkani.ly',
  supportWhatsApp: import.meta.env.VITE_SUPPORT_WHATSAPP || '218921361748',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'dukkani2026@gmail.com'
};

// Subscription Configuration
export const SUBSCRIPTION_CONFIG = {
  monthlyPrice: 25, // LYD
  currency: 'LYD',
  features: [
    'Complete online store',
    'Unlimited products',
    'WhatsApp integration',
    '24/7 technical support',
    'Product image uploads',
    'Shop logo and banner',
    'Social media links',
    'Customer ratings and reviews',
    'Professional shop branding'
  ]
};

// Product Categories
export const PRODUCT_CATEGORIES = [
  { id: 'clothing', nameAr: 'ملابس', nameEn: 'Clothing' },
  { id: 'jewelry', nameAr: 'مجوهرات', nameEn: 'Jewelry' },
  { id: 'plants', nameAr: 'نباتات', nameEn: 'Plants' },
  { id: 'electronics', nameAr: 'إلكترونيات', nameEn: 'Electronics' },
  { id: 'home', nameAr: 'منزل وحديقة', nameEn: 'Home & Garden' },
  { id: 'beauty', nameAr: 'جمال وعناية', nameEn: 'Beauty & Care' },
  { id: 'food', nameAr: 'طعام ومشروبات', nameEn: 'Food & Drinks' },
  { id: 'books', nameAr: 'كتب', nameEn: 'Books' },
  { id: 'sports', nameAr: 'رياضة', nameEn: 'Sports' },
  { id: 'toys', nameAr: 'ألعاب', nameEn: 'Toys' },
  { id: 'automotive', nameAr: 'سيارات', nameEn: 'Automotive' }
];

// Image Upload Configuration
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  quality: 0.8,
  maxWidth: 1200,
  maxHeight: 1200
};

// Admin Configuration
export const ADMIN_CONFIG = {
  adminEmails: ['dukkani2026@gmail.com'],
  isAdmin: (email: string) => ADMIN_CONFIG.adminEmails.includes(email)
};

// SEO Configuration
export const SEO_CONFIG = {
  defaultTitle: 'دكاني - أنشئ متجرك الإلكتروني',
  defaultDescription: 'منصة دكاني تتيح لك إنشاء متجرك الإلكتروني المهني في دقائق. ابدأ البيع عبر الإنترنت في ليبيا اليوم.',
  keywords: 'متجر إلكتروني، ليبيا، تجارة إلكترونية، دكاني، بيع أونلاين',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
};