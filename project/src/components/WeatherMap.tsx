import React, { useRef, useEffect, useState } from 'react';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

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

interface WeatherMapProps {
  location: LocationData | null;
  weatherData: WeatherData | null;
  networkInfo: any;
}

const WeatherMap: React.FC<WeatherMapProps> = ({ location, weatherData, networkInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [isVisible, setIsVisible] = useState(true);

  // Intersection Observer API
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Responsive sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(300, rect.width - 32),
          height: Math.max(200, Math.min(400, rect.width * 0.6))
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Canvas API - Map visualization
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw map background
    const mapGradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height);
    mapGradient.addColorStop(0, '#2E8B57');
    mapGradient.addColorStop(0.3, '#3CB371');
    mapGradient.addColorStop(0.7, '#90EE90');
    mapGradient.addColorStop(1, '#98FB98');
    
    ctx.fillStyle = mapGradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Adjust detail based on network
    let gridSize = 20;
    let showDetails = true;
    
    if (networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g') {
      gridSize = 40;
      showDetails = false;
    } else if (networkInfo?.effectiveType === '3g') {
      gridSize = 30;
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    if (!location) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Loading location...',
        canvasSize.width / 2,
        canvasSize.height / 2
      );
      return;
    }

    // Draw location marker
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    
    // Location pin
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Pin shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX + 2, centerY + 2, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Pin highlight
    ctx.fillStyle = '#FF6666';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, 3, 0, 2 * Math.PI);
    ctx.fill();

    if (showDetails && weatherData) {
      // Weather overlay zones
      const zones = [
        { x: centerX - 80, y: centerY - 60, temp: weatherData.temperature + 2, size: 40 },
        { x: centerX + 60, y: centerY - 40, temp: weatherData.temperature - 1, size: 35 },
        { x: centerX - 40, y: centerY + 70, temp: weatherData.temperature + 1, size: 45 },
        { x: centerX + 80, y: centerY + 50, temp: weatherData.temperature - 2, size: 30 }
      ];

      zones.forEach(zone => {
        const tempColor = getTemperatureColor(zone.temp);
        ctx.fillStyle = tempColor;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Temperature label
        ctx.fillStyle = 'white';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${zone.temp.toFixed(0)}°`, zone.x, zone.y + 3);
      });

      // Wind direction arrows
      if (weatherData.windSpeed > 0) {
        drawWindArrows(ctx, centerX, centerY, weatherData.windDirection, weatherData.windSpeed);
      }
    }

    // Location info
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(location.city, centerX, centerY + 30);
    
    ctx.font = '12px system-ui';
    ctx.fillText(location.country, centerX, centerY + 45);
    
    // Coordinates
    ctx.font = '10px system-ui';
    ctx.fillText(
      `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      centerX,
      centerY + 60
    );

  }, [location, weatherData, canvasSize, networkInfo, isVisible]);

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'rgba(0, 100, 255, 0.6)';
    if (temp < 10) return 'rgba(100, 150, 255, 0.6)';
    if (temp < 20) return 'rgba(100, 255, 100, 0.6)';
    if (temp < 30) return 'rgba(255, 255, 100, 0.6)';
    return 'rgba(255, 100, 100, 0.6)';
  };

  const drawWindArrows = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, direction: number, speed: number) => {
    const positions = [
      { x: centerX - 60, y: centerY - 60 },
      { x: centerX + 60, y: centerY - 60 },
      { x: centerX - 60, y: centerY + 60 },
      { x: centerX + 60, y: centerY + 60 }
    ];

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    positions.forEach(pos => {
      const angle = (direction * Math.PI) / 180;
      const length = 10 + speed;
      const endX = pos.x + Math.cos(angle) * length;
      const endY = pos.y + Math.sin(angle) * length;

      // Arrow line
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow head
      const headLength = 5;
      const headAngle = Math.PI / 6;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - headAngle),
        endY - headLength * Math.sin(angle - headAngle)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + headAngle),
        endY - headLength * Math.sin(angle + headAngle)
      );
      ctx.stroke();
    });
  };

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="border border-white/20 rounded-lg shadow-lg bg-gradient-to-br from-green-400/20 to-blue-500/20"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          maxWidth: '100%'
        }}
      />
      <div className="mt-2 text-xs text-white/70 text-center">
        Interactive weather map with location-based data
      </div>
    </div>
  );
};

export default WeatherMap;