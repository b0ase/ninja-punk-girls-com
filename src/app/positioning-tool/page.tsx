'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

// PositionState includes fontSize
interface PositionState {
  x: number;
  y: number;
  fontSize: number;
  width?: number; 
  height?: number;
}

// Restore separate Label/Value entries, add Series
const initialCoords: Record<string, PositionState> = {
    nameBox:   { x: 340, y: 165, fontSize: 48 },
    numberBox: { x: 340, y: 115, fontSize: 36 },
    seriesBox: { x: 140, y: 130, fontSize: 40 }, // Added Series (adjust initial X/Y/Size)
    qrCodeBox: { x: 961 - 150 - 50, y: 26, fontSize: 10, width: 150, height: 150 },
    // Stats Labels (Restored)
    strengthLabel: { x: 355, y: 1200, fontSize: 24 },
    speedLabel:    { x: 355, y: 1240, fontSize: 24 },
    skillLabel:    { x: 355, y: 1280, fontSize: 24 },
    staminaLabel:  { x: 961 - 100, y: 1200, fontSize: 24 },
    stealthLabel:  { x: 961 - 100, y: 1240, fontSize: 24 },
    styleLabel:    { x: 961 - 100, y: 1280, fontSize: 24 },
    // Stats Values (Restored)
    strengthValue: { x: 375, y: 1200, fontSize: 32 },
    speedValue:    { x: 375, y: 1240, fontSize: 32 },
    skillValue:    { x: 375, y: 1280, fontSize: 32 },
    staminaValue:  { x: 961 - 80, y: 1200, fontSize: 32 },
    stealthValue:  { x: 961 - 80, y: 1240, fontSize: 32 },
    styleValue:    { x: 961 - 80, y: 1280, fontSize: 32 },
};

type AllPositions = Record<keyof typeof initialCoords, PositionState>;

// Restore labelMap entries, add Series
const labelMap: Record<keyof AllPositions, string> = {
    nameBox:   "Name",
    numberBox: "Number (#)",
    seriesBox: "Series", // Added Series
    qrCodeBox: "QR Code Area",
    strengthLabel: "Strength Label",
    speedLabel:    "Speed Label",
    skillLabel:    "Skill Label",
    staminaLabel:  "Stamina Label",
    stealthLabel:  "Stealth Label",
    styleLabel:    "Style Label",
    strengthValue: "Strength Value",
    speedValue:    "Speed Value",
    skillValue:    "Skill Value",
    staminaValue:  "Stamina Value",
    stealthValue:  "Stealth Value",
    styleValue:    "Style Value",
};

// Helper component for controls, now including fontSize
interface PositionControlProps {
  label: string;
  pos: PositionState;
  setPos: (key: keyof AllPositions, newPos: PositionState) => void;
  itemKey: keyof AllPositions;
  isTextElement: boolean; // To show font size control
}

const PositionControl: React.FC<PositionControlProps> = ({ label, pos, setPos, itemKey, isTextElement }) => (
  <div className="p-2 border border-gray-700 rounded mb-2 flex flex-wrap items-center gap-2 text-sm">
    <span className="font-semibold text-teal-400 w-full sm:w-32 truncate mb-1 sm:mb-0">{label}:</span>
    <div className="flex items-center gap-2 flex-wrap">
        <label className="text-gray-400">X:</label>
        <input
          type="number"
          value={pos.x}
          onChange={e => setPos(itemKey, { ...pos, x: parseInt(e.target.value) || 0 })}
          className="bg-gray-700 p-1 rounded w-20"
        />
        <label className="text-gray-400">Y:</label>
        <input
          type="number"
          value={pos.y}
          onChange={e => setPos(itemKey, { ...pos, y: parseInt(e.target.value) || 0 })}
          className="bg-gray-700 p-1 rounded w-20"
        />
        {isTextElement && (
            <>
                <label className="text-gray-400">Size:</label>
                <input
                  type="number"
                  value={pos.fontSize}
                  onChange={e => setPos(itemKey, { ...pos, fontSize: parseInt(e.target.value) || 10 })}
                  className="bg-gray-700 p-1 rounded w-16"
                />
            </>
        )}
        <span className="text-cyan-400 text-xs ml-2">(X:{pos.x}, Y:{pos.y}{isTextElement ? `, Size:${pos.fontSize}` : ''})</span>
    </div>
  </div>
);


