import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Search, 
  Store, 
  MessageCircle, 
  Filter,
  Grid,
  List,
  ShoppingBag,
  Star,
  StarOff
} from 'lucide-react';
import ProductModal from '../components/ProductModal';
import RatingSystem from '../components/RatingSystem';

interface Product {
  id: string;
  shopId: string;
  productName: string;
  description: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  createdAt: any;
}

interface Shop {
  id: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
}

interface ProductWithShop extends Product {
  shop: Shop;
  averageRating?: number;
  reviewCount?: number;
}

interface Rating {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  createdAt: any;
}

const categories = [
  { id: 'all', nameAr: 'الكل', nameEn: 'All' },
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

const MarketplacePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithShop[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithShop[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithShop | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      // Fetch all shops
      const shopsQuery = query(
        collection(db, 'shops'),
        orderBy('createdAt', 'desc')
      );
      const shopsSnapshot = await getDocs(shopsQuery);
      const shopsData = shopsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Shop[];
      setShops(shopsData);

      // Fetch all products
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc')
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Product[];

      // Fetch all ratings
      const ratingsQuery = query(
        collection(db, 'ratings'),
        orderBy('createdAt', 'desc')
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsData = ratingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Rating[];
      setRatings(ratingsData);

      // Combine products with shop data
      const productsWithShops = productsData
        .map(product => {
          const shop = shopsData.find(s => s.id === product.shopId);
          if (!shop) return null;
          
          // Calculate average rating for this product
          const productRatings = ratingsData.filter(r => r.productId === product.id);
          const averageRating = productRatings.length > 0 
            ? productRatings.reduce((sum, r) => sum + r.rating, 0) / productRatings.length 
            : 0;
          const reviewCount = productRatings.length;
          
          return { ...product, shop, averageRating, reviewCount };
        })
        .filter(Boolean) as ProductWithShop[];

      setProducts(productsWithShops);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.productName.toLowerCase().includes(term) ||
        product.shop.shopName.toLowerCase().includes(term) ||
        product.shop.description.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  };

  const handleWhatsAppOrder = (product: ProductWithShop) => {
    const message = `مرحباً ${product.shop.shopName}، أود طلب المنتج التالي: ${product.productName}`;
    const whatsappUrl = `https://wa.me/${product.shop.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRatingUpdate = (productId: string, newRating: number) => {
    // Refresh the ratings data
    fetchData();
  };

  const renderStars = (rating: number, reviewCount: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<StarOff key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return (
      <div className="flex items-center space-x-1 space-x-reverse">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">
          {reviewCount > 0 
            ? `(${reviewCount} ${i18n.language === 'ar' ? 'تقييم' : 'reviews'})`
            : i18n.language === 'ar' ? 'لا توجد تقييمات' : 'No ratings'
          }
        </span>
      </div>
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (i18n.language === 'ar' ? category.nameAr : category.nameEn) : categoryId;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleProductClick = (product: ProductWithShop) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              {i18n.language === 'ar' ? 'سوق دكاني' : 'Dukkani Marketplace'}
            </h1>
            <p className="text-xl opacity-90 mb-8">
              {i18n.language === 'ar' 
                ? 'اكتشف آلاف المنتجات من متاجر ليبية مختلفة' 
                : 'Discover thousands of products from various Libyan shops'
              }
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={i18n.language === 'ar' ? 'ابحث عن المنتجات أو المتاجر...' : 'Search for products or shops...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-4 lg:space-y-0">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {i18n.language === 'ar' ? category.nameAr : category.nameEn}
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-gray-600">
              {filteredProducts.length} {i18n.language === 'ar' ? 'منتج' : 'products'}
            </span>
            <div className="flex bg-white rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-l-lg ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-r-lg ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
                onClick={() => handleProductClick(product)}
              >
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className={`object-cover ${
                    viewMode === 'grid' ? 'w-full h-48' : 'w-32 h-32 flex-shrink-0'
                  }`}
                  loading="lazy"
                />
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className={viewMode === 'list' ? 'flex justify-between items-start' : ''}>
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getCategoryName(product.category)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2" title={product.productName}>
                        {truncateText(product.productName, viewMode === 'grid' ? 30 : 50)}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-2" title={product.description}>
                          {truncateText(product.description, viewMode === 'grid' ? 60 : 100)}
                        </p>
                      )}
                      <div className="mb-2">
                        {renderStars(product.averageRating || 0, product.reviewCount || 0)}
                      </div>
                      
                      {/* User Rating Component */}
                      <div className="mb-3">
                        <RatingSystem
                          productId={product.id}
                          onRatingUpdate={(rating) => handleRatingUpdate(product.id, rating)}
                        />
                      </div>
                      
                      <Link 
                        to={`/shop/${product.shop.shopUrlSlug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center space-x-1 space-x-reverse"
                      >
                        <Store size={14} />
                        <span>{truncateText(product.shop.shopName, 20)}</span>
                      </Link>
                      <p className="text-2xl font-bold text-blue-600 mb-4">
                        {product.price} {t('currency')}
                      </p>
                    </div>
                    <div className={viewMode === 'list' ? 'ml-4' : ''}>
                      <button
                        onClick={() => handleWhatsAppOrder(product)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsAppOrder(product);
                        }}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse text-sm"
                      >
                        <MessageCircle size={16} />
                        <span>{t('shop.order.whatsapp')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {i18n.language === 'ar' ? 'لا توجد منتجات' : 'No products found'}
            </h2>
            <p className="text-gray-600">
              {i18n.language === 'ar' 
                ? 'جرب البحث بكلمات مختلفة أو تصفح فئة أخرى'
                : 'Try searching with different keywords or browse another category'
              }
            </p>
          </div>
        )}

        {/* Featured Shops Section */}
        {shops.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {i18n.language === 'ar' ? 'متاجر مميزة' : 'Featured Shops'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.slice(0, 6).map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.shopUrlSlug}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center space-x-3 space-x-reverse mb-3">
                    <Store className="h-8 w-8 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{shop.shopName}</h3>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {shop.description}
                  </p>
                  <div className="mt-4 text-blue-600 text-sm font-medium">
                    {i18n.language === 'ar' ? 'زيارة المتجر' : 'Visit Shop'} →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {showProductModal && selectedProduct && (
          <ProductModal
            product={selectedProduct}
            shop={selectedProduct.shop}
            averageRating={selectedProduct.averageRating || 0}
            reviewCount={selectedProduct.reviewCount || 0}
            isOpen={showProductModal}
            onClose={closeProductModal}
            onWhatsAppOrder={handleWhatsAppOrder}
            onRatingUpdate={handleRatingUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;