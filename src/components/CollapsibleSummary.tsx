'use client';

import React from 'react';
import { NFTType } from '@/types';
import NFTSummary from '@/components/NFTSummary';

interface CollapsibleSummaryProps {
  nft: NFTType | null;
  isExpanded: boolean;
  // onToggle is no longer needed here if the trigger is external
}

// Renamed to reflect it only shows the content now
export default function CollapsibleSummaryContent({ nft, isExpanded }: CollapsibleSummaryProps) {

  if (!nft) {
    return null; 
  }

  return (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
      {/* Use ternary operator for safer conditional rendering */}
      {isExpanded ? (
        <div className="p-4 bg-gray-900 border-t border-gray-700/50">
          <NFTSummary nft={nft} />
        </div>
      ) : null}
    </div>
  );
} 