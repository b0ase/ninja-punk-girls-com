import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, TransformControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib'; // Import type for ref

// Add ErrorBoundary Component
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
            <Text position={[0, 0, 0]} color="white" fontSize={0.2}>
              Error with {this.props.modelUrl.split('/').pop()}
            </Text>
            <Text position={[0, -0.3, 0]} color="white" fontSize={0.1}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </group>
        </group>
      );
    }

    return this.props.children;
  }
}

// --- Type Definitions ---
interface FileNode {
  name: string;
  path: string; // Relative path within the base directory (e.g., 'subfolder/image.png')
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileExplorerNodeProps {
  node: FileNode;
  basePath: string; // Base directory path used in API call (e.g., 'public/assets')
  onFileClick: (relativePath: string, basePath: string) => void; // Passes relative path and base path
  level?: number;
}

interface ViewModelProps {
  modelUrl: string;
  mode: "translate" | "rotate" | "scale";
  isSelected: boolean;
  resetTrigger: number; // Counter to trigger reset
  showHandles: boolean; // <<< New prop
}

interface Studio3DTabProps {
  selectedSeriesId: string | null; // Add this prop
  modelToLoad?: string | null;    // New prop to specify a model to load initially
}
// --- End Type Definitions ---

// <<< Modified ViewModel Component to handle selection and reset >>>
function ViewModel({ modelUrl, mode, isSelected, resetTrigger, showHandles }: ViewModelProps) {
  console.log(`[ViewModel] Rendering model: ${modelUrl}, Mode: ${mode}, Selected: ${isSelected}, Reset: ${resetTrigger}, Handles: ${showHandles}`);
  
  // Track loading state and errors
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [sceneData, setSceneData] = useState<{scene: THREE.Group | null, clonedScene: THREE.Group | null}>({
    scene: null,
    clonedScene: null
  });
  
  // Use useEffect for model loading instead of during render
  useEffect(() => {
    let isCurrentEffect = true;
    
    const loadModel = async () => {
      try {
        // Add cache invalidation for problematic models
        const isChibiModel = modelUrl.includes('chibi_cyberpunk');
        const isDojo = modelUrl.includes('Dojo5.glb');
        
        // Preload the model - this registers it with the cache
        useGLTF.preload(modelUrl);
        
        // Use regular useGLTF hook pattern for loading - this is safer
        const loadedModel = useGLTF(modelUrl);
        if (!loadedModel || !loadedModel.scene) {
          throw new Error(`Could not load scene from ${modelUrl}`);
        }
        
        // Clone the scene
        const clonedScene = loadedModel.scene.clone();
        
        // Special handling for chibi model
        if (isChibiModel && clonedScene) {
          console.log(`[ViewModel] Applying special scaling to Chibi model`);
          clonedScene.scale.set(5, 5, 5);
        }
        
        // Dojo model might need adjustments
        if (isDojo && clonedScene) {
          console.log(`[ViewModel] Applying default scaling to Dojo model`);
          clonedScene.scale.set(0.8, 0.8, 0.8);
        }
        
        // Log model details for debugging
        console.log(`[ViewModel] Model loaded: ${modelUrl}`, {
          hasScene: !!clonedScene,
          childCount: clonedScene?.children?.length || 0,
          position: clonedScene?.position,
          rotation: clonedScene?.rotation,
          scale: clonedScene?.scale
        });
        
        // Only update state if this effect is still current
        if (isCurrentEffect) {
          setSceneData({ scene: loadedModel.scene, clonedScene });
          setModelLoaded(true);
          setLoadingError(null);
        }
      } catch (error: any) {
        console.error(`[ViewModel] Error loading model ${modelUrl}:`, error);
        if (isCurrentEffect) {
          let errorMessage = 'Unknown error loading model';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else {
            try {
              errorMessage = JSON.stringify(error);
            } catch (e) {
              errorMessage = 'Failed to stringify error object.';
            }
          }
          setLoadingError(errorMessage);
          setModelLoaded(false);
        }
      }
    };
    
    loadModel();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isCurrentEffect = false;
    };
  }, [modelUrl]); // Only re-run if modelUrl changes
  
  // <<< Ref for TransformControls >>>
  const controlsRef = useRef<TransformControlsImpl>(null!); // Using non-null assertion

