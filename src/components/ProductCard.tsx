import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, StarOff, MessageCircle, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  shopId: string;
  productName: string;
  description?: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: any;
}

interface Shop {
  id: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
  logoUrl?: string;
}

interface ProductCardProps {
  product: Product;
  shop: Shop;
  averageRating?: number;
  reviewCount?: number;
  onWhatsAppOrder?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  viewMode?: 'grid' | 'list';
  showShopInfo?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  shop,
  averageRating = 0,
  reviewCount = 0,
  onWhatsAppOrder,
  onProductClick,
  viewMode = 'grid',
  showShopInfo = true
}) => {
  const { t, i18n } = useTranslation();

  const renderStars = (rating: number, count: number) => {
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
          {count > 0 
            ? `(${count} ${i18n.language === 'ar' ? 'تقييم' : 'reviews'})`
            : i18n.language === 'ar' ? 'لا توجد تقييمات' : 'No ratings'
          }
        </span>
      </div>
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWhatsAppOrder) {
      onWhatsAppOrder(product);
    }
  };

  const handleShopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={product.imageUrl}
          alt={product.productName}
          className={`object-cover ${
            viewMode === 'grid' ? 'w-full h-56' : 'w-48 h-48 flex-shrink-0'
          }`}
          loading="lazy"
        />
        <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-sm">
          <span className="text-lg font-bold text-blue-600">
            {product.price} {t('currency')}
          </span>
        </div>
        {product.category && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            {product.category}
          </div>
        )}
      </div>
      
      <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <div className={viewMode === 'list' ? 'flex justify-between items-start' : ''}>
          <div className={viewMode === 'list' ? 'flex-1' : ''}>
            <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight" title={product.productName}>
              {truncateText(product.productName, viewMode === 'grid' ? 40 : 60)}
            </h3>
            
            {product.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={product.description}>
                {truncateText(product.description, viewMode === 'grid' ? 80 : 120)}
              </p>
            )}
            
            <div className="mb-3">
              {renderStars(averageRating, reviewCount)}
            </div>
            
            {showShopInfo && (
              <Link 
                to={`/shop/${shop.shopUrlSlug}`}
                onClick={handleShopClick}
                className="inline-flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800 mb-4 transition-colors"
              >
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.shopName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <Store size={16} />
                )}
                <span className="font-medium">{truncateText(shop.shopName, 25)}</span>
              </Link>
            )}
          </div>
          
          <div className={viewMode === 'list' ? 'ml-4 flex-shrink-0' : ''}>
            <div className="space-y-2">
              <Link
                to={`/shop/${shop.shopUrlSlug}`}
                onClick={handleShopClick}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse font-medium text-sm"
              >
                <Store size={16} />
                <span>{i18n.language === 'ar' ? 'زيارة المتجر' : 'Go to Shop'}</span>
              </Link>
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium text-sm"
              >
                <MessageCircle size={16} />
                <span>{t('shop.order.whatsapp')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;