'use client';

import React from 'react';
import PeriodicTable from '@/components/PeriodicTable';

export default function PeriodicTablePage() {
  const handleElementClick = (asset: any) => {
    console.log('Element clicked:', asset);
    // The modal is handled internally by the PeriodicTable component
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <PeriodicTable 
          onElementClick={handleElementClick}
          className="w-full"
        />
      </div>
    </div>
  );
} 