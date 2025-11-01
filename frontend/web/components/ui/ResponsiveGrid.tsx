import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  autoFit?: boolean;
  minItemWidth?: string;
}

export default function ResponsiveGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '',
  autoFit = false,
  minItemWidth = '280px'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  if (autoFit) {
    return (
      <div 
        className={`grid ${gapClasses[gap]} ${className}`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
        }}
      >
        {children}
      </div>
    );
  }

  const gridClasses = `
    grid
    ${columns.sm ? `grid-cols-${columns.sm}` : 'grid-cols-1'}
    ${columns.md ? `md:grid-cols-${columns.md}` : ''}
    ${columns.lg ? `lg:grid-cols-${columns.lg}` : ''}
    ${columns.xl ? `xl:grid-cols-${columns.xl}` : ''}
    ${gapClasses[gap]}
    ${className}
  `.trim();

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}