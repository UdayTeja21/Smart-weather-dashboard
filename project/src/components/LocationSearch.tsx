import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, Clock } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation: LocationData | null;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ onLocationSelect, currentLocation }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sample cities database (in real app, this would be an API call)
  const sampleCities: LocationData[] = [
    { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
    { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
    { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
    { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' },
    { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
    { lat: 19.0760, lng: 72.8777, city: 'Mumbai', country: 'India' },
    { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil' },
    { lat: 55.7558, lng: 37.6176, city: 'Moscow', country: 'Russia' },
    { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China' },
    { lat: 52.5200, lng: 13.4050, city: 'Berlin', country: 'Germany' },
    { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'USA' },
    { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE' },
    { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore' },
    { lat: 59.9311, lng: 10.7490, city: 'Oslo', country: 'Norway' },
    { lat: -26.2041, lng: 28.0473, city: 'Johannesburg', country: 'South Africa' },
    { lat: 45.4215, lng: -75.6972, city: 'Ottawa', country: 'Canada' },
    { lat: -34.6037, lng: -58.3816, city: 'Buenos Aires', country: 'Argentina' },
    { lat: 41.9028, lng: 12.4964, city: 'Rome', country: 'Italy' },
    { lat: 40.4168, lng: -3.7038, city: 'Madrid', country: 'Spain' },
    { lat: 50.0755, lng: 14.4378, city: 'Prague', country: 'Czech Republic' }
  ];

  // Load recent locations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentWeatherLocations');
    if (saved) {
      try {
        setRecentLocations(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent locations:', error);
      }
    }
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter cities based on search query
    const filtered = sampleCities.filter(city => 
      city.city.toLowerCase().includes(query.toLowerCase()) ||
      city.country.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered.slice(0, 8)); // Limit to 8 results
    setIsSearching(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchLocations(query);
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationData) => {
    onLocationSelect(location);
    
    // Add to recent locations
    const updatedRecent = [
      location,
      ...recentLocations.filter(loc => 
        !(loc.lat === location.lat && loc.lng === location.lng)
      )
    ].slice(0, 5); // Keep only 5 recent locations
    
    setRecentLocations(updatedRecent);
    localStorage.setItem('recentWeatherLocations', JSON.stringify(updatedRecent));
    
    // Close search
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Clear recent locations
  const clearRecentLocations = () => {
    setRecentLocations([]);
    localStorage.removeItem('recentWeatherLocations');
  };

  return (
    <div className="relative">
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Change Location</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Search Location</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for a city..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {/* Search Results */}
              {searchQuery && (
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Search Results</h4>
                  {searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-800">{location.city}</div>
                            <div className="text-sm text-gray-500">{location.country}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : !isSearching ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No locations found</p>
                      <p className="text-sm">Try searching for a different city</p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Recent Locations */}
              {!searchQuery && recentLocations.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Recent Locations</span>
                    </h4>
                    <button
                      onClick={clearRecentLocations}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentLocations.map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-800">{location.city}</div>
                          <div className="text-sm text-gray-500">{location.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Cities */}
              {!searchQuery && recentLocations.length === 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">Popular Cities</h4>
                  <div className="space-y-2">
                    {sampleCities.slice(0, 8).map((location, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                      >
                        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-800">{location.city}</div>
                          <div className="text-sm text-gray-500">{location.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Location */}
            {currentLocation && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Current: {currentLocation.city}</div>
                    <div className="text-xs text-gray-500">{currentLocation.country}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;