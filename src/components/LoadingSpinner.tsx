import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  text, 
  className = '',
  fullScreen = false 
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = fullScreen 
    ? 'flex flex-col items-center justify-center min-h-screen'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      <p className="mt-4 text-gray-600 text-center">
        {text || t('loading')}
      </p>
    </div>
  );
};

export default LoadingSpinner;