'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib'; // Import type for ref

// Simplified ErrorBoundary Component without Text
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode, modelUrl: string },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: React.ReactNode, modelUrl: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ModelErrorBoundary] Error rendering model:`, error);
    console.error(`Component stack:`, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" />
          </mesh>
          <group position={[0, 2.2, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshBasicMaterial color="white" />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.1]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        </group>
      );
    }

    return this.props.children;
  }
}

// Type Definitions
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileExplorerNodeProps {
  node: FileNode;
  basePath: string;
  onFileClick: (relativePath: string, basePath: string) => void;
  level?: number;
}

interface ViewModelProps {
  modelUrl: string;
  mode: "translate" | "rotate" | "scale";
  isSelected: boolean;
  resetTrigger: number;
  showHandles: boolean;
}

interface Studio3DTabProps {
  selectedSeriesId: string | null;
  modelToLoad?: string | null;
}

// Simplified ViewModel Component
function ViewModel({ modelUrl, mode, isSelected, resetTrigger, showHandles }: ViewModelProps) {
  console.log(`[ViewModel] Rendering model: ${modelUrl}, Mode: ${mode}, Selected: ${isSelected}, Reset: ${resetTrigger}, Handles: ${showHandles}`);
  
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [sceneData, setSceneData] = useState<{scene: THREE.Group | null, clonedScene: THREE.Group | null}>({
    scene: null,
    clonedScene: null
  });
  
  const controlsRef = useRef<TransformControlsImpl>(null);
  
  useEffect(() => {
    let isCurrentEffect = true;
    
    const loadModel = async () => {
      try {
        console.log(`[ViewModel] Loading model: ${modelUrl}`);
        
        // Use a simple fetch approach instead of useGLTF to avoid dependency issues
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const loader = new GLTFLoader();
        
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(arrayBuffer, '', resolve, reject);
        });
        
        if (!isCurrentEffect) return;
        
        const scene = gltf.scene;
        const clonedScene = scene.clone();
        
        setSceneData({ scene, clonedScene });
        setModelLoaded(true);
        setLoadingError(null);
        
        console.log(`[ViewModel] Model loaded successfully: ${modelUrl}`);
        
      } catch (err: any) {
        if (!isCurrentEffect) return;
        console.error(`[ViewModel] Error loading model: ${modelUrl}`, err);
        setLoadingError(err.message || 'Unknown error');
        setModelLoaded(false);
      }
    };
    
    loadModel();
    
    return () => {
      isCurrentEffect = false;
    };
  }, [modelUrl]);
  
  // Reset transform controls when resetTrigger changes
  useEffect(() => {
    if (controlsRef.current && sceneData.clonedScene) {
      controlsRef.current.reset();
    }
  }, [resetTrigger, sceneData.clonedScene]);
  
  if (loadingError) {
    return (
      <group>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="white" />
          </mesh>
        </group>
      </group>
    );
  }
  
  if (!sceneData.clonedScene) {
    return null;
  }
  
  return (
    <>
      {isSelected && showHandles ? (
        <TransformControls ref={controlsRef} key={modelUrl} mode={mode} object={sceneData.clonedScene}>
           <primitive object={sceneData.clonedScene} />
        </TransformControls>
      ) : (
        <primitive key={modelUrl} object={sceneData.clonedScene} />
      )}
    </>
  );
}

// File Explorer Node Component
const FileExplorerNode: React.FC<FileExplorerNodeProps> = ({ node, basePath, onFileClick, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  
  const handleToggle = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    }
  };
  
  const handleDivClick = () => {
    if (node.type === 'directory') {
      handleToggle(); 
    }
  };
  
  const handleLoadClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onFileClick(node.path, basePath); 
  };
  
  const indentStyle = { paddingLeft: `${level * 1}rem` };
  const isImageFile = node.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(node.name);
  const isModelFile = node.type === 'file' && /\.(glb|gltf)$/i.test(node.name);
  
  return (
    <div className="text-xs my-0.5">
      <div
        className={`flex items-center cursor-pointer hover:bg-gray-600/50 rounded px-1 py-0.5 ${node.type === 'directory' ? 'font-medium text-purple-300' : (isImageFile ? 'text-cyan-300' : isModelFile ? 'text-orange-300' : 'text-gray-300')}`}
        style={indentStyle}
        onClick={handleDivClick}
        title={node.path}
      >
        {node.type === 'directory' && (
          <span className="mr-1 w-3 inline-block text-center">{isOpen ? '▾' : '▸'}</span>
        )}
        {node.type === 'file' && (
          <span className="mr-1 w-3 inline-block text-center">
            {isImageFile ? '🖼️' : isModelFile ? '🧊' : '📄'}
          </span>
        )}
        <span className="truncate flex-1 mr-2">{node.name}</span>
        
        {isModelFile && (
          <button 
            onClick={handleLoadClick}
            className="ml-auto text-[10px] bg-teal-600 hover:bg-teal-700 text-white px-1.5 py-0 rounded shadow-sm transition-colors"
            title={`Load ${node.name}`}
          >
            Load
          </button>
        )}
      </div>
      {node.type === 'directory' && isOpen && node.children && (
        <div className="border-l border-gray-600 ml-[6px]">
          {node.children.length > 0 ? (
            node.children.map((child) => (
              <FileExplorerNode
                key={child.path}
                node={child}
                basePath={basePath}
                onFileClick={onFileClick}
                level={level + 1}
              />
            ))
          ) : (
            <p style={{ paddingLeft: `${(level + 1) * 1}rem` }} className="text-gray-500 italic px-1 py-0.5">(empty)</p>
          )}
        </div>
      )}
    </div>
  );
};

// Main Studio3DTab Component
const Studio3DTab: React.FC<Studio3DTabProps> = ({ selectedSeriesId, modelToLoad }) => {
  const [assetTree2D, setAssetTree2D] = useState<FileNode[]>([]);
  const [assetTree3D, setAssetTree3D] = useState<FileNode[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [resetCounter, setResetCounter] = useState(0);
  const [showHandles, setShowHandles] = useState(true);
  
  // Load initial model if provided
  useEffect(() => {
    if (modelToLoad && !loadedModels.includes(modelToLoad)) {
      setLoadedModels([modelToLoad]);
      setSelectedModelUrl(modelToLoad);
    }
  }, [modelToLoad, loadedModels]);
  
  // Fetch assets
  const fetchAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    setAssetError(null);
    
    try {
      // Fetch 2D assets (element cards)
      const response2D = await fetch('/api/list-assets?directory=public/element_cards');
      const result2D = await response2D.json();
      
      if (!response2D.ok || !result2D.success) {
        throw new Error(result2D.error || 'Failed to fetch 2D assets');
      }
      
      // Fetch 3D models
      const response3D = await fetch('/api/list-assets?directory=public/models');
      const result3D = await response3D.json();
      
      if (!response3D.ok || !result3D.success) {
        throw new Error(result3D.error || 'Failed to fetch 3D models');
      }
      
      setAssetTree2D(result2D.tree || []);
      setAssetTree3D(result3D.tree || []);
      
    } catch (err: any) {
      console.error('[Studio3DTab] Error fetching assets:', err);
      setAssetError(err.message || 'Failed to load assets');
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);
  
  const handleFileClick = useCallback((relativePath: string, basePath: string) => {
    const publicPath = `/${basePath}/${relativePath}`;
    
    if (relativePath.match(/\.(glb|gltf)$/i)) {
      console.log('-> Clicked a 3D model:', publicPath);
      if (!loadedModels.includes(publicPath)) {
        setLoadedModels(prev => [...prev, publicPath]);
        setSelectedModelUrl(publicPath);
      }
    } else if (relativePath.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      console.log('-> Clicked a 2D texture:', publicPath);
      // Placeholder for texture logic
    }
  }, [loadedModels]);
  
  const removeModel = useCallback((url: string) => {
    setLoadedModels(prev => prev.filter(m => m !== url));
    if (selectedModelUrl === url) {
      setSelectedModelUrl(null);
    }
  }, [selectedModelUrl]);
  
  const triggerReset = useCallback(() => {
    setResetCounter(prev => prev + 1);
  }, []);
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-inner h-full text-gray-300 flex flex-col">
      <h2 className="text-xl font-semibold text-teal-400 mb-4 flex-shrink-0">3D Studio</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow min-h-0">
        {/* Column 1: Asset Browser */}
        <div className="bg-gray-700 rounded p-3 overflow-y-auto flex flex-col">
          <h3 className="text-lg font-medium text-gray-200 mb-3 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">Asset Browser</h3>
          
          <div className="space-y-4 flex-grow overflow-y-auto">
            <h4 className="text-md font-medium text-purple-300 mb-2 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">2D Assets</h4>
            <div className="space-y-1">
              {!assetTree2D || assetTree2D.length === 0 && <p className="text-gray-400 italic text-sm">(No 2D assets)</p>}
              {assetTree2D.map((node) => (
                <FileExplorerNode key={node.path} node={node} basePath="element_cards" onFileClick={handleFileClick} />
              ))}
            </div>
            
            <h4 className="text-md font-medium text-orange-300 mb-2 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">3D Models</h4>
            <div className="space-y-1">
              {!assetTree3D || assetTree3D.length === 0 && <p className="text-gray-400 italic text-sm">(No 3D models)</p>}
              {assetTree3D.map((node) => (
                <FileExplorerNode key={node.path} node={node} basePath="models" onFileClick={handleFileClick} />
              ))}
            </div>
            
            {assetError && (
              <div className="text-sm text-red-400 bg-red-900/30 p-2 rounded">
                Error: {assetError}
              </div>
            )}
            {isLoadingAssets && <p className="text-sm text-gray-400 italic">Loading assets...</p>}
          </div>
          
          <div className="mt-auto pt-3 border-t border-gray-600 flex-shrink-0">
            <h4 className="text-md font-medium text-gray-300 mb-2">Loaded Models</h4>
            {loadedModels.length === 0 && <p className='text-sm text-gray-500 italic'>(No models loaded)</p>}
            <ul className='space-y-1'>
              {loadedModels.map((url) => (
                <li
                  key={url}
                  onClick={() => setSelectedModelUrl(url)}
                  className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                    selectedModelUrl === url ? 'bg-teal-700/50 ring-1 ring-teal-500' : 'bg-gray-600/30 hover:bg-gray-600/60'
                  }`}
                >
                  <span className='truncate mr-2' title={url}>
                    {url.split('/').pop()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeModel(url); }}
                    className='text-red-400 hover:text-red-300 text-xs font-semibold flex-shrink-0 ml-1'
                    title={`Remove ${url.split('/').pop()}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Transform Mode Controls */}
          <div className="mt-auto pt-3 border-t border-gray-600 flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-300">Manipulation Mode</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerReset}
                  disabled={!selectedModelUrl}
                  className="px-2 py-0.5 text-xs rounded bg-yellow-600 hover:bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedModelUrl ? `Reset ${selectedModelUrl.split('/').pop()}` : "Select a model to reset"}
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowHandles(!showHandles)}
                  className={`px-2 py-0.5 text-xs rounded ${showHandles ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white`}
                  title={showHandles ? "Hide Handles" : "Show Handles"}
                >
                  {showHandles ? "Hide" : "Show"} Handles
                </button>
              </div>
            </div>
            <div className="flex space-x-2">
              {(["translate", "rotate", "scale"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTransformMode(mode)}
                  className={`px-3 py-1 text-xs rounded ${
                    transformMode === mode
                      ? "bg-teal-500 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-gray-200"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Column 2: 3D Viewer */}
        <div className="md:col-span-2 bg-black rounded overflow-hidden relative flex flex-col">
          <Canvas
            camera={{ position: [0, 2, 10], fov: 50 }}
            className="flex-grow"
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              {loadedModels.map((modelUrl, index) => (
                <ModelErrorBoundary key={`error-boundary-${modelUrl}-${index}`} modelUrl={modelUrl}>
                  <ViewModel
                    key={`${modelUrl}-${index}`}
                    modelUrl={modelUrl}
                    mode={transformMode}
                    isSelected={modelUrl === selectedModelUrl}
                    resetTrigger={resetCounter}
                    showHandles={showHandles}
                  />
                </ModelErrorBoundary>
              ))}
              <Environment preset="sunset" />
            </Suspense>
            <OrbitControls makeDefault />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default Studio3DTab;