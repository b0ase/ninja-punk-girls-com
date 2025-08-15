'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';

// Define type for generation history items
interface GenerationHistoryItem {
  imageData: string; // base64 data URI
  name: string;      // Editable name, defaults to prompt
  prompt: string;    // <<< ADDED: The prompt used for generation >>>
  seed: number;
  supabaseUrl?: string; // URL after successful save
  isSaving?: boolean;
  saveError?: string | null;
}

// <<< Add type for saved background items (matches DB structure) >>>
interface SavedBackgroundItem {
  id: string; // UUID from DB
  user_id: string;
  series_id: string | null;
  name: string;
  prompt: string | null;
  seed: number | null;
  image_url: string; // URL from Supabase storage
  created_at: string; // Timestamp string
}

// Define props if needed, e.g., for receiving initial state or callbacks
interface BackgroundDesignerProps {
  selectedSeriesId: string | null; // Add this prop
}

// <<< Define structure for prompt variations >>>
interface PromptVariationOptions {
  keywords?: string[];
  styles?: string[];
  lighting?: string[];
  details?: string[];
  mood?: string[];
  texture?: string[];
  // Add more categories as needed
}

interface PromptTemplate {
  base: string; // Template with placeholders like {keyword}, {style}, {detail}
  variations: PromptVariationOptions;
}

// <<< Define constants for default dimensions >>>
const DEFAULT_ELEMENT_WIDTH = 400;
const DEFAULT_ELEMENT_HEIGHT = 600;

// <<< Helper function to get a random element from an array >>>
const getRandomElement = <T,>(arr?: T[]): T | undefined => {
  if (!arr || arr.length === 0) {
    return undefined;
  }
  return arr[Math.floor(Math.random() * arr.length)];
};

// <<< Helper function to build the randomized prompt >>>
const buildRandomizedPrompt = (template: PromptTemplate): string => {
  let finalPrompt = template.base;
  const placeholders = finalPrompt.match(/\{(\w+)\}/g) || []; // Find all placeholders like {keyword}

  placeholders.forEach(placeholder => {
    const key = placeholder.slice(1, -1) as keyof PromptVariationOptions; // Get the key name (e.g., 'keyword')
    const options = template.variations[key];
    const randomChoice = getRandomElement(options);
    
    // Replace placeholder with random choice or an empty string if no choice found
    finalPrompt = finalPrompt.replace(placeholder, randomChoice || ''); 
  });

  // Clean up extra commas or spaces that might result from empty replacements
  finalPrompt = finalPrompt.replace(/,\s*,/g, ',').replace(/,\s*$/g, '').replace(/\s\s+/g, ' ').trim();

  return finalPrompt;
};

