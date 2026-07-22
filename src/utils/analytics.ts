// Analytics Utilities (Ready for Google Analytics integration)
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  // Google Analytics 4 event tracking
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, parameters);
  }
  
  // Console log for development
  if (import.meta.env.DEV) {
    console.log('Analytics Event:', eventName, parameters);
  }
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: pagePath,
      page_title: pageTitle
    });
  }
};

export const trackPurchase = (transactionId: string, value: number, currency: string = 'LYD') => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency
  });
};

export const trackShopCreation = (shopId: string) => {
  trackEvent('shop_created', {
    shop_id: shopId
  });
};

export const trackProductView = (productId: string, productName: string, shopId: string) => {
  trackEvent('view_item', {
    item_id: productId,
    item_name: productName,
    item_category: 'product',
    shop_id: shopId
  });
};

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount
  });
};