import React from 'react';
import { Clock, Route, Zap, TrendingUp } from 'lucide-react';

interface RouteData {
  positions: any[];
  distance: number;
  duration: number;
  avgSpeed: number;
}

interface RouteStatsProps {
  routeStats: RouteData;
  isTracking: boolean;
}

const RouteStats: React.FC<RouteStatsProps> = ({ routeStats, isTracking }) => {
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (mps: number) => {
    const kmh = mps * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  };

  const calculatePace = (distance: number, duration: number) => {
    if (distance === 0) return '0:00/km';
    const paceSecondsPerKm = (duration * 1000) / distance;
    const minutes = Math.floor(paceSecondsPerKm / 60);
    const seconds = Math.floor(paceSecondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Distance */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Route className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Distance</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatDistance(routeStats.distance)}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Duration</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatDuration(routeStats.duration)}
          </div>
        </div>

        {/* Average Speed */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Avg Speed</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {formatSpeed(routeStats.avgSpeed)}
          </div>
        </div>

        {/* Pace */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Pace</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {calculatePace(routeStats.distance, routeStats.duration)}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Points Tracked:</span>
          <span className="font-medium text-gray-900">{routeStats.positions.length}</span>
        </div>
        {isTracking && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Live Tracking Active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteStats;