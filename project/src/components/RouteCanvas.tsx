import React, { useRef, useEffect, useState } from 'react';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

interface RouteCanvasProps {
  route: Position[];
  currentPosition: Position | null;
  networkInfo: any;
}

const RouteCanvas: React.FC<RouteCanvasProps> = ({ route, currentPosition, networkInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [visibleSegments, setVisibleSegments] = useState<Position[]>([]);

  // Intersection Observer API - Optimize rendering based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Canvas is visible, render all route segments
            setVisibleSegments(route);
          } else {
            // Canvas not visible, reduce rendering load
            setVisibleSegments(route.slice(-50)); // Keep only last 50 points
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [route]);

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(400, rect.width - 32),
          height: Math.max(300, Math.min(500, rect.width * 0.6))
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Canvas API - Route visualization
  useEffect(() => {
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

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw background grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasSize.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvasSize.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize.width, i);
      ctx.stroke();
    }

    if (visibleSegments.length === 0) {
      // Draw placeholder
      ctx.fillStyle = '#9ca3af';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Start tracking to see your route',
        canvasSize.width / 2,
        canvasSize.height / 2
      );
      return;
    }

    // Calculate bounds for proper scaling
    const lats = visibleSegments.map(p => p.lat);
    const lngs = visibleSegments.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    const padding = 40;

    // Convert lat/lng to canvas coordinates
    const toCanvasCoords = (lat: number, lng: number) => {
      const x = padding + ((lng - minLng) / lngRange) * (canvasSize.width - 2 * padding);
      const y = padding + ((maxLat - lat) / latRange) * (canvasSize.height - 2 * padding);
      return { x, y };
    };

    // Determine line quality based on network connection
    let lineWidth = 3;
    let segmentDetail = 1;
    
    if (networkInfo) {
      const effectiveType = networkInfo.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        lineWidth = 2;
        segmentDetail = 3; // Show every 3rd point
      } else if (effectiveType === '3g') {
        lineWidth = 2.5;
        segmentDetail = 2; // Show every 2nd point
      }
    }

    // Draw route line with gradient
    if (visibleSegments.length > 1) {
      const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, 0);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#ef4444');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      for (let i = 0; i < visibleSegments.length; i += segmentDetail) {
        const pos = visibleSegments[i];
        const coords = toCanvasCoords(pos.lat, pos.lng);
        
        if (i === 0) {
          ctx.moveTo(coords.x, coords.y);
        } else {
          ctx.lineTo(coords.x, coords.y);
        }
      }
      ctx.stroke();

      // Draw start point
      if (visibleSegments.length > 0) {
        const startCoords = toCanvasCoords(visibleSegments[0].lat, visibleSegments[0].lng);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(startCoords.x, startCoords.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add start label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('START', startCoords.x, startCoords.y + 3);
      }
    }

    // Draw current position
    if (currentPosition) {
      const currentCoords = toCanvasCoords(currentPosition.lat, currentPosition.lng);
      
      // Pulsing animation for current position
      const time = Date.now() / 1000;
      const pulseRadius = 8 + Math.sin(time * 3) * 2;
      
      // Outer glow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(currentCoords.x, currentCoords.y, pulseRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(currentCoords.x, currentCoords.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw speed indicators along the route
    if (visibleSegments.length > 1) {
      for (let i = 0; i < visibleSegments.length; i += Math.max(1, Math.floor(visibleSegments.length / 10))) {
        const pos = visibleSegments[i];
        if (pos.speed !== undefined && pos.speed > 0) {
          const coords = toCanvasCoords(pos.lat, pos.lng);
          const speedKmh = pos.speed * 3.6; // Convert m/s to km/h
          
          // Color code by speed
          let speedColor = '#10b981'; // Green for normal speed
          if (speedKmh > 15) speedColor = '#f59e0b'; // Orange for fast
          if (speedKmh > 25) speedColor = '#ef4444'; // Red for very fast
          
          ctx.fillStyle = speedColor;
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Draw network status indicator
    if (networkInfo) {
      const statusText = `Network: ${networkInfo.effectiveType || 'Unknown'}`;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(statusText, 10, canvasSize.height - 10);
    }

  }, [visibleSegments, currentPosition, canvasSize, networkInfo]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm bg-white"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          maxWidth: '100%'
        }}
      />
      <div className="mt-2 text-xs text-gray-500 text-center">
        Canvas rendering optimized for {networkInfo?.effectiveType || 'current'} connection
      </div>
    </div>
  );
};

export default RouteCanvas;