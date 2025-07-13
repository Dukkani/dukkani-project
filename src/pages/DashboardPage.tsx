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
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  MessageCircle,
  Star,
  BarChart3,
  Settings,
  Upload,
  Link as LinkIcon,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const categories = [
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
  const [activeTab, setActiveTab] = useState<'overview' | 'shop' | 'products' | 'analytics' | 'admin'>('overview');
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShopForm, setShowShopForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingShop, setEditingShop] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
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
  const [productFormData, setProductFormData] = useState({
    productName: '',
    description: '',
    price: '',
    imageUrl: '',
    category: ''
  });

  const isAdmin = user?.email === 'dukkani2026@gmail.com';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
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
      }

      // Fetch user's shop
      const userShopQuery = query(
        collection(db, 'shops'), 
        where('ownerId', '==', user!.uid)
      );
      const userShopSnapshot = await getDocs(userShopQuery);
      
      if (!userShopSnapshot.empty) {
        const shopData = userShopSnapshot.docs[0].data() as Shop;
        const shopWithId = { ...shopData, id: userShopSnapshot.docs[0].id };
        setShop(shopWithId);
        
        // Update form data with shop data
        setFormData({
          shopName: shopData.shopName || '',
          description: shopData.description || '',
          whatsappNumber: shopData.whatsappNumber || '',
          shopUrlSlug: shopData.shopUrlSlug || '',
          logoUrl: shopData.logoUrl || '',
          bannerUrl: shopData.bannerUrl || '',
          socialMedia: {
            facebook: shopData.socialMedia?.facebook || '',
            instagram: shopData.socialMedia?.instagram || '',
            twitter: shopData.socialMedia?.twitter || '',
            tiktok: shopData.socialMedia?.tiktok || '',
            youtube: shopData.socialMedia?.youtube || ''
          },
          businessInfo: {
            address: shopData.businessInfo?.address || '',
            phone: shopData.businessInfo?.phone || '',
            email: shopData.businessInfo?.email || '',
            workingHours: shopData.businessInfo?.workingHours || ''
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

      // Fetch ratings
      const ratingsQuery = query(collection(db, 'ratings'), orderBy('createdAt', 'desc'));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratingsData = ratingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Rating[];
      setRatings(ratingsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner' | 'product') => {
    try {
      setUploading(true);
      const imageUrl = await uploadImageToUploadio(file);
      
      if (type === 'product') {
        setProductFormData(prev => ({ ...prev, imageUrl }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          [type === 'logo' ? 'logoUrl' : 'bannerUrl']: imageUrl 
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('dashboard.error.image.upload'));
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      const shopData = {
        ...formData,
        ownerId: user.uid,
        shopUrlSlug: formData.shopUrlSlug || generateSlug(formData.shopName),
        updatedAt: serverTimestamp()
      };

      if (shop) {
        // Update existing shop
        await updateDoc(doc(db, 'shops', shop.id), shopData);
        alert(t('dashboard.shop.updated'));
      } else {
        // Create new shop
        await addDoc(collection(db, 'shops'), {
          ...shopData,
          createdAt: serverTimestamp()
        });
        alert(t('dashboard.shop.created'));
      }
      
      setShowShopForm(false);
      setEditingShop(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving shop:', error);
      alert(t('dashboard.error.shop.create'));
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    try {
      setLoading(true);
      
      const productData = {
        ...productFormData,
        price: parseFloat(productFormData.price),
        shopId: shop.id,
        updatedAt: serverTimestamp()
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        alert(t('dashboard.product.updated'));
      } else {
        // Create new product
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
        alert(t('dashboard.product.added'));
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setProductFormData({
        productName: '',
        description: '',
        price: '',
        imageUrl: '',
        category: ''
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('dashboard.error.product.add'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, isAdminAction = false) => {
    const confirmMessage = isAdminAction 
      ? t('dashboard.confirm.delete.admin')
      : t('dashboard.confirm.delete');
    
    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      
      // Delete the product
      await deleteDoc(doc(db, 'products', productId));
      
      // Delete associated ratings
      const productRatings = ratings.filter(r => r.productId === productId);
      const deletePromises = productRatings.map(rating => 
        deleteDoc(doc(db, 'ratings', rating.id))
      );
      await Promise.all(deletePromises);
      
      alert(t('dashboard.product.deleted'));
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(t('dashboard.error.product.delete'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm(t('dashboard.confirm.delete.shop'))) return;

    try {
      setLoading(true);
      
      // Delete all products in the shop
      const shopProducts = allProducts.filter(p => p.shopId === shopId);
      for (const product of shopProducts) {
        await handleDeleteProduct(product.id, true);
      }
      
      // Delete the shop
      await deleteDoc(doc(db, 'shops', shopId));
      
      alert('Shop deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting shop:', error);
      alert('Failed to delete shop');
    } finally {
      setLoading(false);
    }
  };

  const copyShopLink = () => {
    if (!shop) return;
    const link = `${window.location.origin}/shop/${shop.shopUrlSlug}`;
    navigator.clipboard.writeText(link);
    alert(t('dashboard.link.copied'));
  };

  const getProductRating = (productId: string) => {
    const productRatings = ratings.filter(r => r.productId === productId);
    if (productRatings.length === 0) return { average: 0, count: 0 };
    
    const sum = productRatings.reduce((acc, rating) => acc + rating.rating, 0);
    return {
      average: sum / productRatings.length,
      count: productRatings.length
    };
  };

  const calculateAnalytics = () => {
    const userProducts = isAdmin ? allProducts : products;
    const totalProducts = userProducts.length;
    const totalRatings = ratings.filter(r => 
      userProducts.some(p => p.id === r.productId)
    ).length;
    const averageRating = totalRatings > 0 
      ? ratings.filter(r => userProducts.some(p => p.id === r.productId))
          .reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;
    
    return {
      totalProducts,
      totalRatings,
      averageRating: averageRating.toFixed(1),
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
                {isAdmin 
                  ? 'إدارة جميع المتاجر والمنتجات في المنصة'
                  : 'إدارة متجرك ومنتجاتك بسهولة'
                }
              </p>
            </div>
            {shop && (
              <div className="flex space-x-3 space-x-reverse">
                <button
                  onClick={copyShopLink}
                  className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy size={16} />
                  <span>{t('dashboard.shop.copy')}</span>
                </button>
                <a
                  href={`/shop/${shop.shopUrlSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  <span>{t('dashboard.shop.view')}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 space-x-reverse">
              {[
                { id: 'overview', label: i18n.language === 'ar' ? 'نظرة عامة' : 'Overview', icon: BarChart3 },
                { id: 'shop', label: i18n.language === 'ar' ? 'المتجر' : 'Shop', icon: Store },
                { id: 'products', label: i18n.language === 'ar' ? 'المنتجات' : 'Products', icon: Package },
                { id: 'analytics', label: i18n.language === 'ar' ? 'التحليلات' : 'Analytics', icon: TrendingUp },
                ...(isAdmin ? [{ id: 'admin', label: i18n.language === 'ar' ? 'إدارة المنصة' : 'Platform Admin', icon: Shield }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {isAdmin ? 'إجمالي المتاجر' : 'متجري'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalShops}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {isAdmin ? 'إجمالي المنتجات' : 'منتجاتي'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalProducts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">متوسط التقييم</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.averageRating} ⭐
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي التقييمات</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.totalRatings}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!shop && (
                  <button
                    onClick={() => setShowShopForm(true)}
                    className="flex items-center space-x-3 space-x-reverse p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-600">إنشاء متجر جديد</span>
                  </button>
                )}
                
                {shop && (
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="flex items-center space-x-3 space-x-reverse p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-600">إضافة منتج جديد</span>
                  </button>
                )}
                
                {shop && (
                  <button
                    onClick={() => setEditingShop(true)}
                    className="flex items-center space-x-3 space-x-reverse p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <Settings className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-600">تعديل إعدادات المتجر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Products */}
            {products.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">أحدث المنتجات</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {products.slice(0, 3).map((product) => {
                    const rating = getProductRating(product.id);
                    return (
                      <div key={product.id} className="border rounded-lg p-4">
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-medium text-gray-900 mb-1">{product.productName}</h4>
                        <p className="text-blue-600 font-semibold">{product.price} د.ل</p>
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {rating.average.toFixed(1)} ({rating.count})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-8">
            {shop ? (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Shop Header */}
                <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
                  {shop.bannerUrl && (
                    <img
                      src={shop.bannerUrl}
                      alt="Shop Banner"
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-6 flex items-end space-x-4 space-x-reverse">
                    <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white">
                      {shop.logoUrl ? (
                        <img
                          src={shop.logoUrl}
                          alt="Shop Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Store className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-white">
                      <h2 className="text-2xl font-bold">{shop.shopName}</h2>
                      <p className="opacity-90">{shop.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingShop(true)}
                    className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit size={20} />
                  </button>
                </div>

                {/* Shop Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات أساسية</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <LinkIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">الرابط:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            /shop/{shop.shopUrlSlug}
                          </code>
                        </div>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <MessageCircle className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-600">واتساب:</span>
                          <span>{shop.whatsappNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Business Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات العمل</h3>
                      <div className="space-y-3">
                        {shop.businessInfo?.address && (
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <span>{shop.businessInfo.address}</span>
                          </div>
                        )}
                        {shop.businessInfo?.phone && (
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span>{shop.businessInfo.phone}</span>
                          </div>
                        )}
                        {shop.businessInfo?.email && (
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <span>{shop.businessInfo.email}</span>
                          </div>
                        )}
                        {shop.businessInfo?.workingHours && (
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <span>{shop.businessInfo.workingHours}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  {(shop.socialMedia?.facebook || shop.socialMedia?.instagram || shop.socialMedia?.twitter || shop.socialMedia?.youtube) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">وسائل التواصل الاجتماعي</h3>
                      <div className="flex space-x-4 space-x-reverse">
                        {shop.socialMedia.facebook && (
                          <a
                            href={shop.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Facebook size={24} />
                          </a>
                        )}
                        {shop.socialMedia.instagram && (
                          <a
                            href={shop.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800"
                          >
                            <Instagram size={24} />
                          </a>
                        )}
                        {shop.socialMedia.twitter && (
                          <a
                            href={shop.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <Twitter size={24} />
                          </a>
                        )}
                        {shop.socialMedia.youtube && (
                          <a
                            href={shop.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Youtube size={24} />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('dashboard.no.shop')}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t('dashboard.no.shop.desc')}
                </p>
                <button
                  onClick={() => setShowShopForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('dashboard.create.shop')}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            {shop ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('dashboard.products')} ({products.length})
                  </h2>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={20} />
                    <span>{t('dashboard.add.product')}</span>
                  </button>
                </div>

                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const rating = getProductRating(product.id);
                      return (
                        <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {categories.find(c => c.id === product.category)?.[i18n.language === 'ar' ? 'nameAr' : 'nameEn'] || product.category}
                              </span>
                              <span className="text-lg font-bold text-blue-600">
                                {product.price} د.ل
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{product.productName}</h3>
                            {product.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600 ml-1">
                                  {rating.average.toFixed(1)} ({rating.count})
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2 space-x-reverse">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setProductFormData({
                                    productName: product.productName,
                                    description: product.description,
                                    price: product.price.toString(),
                                    imageUrl: product.imageUrl,
                                    category: product.category
                                  });
                                  setShowProductForm(true);
                                }}
                                className="flex-1 flex items-center justify-center space-x-1 space-x-reverse bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Edit size={16} />
                                <span>{t('dashboard.edit')}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="flex items-center justify-center bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {t('dashboard.no.products')}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      {t('dashboard.no.products.desc')}
                    </p>
                    <button
                      onClick={() => setShowProductForm(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('dashboard.add.product')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  أنشئ متجرك أولاً
                </h2>
                <p className="text-gray-600 mb-6">
                  يجب إنشاء متجر قبل إضافة المنتجات
                </p>
                <button
                  onClick={() => setShowShopForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  إنشاء متجر
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">التحليلات والإحصائيات</h2>
            
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المنتجات</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">التقييمات</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalRatings}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">متوسط التقييم</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.averageRating}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المتاجر</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalShops}</p>
                  </div>
                  <Store className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Product Performance */}
            {products.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء المنتجات</h3>
                <div className="space-y-4">
                  {products.map((product) => {
                    const rating = getProductRating(product.id);
                    return (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{product.productName}</h4>
                            <p className="text-sm text-gray-600">{product.price} د.ل</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">التقييم</p>
                            <p className="font-semibold">{rating.average.toFixed(1)} ⭐</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">المراجعات</p>
                            <p className="font-semibold">{rating.count}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Shield className="h-8 w-8 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">لوحة تحكم المدير</h2>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">جميع المتاجر</h3>
                <p className="text-3xl font-bold text-blue-600">{allShops.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">جميع المنتجات</h3>
                <p className="text-3xl font-bold text-green-600">{allProducts.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">إجمالي التقييمات</h3>
                <p className="text-3xl font-bold text-purple-600">{ratings.length}</p>
              </div>
            </div>

            {/* All Shops */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">جميع المتاجر</h3>
              <div className="space-y-4">
                {allShops.map((shop) => (
                  <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} alt={shop.shopName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{shop.shopName}</h4>
                        <p className="text-sm text-gray-600">{shop.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <a
                        href={`/shop/${shop.shopUrlSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        onClick={() => handleDeleteShop(shop.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All Products */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">جميع المنتجات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProducts.slice(0, 12).map((product) => {
                  const productShop = allShops.find(s => s.id === product.shopId);
                  const rating = getProductRating(product.id);
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-medium text-gray-900 mb-1">{product.productName}</h4>
                      <p className="text-sm text-gray-600 mb-2">{productShop?.shopName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 font-semibold">{product.price} د.ل</span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {rating.average.toFixed(1)} ({rating.count})
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(product.id, true)}
                        className="w-full mt-3 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        حذف المنتج
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shop Form Modal */}
      {(showShopForm || editingShop) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {shop ? 'تعديل المتجر' : 'إنشاء متجر جديد'}
              </h3>
              
              <form onSubmit={handleShopSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المتجر *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الواتساب *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="218912345678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف المتجر *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رابط المتجر
                  </label>
                  <input
                    type="text"
                    value={formData.shopUrlSlug}
                    onChange={(e) => setFormData(prev => ({ ...prev, shopUrlSlug: e.target.value }))}
                    placeholder={generateSlug(formData.shopName)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    سيكون رابط متجرك: /shop/{formData.shopUrlSlug || generateSlug(formData.shopName)}
                  </p>
                </div>

                {/* Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شعار المتجر
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.logoUrl ? (
                        <div className="relative">
                          <img
                            src={formData.logoUrl}
                            alt="Logo"
                            className="w-20 h-20 object-cover rounded-full mx-auto mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                            className="text-red-600 text-sm"
                          >
                            إزالة
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                          >
                            اختر صورة الشعار
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      بانر المتجر
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {formData.bannerUrl ? (
                        <div className="relative">
                          <img
                            src={formData.bannerUrl}
                            alt="Banner"
                            className="w-full h-20 object-cover rounded-lg mx-auto mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bannerUrl: '' }))}
                            className="text-red-600 text-sm"
                          >
                            إزالة
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
                            className="cursor-pointer text-blue-600 hover:text-blue-800"
                          >
                            اختر صورة البانر
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">معلومات العمل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان
                      </label>
                      <input
                        type="text"
                        value={formData.businessInfo.address}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          businessInfo: { ...prev.businessInfo, address: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="text"
                        value={formData.businessInfo.phone}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          businessInfo: { ...prev.businessInfo, phone: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={formData.businessInfo.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          businessInfo: { ...prev.businessInfo, email: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ساعات العمل
                      </label>
                      <input
                        type="text"
                        value={formData.businessInfo.workingHours}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          businessInfo: { ...prev.businessInfo, workingHours: e.target.value }
                        }))}
                        placeholder="9:00 ص - 10:00 م"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">وسائل التواصل الاجتماعي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فيسبوك
                      </label>
                      <input
                        type="url"
                        value={formData.socialMedia.facebook}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                        }))}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        إنستغرام
                      </label>
                      <input
                        type="url"
                        value={formData.socialMedia.instagram}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                        }))}
                        placeholder="https://instagram.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تويتر
                      </label>
                      <input
                        type="url"
                        value={formData.socialMedia.twitter}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                        }))}
                        placeholder="https://twitter.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        يوتيوب
                      </label>
                      <input
                        type="url"
                        value={formData.socialMedia.youtube}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, youtube: e.target.value }
                        }))}
                        placeholder="https://youtube.com/yourchannel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowShopForm(false);
                      setEditingShop(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : (shop ? 'تحديث المتجر' : 'إنشاء المتجر')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h3>
              
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    required
                    value={productFormData.productName}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, productName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر (د.ل) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <select
                    required
                    value={productFormData.category}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الفئة</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {i18n.language === 'ar' ? category.nameAr : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف المنتج
                  </label>
                  <textarea
                    rows={3}
                    value={productFormData.description}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    صورة المنتج *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {productFormData.imageUrl ? (
                      <div className="relative">
                        <img
                          src={productFormData.imageUrl}
                          alt="Product"
                          className="w-full h-32 object-cover rounded-lg mx-auto mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => setProductFormData(prev => ({ ...prev, imageUrl: '' }))}
                          className="text-red-600 text-sm"
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
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
                          className="cursor-pointer text-blue-600 hover:text-blue-800"
                        >
                          اختر صورة المنتج
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                      setProductFormData({
                        productName: '',
                        description: '',
                        price: '',
                        imageUrl: '',
                        category: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploading || !productFormData.imageUrl}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : (editingProduct ? 'تحديث المنتج' : 'إضافة المنتج')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;