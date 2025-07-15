import React from 'react';
import { Wifi, WifiOff, Signal, Zap, AlertTriangle } from 'lucide-react';

interface NetworkStatusProps {
  networkInfo: any;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ networkInfo }) => {
  if (!networkInfo) {
    return (
      <div className="flex items-center space-x-2 text-white/70">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">Network info unavailable</span>
      </div>
    );
  }

  const getConnectionIcon = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g':
        return <Zap className="w-4 h-4 text-green-400" />;
      case '3g':
        return <Signal className="w-4 h-4 text-yellow-400" />;
      case '2g':
      case 'slow-2g':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionColor = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g':
        return 'text-green-400';
      case '3g':
        return 'text-yellow-400';
      case '2g':
      case 'slow-2g':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getOptimizationMessage = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g':
        return 'Full quality rendering';
      case '3g':
        return 'Optimized for 3G';
      case '2g':
      case 'slow-2g':
        return 'Low bandwidth mode';
      default:
        return 'Auto-optimized';
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {getConnectionIcon(networkInfo.effectiveType)}
        <div className="text-sm">
          <span className={`font-medium ${getConnectionColor(networkInfo.effectiveType)}`}>
            {networkInfo.effectiveType?.toUpperCase() || 'Unknown'}
          </span>
          {networkInfo.downlink && (
            <span className="text-white/60 ml-1">
              ({networkInfo.downlink} Mbps)
            </span>
          )}
        </div>
      </div>
      
      <div className="hidden md:block text-xs text-white/60 bg-white/10 px-2 py-1 rounded">
        {getOptimizationMessage(networkInfo.effectiveType)}
      </div>
    </div>
  );
};

export default NetworkStatus;