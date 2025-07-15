import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cloud, Sun, CloudRain, Wind, Eye, Droplets, Thermometer, Gauge } from 'lucide-react';
import WeatherCanvas from './components/WeatherCanvas';
import WeatherStats from './components/WeatherStats';
import NetworkStatus from './components/NetworkStatus';
import LocationDisplay from './components/LocationDisplay';
import WeatherMap from './components/WeatherMap';
import LocationSearch from './components/LocationSearch';

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

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

function App() {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  
  const backgroundTaskRef = useRef<number | null>(null);
  const weatherUpdateInterval = useRef<number | null>(null);

  // Network Information API
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo(connection);
      
      const updateNetworkInfo = () => setNetworkInfo({ ...connection });
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  // Background Tasks API - Process weather data during idle time
  const scheduleBackgroundTask = useCallback((task: () => void) => {
    if ('requestIdleCallback' in window) {
      backgroundTaskRef.current = window.requestIdleCallback(task, { timeout: 2000 });
    } else {
      setTimeout(task, 0);
    }
  }, []);

  // Simulate weather API call (in real app, this would be actual API)
  const fetchWeatherData = useCallback(async (lat: number, lng: number): Promise<WeatherData> => {
    // Simulate API delay based on network speed
    const delay = networkInfo?.effectiveType === 'slow-2g' ? 3000 : 
                  networkInfo?.effectiveType === '2g' ? 2000 :
                  networkInfo?.effectiveType === '3g' ? 1000 : 500;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Generate realistic weather data based on location and time
    const baseTemp = 20 + Math.sin(lat * Math.PI / 180) * 15;
    const timeVariation = Math.sin((Date.now() / (1000 * 60 * 60 * 24)) * 2 * Math.PI) * 5;
    
    return {
      temperature: baseTemp + timeVariation + (Math.random() - 0.5) * 4,
      humidity: 40 + Math.random() * 40,
      windSpeed: Math.random() * 20,
      windDirection: Math.random() * 360,
      pressure: 1000 + Math.random() * 50,
      visibility: 5 + Math.random() * 15,
      condition: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
      timestamp: Date.now()
    };
  }, [networkInfo]);

  // Process weather history in background
  const processWeatherHistory = useCallback(() => {
    scheduleBackgroundTask(() => {
      if (weatherHistory.length > 24) {
        // Keep only last 24 hours of data
        setWeatherHistory(prev => prev.slice(-24));
      }
      
      // Calculate trends and patterns
      if (weatherHistory.length > 1) {
        const trends = {
          temperatureTrend: weatherHistory[weatherHistory.length - 1].temperature - weatherHistory[0].temperature,
          humidityTrend: weatherHistory[weatherHistory.length - 1].humidity - weatherHistory[0].humidity,
          pressureTrend: weatherHistory[weatherHistory.length - 1].pressure - weatherHistory[0].pressure
        };
        
        // Store trends for future use
        localStorage.setItem('weatherTrends', JSON.stringify(trends));
      }
    });
  }, [weatherHistory, scheduleBackgroundTask]);

  // Handle manual location selection
  const handleLocationSelect = useCallback(async (newLocation: LocationData) => {
    setLocation(newLocation);
    setIsLoading(true);
    
    try {
      const weather = await fetchWeatherData(newLocation.lat, newLocation.lng);
      setCurrentWeather(weather);
      setWeatherHistory([weather]); // Reset history for new location
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error fetching weather for new location:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWeatherData]);

  // Geolocation API
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Simulate reverse geocoding
        const cities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Mumbai', 'São Paulo'];
        const countries = ['USA', 'UK', 'Japan', 'France', 'Australia', 'India', 'Brazil'];
        const randomIndex = Math.floor(Math.random() * cities.length);
        
        const locationData: LocationData = {
          lat,
          lng,
          city: cities[randomIndex],
          country: countries[randomIndex]
        };
        
        setLocation(locationData);
        
        try {
          const weather = await fetchWeatherData(lat, lng);
          setCurrentWeather(weather);
          setWeatherHistory(prev => [...prev, weather]);
          setLastUpdate(Date.now());
        } catch (error) {
          console.error('Error fetching weather:', error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        alert('Error getting location. Using default location.');
        
        // Use default location
        const defaultLocation = { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' };
        setLocation(defaultLocation);
        fetchWeatherData(defaultLocation.lat, defaultLocation.lng).then(weather => {
          setCurrentWeather(weather);
          setWeatherHistory(prev => [...prev, weather]);
          setLastUpdate(Date.now());
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [fetchWeatherData]);

  // Auto-update weather data
  useEffect(() => {
    if (location) {
      weatherUpdateInterval.current = window.setInterval(async () => {
        try {
          const weather = await fetchWeatherData(location.lat, location.lng);
          setCurrentWeather(weather);
          setWeatherHistory(prev => [...prev, weather]);
          setLastUpdate(Date.now());
        } catch (error) {
          console.error('Error updating weather:', error);
        }
      }, 300000); // Update every 5 minutes
    }

    return () => {
      if (weatherUpdateInterval.current) {
        clearInterval(weatherUpdateInterval.current);
      }
    };
  }, [location, fetchWeatherData]);

  // Process weather history when it updates
  useEffect(() => {
    if (weatherHistory.length > 0) {
      processWeatherHistory();
    }
  }, [weatherHistory, processWeatherHistory]);

  // Initial load
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (backgroundTaskRef.current) {
        window.cancelIdleCallback(backgroundTaskRef.current);
      }
      if (weatherUpdateInterval.current) {
        clearInterval(weatherUpdateInterval.current);
      }
    };
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'windy': return <Wind className="w-6 h-6 text-green-500" />;
      default: return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                {currentWeather && getWeatherIcon(currentWeather.condition)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Smart Weather Dashboard
                </h1>
                <p className="text-white/80 text-sm">
                  Real-time weather visualization with AI optimization
                </p>
              </div>
            </div>
            <NetworkStatus networkInfo={networkInfo} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Getting your location and weather data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Weather Visualization */}
            <div className="xl:col-span-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Weather Visualization</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={getCurrentLocation}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                    >
                      Use GPS
                    </button>
                    <LocationSearch 
                      onLocationSelect={handleLocationSelect}
                      currentLocation={location}
                    />
                    {lastUpdate && (
                      <span className="text-white/80 text-sm">
                        Updated: {new Date(lastUpdate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Weather Canvas */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-3">Live Weather Animation</h3>
                    <WeatherCanvas 
                      weatherData={currentWeather}
                      weatherHistory={weatherHistory}
                      networkInfo={networkInfo}
                    />
                  </div>
                  
                  {/* Weather Map */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-3">Weather Map</h3>
                    <WeatherMap 
                      location={location}
                      weatherData={currentWeather}
                      networkInfo={networkInfo}
                    />
                  </div>
                </div>

                {/* Current Weather Overview */}
                {currentWeather && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Thermometer className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {currentWeather.temperature.toFixed(1)}°C
                      </div>
                      <div className="text-white/80 text-sm">Temperature</div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {currentWeather.humidity.toFixed(0)}%
                      </div>
                      <div className="text-white/80 text-sm">Humidity</div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Wind className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {currentWeather.windSpeed.toFixed(1)} m/s
                      </div>
                      <div className="text-white/80 text-sm">Wind Speed</div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Gauge className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">
                        {currentWeather.pressure.toFixed(0)} hPa
                      </div>
                      <div className="text-white/80 text-sm">Pressure</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Location Display */}
              <LocationDisplay location={location} />
              
              {/* Weather Statistics */}
              <WeatherStats 
                currentWeather={currentWeather}
                weatherHistory={weatherHistory}
              />
              
              {/* System Status */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">GPS Location</span>
                    <div className={`w-3 h-3 rounded-full ${location ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Weather Data</span>
                    <div className={`w-3 h-3 rounded-full ${currentWeather ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Background Processing</span>
                    <div className={`w-3 h-3 rounded-full ${weatherHistory.length > 0 ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">Auto Updates</span>
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;