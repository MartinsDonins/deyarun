import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '../lib/productionLogger'

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values during SSR or hydration mismatch
    return {
      theme: 'dark' as const,
      setTheme: () => {},
      toggleTheme: () => {}
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on client side
  useEffect(() => {
    setMounted(true);
    
    // Only access localStorage and window.matchMedia on client side
    if (typeof window !== 'undefined') {
      // First check localStorage
      const savedTheme = localStorage.getItem('runacademy-theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
      
      // Try to load user's saved theme preference from API if logged in
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(res => {
          if (!res.ok) {
            // Silently ignore auth errors (401/403) to avoid console noise
            if (res.status === 401 || res.status === 403) {
              return null;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.theme && (data.theme === 'light' || data.theme === 'dark')) {
            setTheme(data.theme);
            localStorage.setItem('runacademy-theme', data.theme);
          }
        })
        .catch(err => {
          // Only log non-auth errors
          if (err && !err.message?.includes('401') && !err.message?.includes('403')) {
            logger.info('COMPONENT', 'Could not load user theme preference:', { err });
          }
        });
      }
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('runacademy-theme', theme);
      
      // Update document class for global theme
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }

      // Save theme to backend if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/theme`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme })
        })
        .then(res => {
          // Silently ignore auth errors to avoid console noise
          if (res.status === 401 || res.status === 403) {
            return;
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
        })
        .catch(err => {
          // Only log non-auth errors
          if (err && !err.message?.includes('401') && !err.message?.includes('403')) {
            logger.info('COMPONENT', 'Could not save theme preference:', { err });
          }
        });
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className={`${mounted ? theme : 'dark'} min-h-screen transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// CSS custom properties for themes
export const themeConfig = {
  light: {
    // Background colors - softer, warmer tones
    'bg-primary': '#fafaf9',
    'bg-secondary': '#f5f5f4',
    'bg-surface': '#ffffff',
    'bg-card': '#f8fafc',
    'bg-hover': '#f1f5f9',
    
    // Text colors - more readable contrast
    'text-primary': '#27272a',
    'text-secondary': '#52525b',
    'text-muted': '#71717a',
    'text-accent': '#ea580c',
    
    // Border colors - subtle and soft
    'border-primary': '#e4e4e7',
    'border-secondary': '#d4d4d8',
    
    // Status colors remain same
    'color-success': '#10b981',
    'color-warning': '#f59e0b',
    'color-error': '#ef4444',
    'color-info': '#3b82f6',
  },
  dark: {
    // Background colors
    'bg-primary': '#0f172a',
    'bg-secondary': '#1e293b',
    'bg-surface': '#334155',
    'bg-card': '#475569',
    'bg-hover': '#1e293b',
    
    // Text colors
    'text-primary': '#f8fafc',
    'text-secondary': '#cbd5e1',
    'text-muted': '#94a3b8',
    'text-accent': '#f59e0b',
    
    // Border colors
    'border-primary': '#475569',
    'border-secondary': '#64748b',
    
    // Status colors remain same
    'color-success': '#10b981',
    'color-warning': '#f59e0b',
    'color-error': '#ef4444',
    'color-info': '#3b82f6',
  }
};

// Hook to get theme-aware CSS classes
export const useThemeClasses = () => {
  const { theme } = useTheme();
  
  return {
    // Background classes - softer light mode
    bgPrimary: theme === 'dark' ? 'bg-gray-900' : 'bg-stone-50',
    bgSecondary: theme === 'dark' ? 'bg-gray-800' : 'bg-stone-100',
    bgSurface: theme === 'dark' ? 'bg-gray-700' : 'bg-white',
    bgCard: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
    bgHover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-stone-50',
    
    // Text classes - better contrast for light mode
    textPrimary: theme === 'dark' ? 'text-gray-100' : 'text-zinc-800',
    textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-zinc-600',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-zinc-500',
    textAccent: 'text-coral',
    
    // Border classes - softer borders for light mode
    borderPrimary: theme === 'dark' ? 'border-gray-700' : 'border-zinc-200',
    borderSecondary: theme === 'dark' ? 'border-gray-600' : 'border-zinc-300',
    
    // Component classes - improved light mode
    card: theme === 'dark' 
      ? 'bg-gray-800 border border-gray-700 shadow-lg' 
      : 'bg-white border border-zinc-200 shadow-sm',
    
    input: theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-coral focus:ring-coral'
      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-500 focus:border-coral focus:ring-coral',
    
    button: theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600'
      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300',
    
    buttonPrimary: 'bg-coral hover:bg-orange-600 text-white border-coral',
    
    modal: theme === 'dark'
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-zinc-200',
  };
};