const PositioningTool = () => {
  const [positions, setPositions] = useState<AllPositions>(initialCoords);
  const [scale, setScale] = useState(1); // Start scale at 1 initially
  const previewContainerRef = useRef<HTMLDivElement>(null); // Ref for the preview container
  const scaledContentRef = useRef<HTMLDivElement>(null); // Ref for the div being scaled

  const baseImageUrl = "/placeholder-nft-bg.png"; 
  const interfaceImageUrl = "/assets/05 Interface/05_01_interface_x_x_x_x.png"; 

  // Update scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const canvasWidth = 961; 
        setScale(containerWidth / canvasWidth);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Update state for a specific element
  const updatePosition = (key: keyof AllPositions, newPos: PositionState) => {
      setPositions(prev => ({
          ...prev,
          [key]: newPos
      }));
  };

  // Drag handler - updates position state using UNscaled coordinates
  const handleDragStop = (key: keyof AllPositions) => (e: DraggableEvent, data: DraggableData) => {
    // data.x and data.y are relative to the scaled parent when scale prop is used
    // We directly use these as the new unscaled positions
    setPositions(prev => ({
        ...prev,
        [key]: { 
            ...prev[key], 
            x: Math.round(data.x), 
            y: Math.round(data.y) 
        }
    }));
  };

  const textBaseStyle = {
      position: 'absolute' as const,
      color: 'white',
      fontFamily: '"Cyberpunks Italic", sans-serif',
      whiteSpace: 'nowrap' as const,
      cursor: 'grab' as const, // Indicate draggable
  };

  // Function to log coordinates to console
  const handleSave = () => {
    console.log("--- Current Coordinates (Copy for coordMap) ---");
    // Format the output slightly for easier copying
    const output = Object.entries(positions).reduce((acc, [key, pos]) => {
        acc[key] = { 
            x: pos.x, 
            y: pos.y, 
            fontSize: pos.fontSize, 
            // Include width/height only if they exist (for QR code)
            ...(pos.width && { width: pos.width }),
            ...(pos.height && { height: pos.height }),
        };
        return acc;
    }, {} as Record<string, any>);
    console.log(JSON.stringify(output, null, 2));
    alert("Coordinates logged to browser console (Press F12)!");
  };

  // Sample data (add series)
  const sampleName = "TAKANA";
  const sampleNumber = "#8227";
  const sampleSeries = "1";
  const sampleStats = { strength: 12, speed: 8, skill: 15, stamina: 9, stealth: 5, style: 11 };

  return (
    <div className="p-4 bg-gray-800 text-white min-h-screen flex flex-col xl:flex-row gap-4">
      {/* Left: Scaled Image Preview */}
      <div 
        ref={previewContainerRef} 
        className="w-full xl:w-2/3 flex-shrink-0 overflow-hidden aspect-[961/1441] bg-gray-700 rounded relative"
      > 
        {/* This div contains the actual content and is scaled */} 
        <div 
          ref={scaledContentRef}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '961px', 
            height: '1441px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Base Image */} 
          <Image 
             src={baseImageUrl} 
             layout="fill" 
             alt="Base NFT" 
             priority 
             unoptimized 
          />
          {/* Interface Overlay */}
          <Image 
              src={interfaceImageUrl} 
              layout="fill" 
              alt="Interface Overlay" 
              priority 
              unoptimized 
              style={{ opacity: 0.9, pointerEvents: 'none' }} // Keep opacity/pointerEvents 
              onError={(e) => { e.currentTarget.style.display='none'; }}
          />

          {/* Draggable Elements - Update display text */}
          {Object.entries(positions).map(([key, pos]) => {
            const isText = key !== 'qrCodeBox';
            let textContent: string | number = key; // Default
            let displayAlign: CanvasTextAlign = 'left'; // Default

            // Generate display text based on NEW requirements
            if (key === 'nameBox') { textContent = 'NAME'; }
            else if (key === 'numberBox') { textContent = '#NUM'; }
            else if (key === 'seriesBox') { textContent = `#${sampleSeries}`; }
            else if (key === 'qrCodeBox') { textContent = 'QR'; }
            // Stat Labels: "Strength 1", "Speed 2", etc.
            else if (key === 'strengthLabel') { textContent = `Strength 1`; displayAlign = 'right'; }
            else if (key === 'speedLabel')    { textContent = `Speed 2`; displayAlign = 'right'; }
            else if (key === 'skillLabel')    { textContent = `Skill 3`; displayAlign = 'right'; }
            else if (key === 'staminaLabel')  { textContent = `Stamina 4`; displayAlign = 'right'; }
            else if (key === 'stealthLabel')  { textContent = `Stealth 5`; displayAlign = 'right'; }
            else if (key === 'styleLabel')    { textContent = `Style 6`; displayAlign = 'right'; }
            // Stat Values: "S1", "S2", etc.
            else if (key === 'strengthValue') { textContent = `S1`; displayAlign = 'left'; }
            else if (key === 'speedValue')    { textContent = `S2`; displayAlign = 'left'; }
            else if (key === 'skillValue')    { textContent = `S3`; displayAlign = 'left'; }
            else if (key === 'staminaValue')  { textContent = `S4`; displayAlign = 'left'; }
            else if (key === 'stealthValue')  { textContent = `S5`; displayAlign = 'left'; }
            else if (key === 'styleValue')    { textContent = `S6`; displayAlign = 'left'; }
            else { return null; } // Should not happen
            
            if (key === 'qrCodeBox') {
              // Draggable QR Placeholder 
              return (
                <Draggable
                  key={key}
                  position={{ x: pos.x, y: pos.y }} // Use unscaled state position
                  onStop={handleDragStop(key as keyof AllPositions)}
                  // scale={scale} // Remove scale prop from Draggable itself
                  bounds="parent"
                >
                  <div style={{ 
                    position: 'absolute', 
                    width: `${pos.width!}px`, 
                    height: `${pos.height!}px`, 
                    border: '1px dashed red', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: `${pos.fontSize}px`, 
                    color: 'red', cursor: 'grab',
                    top: 0, left: 0, // Reset top/left as Draggable handles it
                    boxSizing: 'border-box' 
                  }}>
                    {textContent}
                  </div>
                </Draggable>
              );
            }

            // Regular Draggable Text Elements
            return (
              <Draggable
                key={key}
                position={{ x: pos.x, y: pos.y }} // Use unscaled state position
                onStop={handleDragStop(key as keyof AllPositions)}
                // scale={scale} // Remove scale prop
                bounds="parent" 
              >
                <div style={{ 
                  ...textBaseStyle, 
                  fontSize: `${pos.fontSize}px`, // Use font size from state 
                  textAlign: displayAlign, // Use dynamic alignment
                  top: 0, left: 0, // Let Draggable handle position
                  padding: '2px', // Add padding for easier grabbing
                  border: '1px dotted rgba(255,255,255,0.2)' // Faint border to see bounds
                }}>
                  {textContent} 
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>

      {/* Right: Controls - Updated to iterate over new initialCoords */}
      <div className="w-full xl:w-1/3 overflow-auto pr-2 bg-gray-900 p-4 rounded-md shadow-lg flex flex-col">
        <h2 className="text-xl font-semibold mb-4 text-pink-500">Position & Size Controls</h2>
        <div className="flex-grow space-y-1 overflow-y-auto">
          {Object.keys(initialCoords).map((key) => { // Iterate over all keys again
             const k = key as keyof AllPositions;
             const pos = positions[k]; 
             if (!pos) return null; 
             return (
                <PositionControl 
                    key={k} 
                    label={labelMap[k] || k} // Use label from map
                    pos={pos} 
                    setPos={updatePosition} 
                    itemKey={k}
                    isTextElement={k !== 'qrCodeBox'}
                />
             );
          })}
        </div>
        {/* Save Button */} 
        <button 
          onClick={handleSave}
          className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md"
        >
          Log Coordinates to Console
        </button>
        <p className="text-xs text-gray-500 mt-2">Drag elements or use controls. Click button to log final coordinates for the API's coordMap.</p>
      </div>
    </div>
  );
};

export default PositioningTool; 