  // <<< Effect to reset controls when trigger changes for the selected model >>>
  useEffect(() => {
    // Only reset if this model is selected and the trigger value is positive (it changed)
    if (isSelected && resetTrigger > 0 && controlsRef.current && sceneData.clonedScene) {
      console.log(`[ViewModel ${modelUrl}] Reset triggered!`);
      // Reset the controls state (position/rotation/scale of the gizmo itself)
      controlsRef.current.reset();
      
      // Force reset object transform as well
      sceneData.clonedScene.position.set(0, 0, 0);
      sceneData.clonedScene.rotation.set(0, 0, 0);
      sceneData.clonedScene.scale.set(0.8, 0.8, 0.8);

      console.log(`[ViewModel ${modelUrl}] Controls reset.`);
    }
  }, [resetTrigger, isSelected, modelUrl, sceneData.clonedScene]); // Added clonedScene dependency


  // Special handling for Chibi model scaling and positioning
  useEffect(() => {
    if (sceneData.clonedScene && modelUrl.includes('chibi_cyberpunk')) {
      console.log('[ViewModel] Applying special settings for Chibi model');
      // Apply larger scale for visibility
      sceneData.clonedScene.scale.set(5, 5, 5);
      // Adjust position if needed
      sceneData.clonedScene.position.set(0, 0, 0);
      // Ensure proper rotation
      sceneData.clonedScene.rotation.set(0, 0, 0);
    }
  }, [sceneData.clonedScene, modelUrl]);

  // Return error message if loading failed
  if (loadingError) {
    return (
      <group>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <group position={[0, 2.2, 0]}>
          <Text position={[0, 0, 0]} color="white" fontSize={0.2}>
            Error loading {modelUrl.split('/').pop()}
          </Text>
          <Text position={[0, -0.3, 0]} color="white" fontSize={0.1}>
            {loadingError}
          </Text>
        </group>
      </group>
    );
  }

  // Don't render if clonedScene is null
  if (!sceneData.clonedScene) {
    return null;
  }

  return (
    <>
      {/* <<< Conditionally render TransformControls based on isSelected AND showHandles >>> */}
      {isSelected && showHandles ? (
        <TransformControls ref={controlsRef} key={modelUrl} mode={mode} object={sceneData.clonedScene}>
           <primitive object={sceneData.clonedScene} />
        </TransformControls>
      ) : (
         // Render just the primitive if not selected or handles hidden
        <primitive key={modelUrl} object={sceneData.clonedScene} />
      )}
    </>
  );
}
// <<< END Modified ViewModel Component >>>

// <<< Define File Explorer Node Component >>>
const FileExplorerNode: React.FC<FileExplorerNodeProps> = ({ node, basePath, onFileClick, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Open top levels by default

  const handleToggle = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen);
    }
  };

  // Modified: This click handler is now only for the main div (toggles directories)
  const handleDivClick = () => {
    if (node.type === 'directory') {
      handleToggle(); 
    }
    // Do nothing on file click here - handled by button
  };

  // Specific handler for the load button
  const handleLoadClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering handleDivClick
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
        onClick={handleDivClick} // Use the modified handler
        title={node.path} // Show full relative path on hover
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

        {/* Add Load button specifically for model files */} 
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
        <div className="border-l border-gray-600 ml-[6px]"> {/* Adjust margin if needed */}
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
// <<< END File Explorer Node Component >>>

