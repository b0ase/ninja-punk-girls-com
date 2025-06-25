'use client';

import React, { useRef, useEffect } from 'react';

// Define the structure for AssetDetail, mirroring its use in CharactersPage and API
interface AssetDetail {
  layer: string;
  name: string;
  filename: string;
  assetNumber?: string;
  rarity?: string;
  type?: string;
  character?: string;
  genes?: string;
}

// Define structure for LayerDetails needed by this component
interface LayerDetailInfo {
    folderName: string;
    // Add other properties from LAYER_DETAILS if needed later
}

interface CharacterPreviewCanvasProps {
  assets: AssetDetail[]; // Assets specifically for the character to preview
  layerOrder: string[]; // The order in which to draw layers
  layerDetails: Record<string, LayerDetailInfo>; // Map layer keys to folder names etc.
  width: number;
  height: number;
  className?: string; // Add className as an optional prop
}

const CharacterPreviewCanvas: React.FC<CharacterPreviewCanvasProps> = ({ 
    assets,
    layerOrder,
    layerDetails,
    width, 
    height, 
    className // Destructure className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !assets || assets.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Function to load an image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`[CanvasPreview] Failed to load image: ${src}`, err);
            reject(err);
        };
        img.src = src;
      });
    };

    // Draw layers sequentially
    const drawLayers = async () => {
      for (const layerKey of layerOrder) {
        const layerInfo = layerDetails[layerKey];
        const assetDetail = assets.find(a => a.layer === layerKey);

        if (assetDetail && layerInfo) {
          const imageUrl = `/assets/${layerInfo.folderName}/${assetDetail.filename}`;
          try {
            console.log(`[CanvasPreview] Attempting to draw layer ${layerKey} from ${imageUrl}`);
            const img = await loadImage(imageUrl);
            ctx.drawImage(img, 0, 0, width, height);
            console.log(`[CanvasPreview] Successfully drew layer ${layerKey}`);
          } catch (error) {
            // Image failed to load, already logged in loadImage
            // Continue to next layer maybe?
          }
        } else {
           // console.log(`[CanvasPreview] Skipping layer ${layerKey} - No asset found for this character or no layer info.`);
        }
      }
      console.log("[CanvasPreview] Finished drawing all character layers.");
    };

    // --- MODIFICATION: Await layer drawing, then draw logo ---
    const drawCharacterAndLogo = async () => {
      // Clear canvas before drawing new character
      ctx.clearRect(0, 0, width, height);
      console.log(`[CanvasPreview] Drawing character with ${assets.length} assets.`);
      
      await drawLayers(); // Wait for all character layers to be drawn

      // Now, attempt to draw the logo
      try {
        const firstAsset = assets[0];
        const originGene = firstAsset?.genes?.toLowerCase();
        let logoPath: string | null = null;

        if (originGene === 'npg') {
          logoPath = '/assets/01 Logo/01_01_logo_NPG-logo_x_NPG.png';
        } else if (originGene === 'erobot' || originGene === 'erobotz') { // Handle variations
          logoPath = '/assets/01 Logo/01_02_logo_Erobotz-logo_x_erobot.png';
        }

        if (logoPath) {
          console.log(`[CanvasPreview] Determined origin: ${originGene}. Attempting to draw logo: ${logoPath}`);
          const logoImg = await loadImage(logoPath);
          ctx.drawImage(logoImg, 0, 0, width, height); 
          console.log(`[CanvasPreview] Successfully drew logo.`);
        } else {
          console.log(`[CanvasPreview] No specific logo found for origin: ${originGene}`);
        }
      } catch (logoError) {
        console.error("[CanvasPreview] Error loading or drawing logo:", logoError);
      }
    };

    drawCharacterAndLogo(); // Call the new wrapper function
    // --- END MODIFICATION ---

  }, [assets, layerOrder, layerDetails, width, height]); // Redraw if props change

  return (
    <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className={className} // Use the passed-in className
    />
  );
};

export default CharacterPreviewCanvas; 