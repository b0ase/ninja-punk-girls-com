'use client';
import React from 'react';

interface CoordinateGridOverlayProps {
  width: number;
  height: number;
  step: number;
  labelStep?: number; // How often to show coordinate labels
  color?: string;
  labelColor?: string;
  strokeWidth?: number;
}

const CoordinateGridOverlay: React.FC<CoordinateGridOverlayProps> = ({ 
  width, 
  height, 
  step, 
  labelStep = 100, 
  color = 'rgba(0, 255, 0, 0.5)', // Bright Green
  labelColor = 'rgba(0, 255, 0, 0.9)',
  strokeWidth = 1
}) => {
  const lines = [];
  const labels = [];

  // Vertical lines and labels
  for (let x = 0; x <= width; x += step) {
    lines.push(
      <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} stroke={color} strokeWidth={strokeWidth} />
    );
    if (x % labelStep === 0 && x > 0) {
      labels.push(
        <text key={`vlabel-${x}`} x={x + 3} y={12} fontSize="10" fill={labelColor}>{x}</text>
      );
    }
  }

  // Horizontal lines and labels
  for (let y = 0; y <= height; y += step) {
    lines.push(
      <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} stroke={color} strokeWidth={strokeWidth} />
    );
    if (y % labelStep === 0 && y > 0) {
      labels.push(
        <text key={`hlabel-${y}`} x={3} y={y + 12} fontSize="10" fill={labelColor}>{y}</text>
      );
    }
  }

  return (
    <svg 
      width={width}
      height={height}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none', // Make sure it doesn't interfere with clicks
        zIndex: 10 // Ensure it's above the image
      }} 
    >
      <g>{lines}</g>
      <g>{labels}</g>
    </svg>
  );
};

export default CoordinateGridOverlay; 