// <<< Updated Predefined Prompts with Variations >>>
const presetPrompts: Record<string, PromptTemplate> = {
  "Neon Alley": {
    base: "futuristic cyberpunk alleyway at night, {details}, {lighting}, {styles}, {mood}",
    variations: {
      details: [
        "wet pavement reflecting neon signs", 
        "steam rising from vents", 
        "trash scattered on the ground",
        "a lone figure walking in the distance",
        "glowing billboards overhead",
        "wires hanging loosely",
      ],
      lighting: ["atmospheric", "cinematic lighting", "dramatic shadows", "neon glow", "low key lighting"],
      styles: ["detailed", "photorealistic", "anime style", "concept art", "oil painting"],
      mood: ["atmospheric", "moody", "lonely", "gritty", "vibrant yet dark"],
    }
  },
  "Stripey": {
     base: "abstract background with {details} stripes, {styles}, high contrast",
     variations: {
       details: ["vibrant diagonal", "thin horizontal", "bold vertical", "wavy", "multi-colored"],
       styles: ["modern art style", "pop art", "minimalist", "geometric abstract", "op art"],
     }
  },
  "Patterned": {
     base: "geometric pattern background, intricate repeating {details} shapes, {styles} style, {texture} texture",
     variations: {
       details: ["hexagonal", "triangular", "circular", "interlocking", "floral-inspired"],
       styles: ["art deco", "islamic geometric", "modern abstract", "bauhaus"],
       texture: ["metallic", "brushed metal", "smooth plastic", "embossed paper", "glowing energy"],
     }
  },
  "Dungeon": {
      base: "dark stone dungeon wall texture, {details}, {lighting}, chains hanging, fantasy game background, {styles}",
      variations: {
          details: ["mossy", "cracked stones", "torch sconces on wall", "water dripping", "rough-hewn rock"],
          lighting: ["low key lighting", "torchlight flickering", "ominous shadows", "single beam of light"],
          styles: ["realistic", "painted", "stylized game art", "dark fantasy"],
      }
  },
  // Add variations for other presets (Neon Street, Bar, Dojo) following the same pattern
  "Neon Street": { // Example - add more variations
      base: "busy neon street scene at night, {details}, {styles}, cyberpunk city, reflections on wet ground, high detail",
      variations: {
         details: ["flying vehicles whizzing by", "crowds of people with umbrellas", "food stalls on the sidewalk", "holographic advertisements"],
         styles: ["detailed illustration", "cinematic concept art", "slightly gritty anime style"],
      }
  },
   "Bar": { // Example - add more variations
       base: "interior of a dimly lit, {mood} bar, {details}, wooden counter, bottles on shelves, {styles} style",
       variations: {
          mood: ["smoky", "cozy", "suspicious", "classic"],
          details: ["patrons sitting at tables", "a lone bartender wiping the counter", "neon beer signs glowing"],
          styles: ["vintage", "noir film", "modern minimalist", "rustic wood"],
       }
   },
   "Dojo": { // Example - add more variations
       base: "traditional japanese dojo interior, wooden floors, shoji screens, {details}, {lighting}, {mood} atmosphere",
       variations: {
          details: ["tatami mats", "calligraphy scrolls on the wall", "weapons rack", "zen garden visible outside"],
          lighting: ["sunlight streaming through window", "soft morning light", "evening lantern light"],
          mood: ["peaceful", "serene", "focused training", "meditative"],
       }
   },
};

// Pass props to the component function
const BackgroundDesigner: React.FC<BackgroundDesignerProps> = ({ selectedSeriesId }) => {
  const { isConnected, wallet, isLoading: isHandCashLoading, error: handCashError } = useHandCashWallet();
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationHistoryItem[]>([]);
  // <<< Add state for saved backgrounds and their loading/error status >>>
  const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBackgroundItem[]>([]);
  const [isFetchingSaved, setIsFetchingSaved] = useState<boolean>(false);
  const [fetchSavedError, setFetchSavedError] = useState<string | null>(null);
  
  // <<< Function to fetch saved backgrounds >>>
  const fetchSavedBackgrounds = useCallback(async () => {
    if (!wallet?.id) return; // Don't fetch if not logged in

    setIsFetchingSaved(true);
    setFetchSavedError(null);
    console.log('[BG Designer] Fetching saved backgrounds...');

    try {
      const response = await fetch('/api/save-background', { // Use the GET endpoint
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${wallet?.id}` // Pass wallet ID
        },
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to fetch saved backgrounds (status: ${response.status})`);
      }

      setSavedBackgrounds(result.data || []);
      console.log(`[BG Designer] Successfully fetched ${result.data?.length || 0} saved backgrounds.`);

    } catch (err: any) {
      console.error("[BG Designer] Error fetching saved backgrounds:", err);
      setFetchSavedError(err.message || 'An unknown error occurred while fetching saved backgrounds.');
      setSavedBackgrounds([]); // Clear on error
    } finally {
      setIsFetchingSaved(false);
    }
  }, [wallet?.id]);

  // <<< Fetch saved backgrounds on mount or when auth changes >>>
  useEffect(() => {
    fetchSavedBackgrounds();
  }, [fetchSavedBackgrounds]); // Use the function itself as dependency

  const handleGenerate = async () => {
    // <<< Temporarily bypass HandCash check >>>
    // if (!wallet?.id) {
    //   setError('Please connect your HandCash wallet first.');
    //   return;
    // }

    setIsLoading(true);
    setError(null);
    let paymentTxId: string | null = "(Payment Bypassed)"; // Indicate bypass
    console.log('Initiating generation for prompt (Payment Bypassed):', prompt);

    try {
      // <<< Temporarily bypass payment call >>>
      /*
      console.log(`Calling /api/handcash/pay to pay...`);
      const payResponse = await fetch('/api/handcash/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              walletId: wallet?.id!, // We would have checked wallet?.id above
              payments: [{
                  destination: 'ninjapunkgirls',
                  currencyCode: 'BSV',
                  amount: 0.001,
                  description: `AI Background Generation: ${prompt.substring(0, 50)}...`
              }]
          }),
      });
      const payResult = await payResponse.json();

      if (!payResponse.ok || !payResult.success) {
          throw new Error(payResult.error || `Payment failed with status: ${payResponse.status}`);
      }
      paymentTxId = payResult.transactionId;
      console.log('HandCash payment successful via API. Tx ID:', paymentTxId);
      */
      console.log('[INFO] Skipping actual HandCash payment call for now.');

      // <<< Proceed directly to Generation API call >>>
      console.log('Proceeding to call /api/generate-background');
      const genResponse = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          width: DEFAULT_ELEMENT_WIDTH,
          height: DEFAULT_ELEMENT_HEIGHT,
        }),
      });
      const genResult = await genResponse.json();
      if (!genResponse.ok || !genResult.success) {
        throw new Error(genResult.error || `Generation failed (status: ${genResponse.status}) after payment (Tx: ${paymentTxId}).`);
      }
      console.log('Generation successful, Seed:', genResult.seed);

      const newItem: GenerationHistoryItem = {
          imageData: genResult.imageData,
          name: prompt, // Initial name is the prompt
          prompt: prompt, // <<< Assign the prompt used >>>
          seed: genResult.seed,
          isSaving: false,
          saveError: null,
      };
      setGenerationHistory(prev => [newItem, ...prev]);

    } catch (err: any) {
      console.error("Payment or Generation failed:", err);
      const finalErrorMessage = paymentTxId 
         ? `${err.message} (Payment Tx: ${paymentTxId})`
         : err.message || 'An unknown error occurred.';
      setError(finalErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = useCallback((index: number, newName: string) => {
    setGenerationHistory(prev => 
      prev.map((item, i) => i === index ? { ...item, name: newName, saveError: null } : item)
    );
  }, []);

  const handleSave = useCallback(async (index: number) => {
    const itemToSave = generationHistory[index];
    // <<< Use the stored prompt field >>>
    const originalPromptUsed = itemToSave.prompt; 

    if (!itemToSave || itemToSave.isSaving || itemToSave.supabaseUrl) return;
    if (!wallet?.id) {
       // Handle case where user might have logged out before saving
       setGenerationHistory(prev => 
         prev.map((item, i) => i === index ? { ...item, saveError: 'Authentication token missing. Please re-login.' } : item)
       );
       return;
    }

    setGenerationHistory(prev => 
        prev.map((item, i) => i === index ? { ...item, isSaving: true, saveError: null } : item)
    );
    console.log(`Saving background: ${itemToSave.name}, Series ID: ${selectedSeriesId}`);

    try {
        const response = await fetch('/api/save-background', {
            method: 'POST',
            headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${wallet?.id}` // Include auth token for the POST request
            },
            body: JSON.stringify({
                imageData: itemToSave.imageData,
                filename: itemToSave.name,
                prompt: originalPromptUsed,
                seed: itemToSave.seed,
                seriesId: selectedSeriesId,
            }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || `Save failed with status: ${response.status}`);
        }

        console.log('Save successful, Supabase URL:', result.supabaseUrl);
        // Update the specific item in history (optional, maybe remove instead)
        // setGenerationHistory(prev => 
        //     prev.map((item, i) => i === index ? { ...item, isSaving: false, supabaseUrl: result.supabaseUrl } : item)
        // );
        
        // <<< Remove item from generation history after successful save >>>
        setGenerationHistory(prev => prev.filter((_, i) => i !== index));

        // <<< Trigger re-fetch of saved backgrounds >>>
        fetchSavedBackgrounds(); 

    } catch (error: any) {
      console.error("Save failed:", error);
       setGenerationHistory(prev => 
         prev.map((item, i) => i === index ? { ...item, isSaving: false, saveError: error.message || 'Unknown save error' } : item)
       );
    }
  }, [generationHistory, selectedSeriesId, wallet?.id, fetchSavedBackgrounds]); // Added dependencies

  // <<< Handler for Preset Button Click >>>
  const handlePresetClick = (presetKey: string) => {
    const template = presetPrompts[presetKey];
    if (template) {
      const randomizedPrompt = buildRandomizedPrompt(template);
      setPrompt(randomizedPrompt);
    } else {
      console.warn(`Preset template not found for key: ${presetKey}`);
      // Fallback to original behavior if template somehow missing (shouldn't happen)
      // setPrompt(presetPrompts[presetKey]?.base || ''); 
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col md:flex-row gap-6">

        {/* Left Column: Generation Controls & Main Preview */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex-shrink-0">
          <h2 className="text-xl text-orange-400 mb-4">Background Designer</h2>
          <p className="text-gray-400 mb-1 text-sm">
            Target Dimensions: {DEFAULT_ELEMENT_WIDTH}x{DEFAULT_ELEMENT_HEIGHT}px.
          </p>
          <p className="text-gray-500 mb-4 text-xs">
            Use presets or enter your own prompt.
          </p>

          {/* Preset Buttons (Update onClick) */}
          <div className="mb-4 flex flex-wrap gap-2">
             {Object.entries(presetPrompts).map(([name, template]) => ( // Iterate over new structure
               <button 
                 key={name}
                 onClick={() => handlePresetClick(name)} // <<< Use the new handler >>>
                 title={template.base} // Show base template on hover
                 className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors"
               >
                 {name}
               </button>
             ))}
          </div>

          {/* Prompt Input */}
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Prompt:</label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... or select a preset"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            ></textarea>
          </div>

          {/* Generation Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!wallet?.id ? "Connect HandCash wallet first (Payment bypassed for now)" : undefined}
          >
            {isLoading ? 'Processing...' : 'Generate Background (0.001 BSV)'}
          </button>

          {/* Display General Error / Connect Message */}
          {error && (
            <p className="text-red-500 text-sm bg-red-900/30 p-2 rounded mt-4">Error: {error}</p>
          )}
          {!wallet?.id && (
             <p className="text-yellow-500 text-sm bg-yellow-900/30 p-2 rounded mt-4">Connect HandCash to generate images (Payment bypassed for now).</p>
          )}

          {/* Main Generated Image Preview */}
          <div className="mt-6">
             <h3 className="text-lg text-gray-400 mb-2">
                {generationHistory.length > 0 ? 'Latest Generation' : 'Generated Background'}
             </h3>
             <>
               {generationHistory.length > 0 ? (
                  <>
                    <div className={`relative aspect-[${DEFAULT_ELEMENT_WIDTH}/${DEFAULT_ELEMENT_HEIGHT}] w-full max-w-md bg-gray-700/50 rounded border border-dashed border-gray-600 flex items-center justify-center overflow-hidden mx-auto`}>
                       {isLoading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><p className="text-gray-400 animate-pulse">Generating...</p></div>}
                       <img src={generationHistory[0].imageData} alt={generationHistory[0].name} className="object-contain w-full h-full" />
                    </div>
                    <div className="mt-2 max-w-md mx-auto">
                      <input 
                        type="text"
                        value={generationHistory[0].name}
                        onChange={(e) => handleNameChange(0, e.target.value)}
                        placeholder="Enter filename" 
                        className="w-full p-1.5 rounded bg-gray-600 border border-gray-500 text-white text-sm mb-1"
                        disabled={!!generationHistory[0].supabaseUrl || generationHistory[0].isSaving}
                      />
                      <button 
                         onClick={() => handleSave(0)}
                         disabled={!!generationHistory[0].supabaseUrl || generationHistory[0].isSaving || !generationHistory[0].name.trim()}
                         className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                         {generationHistory[0].isSaving ? 'Saving...' : (generationHistory[0].supabaseUrl ? 'Saved' : 'Save Latest')}
                      </button>
                      {generationHistory[0].saveError && <p className="text-red-400 text-xs mt-1">Save Error: {generationHistory[0].saveError}</p>}
                    </div>
                  </>
               ) : (
                 <div className={`aspect-[${DEFAULT_ELEMENT_WIDTH}/${DEFAULT_ELEMENT_HEIGHT}] w-full max-w-md bg-gray-700/50 rounded border border-dashed border-gray-600 flex items-center justify-center overflow-hidden mx-auto`}>
                     <p className="text-gray-500">Image will appear here</p>
                 </div>
               )}
             </>
          </div>
        </div>

        {/* Right Column: Generation History Catalogue */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex-grow flex flex-col min-h-0">
          <h3 className="text-lg text-gray-400 mb-2 flex-shrink-0">Generation History</h3>
          {generationHistory.length === 0 && (
              <p className="text-sm text-gray-500 flex-grow flex items-center justify-center">No generations yet.</p>
          )}
          {generationHistory.length > 0 && (
              <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                 {generationHistory.map((item, index) => (
                   <div key={`${item.seed}-${index}`} className="p-2 bg-gray-800/50 rounded border border-gray-700 flex gap-3 items-start">
                      <img 
                         src={item.imageData} 
                         alt={item.name} 
                         className="w-20 h-auto aspect-[${DEFAULT_ELEMENT_WIDTH}/${DEFAULT_ELEMENT_HEIGHT}] object-contain border border-gray-600 rounded flex-shrink-0"
                       />
                      {/* Name Input & Save Button */}
                      {/* <<< Adjust layout and button width >>> */}
                      <div className="flex-grow flex flex-col gap-1">
                          <input 
                             type="text"
                             value={item.name}
                             onChange={(e) => handleNameChange(index, e.target.value)}
                             placeholder="Enter filename" 
                             className="w-full p-1 rounded bg-gray-700 border border-gray-600 text-white text-xs"
                             disabled={!!item.supabaseUrl || item.isSaving}
                           />
                          <div className="flex items-center gap-2"> { /* Wrap button and status text */ }
                            <button 
                                onClick={() => handleSave(index)}
                                disabled={!!item.supabaseUrl || item.isSaving || !item.name.trim()}
                                // Remove w-full, add padding
                                className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-[10px] font-medium rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {item.isSaving ? 'Saving...' : (item.supabaseUrl ? 'Saved' : 'Save')}
                            </button>
                            {/* Status text moved next to button */}
                            <div className="flex-grow text-right">
                                {item.saveError && <p className="text-red-400 text-[10px]">Error: {item.saveError}</p>}
                                {item.supabaseUrl && <p className="text-gray-500 text-[10px] truncate" title={item.supabaseUrl}>Saved</p>}
                                {!item.supabaseUrl && !item.isSaving && !item.saveError && <p className="text-gray-500 text-[10px]">Seed: {item.seed}</p>} 
                           </div>
                          </div>
                       </div>
                   </div>
                 ))}
              </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BackgroundDesigner; 