import React from 'react';
import { useThemeClasses } from '../../contexts/ThemeContext';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
}

export default function ResponsiveCard({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  title,
  subtitle
}: ResponsiveCardProps) {
  const themeClasses = useThemeClasses();

  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const cardClasses = `
    ${themeClasses.card}
    ${paddingClasses[padding]}
    ${hover ? 'hover-lift cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      {(title || subtitle) && (
        <div className="mb-4 sm:mb-6">
          {title && (
            <h3 className={`text-lg sm:text-xl font-semibold ${themeClasses.textPrimary} mb-2`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`text-sm sm:text-base ${themeClasses.textSecondary}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}