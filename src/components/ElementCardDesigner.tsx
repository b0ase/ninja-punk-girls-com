'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import DraggableCore, { DraggableData, DraggableEvent } from 'react-draggable';
import cn from 'classnames';
import { initialElementCoords, ElementPositionKeys } from '@/data/layout-constants';

// --- Shared Interfaces & Types ---
export interface PositionState {
  x: number; 
  y: number; 
  fontSize: number;
  width?: number; // Now applicable to text containers too
  height?: number; // Now applicable to text containers too
  backgroundColor?: string; // e.g., 'rgba(0,0,0,0.5)' or '#FFFFFF'
  borderRadius?: number; // e.g., 5 (pixels)
  textAlign?: 'left' | 'center' | 'right'; // Alignment within the container
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

export interface InterfaceFileInfo {
  filename: string;
  width: number;
  height: number;
}

// --- Element Specific Data (Expanded) ---
const elementLabelMap: Record<ElementPositionKeys, string> = {
    elementName: "Element Name",
    elementImage: "Element Image Area",
    seriesNumber: "Series Number (#)",
    layerName: "Layer Name",
    elementNumber: "Element Number (#)",
    rarity: "Rarity Text",
    strengthStat: "Strength Stat (S1)",
    speedStat: "Speed Stat (S2)",
    skillStat: "Skill Stat (S3)",
    staminaStat: "Stamina Stat (S4)",
    stealthStat: "Stealth Stat (S5)",
    styleStat: "Style Stat (S6)",
    characterName: "Character Name",
};
const defaultElementDimensions: CanvasDimensions = { width: 400, height: 600 }; // Example smaller dimensions

// --- Shared Position Control Component (Updated) ---
interface PositionControlProps<T extends string> {
  label: string;
  pos: PositionState;
  setPos: (key: T, newPos: PositionState) => void;
  itemKey: T;
  isTextElement: boolean;
  isAreaElement: boolean;
  sampleText?: string; 
  onSampleTextChange?: (newText: string) => void;
}
const PositionControl = <T extends string>({ 
  label, pos, setPos, itemKey, 
  isTextElement, isAreaElement, 
  sampleText, onSampleTextChange 
}: PositionControlProps<T>) => {
  const handleStyleChange = (prop: keyof PositionState, value: string | number | undefined) => {
    let newPos = { ...pos };

    // <<< Refined type handling for each property >>>
    switch (prop) {
        case 'x':
        case 'y':
        case 'fontSize':
        case 'width':
        case 'height':
        case 'borderRadius':
            const numValue = typeof value === 'string' ? parseInt(value) : value;
            const finalNumValue = (value === '' || value === undefined || isNaN(numValue as number)) ? undefined : numValue;
            // Prevent negative radius
            if (prop === 'borderRadius' && finalNumValue !== undefined && finalNumValue < 0) {
                 newPos = { ...newPos, [prop]: 0 };
            } else {
                 newPos = { ...newPos, [prop]: finalNumValue };
            }
            break;
        case 'backgroundColor':
            newPos = { ...newPos, [prop]: value === '' ? undefined : String(value) }; // Ensure string or undefined
            break;
        case 'textAlign':
            const validAlign = ['left', 'center', 'right'].includes(String(value)) ? value as 'left' | 'center' | 'right' : undefined;
            newPos = { ...newPos, [prop]: validAlign }; // Ensure valid value or undefined
            break;
    }
    setPos(itemKey, newPos);
  };
  
  return (
      <div className="p-1.5 border border-gray-700 rounded mb-1.5 flex flex-col gap-1 text-xs bg-gray-800/30">
        {/* Row 1: Label and Sample Text Input */}
        <div className="flex justify-between items-center gap-1">
          <span className="font-semibold text-teal-400 truncate flex-shrink text-xs" title={label}>{label}:</span>
          {isTextElement && onSampleTextChange && (
            <input
              type="text"
              value={sampleText ?? ''}
              onChange={e => onSampleTextChange(e.target.value)}
              placeholder="Sample"
              className="bg-gray-600 p-0.5 rounded text-[11px] flex-grow min-w-0"
              title="Edit sample text shown in preview"
            />
          )}
        </div>
        {/* Row 2: Position/Size Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
            <label className="text-gray-400 text-[10px]">X:</label>
            <input type="number" value={pos.x} onChange={e => handleStyleChange('x', e.target.value)} className="bg-gray-700 px-1 py-0.5 rounded w-12 text-[11px]" />
            <label className="text-gray-400 text-[10px]">Y:</label>
            <input type="number" value={pos.y} onChange={e => handleStyleChange('y', e.target.value)} className="bg-gray-700 px-1 py-0.5 rounded w-12 text-[11px]" />
            {isTextElement && (
                <>
                    <label className="text-gray-400 text-[10px]">Size:</label>
                    <input type="number" value={pos.fontSize} onChange={e => handleStyleChange('fontSize', e.target.value)} className="bg-gray-700 px-1 py-0.5 rounded w-10 text-[11px]" min="1" />
                </>
            )}
            {(isAreaElement || isTextElement) && (
                <>
                    <label className="text-gray-400 text-[10px]">W:</label>
                    <input type="number" value={pos.width ?? ''} placeholder="auto" onChange={e => handleStyleChange('width', e.target.value)} className="bg-gray-700 px-1 py-0.5 rounded w-10 text-[11px]" min="1" />
                    <label className="text-gray-400 text-[10px]">H:</label>
                    <input type="number" value={pos.height ?? ''} placeholder="auto" onChange={e => handleStyleChange('height', e.target.value)} className="bg-gray-700 px-1 py-0.5 rounded w-10 text-[11px]" min="1" />
                </>
            )}
        </div>
         {/* Row 3: Container Styling Controls */} 
        {isTextElement && (
           <div className="flex items-center gap-1.5 flex-wrap border-t border-gray-700/50 pt-1 mt-1">
               <label className="text-gray-400 text-[10px]">BG:</label>
               <input 
                 type="text" 
                 value={pos.backgroundColor ?? ''} 
                 placeholder="rgba(0,0,0,0.5)" 
                 onChange={e => handleStyleChange('backgroundColor', e.target.value)} 
                 className="bg-gray-700 px-1 py-0.5 rounded w-24 text-[11px]"
                 title="Background Color (CSS format)" 
               />
               <label className="text-gray-400 text-[10px]">Radius:</label>
               <input 
                  type="number" 
                  value={pos.borderRadius ?? ''} 
                  placeholder="0" 
                  onChange={e => handleStyleChange('borderRadius', e.target.value)} 
                  className="bg-gray-700 px-1 py-0.5 rounded w-10 text-[11px]" 
                  min="0"
                  title="Border Radius (px)" 
                />
                <label className="text-gray-400 text-[10px]">Align:</label>
                <select 
                   value={pos.textAlign ?? 'left'} 
                   onChange={e => handleStyleChange('textAlign', e.target.value)} 
                   className="bg-gray-700 px-1 py-0.5 rounded text-[11px]"
                   title="Text Alignment within container"
                 >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
           </div>
        )}
        {/* Display Coordinates */}
        <div className="text-cyan-400 text-[9px] mt-0.5 opacity-75">
          (X:{pos.x}, Y:{pos.y}{pos.width !== undefined ? `, W:${pos.width}`:''}{pos.height !== undefined ? `, H:${pos.height}`:''}{isTextElement ? `, Size:${pos.fontSize}` : ''})
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

// Define the props for the ElementCardDesigner component
export interface ElementCardDesignerProps { // Export if needed elsewhere
  initialLayout: Record<ElementPositionKeys, PositionState>;
  onSaveLayout: (newLayout: Record<ElementPositionKeys, PositionState>) => void;
  selectedSeriesId: string | null; // Add this prop
}

// --- Element Card Designer Component ---
const ElementCardDesigner: React.FC<ElementCardDesignerProps> = ({ 
  initialLayout,
  onSaveLayout,
  selectedSeriesId // Destructure the new prop
}) => {
  // --- State ---
  const [availableInterfaces, setAvailableInterfaces] = useState<InterfaceFileInfo[]>([]); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState<boolean>(true);
  const [elementPositions, setElementPositions] = useState<Record<ElementPositionKeys, PositionState>>(initialLayout);
  const elementPreviewContainerRef = useRef<HTMLDivElement>(null);
  const [selectedElementInterface, setSelectedElementInterface] = useState<string>('');
  const [elementCanvasDimensions, setElementCanvasDimensions] = useState<CanvasDimensions>(defaultElementDimensions);
  const baseElementImageUrl = "/placeholder-element-bg.png";
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // --- Sample Data (Expanded) ---
  const sampleElementName = "Plasma Sword";
  const sampleSeries = "II";
  const sampleLayer = "Right-Weapon";
  const sampleNumber = "#015";
  const sampleRarity = "Rare (150/999)";
  const sampleS6 = { strength: 12, speed: 5, skill: 8, stamina: 0, stealth: 0, style: 9 };
  const sampleCharacter = "Ryder"; // Optional

  // --- Initial Sample Data & Control Order ---
  const generateInitialSampleTexts = useCallback(() => {
    const sampleS6 = { strength: 12, speed: 5, skill: 8, stamina: 0, stealth: 0, style: 9 };
    const sampleCharacter = "Ryder";
    return {
      elementName: "Plasma Sword",
      elementImage: "IMG", // Not editable text
      seriesNumber: `#II`,
      layerName: "Right-Weapon",
      elementNumber: "#015",
      rarity: "Rare (150/999)",
      strengthStat: `Strength ${sampleS6.strength}`,
      speedStat: `Speed ${sampleS6.speed}`,
      skillStat: `Skill ${sampleS6.skill}`,
      staminaStat: `Stamina ${sampleS6.stamina}`,
      stealthStat: `Stealth ${sampleS6.stealth}`,
      styleStat: `Style ${sampleS6.style}`,
      characterName: sampleCharacter ? `Char: ${sampleCharacter}` : 'Char: -',
    } as Record<ElementPositionKeys, string>; // Assert type
  }, []);

  const [sampleTexts, setSampleTexts] = useState<Record<ElementPositionKeys, string>>(generateInitialSampleTexts());
  
  // <<< Define static control order (remove state management for it) >>>
  const controlOrder: ElementPositionKeys[] = [
    'characterName', 'elementName', 'seriesNumber', 'layerName', 
    'elementNumber', 'rarity', 'elementImage', 'strengthStat', 'speedStat', 
    'skillStat', 'staminaStat', 'stealthStat', 'styleStat'
  ];

  // --- Effects ---
  useEffect(() => {
    setElementPositions(initialLayout);
  }, [initialLayout]);

  useEffect(() => {
    setSampleTexts(generateInitialSampleTexts());
  }, [generateInitialSampleTexts]);

  // Fetch Interfaces Effect
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
          setSelectedElementInterface(firstInterface.filename);
          setElementCanvasDimensions({ width: firstInterface.width, height: firstInterface.height });
        } else {
           setElementCanvasDimensions(defaultElementDimensions);
        }
      } catch (err: any) {
        console.error("Failed to fetch Element interface files:", err);
        setFetchError(err.message);
         setElementCanvasDimensions(defaultElementDimensions);
      } finally {
        setIsLoadingInterfaces(false);
      }
    };
    fetchInterfaces();
  }, []);

  // --- Handlers ---
  const handleSampleTextChange = useCallback((key: ElementPositionKeys, newText: string) => {
    setSampleTexts(prev => ({ ...prev, [key]: newText }));
  }, []);

  const updatePosition = (key: ElementPositionKeys, newPos: PositionState) => {
    setElementPositions(prev => ({ ...prev, [key]: newPos }));
  };
  
  // Use DraggableCore for preview elements to avoid conflicts
  const handlePreviewDrag = (key: ElementPositionKeys) => (e: DraggableEvent, data: DraggableData) => {
     setElementPositions(prev => {
       const current = prev[key];
       if (!current) return prev;
       // Calculate new position based on delta
       const newX = Math.round(current.x + data.deltaX);
       const newY = Math.round(current.y + data.deltaY);
       const existingSize = current.width !== undefined ? { width: current.width, height: current.height } : {};
       return { ...prev, [key]: { ...current, x: newX, y: newY, fontSize: current.fontSize, ...existingSize } };
     });
  };
  const textBaseStyle = { position: 'absolute' as const, color: 'white', fontFamily: '"Cyberpunks Italic", sans-serif', whiteSpace: 'nowrap' as const, cursor: 'grab' as const, };

  const handleSaveLayout = () => {
    console.log(`Saving Element Layout:`, elementPositions);
    onSaveLayout(elementPositions);
    alert('Element layout positions saved!');
  };
  
  const handleInterfaceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Basic client-side validation (optional but recommended)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
          setUploadError('Invalid file type. Please upload PNG, JPG, or JPEG.');
          return;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
          setUploadError('File is too large. Maximum size is 10MB.');
          return;
      }

      setIsUploading(true);
      setUploadError(null);
      console.log(`Uploading file: ${file.name}`);

      const formData = new FormData();
      formData.append('file', file); // API expects the file under the key 'file'

      try {
          const response = await fetch('/api/upload-interface', {
              method: 'POST',
              body: formData,
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
              throw new Error(result.error || `Upload failed with status: ${response.status}`);
          }

          console.log('Upload successful:', result.file);

          // Add the new file to the list and select it
          const newFileInfo: InterfaceFileInfo = result.file;
          setAvailableInterfaces(prev => {
              // Avoid duplicates if the same file is uploaded again somehow
              const exists = prev.some(f => f.filename === newFileInfo.filename);
              return exists ? prev : [...prev, newFileInfo];
          });
          setSelectedElementInterface(newFileInfo.filename);
          setElementCanvasDimensions({ width: newFileInfo.width, height: newFileInfo.height });

      } catch (err: any) {
          console.error("Upload failed:", err);
          setUploadError(err.message || 'An unknown error occurred during upload.');
      } finally {
          setIsUploading(false);
          // Clear the file input value so the same file can be selected again if needed
          event.target.value = '';
      }
  };

  const handleElementInterfaceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const filename = event.target.value;
    setSelectedElementInterface(filename);
    const selectedInfo = availableInterfaces.find(f => f.filename === filename);
    if (selectedInfo) {
      setElementCanvasDimensions({ width: selectedInfo.width, height: selectedInfo.height });
    }
  };

  const currentElementScale = useAutoScale(elementPreviewContainerRef, elementCanvasDimensions.width);

  // --- JSX ---
  return (
    <div className="p-4 bg-gray-800/50 text-white rounded-lg shadow-inner flex flex-col gap-4 min-w-0">
      {/* <<< Add Tab Title >>> */}
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4 text-center flex-shrink-0">
          Element Card Layout Designer
      </h2>
      {/* <<< END Tab Title >>> */}

      {/* Interface Selection & Upload - Rearranged */}
       <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-900/30 p-3 rounded-md">
        {/* Upload Button (Moved First) */}
        <label htmlFor="element-interface-upload" className={cn(
            "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer transition-colors",
            { 'opacity-50 cursor-not-allowed': isUploading } // Disable visually during upload
        )}>
            {isUploading ? 'Uploading...' : 'Upload Interface Template'}
        </label>
        <input
           id="element-interface-upload"
           type="file"
           accept=".png,.jpg,.jpeg"
           onChange={handleInterfaceUpload}
           className="hidden"
           disabled={isUploading} // Disable functionally during upload
         />

        {/* Select Dropdown (Moved Second) */}
        <label htmlFor="element-interface-select" className="text-sm text-gray-300 flex-shrink-0 mr-2 sm:ml-2">Select Interface:</label>
        <select
           id="element-interface-select"
           value={selectedElementInterface}
           onChange={handleElementInterfaceChange}
           disabled={isLoadingInterfaces || availableInterfaces.length === 0 || isUploading}
           className="flex-grow p-1.5 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 min-w-0"
        >
            {isLoadingInterfaces && <option>Loading...</option>}
            {fetchError && <option>Error fetching: {fetchError}</option>}
            {!isLoadingInterfaces && !fetchError && availableInterfaces.length === 0 && <option>No interfaces found</option>}
            {availableInterfaces.map(fileInfo => (
                <option key={`element-${fileInfo.filename}`} value={fileInfo.filename}>{fileInfo.filename} ({fileInfo.width}x{fileInfo.height})</option>
            ))}
        </select>
      </div>
      {/* Display Upload Error */}
      {uploadError && (
          <p className="text-red-500 text-sm bg-red-900/30 p-2 rounded">Upload Error: {uploadError}</p>
      )}

      <div className="flex flex-col xl:flex-row gap-4 flex-grow min-h-0">
          {/* Left: Scaled Image Preview */} 
          <div 
            ref={elementPreviewContainerRef} 
            className="w-full xl:w-2/3 flex-shrink-0 overflow-hidden bg-gray-700 rounded relative" 
            style={{ 
              aspectRatio: elementCanvasDimensions.width && elementCanvasDimensions.height ? `${elementCanvasDimensions.width} / ${elementCanvasDimensions.height}` : `${defaultElementDimensions.width} / ${defaultElementDimensions.height}` 
            }}
          > 
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: `${elementCanvasDimensions.width}px`, 
                height: `${elementCanvasDimensions.height}px`, 
                transform: `scale(${currentElementScale})`, 
                transformOrigin: 'top left' 
              }}>
                  <Image src={baseElementImageUrl} layout="fill" alt="Base Element Card Background" priority unoptimized />
                  {selectedElementInterface && (
                       <Image 
                           key={`element-overlay-${selectedElementInterface}`} 
                           src={`/assets/05 Interface/${selectedElementInterface}`}
                           layout="fill" 
                           alt="Selected Element Interface Overlay" 
                           priority 
                           unoptimized 
                           style={{ opacity: 0.9, pointerEvents: 'none' }} 
                           onError={(e) => { console.error(`Error loading Element interface: ${selectedElementInterface}`); e.currentTarget.style.display='none'; }} 
                        />
                  )}
                  {/* Draggable Elements (Use Containers) */} 
                  {Object.entries(elementPositions).map(([key, pos]) => {
                       const k = key as ElementPositionKeys;
                       const textContent = sampleTexts[k] || k; 
                       const isArea = k === 'elementImage';
                       const isText = !isArea;

                       // <<< Updated Rendering Logic >>>
                       const hasContainer = isText && pos.width !== undefined && pos.height !== undefined;
                       
                       const containerStyle: React.CSSProperties = {
                            position: 'absolute',
                            top: `${pos.y}px`,
                            left: `${pos.x}px`,
                            width: `${pos.width}px`,
                            height: `${pos.height}px`,
                            backgroundColor: pos.backgroundColor, 
                            borderRadius: pos.borderRadius !== undefined ? `${pos.borderRadius}px` : undefined,
                            display: 'flex', // Use flex to align text inside
                            padding: '2px 4px', // Add some padding
                            boxSizing: 'border-box',
                            overflow: 'hidden', // Prevent text overflow
                       };
                       
                       // Determine text alignment for flexbox
                       let justifyContent = 'flex-start'; // default left
                       if (pos.textAlign === 'center') justifyContent = 'center';
                       else if (pos.textAlign === 'right') justifyContent = 'flex-end';
                       containerStyle.justifyContent = justifyContent;
                       containerStyle.alignItems = 'center'; // Vertically center
                       
                       const textStyle: React.CSSProperties = {
                           fontSize: `${pos.fontSize}px`,
                           color: 'white', // Assuming white text, could be configurable later
                           fontFamily: '"Cyberpunks Italic", sans-serif',
                           whiteSpace: 'nowrap',
                           // Text alignment is handled by container's flex properties
                       };

                       if (isArea) {
                          // Render Image Area (largely unchanged, but using DraggableCore)
                          return (
                            <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                              <div style={{ ...containerStyle, border: '1px dashed cyan', cursor: 'grab', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{fontSize: '10px', color: 'cyan'}}>{textContent}</span> { /* Simple placeholder */}
                              </div>
                            </DraggableCore>
                          );
                       } else if (hasContainer) {
                           // Render Text with Container
                           return (
                            <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                              <div style={{ ...containerStyle, cursor: 'grab' }}>
                                 <span style={textStyle}>{textContent}</span>
                              </div>
                            </DraggableCore>
                           );
                       } else {
                           // Render Plain Text (no container)
                           return (
                              <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                                 <div style={{ 
                                     position: 'absolute', 
                                     top: `${pos.y}px`, 
                                     left: `${pos.x}px`, 
                                     ...textStyle, // Apply text styles directly
                                     padding: '2px', 
                                     border: '1px dotted rgba(100,200,255,0.3)', 
                                     cursor: 'grab' 
                                  }}>
                                    {textContent}
                                 </div>
                              </DraggableCore>
                           );
                       }
                  })}
              </div>
          </div>
          {/* Right: Controls (Static Order) */} 
          <div className="w-full xl:w-1/3 overflow-hidden bg-gray-900/50 p-4 rounded-md shadow-inner flex flex-col">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Element Position Controls</h3>
              <button onClick={handleSaveLayout} className="mb-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md">
                 Save Element Layout
              </button>
              <div 
                className="flex-grow space-y-1 overflow-y-auto pr-2"
              >
                {controlOrder.map((key) => {
                  const k = key as ElementPositionKeys;
                  const pos = elementPositions[k];
                  if (!pos) return null;
                  const isTextElement = k !== 'elementImage';
                  
                  return (
                      <PositionControl<ElementPositionKeys>
                        key={`element-ctrl-${k}`}
                        label={elementLabelMap[k] || k}
                        pos={pos}
                        setPos={updatePosition}
                        itemKey={k}
                        isTextElement={isTextElement}
                        isAreaElement={k === 'elementImage'}
                        sampleText={sampleTexts[k]}
                        onSampleTextChange={isTextElement ? (newText) => handleSampleTextChange(k, newText) : undefined}
                      />
                  );
                })}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ElementCardDesigner; 