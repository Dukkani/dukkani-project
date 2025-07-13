import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '../utils/productHelpers';

interface UseProductsOptions {
  shopId?: string;
  category?: string;
  limit?: number;
  realtime?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

      if (options.shopId) {
        q = query(q, where('shopId', '==', options.shopId));
      }

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      const snapshot = await getDocs(q);
      const productsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Product[];

      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (options.realtime) {
      // Set up real-time listener
      let q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

      if (options.shopId) {
        q = query(q, where('shopId', '==', options.shopId));
      }

      if (options.category) {
        q = query(q, where('category', '==', options.category));
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Product[];
          setProducts(productsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error in products listener:', err);
          setError('Failed to fetch products');
          setLoading(false);
        }
      );
    } else {
      // One-time fetch
      fetchProducts();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [options.shopId, options.category, options.realtime]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
};