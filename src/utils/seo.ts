// SEO Utilities
export const updatePageTitle = (title: string, shopName?: string) => {
  const baseTitle = 'دكاني - Dukkani';
  let fullTitle = title;
  
  if (shopName) {
    fullTitle = `${title} - ${shopName}`;
  }
  
  document.title = `${fullTitle} | ${baseTitle}`;
};

export const updateMetaDescription = (description: string) => {
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
};

export const updateCanonicalUrl = (url: string) => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
};

export const generateStructuredData = (type: 'Organization' | 'LocalBusiness' | 'Product', data: any) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };
  
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(structuredData);
};