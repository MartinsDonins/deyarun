import React from 'react';

interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function ResponsiveButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  loading = false,
  className = '',
  icon,
  iconPosition = 'left'
}: ResponsiveButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-coral text-white hover:bg-orange-600 focus:ring-coral/30 shadow-lg hover:shadow-coral/25',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500/30 border border-gray-600',
    outline: 'border-2 border-coral text-coral hover:bg-coral hover:text-white focus:ring-coral/30',
    ghost: 'text-coral hover:bg-coral/10 focus:ring-coral/30'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm sm:px-4',
    md: 'px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base',
    lg: 'px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg'
  };

  const fullWidthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidthClass}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2" />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2 flex-shrink-0">
          {icon}
        </span>
      )}
      
      <span className="truncate">
        {children}
      </span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2 flex-shrink-0">
          {icon}
        </span>
      )}
    </button>
  );
}