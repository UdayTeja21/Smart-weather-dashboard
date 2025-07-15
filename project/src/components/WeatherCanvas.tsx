import React, { useRef, useEffect, useState } from 'react';

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

interface WeatherCanvasProps {
  weatherData: WeatherData | null;
  weatherHistory: WeatherData[];
  networkInfo: any;
}

const WeatherCanvas: React.FC<WeatherCanvasProps> = ({ weatherData, weatherHistory, networkInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 300 });
  const [isVisible, setIsVisible] = useState(true);

  // Intersection Observer API - Optimize rendering based on visibility
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

  // Responsive canvas sizing
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

  // Canvas API - Weather visualization with animations
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    let animationTime = 0;

    const animate = () => {
      if (!isVisible) return;

      animationTime += 0.02;
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
      if (weatherData?.condition === 'sunny') {
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
      } else if (weatherData?.condition === 'rainy') {
        gradient.addColorStop(0, '#708090');
        gradient.addColorStop(1, '#2F4F4F');
      } else if (weatherData?.condition === 'cloudy') {
        gradient.addColorStop(0, '#B0C4DE');
        gradient.addColorStop(1, '#D3D3D3');
      } else {
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#F0F8FF');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      if (!weatherData) {
        // Draw placeholder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Loading weather data...',
          canvasSize.width / 2,
          canvasSize.height / 2
        );
        return;
      }

      // Adjust detail level based on network speed
      let particleCount = 50;
      let animationQuality = 1;
      
      if (networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g') {
        particleCount = 20;
        animationQuality = 0.5;
      } else if (networkInfo?.effectiveType === '3g') {
        particleCount = 35;
        animationQuality = 0.75;
      }

      // Draw weather effects based on condition
      if (weatherData.condition === 'rainy') {
        drawRain(ctx, canvasSize, animationTime, particleCount);
      } else if (weatherData.condition === 'sunny') {
        drawSun(ctx, canvasSize, animationTime);
        drawClouds(ctx, canvasSize, animationTime, 2);
      } else if (weatherData.condition === 'cloudy') {
        drawClouds(ctx, canvasSize, animationTime, 5);
      } else if (weatherData.condition === 'windy') {
        drawWind(ctx, canvasSize, animationTime, weatherData.windSpeed);
        drawClouds(ctx, canvasSize, animationTime, 3);
      }

      // Draw temperature visualization
      drawTemperatureBar(ctx, canvasSize, weatherData.temperature);

      // Draw humidity indicator
      drawHumidityIndicator(ctx, canvasSize, weatherData.humidity);

      // Draw wind direction
      if (weatherData.windSpeed > 0) {
        drawWindDirection(ctx, canvasSize, weatherData.windDirection, weatherData.windSpeed);
      }

      // Draw weather history graph
      if (weatherHistory.length > 1) {
        drawWeatherGraph(ctx, canvasSize, weatherHistory);
      }

      if (animationQuality > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [weatherData, weatherHistory, canvasSize, networkInfo, isVisible]);

  // Weather effect drawing functions
  const drawRain = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, time: number, count: number) => {
    ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < count; i++) {
      const x = (i * 13 + time * 100) % (size.width + 20);
      const y = (i * 7 + time * 200) % (size.height + 20);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 15);
      ctx.stroke();
    }
  };

  const drawSun = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, time: number) => {
    const centerX = size.width * 0.8;
    const centerY = size.height * 0.2;
    const radius = 30;
    
    // Sun rays
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) + time;
      const startX = centerX + Math.cos(angle) * (radius + 5);
      const startY = centerY + Math.sin(angle) * (radius + 5);
      const endX = centerX + Math.cos(angle) * (radius + 15);
      const endY = centerY + Math.sin(angle) * (radius + 15);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Sun body
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    sunGradient.addColorStop(0, '#FFD700');
    sunGradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawClouds = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, time: number, count: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < count; i++) {
      const x = (i * 80 + time * 10) % (size.width + 60);
      const y = 30 + i * 20;
      
      // Cloud shape with multiple circles
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.arc(x + 25, y, 25, 0, 2 * Math.PI);
      ctx.arc(x + 50, y, 20, 0, 2 * Math.PI);
      ctx.arc(x + 25, y - 15, 15, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const drawWind = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, time: number, windSpeed: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    
    const lines = Math.floor(windSpeed / 2) + 3;
    for (let i = 0; i < lines; i++) {
      const y = 50 + i * 30;
      const offset = Math.sin(time + i) * 20;
      
      ctx.beginPath();
      ctx.moveTo(10 + offset, y);
      ctx.lineTo(size.width - 10 + offset, y);
      ctx.stroke();
    }
  };

  const drawTemperatureBar = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, temperature: number) => {
    const barHeight = size.height * 0.6;
    const barWidth = 20;
    const x = 20;
    const y = size.height - 40;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y - barHeight, barWidth, barHeight);
    
    // Temperature fill
    const tempRatio = Math.max(0, Math.min(1, (temperature + 10) / 50));
    const fillHeight = barHeight * tempRatio;
    
    const tempGradient = ctx.createLinearGradient(x, y, x, y - barHeight);
    tempGradient.addColorStop(0, '#FF4444');
    tempGradient.addColorStop(0.5, '#FFAA00');
    tempGradient.addColorStop(1, '#4444FF');
    
    ctx.fillStyle = tempGradient;
    ctx.fillRect(x, y - fillHeight, barWidth, fillHeight);
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${temperature.toFixed(1)}°C`, x + barWidth / 2, y + 15);
  };

  const drawHumidityIndicator = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, humidity: number) => {
    const x = size.width - 60;
    const y = size.height - 60;
    const radius = 25;
    
    // Background circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Humidity arc
    const humidityAngle = (humidity / 100) * 2 * Math.PI;
    ctx.strokeStyle = '#4A90E2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + humidityAngle);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'white';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${humidity.toFixed(0)}%`, x, y + 3);
  };

  const drawWindDirection = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, direction: number, speed: number) => {
    const x = size.width - 120;
    const y = 60;
    const length = 20 + speed * 2;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const angle = (direction * Math.PI) / 180;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Arrow line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Arrow head
    const headLength = 8;
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
  };

  const drawWeatherGraph = (ctx: CanvasRenderingContext2D, size: { width: number; height: number }, history: WeatherData[]) => {
    if (history.length < 2) return;
    
    const graphHeight = 60;
    const graphY = size.height - graphHeight - 10;
    const graphWidth = size.width - 100;
    const graphX = 50;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    // Temperature line
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const temps = history.slice(-20).map(h => h.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 1;
    
    temps.forEach((temp, index) => {
      const x = graphX + (index / (temps.length - 1)) * graphWidth;
      const y = graphY + graphHeight - ((temp - minTemp) / tempRange) * graphHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="border border-white/20 rounded-lg shadow-lg bg-gradient-to-br from-blue-400/20 to-purple-500/20"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          maxWidth: '100%'
        }}
      />
      <div className="mt-2 text-xs text-white/70 text-center">
        Live weather animation optimized for {networkInfo?.effectiveType || 'current'} connection
      </div>
    </div>
  );
};

export default WeatherCanvas;