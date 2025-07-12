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
  ShoppingBag,
  Star,
  StarOff,
  Image as ImageIcon,
  Save,
  X,
  Calendar,
  Package,
  Users,
  TrendingUp
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
  rating: number;
  reviewCount: number;
  createdAt: any;
}

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

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, userData } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateShop, setShowCreateShop] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [shopForm, setShopForm] = useState({
    shopName: '',
    description: '',
    whatsappNumber: '',
    logoUrl: '',
    bannerUrl: '',
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    address: '',
    phone: '',
    email: '',
    workingHours: ''
  });

  const [productForm, setProductForm] = useState({
    productName: '',
    description: '',
    price: '',
    category: 'clothing',
    imageUrl: ''
  });

  const isAdmin = user?.email === 'dukkani2026@gmail.com';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
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
      } else {
        // Regular user: Fetch their shop and products
        const shopQuery = query(collection(db, 'shops'), where('ownerId', '==', user!.uid));
        const shopSnapshot = await getDocs(shopQuery);
        
        if (!shopSnapshot.empty) {
          const shopData = shopSnapshot.docs[0].data() as Shop;
          const shopWithId = { ...shopData, id: shopSnapshot.docs[0].id };
          setShop(shopWithId);

          const productsQuery = query(
            collection(db, 'products'), 
            where('shopId', '==', shopWithId.id)
          );
          const productsSnapshot = await getDocs(productsQuery);
          let productsData = productsSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as Product[];
          
          // Sort client-side to avoid composite index requirement
          productsData = productsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });
          
          setProducts(productsData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', t('dashboard.error.shop.create'));
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
    setLoading(true);

    try {
      const shopUrlSlug = shopForm.shopName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await addDoc(collection(db, 'shops'), {
        ownerId: user!.uid,
        shopName: shopForm.shopName,
        description: shopForm.description,
        whatsappNumber: shopForm.whatsappNumber,
        logoUrl: shopForm.logoUrl,
        bannerUrl: shopForm.bannerUrl,
        socialMedia: {
          facebook: shopForm.facebook,
          instagram: shopForm.instagram,
          twitter: shopForm.twitter,
          tiktok: shopForm.tiktok,
          youtube: shopForm.youtube
        },
        businessInfo: {
          address: shopForm.address,
          phone: shopForm.phone,
          email: shopForm.email,
          workingHours: shopForm.workingHours
        },
        shopUrlSlug,
        createdAt: serverTimestamp()
      });

      showMessage('success', t('dashboard.shop.created'));
      setShowCreateShop(false);
      setShopForm({ 
        shopName: '', 
        description: '', 
        whatsappNumber: '',
        logoUrl: '',
        bannerUrl: '',
        facebook: '',
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        address: '',
        phone: '',
        email: '',
        workingHours: ''
      });
      await fetchData();
    } catch (error) {
      console.error('Error creating shop:', error);
      showMessage('error', t('dashboard.error.shop.create'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'shops', shop.id), {
        shopName: shopForm.shopName,
        description: shopForm.description,
        whatsappNumber: shopForm.whatsappNumber,
        logoUrl: shopForm.logoUrl,
        bannerUrl: shopForm.bannerUrl,
        socialMedia: {
          facebook: shopForm.facebook,
          instagram: shopForm.instagram,
          twitter: shopForm.twitter,
          tiktok: shopForm.tiktok,
          youtube: shopForm.youtube
        },
        businessInfo: {
          address: shopForm.address,
          phone: shopForm.phone,
          email: shopForm.email,
          workingHours: shopForm.workingHours
        }
      });

      showMessage('success', t('dashboard.shop.updated'));
      setShowEditShop(false);
      await fetchData();
    } catch (error) {
      console.error('Error updating shop:', error);
      showMessage('error', t('dashboard.error.shop.update'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const imageUrl = await uploadImageToUploadio(file);
      setProductForm(prev => ({ ...prev, imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', t('dashboard.error.image.upload'));
    } finally {
      setImageUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const imageUrl = await uploadImageToUploadio(file);
      setShopForm(prev => ({ ...prev, logoUrl: imageUrl }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', t('dashboard.error.image.upload'));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const imageUrl = await uploadImageToUploadio(file);
      setShopForm(prev => ({ ...prev, bannerUrl: imageUrl }));
    } catch (error) {
      console.error('Error uploading banner:', error);
      showMessage('error', t('dashboard.error.image.upload'));
    } finally {
      setBannerUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop && !isAdmin) return;

    setLoading(true);
    try {
      const productData = {
        shopId: isAdmin ? (editingProduct?.shopId || '') : shop!.id,
        productName: productForm.productName,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        imageUrl: productForm.imageUrl,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        showMessage('success', t('dashboard.product.updated'));
      } else {
        await addDoc(collection(db, 'products'), productData);
        showMessage('success', t('dashboard.product.added'));
      }

      setShowAddProduct(false);
      setEditingProduct(null);
      setProductForm({ productName: '', description: '', price: '', category: 'clothing', imageUrl: '' });
      await fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      showMessage('error', editingProduct ? t('dashboard.error.product.update') : t('dashboard.error.product.add'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(isAdmin ? t('dashboard.confirm.delete.admin') : t('dashboard.confirm.delete'))) return;

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
      const productsQuery = query(collection(db, 'products'), where('shopId', '==', shopId));
      const productsSnapshot = await getDocs(productsQuery);
      
      for (const productDoc of productsSnapshot.docs) {
        await deleteDoc(doc(db, 'products', productDoc.id));
      }

      // Then delete the shop
      await deleteDoc(doc(db, 'shops', shopId));
      showMessage('success', 'تم حذف المتجر بنجاح');
      await fetchData();
    } catch (error) {
      console.error('Error deleting shop:', error);
      showMessage('error', 'فشل في حذف المتجر');
    }
  };

  const copyShopLink = () => {
    if (!shop) return;
    const link = `${window.location.origin}/shop/${shop.shopUrlSlug}`;
    navigator.clipboard.writeText(link);
    showMessage('success', t('dashboard.link.copied'));
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      productName: product.productName,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl
    });
    setShowAddProduct(true);
  };

  const openEditShop = () => {
    if (!shop) return;
    setShopForm({
      shopName: shop.shopName,
      description: shop.description,
      whatsappNumber: shop.whatsappNumber,
      logoUrl: shop.logoUrl || '',
      bannerUrl: shop.bannerUrl || '',
      facebook: shop.socialMedia?.facebook || '',
      instagram: shop.socialMedia?.instagram || '',
      twitter: shop.socialMedia?.twitter || '',
      tiktok: shop.socialMedia?.tiktok || '',
      youtube: shop.socialMedia?.youtube || '',
      address: shop.businessInfo?.address || '',
      phone: shop.businessInfo?.phone || '',
      email: shop.businessInfo?.email || '',
      workingHours: shop.businessInfo?.workingHours || ''
    });
    setShowEditShop(true);
  };

  const renderStars = (rating: number, reviewCount: number) => {
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
          {reviewCount > 0 
            ? `(${reviewCount} ${i18n.language === 'ar' ? 'تقييم' : 'reviews'})`
            : i18n.language === 'ar' ? 'لا توجد تقييمات' : 'No ratings'
          }
        </span>
      </div>
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? (i18n.language === 'ar' ? category.nameAr : category.nameEn) : categoryId;
  };

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
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {isAdmin ? (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Store className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي المتاجر</p>
                    <p className="text-2xl font-semibold text-gray-900">{allShops.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                    <p className="text-2xl font-semibold text-gray-900">{allProducts.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">المتاجر النشطة</p>
                    <p className="text-2xl font-semibold text-gray-900">{allShops.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">متوسط التقييم</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {allProducts.length > 0 
                        ? (allProducts.reduce((sum, p) => sum + p.rating, 0) / allProducts.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Shops */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.all.shops')}</h2>
              </div>
              <div className="p-6">
                {allShops.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allShops.map((shopItem) => (
                      <div key={shopItem.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">{shopItem.shopName}</h3>
                          <button
                            onClick={() => handleDeleteShop(shopItem.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{shopItem.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>المنتجات: {allProducts.filter(p => p.shopId === shopItem.id).length}</span>
                          <a
                            href={`/shop/${shopItem.shopUrlSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد متاجر</p>
                )}
              </div>
            </div>

            {/* All Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.all.products')}</h2>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
                >
                  <Plus size={20} />
                  <span>إضافة منتج (مدير)</span>
                </button>
              </div>
              <div className="p-6">
                {allProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allProducts.map((product) => {
                      const productShop = allShops.find(s => s.id === product.shopId);
                      return (
                        <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
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
                              <div className="flex space-x-2 space-x-reverse">
                                <button
                                  onClick={() => openEditProduct(product)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{product.productName}</h3>
                            {product.description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                            )}
                            <div className="mb-2">
                              {renderStars(product.rating, product.reviewCount)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-blue-600">
                                {product.price} {t('currency')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {productShop?.shopName}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">لا توجد منتجات</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Regular User Dashboard */
          <div className="space-y-8">
            {/* Shop Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.my.shop')}</h2>
              </div>
              <div className="p-6">
                {shop ? (
                  <div className="space-y-4">
                    {/* Shop Banner */}
                    {shop.bannerUrl && (
                      <div className="relative h-32 rounded-lg overflow-hidden mb-4">
                        <img
                          src={shop.bannerUrl}
                          alt="Shop Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          {shop.logoUrl && (
                            <img
                              src={shop.logoUrl}
                              alt="Shop Logo"
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">{shop.shopName}</h3>
                        </div>
                        <p className="text-gray-600">{shop.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t('dashboard.shop.whatsapp')}: {shop.whatsappNumber}
                        </p>
                        {shop.businessInfo?.address && (
                          <p className="text-sm text-gray-500">
                            العنوان: {shop.businessInfo.address}
                          </p>
                        )}
                        {shop.businessInfo?.workingHours && (
                          <p className="text-sm text-gray-500">
                            ساعات العمل: {shop.businessInfo.workingHours}
                          </p>
                        )}
                        
                        {/* Social Media Links */}
                        {(shop.socialMedia?.facebook || shop.socialMedia?.instagram || shop.socialMedia?.twitter || shop.socialMedia?.tiktok || shop.socialMedia?.youtube) && (
                          <div className="flex items-center space-x-3 space-x-reverse mt-3">
                            {shop.socialMedia.facebook && (
                              <a
                                href={shop.socialMedia.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              </a>
                            )}
                            {shop.socialMedia.instagram && (
                              <a
                                href={shop.socialMedia.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-600 hover:text-pink-800"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/>
                                </svg>
                              </a>
                            )}
                            {shop.socialMedia.twitter && (
                              <a
                                href={shop.socialMedia.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-600"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                              </a>
                            )}
                            {shop.socialMedia.tiktok && (
                              <a
                                href={shop.socialMedia.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black hover:text-gray-700"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                              </a>
                            )}
                            {shop.socialMedia.youtube && (
                              <a
                                href={shop.socialMedia.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={openEditShop}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
                        >
                          <Edit size={16} />
                          <span>{t('dashboard.edit')}</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-4 space-x-reverse">
                      <button
                        onClick={copyShopLink}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 space-x-reverse"
                      >
                        <Copy size={16} />
                        <span>{t('dashboard.shop.copy')}</span>
                      </button>
                      <a
                        href={`/shop/${shop.shopUrlSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 space-x-reverse"
                      >
                        <ExternalLink size={16} />
                        <span>{t('dashboard.shop.view')}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('dashboard.no.shop')}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {t('dashboard.no.shop.desc')}
                    </p>
                    <button
                      onClick={() => setShowCreateShop(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse mx-auto"
                    >
                      <Plus size={20} />
                      <span>{t('dashboard.create.shop')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Products Section */}
            {shop && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.products')}</h2>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
                  >
                    <Plus size={20} />
                    <span>{t('dashboard.add.product')}</span>
                  </button>
                </div>
                <div className="p-6">
                  {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
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
                              <div className="flex space-x-2 space-x-reverse">
                                <button
                                  onClick={() => openEditProduct(product)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{product.productName}</h3>
                            {product.description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                            )}
                            <div className="mb-2">
                              {renderStars(product.rating, product.reviewCount)}
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {product.price} {t('currency')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('dashboard.no.products')}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {t('dashboard.no.products.desc')}
                      </p>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse mx-auto"
                      >
                        <Plus size={20} />
                        <span>{t('dashboard.add.product')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Shop Modal */}
        {showCreateShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('dashboard.create.shop')}
                </h3>
                <button
                  onClick={() => setShowCreateShop(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateShop} className="space-y-4">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">المعلومات الأساسية</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.name')}
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
                        {t('dashboard.shop.whatsapp')}
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
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.shop.description')}
                    </label>
                    <textarea
                      required
                      value={shopForm.description}
                      onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder={t('dashboard.shop.description.placeholder')}
                    />
                  </div>
                </div>

                {/* Branding */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">العلامة التجارية</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شعار المتجر
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {logoUploading && (
                        <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">جاري رفع الشعار...</span>
                        </div>
                      )}
                      {shopForm.logoUrl && (
                        <div className="mt-2">
                          <img
                            src={shopForm.logoUrl}
                            alt="Logo preview"
                            className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        بانر المتجر
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {bannerUploading && (
                        <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">جاري رفع البانر...</span>
                        </div>
                      )}
                      {shopForm.bannerUrl && (
                        <div className="mt-2">
                          <img
                            src={shopForm.bannerUrl}
                            alt="Banner preview"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">وسائل التواصل الاجتماعي</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فيسبوك
                      </label>
                      <input
                        type="url"
                        value={shopForm.facebook}
                        onChange={(e) => setShopForm(prev => ({ ...prev, facebook: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        إنستغرام
                      </label>
                      <input
                        type="url"
                        value={shopForm.instagram}
                        onChange={(e) => setShopForm(prev => ({ ...prev, instagram: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تويتر
                      </label>
                      <input
                        type="url"
                        value={shopForm.twitter}
                        onChange={(e) => setShopForm(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تيك توك
                      </label>
                      <input
                        type="url"
                        value={shopForm.tiktok}
                        onChange={(e) => setShopForm(prev => ({ ...prev, tiktok: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://tiktok.com/@yourpage"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        يوتيوب
                      </label>
                      <input
                        type="url"
                        value={shopForm.youtube}
                        onChange={(e) => setShopForm(prev => ({ ...prev, youtube: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">معلومات العمل</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان
                      </label>
                      <input
                        type="text"
                        value={shopForm.address}
                        onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="عنوان المتجر"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={shopForm.phone}
                        onChange={(e) => setShopForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="رقم هاتف إضافي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={shopForm.email}
                        onChange={(e) => setShopForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ساعات العمل
                      </label>
                      <input
                        type="text"
                        value={shopForm.workingHours}
                        onChange={(e) => setShopForm(prev => ({ ...prev, workingHours: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: 9 صباحاً - 10 مساءً"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateShop(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('dashboard.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || logoUploading || bannerUploading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? t('dashboard.saving') : t('dashboard.shop.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Shop Modal */}
        {showEditShop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('dashboard.shop.edit')}
                </h3>
                <button
                  onClick={() => setShowEditShop(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleUpdateShop} className="space-y-4">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">المعلومات الأساسية</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('dashboard.shop.name')}
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
                        {t('dashboard.shop.whatsapp')}
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
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('dashboard.shop.description')}
                    </label>
                    <textarea
                      required
                      value={shopForm.description}
                      onChange={(e) => setShopForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Branding */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">العلامة التجارية</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        شعار المتجر
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {logoUploading && (
                        <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">جاري رفع الشعار...</span>
                        </div>
                      )}
                      {shopForm.logoUrl && (
                        <div className="mt-2">
                          <img
                            src={shopForm.logoUrl}
                            alt="Logo preview"
                            className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Banner Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        بانر المتجر
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {bannerUploading && (
                        <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">جاري رفع البانر...</span>
                        </div>
                      )}
                      {shopForm.bannerUrl && (
                        <div className="mt-2">
                          <img
                            src={shopForm.bannerUrl}
                            alt="Banner preview"
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">وسائل التواصل الاجتماعي</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        فيسبوك
                      </label>
                      <input
                        type="url"
                        value={shopForm.facebook}
                        onChange={(e) => setShopForm(prev => ({ ...prev, facebook: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        إنستغرام
                      </label>
                      <input
                        type="url"
                        value={shopForm.instagram}
                        onChange={(e) => setShopForm(prev => ({ ...prev, instagram: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://instagram.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تويتر
                      </label>
                      <input
                        type="url"
                        value={shopForm.twitter}
                        onChange={(e) => setShopForm(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تيك توك
                      </label>
                      <input
                        type="url"
                        value={shopForm.tiktok}
                        onChange={(e) => setShopForm(prev => ({ ...prev, tiktok: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://tiktok.com/@yourpage"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        يوتيوب
                      </label>
                      <input
                        type="url"
                        value={shopForm.youtube}
                        onChange={(e) => setShopForm(prev => ({ ...prev, youtube: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/c/yourchannel"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">معلومات العمل</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان
                      </label>
                      <input
                        type="text"
                        value={shopForm.address}
                        onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="عنوان المتجر"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={shopForm.phone}
                        onChange={(e) => setShopForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="رقم هاتف إضافي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={shopForm.email}
                        onChange={(e) => setShopForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ساعات العمل
                      </label>
                      <input
                        type="text"
                        value={shopForm.workingHours}
                        onChange={(e) => setShopForm(prev => ({ ...prev, workingHours: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="مثال: 9 صباحاً - 10 مساءً"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditShop(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('dashboard.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || logoUploading || bannerUploading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? t('dashboard.saving') : t('dashboard.shop.update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? t('dashboard.edit') + ' ' + t('dashboard.products') : t('dashboard.add.product')}
                </h3>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    setProductForm({ productName: '', description: '', price: '', category: 'clothing', imageUrl: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.product.name')}
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
                    {t('dashboard.product.description')}
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder={t('dashboard.product.description.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.product.category')}
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {i18n.language === 'ar' ? category.nameAr : category.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.product.price')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('dashboard.product.price.placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.product.image')}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {imageUploading && (
                      <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">جاري رفع الصورة...</span>
                      </div>
                    )}
                    {productForm.imageUrl && (
                      <div className="relative">
                        <img
                          src={productForm.imageUrl}
                          alt="Product preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setProductForm(prev => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-4 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false);
                      setEditingProduct(null);
                      setProductForm({ productName: '', description: '', price: '', category: 'clothing', imageUrl: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('dashboard.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || imageUploading || !productForm.imageUrl}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <Save size={16} />
                    <span>{loading ? t('dashboard.saving') : t('dashboard.save')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;