import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Filter } from 'lucide-react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onFilterChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rating';
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFilterChange,
  placeholder,
  showFilters = false,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const clearFilters = () => {
    setFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
          placeholder={placeholder || (i18n.language === 'ar' ? 'ابحث عن المنتجات...' : 'Search for products...')}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 transition-colors ${
                showFilterPanel || Object.keys(filters).length > 0
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">
              {i18n.language === 'ar' ? 'تصفية النتائج' : 'Filter Results'}
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {i18n.language === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'ar' ? 'الفئة' : 'Category'}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">{i18n.language === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                <option value="clothing">{i18n.language === 'ar' ? 'ملابس' : 'Clothing'}</option>
                <option value="jewelry">{i18n.language === 'ar' ? 'مجوهرات' : 'Jewelry'}</option>
                <option value="electronics">{i18n.language === 'ar' ? 'إلكترونيات' : 'Electronics'}</option>
                <option value="home">{i18n.language === 'ar' ? 'منزل وحديقة' : 'Home & Garden'}</option>
                <option value="beauty">{i18n.language === 'ar' ? 'جمال وعناية' : 'Beauty & Care'}</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'ar' ? 'نطاق السعر' : 'Price Range'}
              </label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="number"
                  placeholder={i18n.language === 'ar' ? 'من' : 'Min'}
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => handleFilterChange({
                    priceRange: {
                      ...filters.priceRange,
                      min: parseInt(e.target.value) || 0,
                      max: filters.priceRange?.max || 999999
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  placeholder={i18n.language === 'ar' ? 'إلى' : 'Max'}
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => handleFilterChange({
                    priceRange: {
                      min: filters.priceRange?.min || 0,
                      max: parseInt(e.target.value) || 999999
                    }
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'ar' ? 'ترتيب حسب' : 'Sort By'}
              </label>
              <select
                value={filters.sortBy || ''}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">{i18n.language === 'ar' ? 'افتراضي' : 'Default'}</option>
                <option value="newest">{i18n.language === 'ar' ? 'الأحدث' : 'Newest'}</option>
                <option value="oldest">{i18n.language === 'ar' ? 'الأقدم' : 'Oldest'}</option>
                <option value="price_low">{i18n.language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price_high">{i18n.language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="rating">{i18n.language === 'ar' ? 'التقييم' : 'Rating'}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;