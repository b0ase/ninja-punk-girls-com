'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import DraggableCore, { DraggableData, DraggableEvent } from 'react-draggable';
import cn from 'classnames';
import { initialElementCoords, ElementPositionKeys } from '@/data/layout-constants';
import { useAssets } from '@/context/AssetContext';
import { AssetDetail } from '@/types';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import VectorElementCardNew from '@/components/VectorElementCardNew';

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
    // New vector card interface elements
    topBanner: "Top Banner",
    layerBanner: "Layer Banner",
    statBox1: "Stat Box 1 (Strength)",
    statBox2: "Stat Box 2 (Speed)",
    statBox3: "Stat Box 3 (Skill)",
    statBox4: "Stat Box 4 (Stamina)",
    statBox5: "Stat Box 5 (Stealth)",
    statBox6: "Stat Box 6 (Style)",
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
                 className="bg-gray-700 px-1 py-0.5 rounded w-20 text-[11px]" 
                 title="Background color (CSS color value)"
               />
               <label className="text-gray-400 text-[10px]">Radius:</label>
               <input 
                 type="number" 
                 value={pos.borderRadius ?? ''} 
                 placeholder="0" 
                 onChange={e => handleStyleChange('borderRadius', e.target.value)} 
                 className="bg-gray-700 px-1 py-0.5 rounded w-10 text-[11px]" 
                 min="0"
                 title="Border radius in pixels"
               />
               <label className="text-gray-400 text-[10px]">Align:</label>
               <select 
                 value={pos.textAlign ?? 'left'} 
                 onChange={e => handleStyleChange('textAlign', e.target.value)} 
                 className="bg-gray-700 px-1 py-0.5 rounded text-[11px]"
               >
                 <option value="left">Left</option>
                 <option value="center">Center</option>
                 <option value="right">Right</option>
               </select>
           </div>
        )}
      </div>
  );
};

// --- Main Component ---
interface ElementCardDesignerProps {
  selectedSeriesId?: string | null;
  onSaveLayout?: (layout: Record<ElementPositionKeys, PositionState>) => void;
  className?: string;
}

