import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Star, StarOff, Shield, AlertTriangle } from 'lucide-react';

interface RatingSystemProps {
  productId: string;
  onRatingUpdate?: (newRating: number) => void;
  disabled?: boolean;
}

interface UserRating {
  id: string;
  rating: number;
  createdAt: any;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  productId,
  onRatingUpdate,
  disabled = false
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (user && productId) {
      checkUserRating();
    }
  }, [user, productId]);

  const checkUserRating = async () => {
    if (!user) return;

    try {
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('productId', '==', productId),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(ratingsQuery);
      
      if (!snapshot.empty) {
        const ratingData = snapshot.docs[0].data();
        const rating: UserRating = {
          id: snapshot.docs[0].id,
          rating: ratingData.rating,
          createdAt: ratingData.createdAt
        };
        
        setUserRating(rating);
        setHasRated(true);
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleRatingClick = async (rating: number) => {
    if (!user) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    if (hasRated || disabled) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setLoading(true);
    
    try {
      // Create new rating (only once per user per product)
      await addDoc(collection(db, 'ratings'), {
        productId: productId,
        userId: user.uid,
        rating: rating,
        createdAt: serverTimestamp()
      });
      
      // Update local state
      setUserRating({
        id: 'temp',
        rating: rating,
        createdAt: { seconds: Date.now() / 1000 }
      });
      
      setHasRated(true);
      
      // Notify parent component
      if (onRatingUpdate) {
        onRatingUpdate(rating);
      }
      
    } catch (error) {
      console.error('Error saving rating:', error);
      alert(i18n.language === 'ar' ? 'فشل في حفظ التقييم' : 'Failed to save rating');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || userRating?.rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= displayRating;
      const canInteract = user && !hasRated && !disabled && !loading;
      
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingClick(i)}
          onMouseEnter={() => canInteract && setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={!canInteract}
          className={`
            focus:outline-none transition-all duration-200
            ${canInteract ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
            ${loading ? 'animate-pulse' : ''}
          `}
        >
          {isFilled ? (
            <Star 
              size={24} 
              className="text-yellow-400 fill-current drop-shadow-sm" 
            />
          ) : (
            <StarOff 
              size={24} 
              className={`${canInteract ? 'text-gray-300 hover:text-yellow-200' : 'text-gray-300'} transition-colors`}
            />
          )}
        </button>
      );
    }
    
    return stars;
  };

  return (
    <div className="relative">
      {/* Rating Stars */}
      <div className="flex items-center space-x-1 space-x-reverse">
        {renderStars()}
        
        {loading && (
          <div className="ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {/* User's Rating Status */}
      {userRating && (
        <div className="mt-2 flex items-center space-x-2 space-x-reverse text-sm">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-green-700">
            {i18n.language === 'ar' ? 'تقييمك:' : 'Your rating:'} {userRating.rating} ⭐
          </span>
        </div>
      )}
      
      {/* Help Text */}
      {!hasRated && user && (
        <div className="mt-2 text-sm text-gray-500">
          {i18n.language === 'ar' 
            ? 'اضغط على النجوم لتقييم هذا المنتج (مرة واحدة فقط)'
            : 'Click on stars to rate this product (one time only)'
          }
        </div>
      )}

      {/* Already Rated Message */}
      {hasRated && (
        <div className="mt-2 text-sm text-gray-500">
          {i18n.language === 'ar' 
            ? 'شكراً لك! لقد قمت بتقييم هذا المنتج'
            : 'Thank you! You have already rated this product'
          }
        </div>
      )}
      
      {/* Warning Message */}
      {showMessage && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-lg z-10">
          <div className="flex items-start space-x-2 space-x-reverse">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                {!user 
                  ? (i18n.language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Login Required')
                  : (i18n.language === 'ar' ? 'تقييم واحد فقط' : 'One Rating Only')
                }
              </p>
              <p>
                {!user 
                  ? (i18n.language === 'ar' 
                      ? 'يجب تسجيل الدخول لتقييم المنتجات'
                      : 'Please login to rate products'
                    )
                  : (i18n.language === 'ar' 
                      ? 'يمكنك تقييم كل منتج مرة واحدة فقط'
                      : 'You can only rate each product once'
                    )
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingSystem;