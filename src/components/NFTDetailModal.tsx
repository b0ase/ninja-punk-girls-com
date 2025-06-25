'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { NFTAttribute, NFTType } from '@/types';
import NFTCanvas from './NFTCanvas';
import ErrorBoundary from './ErrorBoundary';
import { Button, Modal, Typography, Box, Grid, Divider, CircularProgress, IconButton } from '@mui/material';
import Image from 'next/image';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { toast } from 'react-hot-toast';
import { LAYER_DETAILS } from '@/data/layer-config';
import ElementDetailModal from './ElementDetailModal';
import CompositedElementCard from './CompositedElementCard';
import { getCardBackgroundPath, getElementAssetUrl } from '@/lib/utils';

// Type for the element card background mapping
interface ElementCardBG {
  name: string; // e.g., "Background", "Body"
  path: string; // e.g., "/element_cards/Background.jpg"
}

// Type for the fetched element card file data
interface ElementCardFile {
  name: string; 
  path: string; 
}

interface NFTDetailModalProps {
  nft: NFTType; 
  onClose: () => void;
  // Handlers
  onListNFT: (identifier: string) => void;
  onDelistNFT: (identifier: string) => void;
  onSendNFT: (identifier: string) => void;
  onOpenMeltConfirm: (identifier: string) => void;
  onBurnNFT: (identifier: string) => void;
  onPriceChange: (identifier: string, price: string) => void;
  onRecipientChange: (identifier: string, handle: string) => void;
  // State
  itemIdentifier: string | null; // The identifier (origin or id) of the NFT
  isListed: boolean;
  listPrice: string;
  recipientHandle: string;
  isSending: boolean;
  isMelting: boolean;
  isBurning: boolean;
  actionError: string | null;
  actionSuccess: string | null;
}

// Structure for element assets extracted from NFT attributes
interface ElementAsset {
  name: string;
  type: string;
  assetUrl: string; // URL to the element image
  cardBackground: string; // URL to the card background
  rarity: string;
  layer: string;
}

const NFTDetailModal: React.FC<NFTDetailModalProps> = ({ 
  nft, 
  onClose, 
  // Destructure new props
  itemIdentifier,
  isListed,
  listPrice,
  recipientHandle,
  isSending,
  isMelting,
  isBurning,
  actionError,
  actionSuccess,
  onListNFT,
  onDelistNFT,
  onSendNFT,
  onOpenMeltConfirm,
  onBurnNFT,
  onPriceChange,
  onRecipientChange
}) => {

  // <<< Log the prop immediately on render >>>
  console.log("[NFTDetailModal Render] Rendering modal.");
  console.log("[NFTDetailModal Render] Received nft prop:", nft);
  console.log("[NFTDetailModal Render] Attributes from prop:", nft?.attributes);
  // <<< End logging >>>

  // State for element card *background* mapping
  const [elementCardBackgrounds, setElementCardBackgrounds] = useState<Record<string, string>>({}); // Map name -> path
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState<boolean>(true);
  const [backgroundFetchError, setBackgroundFetchError] = useState<string | null>(null);
  
  // Fetch element card background mappings on mount
  useEffect(() => {
    const fetchBackgrounds = async () => {
      setIsLoadingBackgrounds(true);
      setBackgroundFetchError(null);
      try {
        const params = new URLSearchParams({
          directory: 'public/element_cards', // Directory containing card backgrounds
          fileType: 'jpg' // Assuming they are jpg
        });
        const apiUrl = `/api/interface-files?${params.toString()}`;
        console.log(`[NFTDetailModal] Fetching element card backgrounds from: ${apiUrl}`);

        const response = await fetch(apiUrl, { method: 'GET' }); 
        
        if (!response.ok) {
          throw new Error(`HTTP error fetching backgrounds! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.files)) {
          const backgroundMap: Record<string, string> = {};
          data.files.forEach((file: any) => {
            // Assuming file.name is like "Background.jpg", extract "Background"
            const nameWithoutExtension = file.name.split('.')[0]; 
            backgroundMap[nameWithoutExtension] = file.path; // Store mapping: "Background" -> "/element_cards/Background.jpg"
          });
          setElementCardBackgrounds(backgroundMap);
          console.log('[NFTDetailModal] Element card background map:', backgroundMap);
        } else {
          throw new Error(data.error || 'Invalid response structure for backgrounds');
        }
      } catch (error: any) {
        console.error("Error fetching element card backgrounds:", error);
        setBackgroundFetchError(error.message || 'Failed to load element card backgrounds.');
        setElementCardBackgrounds({});
      } finally {
        setIsLoadingBackgrounds(false);
      }
    };

    fetchBackgrounds();
  }, []); 

  // Define layers NOT to show as individual element cards in the modal
  const NON_DISPLAY_LAYERS = useMemo(() => new Set([
    'BACKGROUND', 
    'GLOW', 
    'BANNER', 
    'DECALS', 
    'TEAM', 
    'LOGO', 
    'INTERFACE', 
    'SCORES', 
    'COPYRIGHT',
    'EFFECTS'
    // Add any other layers that are part of the NFT but not shown as separate elements
  ]), []);

  console.log("[NFTDetailModal Render] Before useMemo calculation for nftElements."); // Added log before useMemo

  // Use the corrected filtering logic based on NON_DISPLAY_LAYERS
  const nftElements = useMemo(() => {
    // Log the attributes array *before* filtering
    console.log("[NFTDetailModal useMemo] Attributes received:", nft?.attributes);

    if (!nft?.attributes || nft.attributes.length === 0) { // Check length explicitly
        console.log("[NFTDetailModal useMemo] Attributes array is null, undefined, or empty. Returning [].");
        return [];
    }
    
    const filtered = nft.attributes.filter(attr => {
        // Check if the layer should be displayed
        const shouldDisplayLayer = !NON_DISPLAY_LAYERS.has(attr.layer);
        // Check if we have enough data to display the element
        const hasImageData = !!(attr.fullFilename || attr.imageUrl || (attr.layer && attr.metadata?.elementName)); // Explicit boolean conversion
        const hasName = !!(attr.metadata?.elementName || attr.elementNameForAssetField); // Explicit boolean conversion

        // <<< ADDED DEBUG LOGGING INSIDE FILTER >>>
        console.log(`[NFTDetailModal Filter] Processing Layer: ${attr.layer}, ` +
                    `shouldDisplay: ${shouldDisplayLayer}, ` +
                    `hasImage: ${hasImageData}, ` +
                    `hasName: ${hasName}, ` +
                    `Result: ${shouldDisplayLayer && hasImageData && hasName}`);
        // <<< END DEBUG LOGGING >>>

        // Keep the attribute if it's displayable and has the necessary data
        return shouldDisplayLayer && hasImageData && hasName;
    });

    console.log("[NFTDetailModal useMemo] Filtered result:", filtered); // Log the result *after* filtering
    return filtered;

  }, [nft, NON_DISPLAY_LAYERS]); // Added NON_DISPLAY_LAYERS dependency

  // console.log("[NFTDetailModal] Filtered nftElements:", nftElements); // Moved logging inside useMemo

  if (!nft || !itemIdentifier) return null; // <<< Ensure itemIdentifier exists

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine if any action is currently loading for this item
  const isLoadingAction = isSending || isMelting || isBurning;

  // Helper function to get background path
  const getCardBackgroundPath = (layerName: string, backgroundMap: Record<string, string>): string => {
    // layerName is now like "BODY_SKIN", "RIGHT_WEAPON"
    const layerDetail = LAYER_DETAILS[layerName];

    if (!layerDetail || !layerDetail.number) {
        console.warn(`[getCardBackgroundPath] Could not find layer number in LAYER_DETAILS for key: ${layerName}`);
        return '/placeholder-element-card.png'; // Cannot proceed without number
    }

    // Construct the expected filename format (e.g., "21_body.jpg", "25_behind.jpg")
    const layerNumber = layerDetail.number;
    // SPECIAL CASE: If layerName is BODY_SKIN, use 'body' for filename
    const baseName = (layerName === 'BODY_SKIN') 
        ? 'body' 
        : layerName.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    const targetFilename = `${layerNumber}_${baseName}.jpg`;
    const expectedPathEnd = `/element_cards/${targetFilename}`;

    // console.log(`[getCardBackgroundPath] Searching for background ending with: ${expectedPathEnd}`); // Optional debug log

    // Search the fetched backgrounds map for the path ending with the target filename
    const foundPath = Object.values(backgroundMap).find(p => p.endsWith(expectedPathEnd));

    if (foundPath) {
       // console.log(`[getCardBackgroundPath] Found background: ${foundPath}`); // Optional debug log
        return foundPath;
    }

    // If not found, log warning and return placeholder
    console.warn(`[getCardBackgroundPath] Could not find background image matching pattern *${expectedPathEnd}. Available:`, backgroundMap);
    return '/placeholder-element-card.png';
  };

  // Helper function to get element asset URL
  const getElementAssetUrl = (attr: NFTAttribute): string => {
    // 1. Prioritize direct imageUrl if available
    if (attr.imageUrl) {
        console.log(`[getElementAssetUrl] Using direct imageUrl: ${attr.imageUrl}`);
        return attr.imageUrl;
    }

    // 2. Use fullFilename and construct path with layer folder
    if (attr.fullFilename && attr.layer) {
        const layerDetails = LAYER_DETAILS[attr.layer];
        if (layerDetails && layerDetails.folderName) {
            const folderName = encodeURIComponent(layerDetails.folderName);
            const filename = encodeURIComponent(attr.fullFilename);
            const constructedUrl = `/assets/${folderName}/${filename}`;
            // console.log(`[getElementAssetUrl] Constructed URL from fullFilename: ${constructedUrl}`); // Optional: uncomment for debugging
            return constructedUrl;
        } else {
            console.warn(`[getElementAssetUrl] Could not find folderName in LAYER_DETAILS for layer: ${attr.layer}`);
            // Fallback if folderName is missing, less reliable
            const filename = encodeURIComponent(attr.fullFilename);
            return `/assets/${encodeURIComponent(attr.layer)}/${filename}`; 
        }
    }

    // 3. Fallback if no imageUrl or fullFilename (should ideally not happen)
    console.error(`[getElementAssetUrl] Could not determine URL for attribute:`, attr);
    return '/placeholder-element.png'; // Fallback PNG
  };

  // <<< Add state for element modal >>>
  const [selectedElement, setSelectedElement] = useState<NFTAttribute | null>(null);
  const [isElementModalOpen, setIsElementModalOpen] = useState<boolean>(false);

  // <<< Handler to open element modal >>>
  const handleElementClick = (element: NFTAttribute) => {
    setSelectedElement(element);
    setIsElementModalOpen(true);
  };

  const handleElementModalClose = () => {
    setIsElementModalOpen(false);
    setSelectedElement(null);
  };
  
  // Ensure stats are available
  const stats = nft.stats || { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-85 flex items-center justify-center z-50 p-4 sm:p-8" 
      onClick={onClose} 
    >
      <div 
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-2xl p-4 sm:p-6 max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col relative border border-pink-500/50" 
        onClick={handleModalContentClick} 
      >
        {/* Close Button */}
         <button 
           onClick={onClose} 
           className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-30 bg-gray-800/60 rounded-full p-1.5"
           aria-label="Close modal"
         >
             <ClearIcon fontSize="small" />
         </button>

        {/* Modal Title Area */}
         <div className="mb-4 flex-shrink-0">
             <h2 className="text-2xl lg:text-3xl font-bold text-pink-400 text-center">{nft.name} {nft.number ? `#${nft.number}` : ''}</h2>
         </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row gap-4 flex-grow overflow-hidden"> 
          {/* Left Column: NFT Preview & Actions */}
           <div className="w-full md:w-1/3 lg:w-2/5 flex flex-col gap-4 flex-shrink-0 overflow-y-auto pr-2 pb-2">
             {/* Preview Area */}
             <div className="relative aspect-w-2 aspect-h-3 w-full bg-gray-700 rounded-lg overflow-hidden shadow-lg border border-gray-600/50">
               <ErrorBoundary fallback={<div>Error loading NFT preview.</div>}>
                 <NFTCanvas nft={nft} /> 
               </ErrorBoundary>
             </div>
             {/* <<< Action Buttons Area >>> */}
             <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50 flex flex-col gap-2">
                {/* Error/Success Messages */}
                {actionError && <Typography color="error" variant="caption" className="text-center mt-2">{actionError}</Typography>}
                {actionSuccess && <Typography color="success" variant="caption" className="text-center mt-2">{actionSuccess}</Typography>}

                {/* --- Listing Controls --- */}
                <div>
                  {isListed ? (
                     <div className="flex justify-between items-center"> 
                        {/* Showing listed price from NFTStore context, not passed here, simple display */}
                        <span className="text-sm font-semibold text-green-400">Currently Listed</span> 
                        <button 
                          onClick={() => onDelistNFT(itemIdentifier)} 
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition-colors text-sm"
                          disabled={isLoadingAction}
                        >
                          Delist
                        </button>
                     </div>
                  ) : (
                     <div className="flex items-center space-x-2"> 
                        <button 
                          onClick={() => onListNFT(itemIdentifier)} 
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded transition-colors text-sm"
                          disabled={isLoadingAction || !listPrice || parseFloat(listPrice) <= 0}
                        >
                          List
                        </button>
                        <input 
                          id={`modal-price-${itemIdentifier}`} 
                          type="number" 
                          placeholder="0.001" 
                          value={listPrice} 
                          onChange={(e) => onPriceChange(itemIdentifier, e.target.value)} 
                          className="p-1.5 rounded bg-gray-600 border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm w-24"
                          min="0.00000001" 
                          step="0.00000001" 
                          disabled={isLoadingAction}
                        />
                        <span className="text-sm text-gray-400">BSV</span>
                     </div>
                  )}
                </div>

                {/* --- Send Controls --- */}
                {!isListed && (
                  <div>
                     <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => onSendNFT(itemIdentifier)} 
                          className={`px-3 py-1 rounded transition-colors text-sm font-semibold ${isSending || !recipientHandle || !recipientHandle.startsWith('$') ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                          disabled={isSending || !recipientHandle || !recipientHandle.startsWith('$') || isLoadingAction}
                        >
                          {isSending ? 'Sending...' : 'Send'}
                        </button>
                        <input 
                          id={`modal-send-handle-${itemIdentifier}`} 
                          type="text" 
                          placeholder="$handle" 
                          value={recipientHandle} 
                          onChange={(e) => onRecipientChange(itemIdentifier, e.target.value)} 
                          className="p-1.5 rounded bg-gray-600 border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm w-full"
                          disabled={isSending || isLoadingAction} 
                          list="friends-list-datalist" // Assume datalist is available globally or pass friends too
                        />
                     </div>
                  </div>
                )}

                {/* --- Melt & Burn Buttons --- */}
                {!isListed && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-700/50">
                    {/* Melt Button */}
                    <button 
                      onClick={() => itemIdentifier && onOpenMeltConfirm(itemIdentifier)}
                      disabled={isMelting || isLoadingAction || !itemIdentifier}
                      className={`flex-1 px-3 py-1.5 rounded text-white text-sm transition-colors font-medium flex items-center justify-center gap-1.5 ${
                        isMelting
                          ? 'bg-yellow-600 text-white cursor-wait' 
                          : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                      title="Melt NFT into constituent elements"
                    >
                      {isMelting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Melting...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0118 14c-1.657 1.657-7.657 4.31-7.657 4.31a9.026 9.026 0 01-2.343-.771 3 3 0 00-1.343.771 3 3 0 00-1.343-.771 9.026 9.026 0 01-2.343.771 3 3 0 00-1.343.771 3 3 0 00-1.343-.771" /></svg>
                          Melt
                        </>
                      )}
                    </button>
                    {/* Burn Button */}
                    <button 
                      onClick={() => itemIdentifier && onBurnNFT(itemIdentifier)} 
                      disabled={isBurning || isLoadingAction || !itemIdentifier}
                      className={`flex-1 px-3 py-1.5 rounded text-white text-sm transition-colors font-medium flex items-center justify-center gap-1.5 ${
                        isBurning
                          ? 'bg-red-700 text-white cursor-wait' 
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                      title="Permanently BURN this NFT"
                    >
                       {isBurning ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Burning...
                        </>
                      ) : (
                        '🔥 Burn'
                      )}
                    </button>
                  </div>
                )}
             </div>
             {/* <<< End Action Buttons Area >>> */}
           </div>

          {/* Right Column: Specific Element Cards for this NFT */}
          <div className="w-full md:w-2/3 lg:w-3/5 flex flex-col overflow-hidden"> 
            <h3 className="text-xl lg:text-2xl font-semibold text-teal-400 mb-3 text-center md:text-left flex-shrink-0">NFT Elements</h3>
            
            {/* Scrollable Element Card Grid Area */}
            <div className="flex-grow overflow-y-auto pr-1 pb-2"> 
                {isLoadingBackgrounds ? (
                    <div className="flex justify-center items-center h-full"><CircularProgress color="secondary" /></div>
                ) : backgroundFetchError ? (
                    <Typography color="error" className="text-center">{backgroundFetchError}</Typography>
                ) : nftElements.length === 0 ? (
                    <Typography className="text-gray-500 text-center mt-4">No element attributes found for this NFT.</Typography>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {nftElements.map((element, index) => (
                            <CompositedElementCard
                                key={`${element.layer}-${index}`}
                                attribute={element}
                                backgroundMap={elementCardBackgrounds}
                                onClick={() => handleElementClick(element)}
                                className="cursor-pointer"
                            />
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Render the Element Detail Modal */}
      <ElementDetailModal 
        isOpen={isElementModalOpen}
        onClose={handleElementModalClose}
        elementData={selectedElement}
        elementCardBackgrounds={elementCardBackgrounds}
      />
    </div>
  );
};

export default NFTDetailModal; 