export default function ElementCardDesigner({ selectedSeriesId, onSaveLayout, className }: ElementCardDesignerProps) {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'layout' | 'vector'>('layout');
  
  // Define control order early so it can be used in state initialization
  const controlOrder: ElementPositionKeys[] = [
    'elementName', 'elementImage', 'seriesNumber', 'layerName', 'elementNumber',
    'rarity', 'strengthStat', 'speedStat', 'skillStat', 'staminaStat', 'stealthStat', 'styleStat', 'characterName',
    'topBanner', 'layerBanner', 'statBox1', 'statBox2', 'statBox3', 'statBox4', 'statBox5', 'statBox6'
  ];
  
  // Layout Designer State
  const [elementPositions, setElementPositions] = useState<Record<ElementPositionKeys, PositionState>>(initialElementCoords);
  const [sampleTexts, setSampleTexts] = useState<Record<ElementPositionKeys, string>>(() => {
    // Initialize with empty strings for all keys
    const initial: Record<ElementPositionKeys, string> = {} as Record<ElementPositionKeys, string>;
    controlOrder.forEach(key => {
      initial[key] = '';
    });
    return initial;
  });
  const [availableInterfaces, setAvailableInterfaces] = useState<InterfaceFileInfo[]>([]);
  const [selectedElementInterface, setSelectedElementInterface] = useState<string>('');
  const [elementCanvasDimensions, setElementCanvasDimensions] = useState<CanvasDimensions>(defaultElementDimensions);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const elementPreviewContainerRef = useRef<HTMLDivElement>(null);

  // Vector Cards State
  const { availableAssets, isInitialized, assetLoadingProgress } = useAssets();
  const [selectedLayer, setSelectedLayer] = useState<string>('21-Body'); // Use folder name that matches API
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'grid'>('cards');
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showIntegration, setShowIntegration] = useState<boolean>(false); // New state for side-by-side view
  const [filters, setFilters] = useState({
    rarity: '',
    character: '',
    genes: '',
    search: ''
  });

  // --- Layout Designer Logic ---
  // Auto-scale hook for preview
  const useAutoScale = (containerRef: React.RefObject<HTMLDivElement>, baseWidth: number) => {
    const [scale, setScale] = useState(1);
    
    useEffect(() => {
      const updateScale = () => {
        if (containerRef.current && baseWidth > 0) {
          const containerWidth = containerRef.current.offsetWidth;
          const newScale = Math.min(1, containerWidth / baseWidth);
          setScale(newScale);
        }
      };
      
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }, [containerRef, baseWidth]);
    
    return scale;
  };

  // Fetch interface files
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

  const handleSaveLayout = () => {
    console.log(`Saving Element Layout:`, elementPositions);
    if (onSaveLayout) {
      onSaveLayout(elementPositions);
    }
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

  // --- Vector Cards Logic ---
  // Get layer options from available assets (API response uses folder names as keys)
  const layerOptions = Object.keys(availableAssets).filter(layer => 
    !['29-Background', '28-Glow', '27-Banner', '26-Decals', '01-Logo', '02-Copyright', '03-Scores', '04-Team', '05-Interface', '06-Effects'].includes(layer)
  );

  const selectedAssets = availableAssets[selectedLayer] || [];

  // Comprehensive filtering
  const filteredAssets = selectedAssets.filter(asset => {
    if (filters.rarity && asset.rarity?.toLowerCase() !== filters.rarity.toLowerCase()) return false;
    if (filters.character && asset.character?.toLowerCase() !== filters.character.toLowerCase()) return false;
    if (filters.genes && asset.genes?.toLowerCase() !== filters.genes.toLowerCase()) return false;
    if (filters.search && !asset.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Get unique values for filter options
  const uniqueRarities = [...new Set(selectedAssets.map(asset => asset.rarity).filter(Boolean))];
  const uniqueCharacters = [...new Set(selectedAssets.map(asset => asset.character).filter(Boolean))];
  const uniqueGenes = [...new Set(selectedAssets.map(asset => asset.genes).filter(Boolean))];

  // Helper function for rarity colors
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#6b7280';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      case 'mythic': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderVectorCards = () => (
    <div className="space-y-6">
      {/* Layout Controls for Vector Cards */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Vector Card Layout Controls</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Interface Template Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Card Background Template</label>
            <select
              value={selectedElementInterface}
              onChange={(e) => setSelectedElementInterface(e.target.value)}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Interface Template</option>
              {availableInterfaces.map(interfaceFile => (
                <option key={interfaceFile.filename} value={interfaceFile.filename}>
                  {interfaceFile.filename} ({interfaceFile.width}x{interfaceFile.height})
                </option>
              ))}
            </select>
          </div>
          
          {/* Layout Scale */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Layout Scale: {Math.round(currentElementScale * 100)}%</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={currentElementScale}
              onChange={(e) => {
                // This will be handled by the useAutoScale hook
                // We'll update the preview container dimensions
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Vector Cards with Layout Designer Integration */}
      <div className="space-y-6">
        {/* Real-time Preview Section */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Real-time Layout Preview</h3>
          <p className="text-gray-300 text-sm mb-4">
            Changes made in the Layout Designer tab will automatically apply to all Vector Element Cards below.
          </p>
          
          {/* Live Preview Card */}
          <div className="flex justify-center">
            <VectorElementCardNew
              asset={filteredAssets[0] || {
                layer: selectedLayer,
                filename: 'preview.png',
                name: 'Preview Card',
                stats: { strength: 5, speed: 5, skill: 5, stamina: 5, stealth: 5, style: 5 },
                rarity: 'Preview'
              }}
              layerKey={selectedLayer}
              size="medium"
              showDetails={false}
              interfaceTemplate={selectedElementInterface}
              elementPositions={elementPositions}
              sampleTexts={sampleTexts}
              layoutScale={currentElementScale}
            />
          </div>
        </div>

        {/* Vector Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAssets.map((asset, index) => (
            <div key={`${asset.filename}-${index}`} className="flex justify-center">
              <VectorElementCardNew
                asset={asset}
                layerKey={selectedLayer}
                size={cardSize}
                showDetails={true}
                // Pass layout designer props for integration
                interfaceTemplate={selectedElementInterface}
                elementPositions={elementPositions}
                sampleTexts={sampleTexts}
                layoutScale={currentElementScale}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVectorTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-600">
          <tr>
            <th className="px-4 py-2 text-left text-white">Name</th>
            <th className="px-4 py-2 text-left text-white">Layer</th>
            <th className="px-4 py-2 text-left text-white">Rarity</th>
            <th className="px-4 py-2 text-left text-white">Character</th>
            <th className="px-4 py-2 text-left text-white">Genes</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.map((asset, index) => (
            <tr key={`${asset.filename}-${index}`} className="border-b border-gray-600 hover:bg-gray-600">
              <td className="px-4 py-2 text-white">{asset.name}</td>
              <td className="px-4 py-2 text-gray-300">{selectedLayer}</td>
              <td className="px-4 py-2">
                {asset.rarity && (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: getRarityColor(asset.rarity), color: 'white' }}
                  >
                    {asset.rarity}
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-300">{asset.character || '-'}</td>
              <td className="px-4 py-2 text-gray-300">{asset.genes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderVectorGrid = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
      {filteredAssets.map((asset, index) => (
        <div key={`${asset.filename}-${index}`} className="flex justify-center">
          <VectorElementCardNew
            asset={asset}
            layerKey={selectedLayer}
            size="small"
            showDetails={false}
            // Pass layout designer props for integration
            interfaceTemplate={selectedElementInterface}
            elementPositions={elementPositions}
            sampleTexts={sampleTexts}
            layoutScale={currentElementScale}
          />
        </div>
      ))}
    </div>
  );

  // --- JSX ---
  return (
    <div className={`${className} p-4 bg-gray-800/50 text-white rounded-lg shadow-inner flex flex-col gap-4 min-w-0`}>
      {/* Header with Tabs */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-cyan-400 mb-4">
          Element Card Designer - Rebuild Your Series
        </h2>
        
        {/* Tab Navigation */}
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'layout'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Layout Designer
          </button>
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'vector'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Vector Element Cards
          </button>
        </div>

        {/* Integration Toggle */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowIntegration(!showIntegration)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              showIntegration
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {showIntegration ? '🔄 Hide Integration View' : '🔗 Show Integration View'}
          </button>
        </div>

        {/* Integration View - Side by Side */}
        {showIntegration && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Layout Designer */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Layout Designer</h3>
              {/* Layout Designer Content */}
              <div className="space-y-4">
                {/* Interface Selection & Upload */}
                <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-900/30 p-3 rounded-md">
                  <select
                    value={selectedElementInterface}
                    onChange={(e) => setSelectedElementInterface(e.target.value)}
                    className="flex-1 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Interface Template</option>
                    {availableInterfaces.map(interfaceFile => (
                      <option key={interfaceFile.filename} value={interfaceFile.filename}>
                        {interfaceFile.filename} ({interfaceFile.width}x{interfaceFile.height})
                      </option>
                    ))}
                  </select>
                  <input
                    id="integration-interface-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleInterfaceUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('integration-interface-upload')?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Upload New
                  </button>
                </div>

                {/* Quick Text Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Element Name"
                    value={sampleTexts.elementName || ''}
                    onChange={(e) => handleSampleTextChange('elementName', e.target.value)}
                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Series Number"
                    value={sampleTexts.seriesNumber || ''}
                    onChange={(e) => handleSampleTextChange('seriesNumber', e.target.value)}
                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Vector Card Preview */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Live Vector Card Preview</h3>
              <div className="flex justify-center">
                {filteredAssets[0] ? (
                  <VectorElementCardNew
                    asset={filteredAssets[0]}
                    layerKey={selectedLayer}
                    size="medium"
                    showDetails={false}
                    interfaceTemplate={selectedElementInterface}
                    elementPositions={elementPositions}
                    sampleTexts={sampleTexts}
                    layoutScale={currentElementScale}
                  />
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <div className="text-2xl mb-2">🎴</div>
                    <div>Select a layer to see preview</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout Designer Tab Content */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          {/* Integration Notice */}
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">🎨 Layout Designer Integration</h3>
            <p className="text-blue-200 text-sm">
              Changes made here will automatically apply to all Vector Element Cards in the Vector Element Cards tab. 
              Position text elements, upload interface templates, and see your design applied in real-time to your element cards.
            </p>
          </div>
          {/* Interface Selection & Upload */}
          <div className="flex flex-col sm:flex-row gap-2 items-center bg-gray-900/30 p-3 rounded-md">
            <label htmlFor="element-interface-upload" className={cn(
                "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer transition-colors",
                { 'opacity-50 cursor-not-allowed': isUploading }
            )}>
                {isUploading ? 'Uploading...' : 'Upload Interface Template'}
            </label>
            <input
               id="element-interface-upload"
               type="file"
               accept=".png,.jpg,.jpeg"
               onChange={handleInterfaceUpload}
               className="hidden"
               disabled={isUploading}
             />

            <select
              value={selectedElementInterface}
              onChange={handleElementInterfaceChange}
              className="bg-gray-700 text-white rounded px-3 py-1.5 text-sm border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              disabled={isLoadingInterfaces}
            >
              {isLoadingInterfaces ? (
                <option>Loading interfaces...</option>
              ) : availableInterfaces.length === 0 ? (
                <option>No interfaces available</option>
              ) : (
                availableInterfaces.map(interfaceFile => (
                  <option key={interfaceFile.filename} value={interfaceFile.filename}>
                    {interfaceFile.filename} ({interfaceFile.width}x{interfaceFile.height})
                  </option>
                ))
              )}
            </select>

            {uploadError && (
              <div className="text-red-400 text-sm bg-red-900/20 px-2 py-1 rounded">
                {uploadError}
              </div>
            )}
          </div>

          {/* Main Layout Designer */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Left: Preview Canvas */}
            <div className="flex-1 bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Element Layout Preview</h3>
              <div 
                ref={elementPreviewContainerRef}
                className="relative mx-auto border border-gray-600 rounded overflow-hidden"
                style={{ 
                  width: elementCanvasDimensions.width * currentElementScale, 
                  height: elementCanvasDimensions.height * currentElementScale 
                }}
              >
                {/* Background Interface */}
                {selectedElementInterface && (
                  <Image
                    src={`/api/interface-files/${encodeURIComponent(selectedElementInterface)}`}
                    alt="Element interface background"
                    width={elementCanvasDimensions.width}
                    height={elementCanvasDimensions.height}
                    className="w-full h-full object-contain"
                    style={{ opacity: 0.9, pointerEvents: 'none' }} 
                    onError={(e) => { console.error(`Error loading Element interface: ${selectedElementInterface}`); e.currentTarget.style.display='none'; }} 
                 />
                )}
                {/* Draggable Elements */}
                {Object.entries(elementPositions).map(([key, pos]) => {
                   const k = key as ElementPositionKeys;
                   const textContent = sampleTexts[k] || k; 
                   const isArea = k === 'elementImage';
                   const isText = !isArea;

                   const hasContainer = isText && pos.width !== undefined && pos.height !== undefined;
                   
                   const containerStyle: React.CSSProperties = {
                        position: 'absolute',
                        top: `${pos.y * currentElementScale}px`,
                        left: `${pos.x * currentElementScale}px`,
                        width: `${(pos.width || 0) * currentElementScale}px`,
                        height: `${(pos.height || 0) * currentElementScale}px`,
                        backgroundColor: pos.backgroundColor, 
                        borderRadius: pos.borderRadius !== undefined ? `${pos.borderRadius * currentElementScale}px` : undefined,
                        display: 'flex',
                        padding: '2px 4px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                   };
                   
                   let justifyContent = 'flex-start';
                   if (pos.textAlign === 'center') justifyContent = 'center';
                   else if (pos.textAlign === 'right') justifyContent = 'flex-end';
                   containerStyle.justifyContent = justifyContent;
                   containerStyle.alignItems = 'center';
                   
                   const textStyle: React.CSSProperties = {
                       fontSize: `${pos.fontSize * currentElementScale}px`,
                       color: 'white',
                       fontFamily: '"Cyberpunks Italic", sans-serif',
                       whiteSpace: 'nowrap',
                   };

                   if (isArea) {
                      return (
                        <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                          <div style={{ ...containerStyle, border: '1px dashed cyan', cursor: 'grab', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{fontSize: '10px', color: 'cyan'}}>{textContent}</span>
                          </div>
                        </DraggableCore>
                      );
                   } else if (hasContainer) {
                       return (
                        <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                          <div style={{ ...containerStyle, cursor: 'grab' }}>
                             <span style={textStyle}>{textContent}</span>
                          </div>
                        </DraggableCore>
                       );
                   } else {
                       return (
                          <DraggableCore key={`element-drag-${k}`} onDrag={handlePreviewDrag(k)} >
                             <div style={{ 
                                 position: 'absolute', 
                                 top: `${pos.y * currentElementScale}px`, 
                                 left: `${pos.x * currentElementScale}px`, 
                                 ...textStyle,
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

            {/* Right: Controls */}
            <div className="w-full xl:w-1/3 overflow-hidden bg-gray-900/50 p-4 rounded-md shadow-inner flex flex-col">
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Element Position Controls</h3>
                <button onClick={handleSaveLayout} className="mb-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md">
                   Save Element Layout
                </button>
                <div className="flex-grow space-y-1 overflow-y-auto pr-2">
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
      )}

      {/* Vector Element Cards Tab */}
      {activeTab === 'vector' && (
        <div className="space-y-6">
          {!isInitialized ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Loading Vector Element Cards...</h3>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${assetLoadingProgress}%` }}
                  ></div>
                </div>
                <div className="text-center text-gray-400">
                  Loading assets... {assetLoadingProgress}%
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Layer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Layer</label>
                    <select
                      value={selectedLayer}
                      onChange={(e) => setSelectedLayer(e.target.value)}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {layerOptions.map(layer => (
                        <option key={layer} value={layer}>
                          {layer} ({availableAssets[layer]?.length || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* View Mode */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">View Mode</label>
                    <div className="flex space-x-2">
                      {(['cards', 'table', 'grid'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            viewMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Size (for cards view) */}
                  {viewMode === 'cards' && (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Card Size</label>
                      <div className="flex space-x-2">
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => setCardSize(size)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              cardSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Search</label>
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Rarity</label>
                    <select
                      value={filters.rarity}
                      onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Rarities</option>
                      {uniqueRarities.map(rarity => (
                        <option key={rarity} value={rarity}>{rarity}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Character</label>
                    <select
                      value={filters.character}
                      onChange={(e) => setFilters(prev => ({ ...prev, character: e.target.value }))}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Characters</option>
                      {uniqueCharacters.map(character => (
                        <option key={character} value={character}>{character}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Genes</label>
                    <select
                      value={filters.rarity}
                      onChange={(e) => setFilters(prev => ({ ...prev, genes: e.target.value }))}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Genes</option>
                      {uniqueGenes.map(genes => (
                        <option key={genes} value={genes}>{genes}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(filters.search || filters.rarity || filters.character || filters.genes) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-300">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => 
                      value && (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white"
                        >
                          {key}: {value}
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                            className="ml-1 hover:bg-blue-700 rounded-full w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                    <button
                      onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-6">
                {viewMode === 'cards' && renderVectorCards()}
                {viewMode === 'table' && renderVectorTable()}
                {viewMode === 'grid' && renderVectorGrid()}
              </div>

              {/* Layer Overview */}
              <div className="mt-8 bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-4">Layer Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {layerOptions.map(layer => (
                    <div
                      key={layer}
                      onClick={() => setSelectedLayer(layer)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedLayer === layer
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{layer}</div>
                      <div className="text-xs opacity-75">
                        {availableAssets[layer]?.length || 0} assets
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 