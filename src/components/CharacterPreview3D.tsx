'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

interface CharacterPreview3DProps {
  characterName: string;
  modelUrl: string;
}

// Preload models globally to ensure they're available
// This runs only once when the component is loaded
useGLTF.preload('/models/chibi_cyberpunk_final.glb');

// Simple model viewer component for character previews
function CharacterModel({ url }: { url: string }) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const modelRef = useRef<THREE.Group>(null);
  
  // Handle initial loading state
  useEffect(() => {
    // Set a short timeout to allow the model to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  try {
    // Get the model - this will use the cache if preloaded
    const { scene } = useGLTF(url);
    
    // Clone the scene to avoid mutations affecting the cached original
    const modelScene = scene.clone();
    
    // Apply scaling based on model type
    if (url.includes('chibi_cyberpunk')) {
      // Increase scale to match 2D preview better
      modelScene.scale.set(8, 8, 8);
      // Adjust position to center the character
      modelScene.position.set(0, -1.5, 0);
      // Optional rotation adjustment if needed
      modelScene.rotation.y = Math.PI * 0.05; // Slight turn for better viewing angle
    }
    
    // Set loaded state
    if (!modelLoaded) {
      setModelLoaded(true);
      if (error) setError(null);
    }
    
    // Show loading indicator if still in loading state
    if (isLoading) {
      return (
        <group>
          <Html center>
            <div className="text-white text-lg">Loading model...</div>
          </Html>
        </group>
      );
    }
    
    return <primitive ref={modelRef} object={modelScene} />;
  } catch (err: any) {
    // Set error state if model fails to load
    if (!error) {
      console.error(`Error loading model ${url}:`, err);
      setError(err.message || 'Failed to load model');
    }
    
    // Return an empty group if there's an error
    return (
      <group>
        <Html center>
          <div className="text-red-500 text-lg bg-black/50 p-2 rounded">
            Error loading model
          </div>
        </Html>
      </group>
    );
  }
}

const CharacterPreview3D: React.FC<CharacterPreview3DProps> = ({ 
  characterName,
  modelUrl
}) => {
  // Use state to track if canvas has been mounted
  const [isCanvasMounted, setIsCanvasMounted] = useState(false);
  
  // Ensure canvas is mounted after component renders
  useEffect(() => {
    setIsCanvasMounted(true);
  }, []);

  return (
    <div className="w-full h-full">
      {isCanvasMounted && (
        <Canvas
          camera={{ position: [0, 1, 5], fov: 45 }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Suspense fallback={
            <Html center>
              <div className="text-white text-lg">
                <span className="animate-pulse">Loading {characterName}...</span>
              </div>
            </Html>
          }>
            <CharacterModel url={modelUrl} />
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls 
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            autoRotate
            autoRotateSpeed={0.5}
            target={[0, 0, 0]}
          />
        </Canvas>
      )}
    </div>
  );
};

export default CharacterPreview3D; 