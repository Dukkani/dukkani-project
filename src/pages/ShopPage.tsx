import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Store, Star, StarOff } from 'lucide-react';

const categories = [
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

interface Shop {
  id: string;
  ownerId: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  businessInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    workingHours?: string;
  };
  createdAt: any;
}

interface Product {
  id: string;
  productName: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  createdAt: any;
}

interface Rating {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  createdAt: any;
}

const ShopPage: React.FC = () => {
  const { shopUrlSlug } = useParams<{ shopUrlSlug: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [productRatings, setProductRatings] = useState<{ [key: string]: { average: number; count: number } }>({});
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);

  useEffect(() => {
    if (shopUrlSlug) {
      fetchShopData();
    }
  }, [shopUrlSlug]);

  const fetchShopData = async () => {
    try {
      // Fetch shop
      const shopQuery = query(
        collection(db, 'shops'), 
        where('shopUrlSlug', '==', shopUrlSlug)
      );
      const shopSnapshot = await getDocs(shopQuery);
      
      if (!shopSnapshot.empty) {
        const shopData = shopSnapshot.docs[0].data() as Shop;
        const shopWithId = { ...shopData, id: shopSnapshot.docs[0].id };
        setShop(shopWithId);

        // Fetch products
        const productsQuery = query(
          collection(db, 'products'), 
          where('shopId', '==', shopWithId.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Product[];
        setProducts(productsData);
        
        // Fetch ratings for all products
        await fetchRatings(productsData.map(p => p.id));
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (productIds: string[]) => {
    try {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'desc')
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsData = ratingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Rating[];
      
      // Filter ratings for current products
      const productRatings = ratingsData.filter(rating => 
        productIds.includes(rating.productId)
      );
      setRatings(productRatings);
      
      // Calculate average ratings and user ratings
      const avgRatings: { [key: string]: { average: number; count: number } } = {};
      const userRatingsMap: { [key: string]: number } = {};
      
      productIds.forEach(productId => {
        const productRatings = ratingsData.filter(r => r.productId === productId);
        if (productRatings.length > 0) {
          const sum = productRatings.reduce((acc, r) => acc + r.rating, 0);
          avgRatings[productId] = {
            average: sum / productRatings.length,
            count: productRatings.length
          };
          
          // Find user's rating if logged in
          if (user) {
            const userRating = productRatings.find(r => r.userId === user.uid);
            if (userRating) {
              userRatingsMap[productId] = userRating.rating;
            }
          }
        } else {
          // Default rating for products with no ratings
          avgRatings[productId] = { average: 0, count: 0 };
        }
      });
      
      setProductRatings(avgRatings);
      setUserRatings(userRatingsMap);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleRating = async (productId: string, rating: number) => {
    if (!user) {
      alert(i18n.language === 'ar' ? 'يجب تسجيل الدخول لتقييم المنتجات' : 'Please login to rate products');
      return;
    }

    setRatingLoading(productId);
    
    try {
      // Check if user already rated this product
      const existingRating = ratings.find(r => r.productId === productId && r.userId === user.uid);
      
      if (existingRating) {
        // Update existing rating
        await updateDoc(doc(db, 'ratings', existingRating.id), {
          rating: rating,
          createdAt: serverTimestamp()
        });
      } else {
        // Create new rating
        await addDoc(collection(db, 'ratings'), {
          productId: productId,
          userId: user.uid,
          rating: rating,
          createdAt: serverTimestamp()
        });
      }
      
      // Refresh ratings
      await fetchRatings([productId]);
      
    } catch (error) {
      console.error('Error saving rating:', error);
      alert(i18n.language === 'ar' ? 'فشل في حفظ التقييم' : 'Failed to save rating');
    } finally {
      setRatingLoading(null);
    }
  };

  const handleWhatsAppOrder = (product: Product) => {
    if (!shop) return;

    const message = `مرحباً ${shop.shopName}، أود طلب المنتج التالي: ${product.productName}`;
    const whatsappUrl = `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (t('loading') === 'جاري التحميل...' ? category.nameAr : category.nameEn) : categoryId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('shop.not.found')}
          </h1>
          <p className="text-gray-600">
            المتجر الذي تبحث عنه غير موجود
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <>
      {/* Shop Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
        {/* Banner Background */}
        {shop.bannerUrl && (
          <div className="absolute inset-0">
            <img
              src={shop.bannerUrl}
              alt="Shop Banner"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80"></div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6">
              {shop.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={`${shop.shopName} Logo`}
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-full h-full bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Store className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {shop.shopName}
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              {shop.description}
            </p>
            
            {/* Business Info */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              {shop.businessInfo?.address && (
                <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{shop.businessInfo.address}</span>
                </div>
              )}
              {shop.businessInfo?.workingHours && (
                <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>{shop.businessInfo.workingHours}</span>
                </div>
              )}
              <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                <MessageCircle className="h-4 w-4" />
                <span>متاح للطلب عبر واتساب</span>
              </div>
            </div>
            
            {/* Social Media Links */}
            {(shop.socialMedia?.facebook || shop.socialMedia?.instagram || shop.socialMedia?.twitter || shop.socialMedia?.tiktok || shop.socialMedia?.youtube) && (
              <div className="mt-6 flex justify-center space-x-4 space-x-reverse">
                {shop.socialMedia.facebook && (
                  <a
                    href={shop.socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {shop.socialMedia.instagram && (
                  <a
                    href={shop.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/>
                    </svg>
                  </a>
                )}
                {shop.socialMedia.twitter && (
                  <a
                    href={shop.socialMedia.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
                {shop.socialMedia.tiktok && (
                  <a
                    href={shop.socialMedia.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
                {shop.socialMedia.youtube && (
                  <a
                    href={shop.socialMedia.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <div className="text-sm text-gray-600">منتج متاح</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">متاح</div>
              <div className="text-sm text-gray-600">حالة المتجر</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">فوري</div>
              <div className="text-sm text-gray-600">الرد على الطلبات</div>
            </div>
          </div>
          
          {/* Additional Contact Info */}
          {(shop.businessInfo?.phone || shop.businessInfo?.email) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">معلومات التواصل</h3>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {shop.businessInfo.phone && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-gray-700">{shop.businessInfo.phone}</span>
                  </div>
                )}
                {shop.businessInfo.email && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-700">{shop.businessInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">منتجاتنا</h2>
              <p className="text-gray-600">اختر من مجموعة منتجاتنا المميزة</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="relative">
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-56 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-sm">
                      <span className="text-lg font-bold text-blue-600">
                        {product.price} {t('currency')}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {getCategoryName(product.category)}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center space-x-1 space-x-reverse mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(product.id, star)}
                          disabled={ratingLoading === product.id}
                          className={`focus:outline-none hover:scale-110 transition-transform ${
                            ratingLoading === product.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <Star
                            size={20}
                            className={`${
                              star <= (userRatings[product.id] || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <div className="text-sm text-gray-600 ml-2 flex flex-col">
                        <span>
                          {productRatings[product.id]?.count > 0 
                            ? `${productRatings[product.id].average.toFixed(1)} (${productRatings[product.id].count} ${i18n.language === 'ar' ? 'تقييم' : 'reviews'})`
                            : i18n.language === 'ar' ? 'لا توجد تقييمات' : 'No ratings'
                          }
                        </span>
                        {userRatings[product.id] && (
                          <span className="text-xs text-blue-600">
                            {i18n.language === 'ar' ? 'تقييمك:' : 'Your rating:'} {userRatings[product.id]} ⭐
                          </span>
                        )}
                      </div>
                      {ratingLoading === product.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight">
                      {product.productName}
                    </h3>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <button
                      onClick={() => handleWhatsAppOrder(product)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-semibold shadow-sm hover:shadow-md"
                    >
                      <MessageCircle size={18} />
                      <span>{t('shop.order.whatsapp')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              لا توجد منتجات حالياً
            </h2>
            <p className="text-gray-600 text-lg">
              سيتم إضافة المنتجات قريباً، تابعونا للحصول على آخر التحديثات
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            تواصل معنا مباشرة
          </h3>
          <p className="text-gray-600 mb-6">
            لديك استفسار أو تريد طلب منتج مخصص؟ تواصل معنا عبر واتساب
          </p>
          <a
            href={`https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(`مرحباً ${shop.shopName}، أود الاستفسار عن منتجاتكم`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <MessageCircle size={20} />
            <span>تواصل عبر واتساب</span>
          </a>
        </div>
      </div>
      </>
    </div>
  );
};

export default ShopPage;