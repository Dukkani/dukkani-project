import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Share2, MessageCircle, Store, Star } from 'lucide-react';
import RatingSystem from './RatingSystem';

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

interface ProductModalProps {
  product: Product;
  shop: Shop;
  averageRating?: number;
  reviewCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onWhatsAppOrder?: (product: Product) => void;
  onRatingUpdate?: (productId: string, newRating: number) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  shop,
  averageRating = 0,
  reviewCount = 0,
  isOpen,
  onClose,
  onWhatsAppOrder,
  onRatingUpdate
}) => {
  const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/shop/${shop.shopUrlSlug}#product-${product.id}`;
    const title = `${product.productName} - ${shop.shopName}`;

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

  const handleWhatsAppClick = () => {
    if (onWhatsAppOrder) {
      onWhatsAppOrder(product);
    }
  };

  const handleRatingChange = (newRating: number) => {
    if (onRatingUpdate) {
      onRatingUpdate(product.id, newRating);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-5 w-5 text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />);
      }
    }

    return <div className="flex">{stars}</div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
          
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="w-full h-64 md:h-80 object-cover rounded-t-xl"
          />
          
          {/* Price Badge */}
          <div className="absolute bottom-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg">
            <span className="text-2xl font-bold text-blue-600">
              {product.price} {t('currency')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {product.productName}
          </h2>
          
          {/* Shop Info */}
          <div className="flex items-center space-x-3 space-x-reverse mb-4 p-3 bg-gray-50 rounded-lg">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.shopName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{shop.shopName}</h3>
              <p className="text-sm text-gray-600">{shop.description}</p>
            </div>
          </div>

          {/* Average Rating Display */}
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {i18n.language === 'ar' ? 'تقييم العملاء' : 'Customer Rating'}
                </h4>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {renderStars(averageRating)}
                  <span className="text-lg font-semibold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({reviewCount} {i18n.language === 'ar' ? 'تقييم' : 'reviews'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Rating Section */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              {i18n.language === 'ar' ? 'قيم هذا المنتج' : 'Rate This Product'}
            </h4>
            <RatingSystem
              productId={product.id}
              onRatingUpdate={handleRatingChange}
            />
          </div>
          
          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">
                {i18n.language === 'ar' ? 'وصف المنتج' : 'Product Description'}
              </h4>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
            <button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse font-semibold text-lg shadow-lg"
            >
              <MessageCircle size={24} />
              <span>{t('shop.order.whatsapp')}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="sm:w-auto bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 space-x-reverse font-medium"
            >
              <Share2 size={20} />
              <span>{i18n.language === 'ar' ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
          
          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">
                  {i18n.language === 'ar' ? 'الفئة:' : 'Category:'}
                </span>
                <span className="ml-2">{product.category}</span>
              </div>
              <div>
                <span className="font-medium">
                  {i18n.language === 'ar' ? 'المتجر:' : 'Shop:'}
                </span>
                <span className="ml-2">{shop.shopName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;