'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import cn from 'classnames';

// --- Shared Interfaces & Types (Copied from InterfaceDesignerTab) ---
interface PositionState {
  x: number; y: number; fontSize: number;
  width?: number; height?: number;
}

interface CanvasDimensions {
  width: number;
  height: number;
}

interface InterfaceFileInfo {
  filename: string;
  width: number;
  height: number;
}

// --- NFT Specific Data (Copied from InterfaceDesignerTab) ---
const initialNftCoords: Record<string, PositionState> = {
  "nameBox": { "x": 391, "y": 152, "fontSize": 48 },
  "numberBox": { "x": 450, "y": 78, "fontSize": 36 },
  "seriesBox": { "x": 383, "y": 72, "fontSize": 40 },
  "qrCodeBox": { "x": 739, "y": 81, "fontSize": 10, "width": 150, "height": 150 },
  "strengthLabel": { "x": 115, "y": 1205, "fontSize": 32 },
  "speedLabel": { "x": 369, "y": 1205, "fontSize": 32 },
  "skillLabel": { "x": 621, "y": 1205, "fontSize": 32 },
  "staminaLabel": { "x": 113, "y": 1273, "fontSize": 32 },
  "stealthLabel": { "x": 368, "y": 1276, "fontSize": 32 },
  "styleLabel": { "x": 620, "y": 1276, "fontSize": 32 },
  "strengthValue": { "x": 296, "y": 1203, "fontSize": 32 },
  "speedValue": { "x": 549, "y": 1204, "fontSize": 32 },
  "skillValue": { "x": 805, "y": 1203, "fontSize": 32 },
  "staminaValue": { "x": 296, "y": 1276, "fontSize": 32 },
  "stealthValue": { "x": 551, "y": 1277, "fontSize": 32 },
  "styleValue": { "x": 806, "y": 1275, "fontSize": 32 }
};
type NftPositionKeys = keyof typeof initialNftCoords;
const nftLabelMap: Record<NftPositionKeys, string> = {
    nameBox:   "Name", numberBox: "Number (#)", seriesBox: "Series", 
    qrCodeBox: "QR Code Area", strengthLabel: "Strength Label", speedLabel: "Speed Label",
    skillLabel: "Skill Label", staminaLabel: "Stamina Label", stealthLabel: "Stealth Label",
    styleLabel: "Style Label", strengthValue: "Strength Value", speedValue: "Speed Value",
    skillValue: "Skill Value", staminaValue: "Stamina Value", stealthValue: "Stealth Value",
    styleValue: "Style Value",
};
const defaultNftDimensions: CanvasDimensions = { width: 961, height: 1441 };

// --- Shared Position Control Component (Copied from InterfaceDesignerTab) ---
interface PositionControlProps<T extends string> { 
  label: string; 
  pos: PositionState;
  setPos: (key: T, newPos: PositionState) => void; 
  itemKey: T; 
  isTextElement: boolean;
  isAreaElement: boolean; 
}
const PositionControl = <T extends string>({ label, pos, setPos, itemKey, isTextElement, isAreaElement }: PositionControlProps<T>) => {
  // ... (JSX remains the same) ...
  return (
      <div className="p-2 border border-gray-700 rounded mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-teal-400 w-full sm:w-32 truncate mb-1 sm:mb-0">{label}:</span>
        <div className="flex items-center gap-2 flex-wrap">
            <label className="text-gray-400">X:</label>
            <input type="number" value={pos.x} onChange={e => setPos(itemKey, { ...pos, x: parseInt(e.target.value) || 0 })} className="bg-gray-700 p-1 rounded w-20" />
            <label className="text-gray-400">Y:</label>
            <input type="number" value={pos.y} onChange={e => setPos(itemKey, { ...pos, y: parseInt(e.target.value) || 0 })} className="bg-gray-700 p-1 rounded w-20" />
            {isTextElement && (
                <>
                    <label className="text-gray-400">Size:</label>
                    <input type="number" value={pos.fontSize} onChange={e => setPos(itemKey, { ...pos, fontSize: parseInt(e.target.value) || 10 })} className="bg-gray-700 p-1 rounded w-16" />
                </>
            )}
            {isAreaElement && (
                <>
                    <label className="text-gray-400">W:</label>
                    <input type="number" value={pos.width ?? ''} onChange={e => setPos(itemKey, { ...pos, width: parseInt(e.target.value) || undefined })} className="bg-gray-700 p-1 rounded w-16" />
                    <label className="text-gray-400">H:</label>
                    <input type="number" value={pos.height ?? ''} onChange={e => setPos(itemKey, { ...pos, height: parseInt(e.target.value) || undefined })} className="bg-gray-700 p-1 rounded w-16" />
                </>
            )}
            <span className="text-cyan-400 text-xs ml-2">(X:{pos.x}, Y:{pos.y}{isTextElement ? `, Size:${pos.fontSize}` : ''}{isAreaElement ? `, W:${pos.width ?? 'auto'}, H:${pos.height ?? 'auto'}` : ''})</span>
        </div>
      </div>
  );
};

