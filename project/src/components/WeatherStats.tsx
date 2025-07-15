import React from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, Gauge, Wind } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  condition: string;
  timestamp: number;
}

interface WeatherStatsProps {
  currentWeather: WeatherData | null;
  weatherHistory: WeatherData[];
}

const WeatherStats: React.FC<WeatherStatsProps> = ({ currentWeather, weatherHistory }) => {
  const calculateTrend = (current: number, history: WeatherData[], field: keyof WeatherData) => {
    if (history.length < 2) return 0;
    const previous = history[history.length - 2][field] as number;
    return current - previous;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.5) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend < -0.5) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatTrend = (trend: number, unit: string) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}${unit}`;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getVisibilityDescription = (visibility: number) => {
    if (visibility > 10) return 'Excellent';
    if (visibility > 5) return 'Good';
    if (visibility > 2) return 'Moderate';
    return 'Poor';
  };

  if (!currentWeather) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Weather Statistics</h3>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-white/80">Loading weather data...</p>
        </div>
      </div>
    );
  }

  const tempTrend = calculateTrend(currentWeather.temperature, weatherHistory, 'temperature');
  const humidityTrend = calculateTrend(currentWeather.humidity, weatherHistory, 'humidity');
  const pressureTrend = calculateTrend(currentWeather.pressure, weatherHistory, 'pressure');

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Weather Statistics</h3>
      
      <div className="space-y-4">
        {/* Temperature */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Temperature</span>
            <div className="flex items-center space-x-1">
              {getTrendIcon(tempTrend)}
              <span className="text-xs text-white/60">
                {formatTrend(tempTrend, '°C')}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {currentWeather.temperature.toFixed(1)}°C
          </div>
          <div className="text-xs text-white/60 mt-1">
            Feels like {(currentWeather.temperature + (currentWeather.humidity - 50) * 0.1).toFixed(1)}°C
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">Humidity</span>
            <div className="flex items-center space-x-1">
              {getTrendIcon(humidityTrend)}
              <span className="text-xs text-white/60">
                {formatTrend(humidityTrend, '%')}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {currentWeather.humidity.toFixed(0)}%
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentWeather.humidity}%` }}
            ></div>
          </div>
        </div>

        {/* Wind */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Wind className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-sm">Wind</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-white">
                {currentWeather.windSpeed.toFixed(1)} m/s
              </div>
              <div className="text-xs text-white/60">
                {getWindDirection(currentWeather.windDirection)} ({currentWeather.windDirection.toFixed(0)}°)
              </div>
            </div>
            <div className="w-8 h-8 border-2 border-white/40 rounded-full flex items-center justify-center">
              <div 
                className="w-1 h-3 bg-white rounded-full transform origin-bottom"
                style={{ 
                  transform: `rotate(${currentWeather.windDirection}deg)`,
                  transition: 'transform 0.5s ease'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-sm">Pressure</span>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(pressureTrend)}
              <span className="text-xs text-white/60">
                {formatTrend(pressureTrend, ' hPa')}
              </span>
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            {currentWeather.pressure.toFixed(0)} hPa
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-sm">Visibility</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">
              {currentWeather.visibility.toFixed(1)} km
            </div>
            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
              {getVisibilityDescription(currentWeather.visibility)}
            </span>
          </div>
        </div>

        {/* Data Points */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Data Points:</span>
            <span className="font-medium text-white">{weatherHistory.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-white/60">Last Update:</span>
            <span className="font-medium text-white">
              {new Date(currentWeather.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherStats;