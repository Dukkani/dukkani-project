import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Product {
  id: string;
  shopId: string;
  productName: string;
  description?: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: any;
}

export interface Shop {
  id: string;
  ownerId: string;
  shopName: string;
  description: string;
  whatsappNumber: string;
  shopUrlSlug: string;
  logoUrl?: string;
  bannerUrl?: string;
  createdAt: any;
}

/**
 * Delete a product with proper authorization checks
 */
export const deleteProduct = async (
  productId: string, 
  userId: string,
  isAdmin: boolean = false
): Promise<void> => {
  try {
    // Delete the product
    await deleteDoc(doc(db, 'products', productId));
    
    // Also delete any ratings for this product
    const ratingsQuery = query(
      collection(db, 'ratings'),
      where('productId', '==', productId)
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);
    
    const deletePromises = ratingsSnapshot.docs.map(ratingDoc => 
      deleteDoc(doc(db, 'ratings', ratingDoc.id))
    );
    
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Calculate average rating for a product
 */
export const calculateProductRating = (ratings: any[], productId: string) => {
  const productRatings = ratings.filter(r => r.productId === productId);
  if (productRatings.length === 0) {
    return { average: 0, count: 0 };
  }
  
  const sum = productRatings.reduce((acc, rating) => acc + rating.rating, 0);
  return {
    average: sum / productRatings.length,
    count: productRatings.length
  };
};

/**
 * Format price with currency
 */
export const formatPrice = (price: number, currency: string = 'د.ل'): string => {
  return `${price.toLocaleString()} ${currency}`;
};

/**
 * Generate WhatsApp order message
 */
export const generateWhatsAppMessage = (
  product: Product, 
  shop: Shop, 
  language: string = 'ar'
): string => {
  if (language === 'ar') {
    return `مرحباً ${shop.shopName}، أود طلب المنتج التالي:\n\n📦 ${product.productName}\n💰 السعر: ${formatPrice(product.price)}\n\nشكراً لكم`;
  } else {
    return `Hello ${shop.shopName}, I would like to order the following product:\n\n📦 ${product.productName}\n💰 Price: ${formatPrice(product.price)}\n\nThank you`;
  }
};

/**
 * Validate product data
 */
export const validateProductData = (productData: Partial<Product>): string[] => {
  const errors: string[] = [];
  
  if (!productData.productName?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!productData.price || productData.price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (!productData.imageUrl?.trim()) {
    errors.push('Product image is required');
  }
  
  if (!productData.category?.trim()) {
    errors.push('Product category is required');
  }
  
  return errors;
};

/**
 * Filter and sort products
 */
export const filterAndSortProducts = (
  products: Product[],
  filters: {
    searchTerm?: string;
    category?: string;
    priceRange?: { min: number; max: number };
    sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name';
  }
): Product[] => {
  let filtered = [...products];
  
  // Apply search filter
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(product =>
      product.productName.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }
  
  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(product => product.category === filters.category);
  }
  
  // Apply price range filter
  if (filters.priceRange) {
    filtered = filtered.filter(product =>
      product.price >= filters.priceRange!.min &&
      product.price <= filters.priceRange!.max
    );
  }
  
  // Apply sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return b.createdAt?.seconds - a.createdAt?.seconds || 0;
        case 'oldest':
          return a.createdAt?.seconds - b.createdAt?.seconds || 0;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'name':
          return a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });
  }
  
  return filtered;
};