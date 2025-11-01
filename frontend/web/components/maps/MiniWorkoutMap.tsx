import React, { useEffect, useRef } from 'react';
import GoogleMapsWrapper from './GoogleMapsWrapper';
import { RoutePoint } from '../../types/workout';

interface MiniWorkoutMapProps {
  route: RoutePoint[];
  workoutType?: 'running' | 'walking' | 'cycling';
  className?: string;
  interactive?: boolean;
}

const MiniWorkoutMap: React.FC<MiniWorkoutMapProps> = ({
  route,
  workoutType = 'running',
  className = "w-full h-32",
  interactive = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const getWorkoutColor = () => {
    switch (workoutType) {
      case 'running':
        return '#FF6B6B';
      case 'walking':
        return '#4ECDC4';
      case 'cycling':
        return '#45B7D1';
      default:
        return '#FF6B6B';
    }
  };

  useEffect(() => {
    if (mapRef.current && route.length > 0) {
      const map = new google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: route[0].latitude, lng: route[0].longitude },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: !interactive,
        gestureHandling: interactive ? 'auto' : 'none',
        zoomControl: interactive,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{"color": "#212121"}]
          },
          {
            "elementType": "labels.icon",
            "stylers": [{"visibility": "off"}]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#757575"}]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#212121"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#2c2c2c"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#000000"}]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Convert route to Google Maps LatLng format
      const path = route.map(point => ({
        lat: point.latitude,
        lng: point.longitude
      }));

      // Create polyline
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: getWorkoutColor(),
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });

      polyline.setMap(map);

      // Fit bounds to show entire route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
    }
  }, [route, workoutType, interactive]);

  if (!route || route.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800 text-gray-500 rounded border border-gray-700`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${className} rounded overflow-hidden border border-gray-700`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

const MiniWorkoutMapWithWrapper: React.FC<MiniWorkoutMapProps> = (props) => {
  return (
    <GoogleMapsWrapper className={props.className}>
      <MiniWorkoutMap {...props} />
    </GoogleMapsWrapper>
  );
};

export default MiniWorkoutMapWithWrapper;