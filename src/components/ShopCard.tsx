import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Store, MapPin, Clock, Star } from 'lucide-react';

interface Shop {
  id: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    workingHours?: string;
  };
}

interface ShopCardProps {
  shop: Shop;
  productCount?: number;
  averageRating?: number;
  reviewCount?: number;
}

const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  productCount = 0,
  averageRating = 0,
  reviewCount = 0
}) => {
  const { t, i18n } = useTranslation();

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return <div className="flex">{stars}</div>;
  };

  return (
    <Link
      to={`/shop/${shop.shopUrlSlug}`}
      className="block bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600">
        {shop.bannerUrl && (
          <img
            src={shop.bannerUrl}
            alt={`${shop.shopName} Banner`}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <div className="p-6 relative">
        {/* Logo */}
        <div className="absolute -top-8 left-6">
          <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={`${shop.shopName} Logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Store className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="pt-8">
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            {shop.shopName}
          </h3>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {shop.description}
          </p>

          {/* Stats */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
              <span>
                {productCount} {i18n.language === 'ar' ? 'منتج' : 'products'}
              </span>
              {reviewCount > 0 && (
                <div className="flex items-center space-x-1 space-x-reverse">
                  {renderStars(averageRating)}
                  <span className="text-xs">
                    ({reviewCount})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-2 text-xs text-gray-500">
            {shop.businessInfo?.address && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{shop.businessInfo.address}</span>
              </div>
            )}
            {shop.businessInfo?.workingHours && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{shop.businessInfo.workingHours}</span>
              </div>
            )}
          </div>

          {/* Visit Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-blue-600 text-sm font-medium flex items-center justify-between">
              <span>{i18n.language === 'ar' ? 'زيارة المتجر' : 'Visit Shop'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;