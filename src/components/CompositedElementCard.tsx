'use client';

import React from 'react';
import Image from 'next/image';
import { NFTAttribute } from '@/types'; // Assuming NFTAttribute is in @/types
import { getCardBackgroundPath, getElementAssetUrl } from '@/lib/utils'; // Assuming utils path

// Define the props for the component
interface CompositedElementCardProps {
  attribute: NFTAttribute;
  backgroundMap: Record<string, string>; // Pass the fetched map
  onClick?: () => void; // Optional click handler
  className?: string; // Optional additional class names
}

const CompositedElementCard: React.FC<CompositedElementCardProps> = ({ 
  attribute, 
  backgroundMap, 
  onClick, 
  className = '' 
}) => {
    // Use the passed backgroundMap and the utility function
    const backgroundUrl = getCardBackgroundPath(attribute.layer, backgroundMap);
    const elementUrl = getElementAssetUrl(attribute); // This function likely exists in utils now

    return (
        <div 
          className={`bg-gray-700 rounded-lg shadow-md overflow-hidden flex flex-col text-xs border border-gray-600/50 group relative ${className}`} 
          onClick={onClick}
        >
            {/* Container for images */}
            <div className="relative w-full aspect-[2/3]"> {/* Enforce aspect ratio */}
                {/* Background Cover Image */}
                <Image
                    src={backgroundUrl}
                    alt={`${attribute.layer} background`}
                    layout="fill"
                    objectFit="cover" // Cover the area
                    unoptimized
                    className="block group-hover:opacity-70 transition-opacity duration-150"
                    onError={(e) => {
                        console.error(`[ElementCard] Cover Image Load Error for src: ${backgroundUrl}`);
                        (e.target as HTMLImageElement).src = '/placeholder-element-card.png'; // Fallback
                    }}
                />
                {/* Foreground Asset PNG Image */}
                <Image
                    src={elementUrl}
                    alt={`${attribute.layer} element: ${attribute.metadata?.elementName || attribute.name || 'Unknown Element'}`}
                    layout="fill"
                    objectFit="contain" // Contain within the bounds
                    unoptimized
                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-150 z-10"
                    onError={(e) => {
                        console.error(`[ElementCard] Asset Image Load Error for src: ${elementUrl}`);
                         (e.target as HTMLImageElement).src = '/placeholder-element.png'; // Fallback
                         (e.target as HTMLImageElement).style.opacity = '0.5'; // Make fallback visible
                    }}
                />
            </div>
             {/* Optional: Add minimal info below the card */}
            <div className="p-1.5 bg-gray-800/80 text-center absolute bottom-0 left-0 right-0 z-20">
                <p className="text-gray-300 font-semibold truncate text-[10px]" title={attribute.metadata?.elementName || attribute.name || 'Unknown'}>
                    {attribute.metadata?.elementName || attribute.name || 'Unnamed'}
                </p>
                 <p className="text-gray-400 text-[9px] truncate" title={attribute.layer}>
                    {/* Attempt to clean up layer name, might need adjustment */}
                    {attribute.layer.includes('_') ? attribute.layer.substring(attribute.layer.indexOf('_') + 1) : attribute.layer}
                 </p>
            </div>
        </div>
    );
};

export default CompositedElementCard; 