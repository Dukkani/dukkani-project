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
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Store, Star, StarOff, Shield, Clock, MapPin, Phone, Mail, Globe, Heart, Share2 } from 'lucide-react';
import RatingSystem from '../components/RatingSystem';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating'>('newest');

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
          where('shopId', '==', shopWithId.id),
          orderBy('createdAt', 'desc')
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
          avgRatings[productId] = { average: 0, count: 0 };
        }
      });
      
      setProductRatings(avgRatings);
      setUserRatings(userRatingsMap);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleRatingUpdate = (productId: string, newRating: number) => {
    // Refresh ratings data
    fetchRatings([productId]);
  };

  const handleWhatsAppOrder = (product: Product) => {
    if (!shop) return;

    const message = `مرحباً ${shop.shopName}، أود طلب المنتج التالي:\n\n📦 ${product.productName}\n💰 السعر: ${product.price} د.ل\n\nشكراً لكم`;
    const whatsappUrl = `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async (product?: Product) => {
    const url = product 
      ? `${window.location.origin}/shop/${shop?.shopUrlSlug}#product-${product.id}`
      : window.location.href;
    
    const title = product 
      ? `${product.productName} - ${shop?.shopName}`
      : `${shop?.shopName} - دكاني`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        alert(i18n.language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert(i18n.language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (i18n.language === 'ar' ? category.nameAr : category.nameEn) : categoryId;
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchTerm || 
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt?.seconds - a.createdAt?.seconds || 0;
        case 'oldest':
          return a.createdAt?.seconds - b.createdAt?.seconds || 0;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          const aRating = productRatings[a.id]?.average || 0;
          const bRating = productRatings[b.id]?.average || 0;
          return bRating - aRating;
        default:
          return 0;
      }
    });

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
      {/* Shop Header */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
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
            <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed mb-6">
              {shop.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 space-x-reverse mb-6">
              <button
                onClick={() => handleShare()}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <Share2 size={20} />
                <span>{i18n.language === 'ar' ? 'مشاركة المتجر' : 'Share Shop'}</span>
              </button>
              <a
                href={`https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(`مرحباً ${shop.shopName}، أود الاستفسار عن منتجاتكم`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <MessageCircle size={20} />
                <span>{i18n.language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</span>
              </a>
            </div>
            
            {/* Business Info */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {shop.businessInfo?.address && (
                <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.businessInfo.address}</span>
                </div>
              )}
              {shop.businessInfo?.workingHours && (
                <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <Clock className="h-4 w-4" />
                  <span>{shop.businessInfo.workingHours}</span>
                </div>
              )}
              <div className="inline-flex items-center space-x-2 space-x-reverse bg-white bg-opacity-20 rounded-full px-4 py-2">
                <Shield className="h-4 w-4" />
                <span>{i18n.language === 'ar' ? 'متجر موثق' : 'Verified Shop'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredProducts.length}</div>
              <div className="text-sm text-gray-600">{i18n.language === 'ar' ? 'منتج متاح' : 'Products'}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{i18n.language === 'ar' ? 'متاح' : 'Available'}</div>
              <div className="text-sm text-gray-600">{i18n.language === 'ar' ? 'حالة المتجر' : 'Shop Status'}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{i18n.language === 'ar' ? 'فوري' : 'Instant'}</div>
              <div className="text-sm text-gray-600">{i18n.language === 'ar' ? 'الرد على الطلبات' : 'Response Time'}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(productRatings).reduce((sum, rating) => sum + rating.count, 0)}
              </div>
              <div className="text-sm text-gray-600">{i18n.language === 'ar' ? 'تقييم العملاء' : 'Customer Reviews'}</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder={i18n.language === 'ar' ? 'ابحث في المنتجات...' : 'Search products...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{i18n.language === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {i18n.language === 'ar' ? category.nameAr : category.nameEn}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">{i18n.language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                <option value="oldest">{i18n.language === 'ar' ? 'الأقدم' : 'Oldest'}</option>
                <option value="price_low">{i18n.language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price_high">{i18n.language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="rating">{i18n.language === 'ar' ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} id={`product-${product.id}`} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative group">
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
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleShare(product)}
                      className="bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight">
                    {product.productName}
                  </h3>
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Rating Display */}
                  <div className="flex items-center space-x-1 space-x-reverse mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${
                          star <= (productRatings[product.id]?.average || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {productRatings[product.id]?.count > 0 
                        ? `${productRatings[product.id].average.toFixed(1)} (${productRatings[product.id].count})`
                        : i18n.language === 'ar' ? 'لا توجد تقييمات' : 'No ratings'
                      }
                    </span>
                  </div>
                  
                  {/* User's Rating */}
                  {userRatings[product.id] && (
                    <div className="text-xs text-blue-600 mb-3">
                      {i18n.language === 'ar' ? 'تقييمك:' : 'Your rating:'} {userRatings[product.id]} ⭐
                    </div>
                  )}
                  
                  {/* Rating System */}
                  <div className="mb-4">
                    <RatingSystem
                      productId={product.id}
                      onRatingUpdate={(rating) => handleRatingUpdate(product.id, rating)}
                    />
                  </div>
                  
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
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {i18n.language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
            </h2>
            <p className="text-gray-600 text-lg">
              {searchTerm || selectedCategory !== 'all'
                ? (i18n.language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria')
                : (i18n.language === 'ar' ? 'سيتم إضافة المنتجات قريباً' : 'Products will be added soon')
              }
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8">
          <div className="text-center mb-6">
            <MessageCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {i18n.language === 'ar' ? 'تواصل معنا مباشرة' : 'Contact Us Directly'}
            </h3>
            <p className="text-gray-600">
              {i18n.language === 'ar' 
                ? 'لديك استفسار أو تريد طلب منتج مخصص؟ تواصل معنا عبر واتساب'
                : 'Have a question or want to order a custom product? Contact us via WhatsApp'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {shop.businessInfo?.phone && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">{shop.businessInfo.phone}</span>
              </div>
            )}
            {shop.businessInfo?.email && (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">{shop.businessInfo.email}</span>
              </div>
            )}
            <div className="flex items-center space-x-3 space-x-reverse">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">{window.location.host}</span>
            </div>
          </div>
          
          <div className="text-center">
            <a
              href={`https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(`مرحباً ${shop.shopName}، أود الاستفسار عن منتجاتكم`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <MessageCircle size={20} />
              <span>{i18n.language === 'ar' ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ShopPage;