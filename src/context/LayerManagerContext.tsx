'use client';

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction } from 'react';

// Define the shape of the context data
interface LayerManagerContextProps {
  selectedImageUrl: string | null;
  setSelectedImageUrl: Dispatch<SetStateAction<string | null>>;
}

// Create the context with a default value (can be undefined or null, handled in consumer)
const LayerManagerContext = createContext<LayerManagerContextProps | undefined>(undefined);

// Define the props for the provider
interface LayerManagerProviderProps {
  children: ReactNode;
}

// Create the Provider component
export const LayerManagerProvider: React.FC<LayerManagerProviderProps> = ({ children }) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  return (
    <LayerManagerContext.Provider value={{ selectedImageUrl, setSelectedImageUrl }}>
      {children}
    </LayerManagerContext.Provider>
  );
};

// Create a custom hook for easy consumption
export const useLayerManager = () => {
  const context = useContext(LayerManagerContext);
  if (context === undefined) {
    throw new Error('useLayerManager must be used within a LayerManagerProvider');
  }
  return context;
}; 