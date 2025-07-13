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
  deleteDoc,
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadImageToUploadio } from '../config/uploadio';
import { ADMIN_CONFIG, PRODUCT_CATEGORIES } from '../config/constants';
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart3,
  Users,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Settings,
  Image as ImageIcon,
  Globe,
  Phone,
  Mail,
  Clock,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone
} from 'lucide-react';

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
  shopId: string;
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

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'shop' | 'analytics' | 'admin'>('overview');
  
  const [shopForm, setShopForm] = useState({
    shopName: '',
    description: '',
    whatsappNumber: '',
    shopUrlSlug: '',
    logoUrl: '',
    bannerUrl: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      youtube: ''
    },
    businessInfo: {
      address: '',
      phone: '',
      email: '',
      workingHours: ''
    }
  });

  const [productForm, setProductForm] = useState({
    productName: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'clothing'
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user && ADMIN_CONFIG.isAdmin(user.email || '');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      if (isAdmin) {
        // Admin: Fetch all shops and products
        const shopsQuery = query(collection(db, 'shops'), orderBy('createdAt', 'desc'));
        const shopsSnapshot = await getDocs(shopsQuery);
        const shopsData = shopsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Shop[];
        setAllShops(shopsData);

        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Product[];
        setAllProducts(productsData);

        // Also fetch user's own shop if exists
        const userShop = shopsData.find(s => s.ownerId === user.uid);
        if (userShop) {
          setShop(userShop);
          const userProducts = productsData.filter(p => p.shopId === userShop.id);
          setProducts(userProducts);
        }
      } else {
        // Regular user: Fetch only their shop and products
        const shopQuery = query(
          collection(db, 'shops'), 
          where('ownerId', '==', user.uid)
        );
        const shopSnapshot = await getDocs(shopQuery);
        
        if (!shopSnapshot.empty) {
          const shopData = shopSnapshot.docs[0].data() as Shop;
          const shopWithId = { ...shopData, id: shopSnapshot.docs[0].id };
          setShop(shopWithId);
          setShopForm({
            shopName: shopData.shopName,
            description: shopData.description,
            whatsappNumber: shopData.whatsappNumber,
            shopUrlSlug: shopData.shopUrlSlug,
            logoUrl: shopData.logoUrl || '',
            bannerUrl: shopData.bannerUrl || '',
            socialMedia: shopData.socialMedia || {
              facebook: '',
              instagram: '',
              twitter: '',
              tiktok: '',
              youtube: ''
            },
            businessInfo: shopData.businessInfo || {
              address: '',
              phone: '',
              email: '',
              workingHours: ''
            }
          });

          // Fetch products for this shop
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
        }
      }

      // Fetch ratings for analytics
      const ratingsQuery = query(collection(db, 'ratings'), orderBy('createdAt', 'desc'));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsData = ratingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Rating[];
      setRatings(ratingsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', t('dashboard.error.fetch', 'Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      // Generate URL slug from shop name if not provided
      let urlSlug = shopForm.shopUrlSlug;
      if (!urlSlug) {
        urlSlug = shopForm.shopName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }

      // Check if slug is unique
      const existingShopQuery = query(
        collection(db, 'shops'),
        where('shopUrlSlug', '==', urlSlug)
      );
      const existingShopSnapshot = await getDocs(existingShopQuery);
      
      if (!existingShopSnapshot.empty) {
        urlSlug = `${urlSlug}-${Date.now()}`;
      }

      const shopData = {
        ownerId: user.uid,
        shopName: shopForm.shopName,
        description: shopForm.description,
        whatsappNumber: shopForm.whatsappNumber,
        shopUrlSlug: urlSlug,
        logoUrl: shopForm.logoUrl,
        bannerUrl: shopForm.bannerUrl,
        socialMedia: shopForm.socialMedia,
        businessInfo: shopForm.businessInfo,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'shops'), shopData);
      const newShop = { ...shopData, id: docRef.id } as Shop;
      setShop(newShop);
      setShowCreateShop(false);
      showMessage('success', t('dashboard.shop.created'));
      await fetchData();
    } catch (error) {
      console.error('Error creating shop:', error);
      showMessage('error', t('dashboard.error.shop.create'));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shop) return;

    setUploading(true);
    try {
      const shopData = {
        shopName: shopForm.shopName,
        description: shopForm.description,
        whatsappNumber: shopForm.whatsappNumber,
        logoUrl: shopForm.logoUrl,
        bannerUrl: shopForm.bannerUrl,
        socialMedia: shopForm.socialMedia,
        businessInfo: shopForm.businessInfo,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'shops', shop.id), shopData);
      setShop({ ...shop, ...shopData });
      setShowEditShop(false);
      showMessage('success', t('dashboard.shop.updated'));
      await fetchData();
    } catch (error) {
      console.error('Error updating shop:', error);
      showMessage('error', t('dashboard.error.shop.update'));
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shop) return;

    setUploading(true);
    try {
      const productData = {
        shopId: shop.id,
        productName: productForm.productName,
        description: productForm.description,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl,
        category: productForm.category,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);
      setShowAddProduct(false);
      setProductForm({
        productName: '',
        description: '',
        price: '',
        imageUrl: '',
        category: 'clothing'
      });
      showMessage('success', t('dashboard.product.added'));
      await fetchData();
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', t('dashboard.error.product.add'));
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingProduct) return;

    setUploading(true);
    try {
      const productData = {
        productName: productForm.productName,
        description: productForm.description,
        price: parseFloat(productForm.price),
        imageUrl: productForm.imageUrl,
        category: productForm.category,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'products', editingProduct.id), productData);
      setEditingProduct(null);
      setProductForm({
        productName: '',
        description: '',
        price: '',
        imageUrl: '',
        category: 'clothing'
      });
      showMessage('success', t('dashboard.product.updated'));
      await fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
      showMessage('error', t('dashboard.error.product.update'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, isAdminAction = false) => {
    const confirmMessage = isAdminAction 
      ? t('dashboard.confirm.delete.admin')
      : t('dashboard.confirm.delete');
    
    if (!confirm(confirmMessage)) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      showMessage('success', t('dashboard.product.deleted'));
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('error', t('dashboard.error.product.delete'));
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm(t('dashboard.confirm.delete.shop'))) return;

    try {
      // Delete all products in the shop first
      const shopProducts = allProducts.filter(p => p.shopId === shopId);
      for (const product of shopProducts) {
        await deleteDoc(doc(db, 'products', product.id));
      }
      
      // Delete the shop
      await deleteDoc(doc(db, 'shops', shopId));
      showMessage('success', 'Shop deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting shop:', error);
      showMessage('error', 'Failed to delete shop');
    }
  };

  const handleImageUpload = async (file: File, type: 'product' | 'logo' | 'banner') => {
    setUploading(true);
    try {
      const imageUrl = await uploadImageToUploadio(file);
      
      if (type === 'product') {
        setProductForm(prev => ({ ...prev, imageUrl }));
      } else if (type === 'logo') {
        setShopForm(prev => ({ ...prev, logoUrl: imageUrl }));
      } else if (type === 'banner') {
        setShopForm(prev => ({ ...prev, bannerUrl: imageUrl }));
      }
      
      showMessage('success', 'Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', t('dashboard.error.image.upload'));
    } finally {
      setUploading(false);
    }
  };

  const copyShopLink = () => {
    if (!shop) return;
    const link = `${window.location.origin}/shop/${shop.shopUrlSlug}`;
    navigator.clipboard.writeText(link);
    showMessage('success', t('dashboard.link.copied'));
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      productName: product.productName,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
      category: product.category
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? (i18n.language === 'ar' ? category.nameAr : category.nameEn) : categoryId;
  };

  const calculateAnalytics = () => {
    const userProducts = isAdmin ? allProducts : products;
    const userRatings = ratings.filter(r => 
      userProducts.some(p => p.id === r.productId)
    );
    
    const totalRating = userRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = userRatings.length > 0 ? totalRating / userRatings.length : 0;
    
    return {
      totalProducts: userProducts.length,
      totalRatings: userRatings.length,
      averageRating: averageRating,
      totalShops: isAdmin ? allShops.length : (shop ? 1 : 0)
    };
  };

  const analytics = calculateAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? t('dashboard.admin.panel') : t('dashboard.welcome')}
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.email}
              </p>
            </div>
            {shop && (
              <div className="flex space-x-4 space-x-reverse">
                <a
                  href={`/shop/${shop.shopUrlSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={20} />
                  <span>{t('dashboard.shop.view')}</span>
                </a>
                <button
                  onClick={copyShopLink}
                  className="inline-flex items-center space-x-2 space-x-reverse bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Copy size={20} />
                  <span>{t('dashboard.shop.copy')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 space-x-reverse ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 space-x-reverse border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <BarChart3 size={20} />
                <span>{i18n.language === 'ar' ? 'نظرة عامة' : 'Overview'}</span>
              </div>
            </button>
            
            {!isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'shop'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Store size={20} />
                    <span>{t('dashboard.my.shop')}</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <ShoppingBag size={20} />
                    <span>{t('dashboard.products')}</span>
                  </div>
                </button>
              </>
            )}
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <TrendingUp size={20} />
                <span>{i18n.language === 'ar' ? 'التحليلات' : 'Analytics'}</span>
              </div>
            </button>
            
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Settings size={20} />
                  <span>{i18n.language === 'ar' ? 'إدارة' : 'Admin'}</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {isAdmin ? t('dashboard.all.shops') : t('dashboard.my.shop')}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalShops}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {t('dashboard.products')}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalProducts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {i18n.language === 'ar' ? 'التقييمات' : 'Ratings'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalRatings}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {i18n.language === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.averageRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {i18n.language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!shop && !isAdmin && (
                  <button
                    onClick={() => setShowCreateShop(true)}
                    className="flex items-center space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">{t('dashboard.create.shop')}</span>
                  </button>
                )}
                
                {shop && !isAdmin && (
                  <>
                    <button
                      onClick={() => setShowAddProduct(true)}
                      className="flex items-center space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-6 w-6 text-green-600" />
                      <span className="font-medium">{t('dashboard.add.product')}</span>
                    </button>
                    
                    <button
                      onClick={() => setShowEditShop(true)}
                      className="flex items-center space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-6 w-6 text-purple-600" />
                      <span className="font-medium">{t('dashboard.shop.edit')}</span>
                    </button>
                  </>
                )}
                
                {shop && (
                  <a
                    href={`/shop/${shop.shopUrlSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 space-x-reverse p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-6 w-6 text-indigo-600" />
                    <span className="font-medium">{t('dashboard.shop.view')}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && !isAdmin && (
          <div className="space-y-6">
            {shop ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('dashboard.my.shop')}
                  </h2>
                  <button
                    onClick={() => setShowEditShop(true)}
                    className="inline-flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit size={20} />
                    <span>{t('dashboard.edit')}</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{shop.shopName}</h3>
                    <p className="text-gray-600 mb-4">{shop.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <span>{shop.whatsappNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span>/shop/{shop.shopUrlSlug}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {shop.logoUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {i18n.language === 'ar' ? 'شعار المتجر' : 'Shop Logo'}
                        </label>
                        <img
                          src={shop.logoUrl}
                          alt="Shop Logo"
                          className="w-20 h-20 rounded-lg object-cover border"
                        />
                      </div>
                    )}
                    
                    {shop.bannerUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {i18n.language === 'ar' ? 'بانر المتجر' : 'Shop Banner'}
                        </label>
                        <img
                          src={shop.bannerUrl}
                          alt="Shop Banner"
                          className="w-full h-32 rounded-lg object-cover border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('dashboard.no.shop')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('dashboard.no.shop.desc')}
                </p>
                <button
                  onClick={() => setShowCreateShop(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  {t('dashboard.create.shop')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && !isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('dashboard.products')}
              </h2>
              {shop && (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="inline-flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  <span>{t('dashboard.add.product')}</span>
                </button>
              )}
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {getCategoryName(product.category)}
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {product.price} {t('currency')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {product.productName}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => startEditProduct(product)}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          {t('dashboard.edit')}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          {t('dashboard.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('dashboard.no.products')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('dashboard.no.products.desc')}
                </p>
                {shop && (
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {t('dashboard.add.product')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {i18n.language === 'ar' ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {i18n.language === 'ar' ? 'نظرة عامة' : 'Overview'}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {i18n.language === 'ar' ? 'إجمالي المنتجات:' : 'Total Products:'}
                    </span>
                    <span className="font-semibold">{analytics.totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {i18n.language === 'ar' ? 'إجمالي التقييمات:' : 'Total Ratings:'}
                    </span>
                    <span className="font-semibold">{analytics.totalRatings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {i18n.language === 'ar' ? 'متوسط التقييم:' : 'Average Rating:'}
                    </span>
                    <span className="font-semibold">{analytics.averageRating.toFixed(1)} ⭐</span>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {i18n.language === 'ar' ? 'إجمالي المتاجر:' : 'Total Shops:'}
                      </span>
                      <span className="font-semibold">{analytics.totalShops}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {i18n.language === 'ar' ? 'الفئات الأكثر شيوعاً' : 'Popular Categories'}
                </h3>
                <div className="space-y-3">
                  {PRODUCT_CATEGORIES.slice(0, 5).map((category) => {
                    const categoryProducts = (isAdmin ? allProducts : products).filter(
                      p => p.category === category.id
                    );
                    const percentage = analytics.totalProducts > 0 
                      ? (categoryProducts.length / analytics.totalProducts) * 100 
                      : 0;
                    
                    return (
                      <div key={category.id}>
                        <div className="flex justify-between text-sm">
                          <span>{i18n.language === 'ar' ? category.nameAr : category.nameEn}</span>
                          <span>{categoryProducts.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboard.admin.panel')}
            </h2>
            
            {/* All Shops */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('dashboard.all.shops')} ({allShops.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i18n.language === 'ar' ? 'اسم المتجر' : 'Shop Name'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i18n.language === 'ar' ? 'المالك' : 'Owner'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i18n.language === 'ar' ? 'المنتجات' : 'Products'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i18n.language === 'ar' ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allShops.map((shopItem) => {
                      const shopProducts = allProducts.filter(p => p.shopId === shopItem.id);
                      return (
                        <tr key={shopItem.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {shopItem.logoUrl && (
                                <img
                                  className="h-10 w-10 rounded-full mr-3"
                                  src={shopItem.logoUrl}
                                  alt=""
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {shopItem.shopName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  /{shopItem.shopUrlSlug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shopItem.ownerId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {shopProducts.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 space-x-reverse">
                              <a
                                href={`/shop/${shopItem.shopUrlSlug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye size={16} />
                              </a>
                              <button
                                onClick={() => handleDeleteShop(shopItem.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('dashboard.all.products')} ({allProducts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allProducts.map((product) => {
                  const productShop = allShops.find(s => s.id === product.shopId);
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <h4 className="font-semibold text-sm mb-1">{product.productName}</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {productShop?.shopName}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-blue-600">
                          {product.price} {t('currency')}
                        </span>
                        <button
                          onClick={() => handleDeleteProduct(product.id, true)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {/* Create Shop Modal */}
        {showCreateShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('dashboard.create.shop')}
                  </h2>
                  <button
                    onClick={() => setShowCreateShop(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateShop} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={shopForm.shopName}
                        onChange={(e) => setShopForm(prev => ({ ...prev, shopName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('dashboard.shop.name.placeholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.whatsapp')} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shopForm.whatsappNumber}
                        onChange={(e) => setShopForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('dashboard.shop.whatsapp.placeholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.shop.description')} *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={shopForm.description}
                      onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('dashboard.shop.description.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'ar' ? 'رابط المتجر (اختياري)' : 'Shop URL (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={shopForm.shopUrlSlug}
                      onChange={(e) => setShopForm(prev => ({ ...prev, shopUrlSlug: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={i18n.language === 'ar' ? 'my-shop' : 'my-shop'}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'ar' ? 'شعار المتجر' : 'Shop Logo'}
                    </label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo');
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <Upload size={16} className="inline mr-2" />
                        {i18n.language === 'ar' ? 'رفع شعار' : 'Upload Logo'}
                      </label>
                      {shopForm.logoUrl && (
                        <img
                          src={shopForm.logoUrl}
                          alt="Logo preview"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'ar' ? 'بانر المتجر' : 'Shop Banner'}
                    </label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'banner');
                        }}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="cursor-pointer bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <Upload size={16} className="inline mr-2" />
                        {i18n.language === 'ar' ? 'رفع بانر' : 'Upload Banner'}
                      </label>
                      {shopForm.bannerUrl && (
                        <img
                          src={shopForm.bannerUrl}
                          alt="Banner preview"
                          className="w-24 h-12 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {i18n.language === 'ar' ? 'معلومات العمل (اختياري)' : 'Business Information (Optional)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'العنوان' : 'Address'}
                        </label>
                        <input
                          type="text"
                          value={shopForm.businessInfo.address}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, address: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <input
                          type="tel"
                          value={shopForm.businessInfo.phone}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, phone: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={shopForm.businessInfo.email}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, email: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                        </label>
                        <input
                          type="text"
                          value={shopForm.businessInfo.workingHours}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, workingHours: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={i18n.language === 'ar' ? 'السبت - الخميس: 9 صباحاً - 9 مساءً' : 'Sat - Thu: 9 AM - 9 PM'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {i18n.language === 'ar' ? 'وسائل التواصل الاجتماعي (اختياري)' : 'Social Media (Optional)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Facebook size={16} className="inline mr-1" />
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.facebook}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Instagram size={16} className="inline mr-1" />
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.instagram}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Twitter size={16} className="inline mr-1" />
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.twitter}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://twitter.com/yourpage"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Youtube size={16} className="inline mr-1" />
                          YouTube
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.youtube}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 space-x-reverse pt-6">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                          {t('dashboard.saving')}
                        </>
                      ) : (
                        <>
                          <Save size={20} className="inline mr-2" />
                          {t('dashboard.shop.create')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateShop(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      {t('dashboard.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Shop Modal */}
        {showEditShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('dashboard.shop.edit')}
                  </h2>
                  <button
                    onClick={() => setShowEditShop(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleUpdateShop} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.name')} *
                      </label>
                      <input
                        type="text"
                        required
                        value={shopForm.shopName}
                        onChange={(e) => setShopForm(prev => ({ ...prev, shopName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.whatsapp')} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={shopForm.whatsappNumber}
                        onChange={(e) => setShopForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.shop.description')} *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={shopForm.description}
                      onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'ar' ? 'شعار المتجر' : 'Shop Logo'}
                    </label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'logo');
                        }}
                        className="hidden"
                        id="edit-logo-upload"
                      />
                      <label
                        htmlFor="edit-logo-upload"
                        className="cursor-pointer bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <Upload size={16} className="inline mr-2" />
                        {i18n.language === 'ar' ? 'تغيير الشعار' : 'Change Logo'}
                      </label>
                      {shopForm.logoUrl && (
                        <img
                          src={shopForm.logoUrl}
                          alt="Logo preview"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {i18n.language === 'ar' ? 'بانر المتجر' : 'Shop Banner'}
                    </label>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'banner');
                        }}
                        className="hidden"
                        id="edit-banner-upload"
                      />
                      <label
                        htmlFor="edit-banner-upload"
                        className="cursor-pointer bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <Upload size={16} className="inline mr-2" />
                        {i18n.language === 'ar' ? 'تغيير البانر' : 'Change Banner'}
                      </label>
                      {shopForm.bannerUrl && (
                        <img
                          src={shopForm.bannerUrl}
                          alt="Banner preview"
                          className="w-24 h-12 rounded-lg object-cover border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {i18n.language === 'ar' ? 'معلومات العمل' : 'Business Information'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'العنوان' : 'Address'}
                        </label>
                        <input
                          type="text"
                          value={shopForm.businessInfo.address}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, address: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <input
                          type="tel"
                          value={shopForm.businessInfo.phone}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, phone: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={shopForm.businessInfo.email}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, email: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock size={16} className="inline mr-1" />
                          {i18n.language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                        </label>
                        <input
                          type="text"
                          value={shopForm.businessInfo.workingHours}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            businessInfo: { ...prev.businessInfo, workingHours: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {i18n.language === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Facebook size={16} className="inline mr-1" />
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.facebook}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Instagram size={16} className="inline mr-1" />
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.instagram}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Twitter size={16} className="inline mr-1" />
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.twitter}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Youtube size={16} className="inline mr-1" />
                          YouTube
                        </label>
                        <input
                          type="url"
                          value={shopForm.socialMedia.youtube}
                          onChange={(e) => setShopForm(prev => ({
                            ...prev,
                            socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 space-x-reverse pt-6">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                          {t('dashboard.saving')}
                        </>
                      ) : (
                        <>
                          <Save size={20} className="inline mr-2" />
                          {t('dashboard.shop.update')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditShop(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      {t('dashboard.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {(showAddProduct || editingProduct) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingProduct ? t('dashboard.edit') + ' ' + t('dashboard.products') : t('dashboard.add.product')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddProduct(false);
                      setEditingProduct(null);
                      setProductForm({
                        productName: '',
                        description: '',
                        price: '',
                        imageUrl: '',
                        category: 'clothing'
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.product.name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.productName}
                      onChange={(e) => setProductForm(prev => ({ ...prev, productName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('dashboard.product.name.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.product.category')} *
                    </label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PRODUCT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {i18n.language === 'ar' ? category.nameAr : category.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.product.price')} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('dashboard.product.price.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.product.description')}
                    </label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('dashboard.product.description.placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.product.image')} *
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'product');
                          }}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
                          className="cursor-pointer bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <Upload size={16} className="inline mr-2" />
                          {i18n.language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                        </label>
                        {productForm.imageUrl && (
                          <img
                            src={productForm.imageUrl}
                            alt="Product preview"
                            className="w-16 h-16 rounded-lg object-cover border"
                          />
                        )}
                      </div>
                      {!productForm.imageUrl && (
                        <p className="text-sm text-red-600">
                          {i18n.language === 'ar' ? 'صورة المنتج مطلوبة' : 'Product image is required'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-4 space-x-reverse pt-6">
                    <button
                      type="submit"
                      disabled={uploading || !productForm.imageUrl}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2" />
                          {t('dashboard.saving')}
                        </>
                      ) : (
                        <>
                          <Save size={20} className="inline mr-2" />
                          {editingProduct ? t('dashboard.update') : t('dashboard.save')}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProduct(false);
                        setEditingProduct(null);
                        setProductForm({
                          productName: '',
                          description: '',
                          price: '',
                          imageUrl: '',
                          category: 'clothing'
                        });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                    >
                      {t('dashboard.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;