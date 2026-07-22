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
import { Shop } from '../utils/productHelpers';

interface UseShopsOptions {
  ownerId?: string;
  limit?: number;
  realtime?: boolean;
}

interface UseShopsReturn {
  shops: Shop[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useShops = (options: UseShopsOptions = {}): UseShopsReturn => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(db, 'shops'), orderBy('createdAt', 'desc'));

      if (options.ownerId) {
        q = query(q, where('ownerId', '==', options.ownerId));
      }

      const snapshot = await getDocs(q);
      const shopsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Shop[];

      setShops(shopsData);
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (options.realtime) {
      // Set up real-time listener
      let q = query(collection(db, 'shops'), orderBy('createdAt', 'desc'));

      if (options.ownerId) {
        q = query(q, where('ownerId', '==', options.ownerId));
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const shopsData = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Shop[];
          setShops(shopsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error in shops listener:', err);
          setError('Failed to fetch shops');
          setLoading(false);
        }
      );
    } else {
      // One-time fetch
      fetchShops();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [options.ownerId, options.realtime]);

  return {
    shops,
    loading,
    error,
    refetch: fetchShops
  };
};