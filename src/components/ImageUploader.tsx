import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => Promise<void>;
  currentImageUrl?: string;
  onImageRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  currentImageUrl,
  onImageRemove,
  accept = 'image/*',
  maxSize = 5,
  className = '',
  placeholder,
  aspectRatio = 'auto',
  disabled = false
}) => {
  const { t, i18n } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return i18n.language === 'ar' 
        ? 'يرجى اختيار ملف صورة صالح'
        : 'Please select a valid image file';
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return i18n.language === 'ar' 
        ? `حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`
        : `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      await onImageUpload(file);
    } catch (err) {
      setError(i18n.language === 'ar' ? 'فشل في رفع الصورة' : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    setError(null);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'landscape':
        return 'aspect-video';
      case 'portrait':
        return 'aspect-[3/4]';
      default:
        return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {currentImageUrl ? (
        <div className={`relative group ${getAspectRatioClass()}`}>
          <img
            src={currentImageUrl}
            alt="Uploaded"
            className="w-full h-full object-cover rounded-lg border border-gray-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={handleClick}
                disabled={disabled || uploading}
                className="bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <Upload size={16} className="inline mr-1" />
                {i18n.language === 'ar' ? 'تغيير' : 'Change'}
              </button>
              {onImageRemove && (
                <button
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <X size={16} className="inline mr-1" />
                  {i18n.language === 'ar' ? 'حذف' : 'Remove'}
                </button>
              )}
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${getAspectRatioClass()}
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">
                {i18n.language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {placeholder || (i18n.language === 'ar' 
                  ? 'اضغط لاختيار صورة أو اسحبها هنا'
                  : 'Click to select an image or drag it here'
                )}
              </p>
              <p className="text-sm text-gray-500">
                {i18n.language === 'ar' 
                  ? `الحد الأقصى: ${maxSize} ميجابايت`
                  : `Max size: ${maxSize}MB`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center space-x-2 space-x-reverse text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
};

export default ImageUploader;