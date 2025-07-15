import React from 'react';
import { MapPin, Globe, Navigation } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

interface LocationDisplayProps {
  location: LocationData | null;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ location }) => {
  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const getTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Navigation className="w-5 h-5 text-blue-400" />
        <span>Location</span>
      </h3>
      
      {location ? (
        <div className="space-y-4">
          {/* City and Country */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {location.city}
            </div>
            <div className="text-white/80 text-lg">
              {location.country}
            </div>
          </div>

          {/* Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80">Latitude</span>
              </div>
              <span className="font-mono text-sm font-medium text-white">
                {formatCoordinate(location.lat)}°
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/80">Longitude</span>
              </div>
              <span className="font-mono text-sm font-medium text-white">
                {formatCoordinate(location.lng)}°
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-3 border-t border-white/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-white/60" />
                <span className="text-xs text-white/80">Timezone</span>
              </div>
              <span className="text-xs text-white/80">
                {getTimezone()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Local Time</span>
              <span className="text-xs text-white/80">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* GPS Status */}
          <div className="flex items-center space-x-2 pt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">GPS Location Active</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 text-sm mb-2">Getting your location...</p>
          <p className="text-white/60 text-xs">
            Please allow location access for weather data
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;