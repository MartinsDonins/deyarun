import React, { useEffect, useRef, useState } from 'react';
import GoogleMapsWrapper from './GoogleMapsWrapper';

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: number;
  altitude?: number;
  speed?: number;
}

interface WorkoutMapProps {
  route?: RoutePoint[];
  workoutType?: 'running' | 'walking' | 'cycling';
  distance?: number;
  duration?: number;
  className?: string;
  showControls?: boolean;
}

const WorkoutMap: React.FC<WorkoutMapProps> = ({
  route = [],
  workoutType = 'running',
  distance,
  duration,
  className = "w-full h-96",
  showControls = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getWorkoutColor = () => {
    switch (workoutType) {
      case 'running':
        return '#FF6B6B'; // coral
      case 'walking':
        return '#4ECDC4'; // teal
      case 'cycling':
        return '#45B7D1'; // blue
      default:
        return '#FF6B6B';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      const map = new google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat: 56.9496, lng: 24.1052 }, // Riga default
        mapTypeId: google.maps.MapTypeId.ROADMAP,
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
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{"color": "#757575"}]
          },
          {
            "featureType": "administrative.country",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#9e9e9e"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#2c2c2c"}]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#8a8a8a"}]
          },
          {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{"color": "#373737"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{"color": "#3c3c3c"}]
          },
          {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{"color": "#2c2c2c"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#3d3d3d"}]
          }
        ]
      });

      mapInstanceRef.current = map;
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && route.length > 0) {
      // Clear existing polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

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
        strokeWeight: 4,
      });

      polyline.setMap(mapInstanceRef.current);
      polylineRef.current = polyline;

      // Fit bounds to show entire route
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);

      // Add start marker
      if (path.length > 0) {
        new google.maps.Marker({
          position: path[0],
          map: mapInstanceRef.current,
          title: 'Starta punkts',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4ECDC4',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          }
        });

        // Add end marker
        new google.maps.Marker({
          position: path[path.length - 1],
          map: mapInstanceRef.current,
          title: 'Finiša punkts',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF6B6B',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          }
        });
      }
    }
  }, [route, workoutType]);

  if (!route || route.length === 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-800 text-gray-400 rounded-lg border border-gray-700`}>
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Nav GPS datu</p>
          <p className="text-xs text-gray-500 mt-1">Šim treniņam nav pieejami maršruta dati</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`${className} rounded-lg overflow-hidden border border-gray-700`}>
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      {showControls && (distance || duration) && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-4 text-sm">
            {distance && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">{formatDistance(distance)}</span>
              </div>
            )}
            {duration && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{formatDuration(duration)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getWorkoutColor() }}
              />
              <span className="text-xs text-gray-300 capitalize">{workoutType}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkoutMapWithWrapper: React.FC<WorkoutMapProps> = (props) => {
  return (
    <GoogleMapsWrapper className={props.className}>
      <WorkoutMap {...props} />
    </GoogleMapsWrapper>
  );
};

export default WorkoutMapWithWrapper;