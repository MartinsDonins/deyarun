import React, { useCallback, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ 
  children, 
  className = "w-full h-full" 
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800 text-gray-400 rounded-lg`}>
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
          <p className="text-sm">Google Maps API key nav konfigurēts</p>
          <p className="text-xs text-gray-500 mt-1">Pievienojiet API key .env.local failā</p>
        </div>
      </div>
    );
  }

  const render = useCallback((status: string) => {
    switch (status) {
      case 'LOADING':
        return (
          <div className={`${className} flex items-center justify-center bg-gray-800 rounded-lg`}>
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral mb-4"></div>
              <p className="text-gray-400 text-sm">Ielādē kartes...</p>
            </div>
          </div>
        );
      case 'FAILURE':
        return (
          <div className={`${className} flex items-center justify-center bg-gray-800 text-gray-400 rounded-lg`}>
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-400">Error ielādējot kartes</p>
              <p className="text-xs text-gray-500 mt-1">Pārbaudiet API key un interneta savienojumu</p>
            </div>
          </div>
        );
      default:
        return <>{children}</>;
    }
  }, [children, className]);

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={['geometry', 'drawing']}
      language="lv"
      region="LV"
    >
      {children}
    </Wrapper>
  );
};

export default GoogleMapsWrapper;