// --- Shared Scaling Logic Hook (Copied from InterfaceDesignerTab) ---
const useAutoScale = (containerRef: React.RefObject<HTMLDivElement>, canvasWidth: number) => { 
    const [scale, setScale] = useState(1);
    useEffect(() => {
      const updateScale = () => {
        if (containerRef.current && canvasWidth > 0) { 
          const containerWidth = containerRef.current.offsetWidth;
          let newScale = 1;
          if (containerWidth > 10) { 
            newScale = containerWidth / canvasWidth;
          } else {
            newScale = 10 / canvasWidth; 
          }
          setScale(newScale);
        } else {
            if (scale !== 1) setScale(1);
        }
      };
      let observer: ResizeObserver | null = null;
      const currentRef = containerRef.current; 
      if (currentRef) {
          observer = new ResizeObserver(updateScale);
          observer.observe(currentRef);
      }
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => {
          if (observer && currentRef) {
              observer.unobserve(currentRef);
          }
          window.removeEventListener('resize', updateScale);
      };
    }, [containerRef, canvasWidth, scale]);
    return scale;
  };

// Define props if needed
interface NftCardDesignerProps {
  selectedSeriesId: string | null; // Add this prop
}

// --- NFT Card Designer Component ---
const NftCardDesigner: React.FC<NftCardDesignerProps> = ({ selectedSeriesId }) => {
  // --- State ---
  const [availableInterfaces, setAvailableInterfaces] = useState<InterfaceFileInfo[]>([]); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState<boolean>(true);
  const [nftPositions, setNftPositions] = useState<Record<NftPositionKeys, PositionState>>(initialNftCoords);
  const nftPreviewContainerRef = useRef<HTMLDivElement>(null);
  const [selectedNftInterface, setSelectedNftInterface] = useState<string>('');
  const [nftCanvasDimensions, setNftCanvasDimensions] = useState<CanvasDimensions>(defaultNftDimensions);
  const baseNftImageUrl = "/placeholder-nft-bg.png"; 

  // Sample data
  const sampleSeries = "1";
  const sampleStats = { strength: 12, speed: 8, skill: 15, stamina: 9, stealth: 5, style: 11 };

  // --- Fetch Available Interfaces ---
  useEffect(() => {
    const fetchInterfaces = async () => {
      setIsLoadingInterfaces(true);
      setFetchError(null);
      try {
        const response = await fetch('/api/interface-files');
        if (!response.ok) throw new Error(`API Error: ${response.statusText} (Status: ${response.status})`);
        const data = await response.json();
        if (!data.success || !Array.isArray(data.files) || (data.files.length > 0 && typeof data.files[0] !== 'object')) {
            throw new Error(data.error || 'Invalid data format from API.');
        }
        const filesData: InterfaceFileInfo[] = data.files;
        setAvailableInterfaces(filesData);
        if (filesData.length > 0) {
          const firstInterface = filesData[0];
          setSelectedNftInterface(firstInterface.filename);
          setNftCanvasDimensions({ width: firstInterface.width, height: firstInterface.height });
        } else {
          setNftCanvasDimensions(defaultNftDimensions);
        }
      } catch (err: any) {
        console.error("Failed to fetch NFT interface files:", err);
        setFetchError(err.message);
        setNftCanvasDimensions(defaultNftDimensions);
      } finally {
        setIsLoadingInterfaces(false);
      }
    };
    fetchInterfaces();
  }, []);

  // --- Handle Interface Selection Change ---
  const handleNftInterfaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = event.target.value;
    setSelectedNftInterface(filename);
    const selectedInfo = availableInterfaces.find(f => f.filename === filename);
    if (selectedInfo) {
      setNftCanvasDimensions({ width: selectedInfo.width, height: selectedInfo.height });
    }
  };

  // --- Scaling ---
  const currentNftScale = useAutoScale(nftPreviewContainerRef, nftCanvasDimensions.width);

  // --- Update & Drag Handlers ---
  const updatePosition = (key: NftPositionKeys, newPos: PositionState) => {
    setNftPositions(prev => ({ ...prev, [key]: newPos }));
  };
  const handleDragStop = (key: NftPositionKeys) => (e: DraggableEvent, data: DraggableData) => {
     setNftPositions(prev => {
       const current = prev[key];
       if (!current) return prev;
       return { ...prev, [key]: { ...current, x: Math.round(data.x), y: Math.round(data.y) } }
     });
  };
  const textBaseStyle = { position: 'absolute' as const, color: 'white', fontFamily: '"Cyberpunks Italic", sans-serif', whiteSpace: 'nowrap' as const, cursor: 'grab' as const, };

  // --- Save Coordinate Handler ---
  const handleSaveCoords = () => {
    console.log(`--- Current NFT Coordinates (Copy for coordMap) ---`);
    const output = Object.entries(nftPositions).reduce((acc, [key, pos]) => {
      const p = pos as PositionState;
      acc[key] = { x: p.x, y: p.y, fontSize: p.fontSize, ...(p.width != null && { width: p.width }), ...(p.height != null && { height: p.height }), };
      return acc;
    }, {} as Record<string, any>);
    console.log(JSON.stringify(output, null, 2));
    alert(`NFT Coordinates logged to browser console (Press F12)!`);
  };
  
  // --- Upload Handler (Placeholder) ---
  const handleInterfaceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          console.log(`Selected file: ${file.name}, Type: ${file.type}`);
          alert(`Uploading ${file.name} - Feature not implemented yet.`);
      }
      event.target.value = ''; 
  };

  // --- JSX ---
  return (
    <div className="p-4 bg-gray-800/50 text-white rounded-lg shadow-inner flex flex-col gap-4 min-w-0">
      {/* Interface Selection & Upload */} 
      <h2 className="text-2xl font-semibold text-pink-400 mb-4 text-center flex-shrink-0">
          NFT Card Layout Designer
      </h2>
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-900/30 p-3 rounded-md flex-shrink-0">
        <label htmlFor="nft-interface-select" className="text-sm text-gray-300 flex-shrink-0 mr-2">Select Interface:</label>
        <select 
           id="nft-interface-select"
           value={selectedNftInterface} 
           onChange={handleNftInterfaceChange} 
           disabled={isLoadingInterfaces || availableInterfaces.length === 0}
           className="flex-grow p-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50 min-w-0"
        >
            {isLoadingInterfaces && <option>Loading...</option>}
            {fetchError && <option>Error: {fetchError}</option>}
            {!isLoadingInterfaces && !fetchError && availableInterfaces.length === 0 && <option>No interfaces found</option>}
            {availableInterfaces.map(fileInfo => (
                <option key={`nft-${fileInfo.filename}`} value={fileInfo.filename}>{fileInfo.filename} ({fileInfo.width}x{fileInfo.height})</option> 
            ))}
        </select>
        <label htmlFor="nft-interface-upload" className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer transition-colors">
            Upload Interface Template
        </label>
        <input id="nft-interface-upload" type="file" accept=".png,.jpg,.jpeg" onChange={handleInterfaceUpload} className="hidden" />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 flex-grow min-h-0">
          {/* Left: Scaled Image Preview */} 
          <div 
            ref={nftPreviewContainerRef} 
            className="w-full xl:w-2/3 flex-shrink-0 overflow-hidden bg-gray-700 rounded relative" 
            style={{
                aspectRatio: nftCanvasDimensions.width && nftCanvasDimensions.height ? `${nftCanvasDimensions.width} / ${nftCanvasDimensions.height}` : '1 / 1.5' 
            }}
          >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: `${nftCanvasDimensions.width}px`, 
                height: `${nftCanvasDimensions.height}px`, 
                transform: `scale(${currentNftScale})`, 
                transformOrigin: 'top left' 
              }}>
                  <Image src={baseNftImageUrl} layout="fill" alt="Base NFT Background" priority unoptimized />
                  {selectedNftInterface && (
                      <Image 
                         key={`nft-overlay-${selectedNftInterface}`} 
                         src={`/assets/05 Interface/${selectedNftInterface}`}
                         layout="fill" 
                         alt="Selected Interface Overlay" 
                         priority 
                         unoptimized 
                         style={{ opacity: 0.9, pointerEvents: 'none' }} 
                         onError={(e) => { console.error(`Error loading NFT interface: ${selectedNftInterface}`); e.currentTarget.style.display='none'; }} 
                       />
                  )}
                  {/* Draggable Elements */} 
                  {Object.entries(nftPositions).map(([key, pos]) => {
                      const k = key as NftPositionKeys;
                      let textContent: string | number = k;
                      let displayAlign: CanvasTextAlign = 'left';
                      if (k === 'nameBox') { textContent = 'NAME'; } 
                      else if (k === 'numberBox') { textContent = '#NUM'; }
                      else if (k === 'seriesBox') { textContent = `#${sampleSeries}`; }
                      else if (k === 'qrCodeBox') { textContent = 'QR'; }
                      else if (k === 'strengthLabel') { textContent = `Strength ${sampleStats.strength}`; displayAlign = 'right'; }
                      else if (k === 'speedLabel')    { textContent = `Speed ${sampleStats.speed}`; displayAlign = 'right'; }
                      else if (k === 'skillLabel')    { textContent = `Skill ${sampleStats.skill}`; displayAlign = 'right'; }
                      else if (k === 'staminaLabel')  { textContent = `Stamina ${sampleStats.stamina}`; displayAlign = 'right'; }
                      else if (k === 'stealthLabel')  { textContent = `Stealth ${sampleStats.stealth}`; displayAlign = 'right'; }
                      else if (k === 'styleLabel')    { textContent = `Style ${sampleStats.style}`; displayAlign = 'right'; }
                      else if (k === 'strengthValue') { textContent = `S${sampleStats.strength}`; displayAlign = 'left'; }
                      else if (k === 'speedValue')    { textContent = `S${sampleStats.speed}`; displayAlign = 'left'; }
                      else if (k === 'skillValue')    { textContent = `S${sampleStats.skill}`; displayAlign = 'left'; }
                      else if (k === 'staminaValue')  { textContent = `S${sampleStats.stamina}`; displayAlign = 'left'; }
                      else if (k === 'stealthValue')  { textContent = `S${sampleStats.stealth}`; displayAlign = 'left'; }
                      else if (k === 'styleValue')    { textContent = `S${sampleStats.style}`; displayAlign = 'left'; }
                      else { return null; }
                      const isArea = k === 'qrCodeBox'; 
                      const isText = !isArea;
                      if (isArea) {
                        return (
                          <Draggable key={`nft-drag-${k}`} position={{ x: pos.x, y: pos.y }} onStop={handleDragStop(k)} bounds="parent">
                            <div style={{ position: 'absolute', width: `${pos.width!}px`, height: `${pos.height!}px`, border: '1px dashed red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${pos.fontSize}px`, color: 'red', cursor: 'grab', top: 0, left: 0, boxSizing: 'border-box' }}>{textContent}</div>
                          </Draggable>
                        );
                      }
                      return (
                        <Draggable key={`nft-drag-${k}`} position={{ x: pos.x, y: pos.y }} onStop={handleDragStop(k)} bounds="parent">
                          <div style={{ ...textBaseStyle, fontSize: `${pos.fontSize}px`, textAlign: displayAlign, top: 0, left: 0, padding: '2px', border: '1px dotted rgba(255,255,255,0.2)' }}>{textContent}</div>
                        </Draggable>
                      );
                  })}
              </div>
          </div>
          {/* Right: Controls */} 
          <div className="w-full xl:w-1/3 overflow-auto pr-2 bg-gray-900/50 p-4 rounded-md shadow-inner flex flex-col">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">NFT Position Controls</h3>
              <div className="flex-grow space-y-1 overflow-y-auto"> 
                  {Object.keys(initialNftCoords).map((key) => {
                      const k = key as NftPositionKeys;
                      const pos = nftPositions[k]; 
                      if (!pos) return null; 
                      return (
                          <PositionControl<NftPositionKeys> 
                             key={`nft-ctrl-${k}`} 
                             label={nftLabelMap[k] || k} 
                             pos={pos} 
                             setPos={updatePosition} 
                             itemKey={k} 
                             isTextElement={k !== 'qrCodeBox'} 
                             isAreaElement={k === 'qrCodeBox'} 
                           />
                      );
                  })}
              </div>
              <button onClick={handleSaveCoords} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md">Log NFT Coordinates</button>
          </div>
      </div>
    </div>
  );
};

export default NftCardDesigner; 