// --- Main 3D Studio Tab Component ---
const Studio3DTab: React.FC<Studio3DTabProps> = ({ selectedSeriesId, modelToLoad }) => {
  // State for asset trees
  const [assetTree2D, setAssetTree2D] = useState<FileNode[] | null>(null);
  const [assetTree3D, setAssetTree3D] = useState<FileNode[] | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  // Pre-cache default models to ensure they load correctly
  useEffect(() => {
    // Preload the default models
    useGLTF.preload('/models/Dojo5.glb');
    useGLTF.preload('/models/chibi_cyberpunk_final.glb');
    console.log("[Studio3DTab] Preloaded default models");
  }, []);

  // <<< State for MULTIPLE loaded model URLs >>>
  const [loadedModels, setLoadedModels] = useState<string[]>(['/models/Dojo5.glb']); // Start with Dojo

  // <<< State for selected model URL (for controls) - null initially >>>
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(loadedModels[0] ?? null);

  // State for TransformControls mode
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");

  // <<< State for reset trigger >>>
  const [resetCounter, setResetCounter] = useState<number>(0);

  // <<< ADD State for showing handles >>>
  const [showHandles, setShowHandles] = useState<boolean>(true);

  // Effect to handle external model loading via prop
  useEffect(() => {
    if (modelToLoad) {
      console.log('[Studio3DTab] Received modelToLoad prop:', modelToLoad);
      setLoadedModels(prevModels => {
        if (!prevModels.includes(modelToLoad)) {
          return [...prevModels, modelToLoad];
        }
        return prevModels;
      });
      setSelectedModelUrl(modelToLoad);
    }
  }, [modelToLoad]);

  // Fetch asset trees on mount
  useEffect(() => {
    const fetchAssetTree = async (directory: string): Promise<FileNode[]> => {
      try {
        console.log(`[Studio3DTab] Fetching asset tree for: ${directory}`);
        const response = await fetch(`/api/list-assets?directory=${encodeURIComponent(directory)}`);
        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
          } catch (e) { /* Ignore JSON parsing error if body is not JSON */ }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'API returned failure but no error message.');
        }
        console.log(`[Studio3DTab] Successfully fetched tree for ${directory}`);
        return data.tree;
      } catch (err: any) {
        console.error(`[Studio3DTab] Error fetching asset tree for ${directory}:`, err);
        throw err; // Re-throw to be caught by Promise.all
      }
    };

    const loadTrees = async () => {
      setIsLoadingAssets(true);
      setAssetError(null);
      setAssetTree2D(null); // Clear previous trees
      setAssetTree3D(null);
      console.log("[Studio3DTab] Loading asset trees...");
      try {
        // <<< IMPORTANT: Ensure 'public/assets' is the correct path for your 2D assets >>>
        const assets2DPath = 'public/assets';
        const assets3DPath = 'public/models';

        const [tree2D, tree3D] = await Promise.allSettled([
          fetchAssetTree(assets2DPath),
          fetchAssetTree(assets3DPath)
        ]);

        let errors: string[] = [];

        if (tree2D.status === 'fulfilled') {
          setAssetTree2D(tree2D.value);
        } else {
          console.error(`Failed to load 2D assets from ${assets2DPath}:`, tree2D.reason);
          errors.push(`2D Assets (${assets2DPath}): ${tree2D.reason.message || 'Unknown error'}`);
          setAssetTree2D([]); // Set to empty array on error to indicate load attempt failed
        }

        if (tree3D.status === 'fulfilled') {
          setAssetTree3D(tree3D.value);
        } else {
          console.error(`Failed to load 3D assets from ${assets3DPath}:`, tree3D.reason);
          errors.push(`3D Models (${assets3DPath}): ${tree3D.reason.message || 'Unknown error'}`);
          setAssetTree3D([]); // Set to empty array on error
        }

        if (errors.length > 0) {
          setAssetError(`Failed to load some asset libraries:\n- ${errors.join('\n- ')}`);
        } else {
            console.log("[Studio3DTab] Successfully loaded all asset trees.");
        }

      } catch (err: any) {
        // This catch block might be less likely to hit with Promise.allSettled
        console.error("[Studio3DTab] Unexpected error during loadTrees:", err);
        setAssetError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setIsLoadingAssets(false);
        console.log("[Studio3DTab] Finished loading trees attempt.");
      }
    };

    loadTrees();
  }, []); // Empty dependency array ensures this runs once on mount

  // <<< MODIFIED Handler to ADD model URL and select it >>>
  const handleAssetClick = useCallback((relativePath: string, basePath: string) => {
    const cleanBasePath = basePath.replace(/^public\/?/, '');
    const publicPath = `/${cleanBasePath}/${relativePath}`.replace(/\/+/g, '/');

    console.log('Asset clicked:', publicPath);

    if (basePath === 'public/models' && /\.(glb|gltf)$/i.test(relativePath)) {
      console.log('-> Adding/Selecting 3D model:', publicPath);
      setLoadedModels(prevModels => {
        if (!prevModels.includes(publicPath)) {
          return [...prevModels, publicPath];
        }
        return prevModels;
      });
      // <<< Select the newly added/clicked model >>>
      setSelectedModelUrl(publicPath);
    } else if (basePath === 'public/assets' && /\.(png|jpg|jpeg|gif|webp)$/i.test(relativePath)) {
      console.log('-> Clicked a 2D texture:', publicPath);
      // Placeholder for texture logic
    } else {
      console.log('-> Clicked non-loadable file type or directory.');
    }
  }, []);

  // <<< Function to remove a model >>>
  const removeModel = useCallback((urlToRemove: string) => {
    setLoadedModels(prevModels => prevModels.filter(url => url !== urlToRemove));
    // If the removed model was selected, deselect it
    if (selectedModelUrl === urlToRemove) {
      setSelectedModelUrl(null);
    }
  }, [selectedModelUrl]);

  // <<< Function to trigger reset for the selected model >>>
   const triggerReset = useCallback(() => {
    if (selectedModelUrl) { // Only trigger if a model is selected
        console.log("Reset button clicked for:", selectedModelUrl);
        setResetCounter(prev => prev + 1); // Increment counter to trigger useEffect in ViewModel
    } else {
        console.log("Reset button clicked, but no model selected.");
    }
  }, [selectedModelUrl]); // Depends on selectedModelUrl

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-inner h-full text-gray-300 flex flex-col">
      <h2 className="text-xl font-semibold text-teal-400 mb-4 flex-shrink-0">3D Studio</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow min-h-0">

        {/* Column 1: Asset Browser, Loaded Models & Controls */}
        <div className="md:col-span-1 bg-gray-700/50 p-3 rounded flex flex-col min-h-0">
          {/* Asset Browser Section */}
          <div className='flex-shrink overflow-y-auto min-h-[200px] custom-scrollbar'> 
            <h3 className="text-lg font-medium text-gray-200 mb-3 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">Asset Browser</h3>
             {!isLoadingAssets && (
               <div className="grid grid-cols-2 gap-3 overflow-hidden"> 
                 {/* 2D Assets Column */}
                 <div className="overflow-y-auto pr-1 border-r border-gray-600 custom-scrollbar">
                     <h4 className="text-md font-medium text-purple-300 mb-2 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">2D Assets</h4>
                      {assetTree2D?.map((node) => ( <FileExplorerNode key={node.path} node={node} basePath="public/assets" onFileClick={handleAssetClick} /> ))}
                      {!assetTree2D || assetTree2D.length === 0 && <p className="text-gray-400 italic text-sm">(No 2D assets)</p>}
                 </div>
                 {/* 3D Models Column */}
                 <div className="overflow-y-auto pl-1 custom-scrollbar">
                     <h4 className="text-md font-medium text-orange-300 mb-2 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">3D Models</h4>
                      {assetTree3D?.map((node) => ( <FileExplorerNode key={node.path} node={node} basePath="public/models" onFileClick={handleAssetClick} /> ))}
                      {!assetTree3D || assetTree3D.length === 0 && <p className="text-gray-400 italic text-sm">(No 3D models)</p>}
                 </div>
              </div>
             )}
             {assetError && ( <div className="text-sm text-red-400 ...">...</div> )}
             {isLoadingAssets && <p className="text-sm text-gray-400 italic">Loading assets...</p>}
          </div>

          {/* Loaded Models List Section */}
          <div className="mt-4 pt-3 border-t border-gray-600 flex-grow flex-shrink overflow-y-auto min-h-[150px] custom-scrollbar">
             <h4 className="text-md font-medium text-gray-300 mb-2 sticky top-0 bg-gray-700/80 backdrop-blur-sm py-1">Loaded Models</h4>
             {loadedModels.length === 0 && <p className='text-sm text-gray-500 italic'>(No models loaded)</p>}
             <ul className='space-y-1'>
                {loadedModels.map((url) => (
                    // <<< Make list item clickable and add selected styling >>>
                    <li
                      key={url}
                      onClick={() => setSelectedModelUrl(url)} // Set selected on click
                      className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                        selectedModelUrl === url ? 'bg-teal-700/50 ring-1 ring-teal-500' : 'bg-gray-600/30 hover:bg-gray-600/60'
                      }`}
                    >
                        <span className='truncate mr-2' title={url}>
                            {url.split('/').pop()}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeModel(url); }} // Stop propagation on remove
                            className='text-red-400 hover:text-red-300 text-xs font-semibold flex-shrink-0 ml-1'
                            title={`Remove ${url.split('/').pop()}`}
                        >
                            ✕
                        </button>
                    </li>
                ))}
             </ul>
          </div>

          {/* Transform Mode Controls Section */}
          <div className="mt-auto pt-3 border-t border-gray-600 flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
                 <h4 className="text-md font-medium text-gray-300">Manipulation Mode</h4>
                 <div className="flex items-center space-x-2"> {/* Group buttons */}
                    {/* Reset Button */}
                    <button
                        onClick={triggerReset}
                        disabled={!selectedModelUrl}
                        className="px-2 py-0.5 text-xs rounded bg-yellow-600 hover:bg-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title={selectedModelUrl ? `Reset ${selectedModelUrl.split('/').pop()}` : "Select a model to reset"}
                    >
                        Reset
                    </button>
                    {/* <<< Add Show/Hide Handles Button >>> */}
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
                 // <<< Pass isSelected and resetTrigger props >>>
                <ModelErrorBoundary key={`error-boundary-${modelUrl}-${index}`} modelUrl={modelUrl}>
                  <ViewModel
                    key={`${modelUrl}-${index}`}
                    modelUrl={modelUrl}
                    mode={transformMode}
                    isSelected={modelUrl === selectedModelUrl} // Check if this model is the selected one
                    resetTrigger={resetCounter} // Pass the counter
                    showHandles={showHandles} // <<< Pass state here
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