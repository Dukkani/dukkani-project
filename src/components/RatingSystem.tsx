import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Star, StarOff, Clock, Shield, AlertTriangle } from 'lucide-react';

interface RatingSystemProps {
  productId: string;
  currentRating?: number;
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
  currentRating = 0,
  onRatingUpdate,
  disabled = false
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [showCooldownWarning, setShowCooldownWarning] = useState(false);

  useEffect(() => {
    if (user && productId) {
      fetchUserRating();
    }
  }, [user, productId]);

  useEffect(() => {
    // Update cooldown timer every minute
    const interval = setInterval(() => {
      if (cooldownEnd && Date.now() >= cooldownEnd) {
        setCooldownEnd(null);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const fetchUserRating = async () => {
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
        
        // Check cooldown (24 hours)
        const lastRatingTime = rating.createdAt?.seconds * 1000 || 0;
        const cooldownDuration = 24 * 60 * 60 * 1000; // 24 hours
        const cooldownEndTime = lastRatingTime + cooldownDuration;
        
        if (Date.now() < cooldownEndTime) {
          setCooldownEnd(cooldownEndTime);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const canUserRate = (): { canRate: boolean; reason?: string } => {
    if (!user) {
      return { 
        canRate: false, 
        reason: i18n.language === 'ar' ? 'يجب تسجيل الدخول لتقييم المنتجات' : 'Please login to rate products' 
      };
    }

    if (disabled) {
      return { 
        canRate: false, 
        reason: i18n.language === 'ar' ? 'التقييم غير متاح حالياً' : 'Rating is currently disabled' 
      };
    }

    if (cooldownEnd && Date.now() < cooldownEnd) {
      const hoursLeft = Math.ceil((cooldownEnd - Date.now()) / (1000 * 60 * 60));
      return { 
        canRate: false, 
        reason: i18n.language === 'ar' 
          ? `يمكنك تقييم هذا المنتج مرة أخرى بعد ${hoursLeft} ساعة`
          : `You can rate this product again in ${hoursLeft} hours`
      };
    }

    return { canRate: true };
  };

  const handleRatingClick = async (rating: number) => {
    const { canRate, reason } = canUserRate();
    
    if (!canRate) {
      setShowCooldownWarning(true);
      setTimeout(() => setShowCooldownWarning(false), 3000);
      return;
    }

    setLoading(true);
    
    try {
      if (userRating) {
        // Update existing rating
        await updateDoc(doc(db, 'ratings', userRating.id), {
          rating: rating,
          createdAt: serverTimestamp()
        });
      } else {
        // Create new rating
        await addDoc(collection(db, 'ratings'), {
          productId: productId,
          userId: user!.uid,
          rating: rating,
          createdAt: serverTimestamp()
        });
      }
      
      // Update local state
      setUserRating({
        id: userRating?.id || 'temp',
        rating: rating,
        createdAt: { seconds: Date.now() / 1000 }
      });
      
      // Set new cooldown
      setCooldownEnd(Date.now() + (24 * 60 * 60 * 1000));
      
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
      const { canRate } = canUserRate();
      
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingClick(i)}
          onMouseEnter={() => canRate && setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={loading || !canRate}
          className={`
            focus:outline-none transition-all duration-200
            ${canRate ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed opacity-60'}
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
              className="text-gray-300 hover:text-yellow-200 transition-colors" 
            />
          )}
        </button>
      );
    }
    
    return stars;
  };

  const getCooldownTimeLeft = () => {
    if (!cooldownEnd) return null;
    
    const timeLeft = cooldownEnd - Date.now();
    if (timeLeft <= 0) return null;
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const timeLeft = getCooldownTimeLeft();

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
      
      {/* User's Current Rating */}
      {userRating && (
        <div className="mt-2 flex items-center space-x-2 space-x-reverse text-sm">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-green-700">
            {i18n.language === 'ar' ? 'تقييمك:' : 'Your rating:'} {userRating.rating} ⭐
          </span>
        </div>
      )}
      
      {/* Cooldown Warning */}
      {timeLeft && (
        <div className="mt-2 flex items-center space-x-2 space-x-reverse text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span>
            {i18n.language === 'ar' 
              ? `يمكنك التقييم مرة أخرى بعد ${timeLeft.hours}:${timeLeft.minutes.toString().padStart(2, '0')}`
              : `You can rate again in ${timeLeft.hours}:${timeLeft.minutes.toString().padStart(2, '0')}`
            }
          </span>
        </div>
      )}
      
      {/* Cooldown Warning Popup */}
      {showCooldownWarning && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg shadow-lg z-10">
          <div className="flex items-start space-x-2 space-x-reverse">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                {i18n.language === 'ar' ? 'تقييم محدود' : 'Rating Limited'}
              </p>
              <p>
                {timeLeft 
                  ? (i18n.language === 'ar' 
                      ? `يمكنك تقييم هذا المنتج مرة أخرى بعد ${timeLeft.hours} ساعة و ${timeLeft.minutes} دقيقة`
                      : `You can rate this product again in ${timeLeft.hours} hours and ${timeLeft.minutes} minutes`
                    )
                  : (i18n.language === 'ar' 
                      ? 'يجب تسجيل الدخول لتقييم المنتجات'
                      : 'Please login to rate products'
                    )
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Text */}
      {!userRating && user && !timeLeft && (
        <div className="mt-2 text-sm text-gray-500">
          {i18n.language === 'ar' 
            ? 'اضغط على النجوم لتقييم هذا المنتج'
            : 'Click on stars to rate this product'
          }
        </div>
      )}
    </div>
  );
};

export default RatingSystem;