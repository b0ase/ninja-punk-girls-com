'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@/context/AuthContext'; 
import BackgroundDesigner from '@/components/BackgroundDesigner';
import NftCardDesigner from '@/components/NftCardDesigner'; 
import ElementCardDesigner from '@/components/ElementCardDesigner';
import { LayerManagerProvider, useLayerManager } from '@/context/LayerManagerContext';
import { ParsedFileInfo } from '@/app/api/asset-files/route'; 
import type { PositionState } from '@/components/ElementCardDesigner'; // Ensure this is correctly typed
import { initialElementCoords, ElementPositionKeys } from '@/data/layout-constants';

// Define types for StudioPage specific states and props
interface SeriesListItem {
  id: string;
  name: string;
}

type StudioTab = 'npgAi' | 'seriesMaker' | 'backgroundDesigner' | 'layerManager' | 'nftCardDesign' | 'elementCardDesign' | 'elementBuilder' | 'assetFiles' | 'aiInteraction';

// Props for the TabButton component
interface TabButtonProps {
  label: string;
  tabKey: StudioTab;
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
}

const StudioPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<StudioTab>('npgAi');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [availableSeriesList, setAvailableSeriesList] = useState<SeriesListItem[]>([]);
  const [isLoadingSeriesList, setIsLoadingSeriesList] = useState<boolean>(true);
  const [isCreatingNewSeries, setIsCreatingNewSeries] = useState<boolean>(false);

  // States for Series Concept form
  const [seriesConceptName, setSeriesConceptName] = useState<string>('');
  const [seriesDescription, setSeriesDescription] = useState<string>('');
  const [seriesStyleKeywords, setSeriesStyleKeywords] = useState<string>('');
  const [seriesColorNotes, setSeriesColorNotes] = useState<string>('');
  const [seriesInfluences, setSeriesInfluences] = useState<string>('');
  const [isSavingConcept, setIsSavingConcept] = useState<boolean>(false);
  const [saveConceptStatus, setSaveConceptStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoadingConcept, setIsLoadingConcept] = useState<boolean>(false);
  const [loadConceptError, setLoadConceptError] = useState<string | null>(null);

  // States for PNG Cutter
  const [cutterSourceImage, setCutterSourceImage] = useState<File | null>(null);
  const [cutterResultPng, setCutterResultPng] = useState<string | null>(null);
  const [isCutting, setIsCutting] = useState<boolean>(false);
  const [cutterError, setCutterError] = useState<string | null>(null);

  // States for Asset Files tab
  const [assetFiles, setAssetFiles] = useState<ParsedFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [fetchFilesError, setFetchFilesError] = useState<string | null>(null);
  const [checkedFiles, setCheckedFiles] = useState<Set<string>>(new Set());

  // New state for the selected asset in Element Builder
  const [selectedPngForAIArt, setSelectedPngForAIArt] = useState<string | null>(null); // Holds path if selected from dropdown, or File object if uploaded
  const [uploadedAiArtFile, setUploadedAiArtFile] = useState<File | null>(null); // New state for uploaded file object

  // New states for Stability AI integration
  const [aiArtPrompt, setAiArtPrompt] = useState<string>('An artistic and beautiful re-imagining of the input image.');
  const [aiArtStylePreset, setAiArtStylePreset] = useState<string>('photographic'); // Default style
  const [aiArtImageStrength, setAiArtImageStrength] = useState<number>(0.35); // New state for image strength
  const [generatedArtImage, setGeneratedArtImage] = useState<string | null>(null); // To store base64 result
  const [isGeneratingArt, setIsGeneratingArt] = useState<boolean>(false);
  const [aiArtError, setAiArtError] = useState<string | null>(null);

  // === COMMENTED OUT LayerManager state/functions (no longer in context) ===
  // const { 
  //   layersConfig,
  //   numCustomLayers,
  //   elementsPerLayer,
  //   previewImageUrl,
  //   isPreviewLoading,
  //   handleNumLayersChange,
  //   // setElementsPerLayer, // This seems to be missing from context based on original code
  //   handleLayerNameChange,
  //   handleFileUpload,
  //   handleFileRemove,
  //   generatePreview,
  //   getLayerColor
  // } = useLayerManager(); // Using the context hook
  // === Placeholder values (replace or remove if logic changes) ===
  const layersConfig: any[] = []; // Placeholder
  const numCustomLayers: number = 0; // Placeholder
  const previewImageUrl: string | null = null; // Placeholder
  const isPreviewLoading: boolean = false; // Placeholder
  const handleNumLayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {}; // Placeholder
  const handleLayerNameChange = (id: string | number, name: string) => {}; // Placeholder
  const handleFileUpload = (id: string | number, files: FileList | null) => {}; // Placeholder
  const handleFileRemove = (id: string | number, file: File) => {}; // Placeholder
  const generatePreview = () => {}; // Placeholder
  const getLayerColor = (id?: string) => 'bg-gray-800'; // Placeholder

  // Define element layout state (for ElementCardDesigner)
  const [elementLayoutPositions, setElementLayoutPositions] = useState<Record<ElementPositionKeys, PositionState>>(initialElementCoords);

  // Handler for saving element card layout
  const handleElementLayoutSave = useCallback(async (newLayout: Record<ElementPositionKeys, PositionState>) => {
    // TODO: Implement saving logic (e.g., to Supabase or local storage)
    console.log('[StudioPage] Saving element card layout:', newLayout);
    setElementLayoutPositions(newLayout);
    // Example: Save to Supabase (ensure you have a table and RLS configured)
    /*
    if (!selectedSeriesId) {
      console.error("No series selected to save layout for.");
      return;
    }
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase
      .from('series_element_layouts') // Assuming a table named 'series_element_layouts'
      .update({ layout_config: newLayout })
      .eq('series_id', selectedSeriesId);

    if (error) {
      console.error('Error saving element layout:', error);
    } else {
      console.log('Element layout saved successfully');
    }
    */
  }, [selectedSeriesId]);

  // Static data for tab descriptions and colors (can be moved to a config file)
  const toolTabDetails: Record<StudioTab, { title: string; description: string; color: string }> = {
    npgAi: { title: 'NPG AI Overview', description: 'Main dashboard and AI assistant integration.', color: 'bg-cyan-700/70 hover:bg-cyan-600/90' },
    seriesMaker: { title: 'Series Concept Maker', description: 'Define the core concept of your NFT series.', color: 'bg-yellow-700/70 hover:bg-yellow-600/90' },
    backgroundDesigner: { title: 'Background Designer', description: 'Create and customize series backgrounds.', color: 'bg-indigo-700/70 hover:bg-indigo-600/90' },
    layerManager: { title: 'Layer Manager & Preview', description: 'Upload assets, configure layers, and preview.', color: 'bg-blue-700/70 hover:bg-blue-600/90' },
    nftCardDesign: { title: 'NFT Card Design', description: 'Design the main NFT character card.', color: 'bg-purple-700/70 hover:bg-purple-600/90' },
    elementCardDesign: { title: 'Element Card Design', description: 'Design individual element cards.', color: 'bg-pink-700/70 hover:bg-pink-600/90' },
    elementBuilder: { title: 'Element Builder & AI Tools', description: 'Construct elements, use AI for background removal.', color: 'bg-teal-700/70 hover:bg-teal-600/90' },
    assetFiles: { title: 'Asset Files Manager', description: 'View, manage, and share your uploaded asset files.', color: 'bg-green-700/70 hover:bg-green-600/90' },
    aiInteraction: { title: 'AI Interaction Center', description: 'Chat with NPG AI for brainstorming and assistance.', color: 'bg-orange-700/70 hover:bg-orange-600/90' },
  };
  // Define the order of tabs for rendering the cards
  const orderedToolTabs: StudioTab[] = [
    'seriesMaker', 
    'backgroundDesigner',
    'layerManager',
    'nftCardDesign',
    'elementCardDesign',
    'elementBuilder',
    'assetFiles',
    'aiInteraction',
  ];

  // Fetch available series for the dropdown
  useEffect(() => {
    const fetchSeries = async () => {
      if (!user) return; // Only fetch if user data is loaded
      setIsLoadingSeriesList(true);
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await supabase
          .from('series_concepts')
          .select('id, name')
          .eq('user_id', user.id) // Filter by current user
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailableSeriesList(data || []);
        if (data && data.length > 0 && !selectedSeriesId) {
           // Optionally auto-select the first series if none is selected
           // setSelectedSeriesId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching series list:', error);
        // Handle error (e.g., show a notification)
      } finally {
        setIsLoadingSeriesList(false);
      }
    };
    fetchSeries();
  }, [user, selectedSeriesId]); // Re-fetch if user changes

  // Fetch asset files for the selected series
  const assetFilePartHeaders = useMemo(() => {
    if (!assetFiles || assetFiles.length === 0) return [];
    // Assuming all filenames have the same number of parts, use the first file to determine headers
    // You might need a more robust way if part counts vary or if you have predefined headers
    return assetFiles[0].filenameParts.map((_, i) => `Part ${i + 1}`);
  }, [assetFiles]);

  // Fetch asset files for the selected series (or all if no series selected for general use)
  useEffect(() => {
    const fetchAssetFilesForBuilder = async () => {
        if (!selectedSeriesId) { // Only fetch if a series is selected, otherwise dropdown is empty
            setAssetFiles([]); // Clear asset files if no series is selected
            setSelectedPngForAIArt(null); // Clear selection
            return;
        }
        // This logic is similar to the one for 'assetFiles' tab, but always runs if series changes
        // and elementBuilder is a possible target, or if we want to pre-populate.
        // For now, let's rely on assetFiles being populated by the 'assetFiles' tab logic
        // or by a dedicated fetch if elementBuilder is active.
        // To keep it simple, we will use the existing assetFiles state which is updated
        // when the 'assetFiles' tab is active OR when selectedSeriesId changes and that tab was already visited.
        // A more robust solution might fetch assets if `selectedSeriesId` changes, regardless of activeTab,
        // if `elementBuilder` needs them immediately.

        // For now, we assume assetFiles is populated appropriately when a series is selected.
        // We can refine this if direct navigation to elementBuilder without visiting assetFiles tab causes issues.
    };

    // If series changes, and we might need assets for element builder, consider fetching.
    // For now, this effect is just a placeholder for potential direct fetching for element builder.
    // The main asset fetching is tied to the 'assetFiles' tab or selectedSeriesId changing.
    if (selectedSeriesId) {
        // Potentially trigger a fetch here if assetFiles are not up-to-date
        // This duplicates the existing fetchAssetFiles logic, so care is needed.
        // For simplicity, we will ensure assetFiles is globally available and updated.
        // The existing useEffect for fetchAssetFiles already depends on selectedSeriesId,
        // but it's also tied to activeTab === 'assetFiles'.
        // Let's modify the existing fetchAssetFiles to also run if elementBuilder is active.
    } else {
        setAssetFiles([]); // Clear if no series selected
        setSelectedPngForAIArt(null);
    }
  }, [selectedSeriesId]); // React to series changes for Element Builder assets

  // Modified useEffect for fetching asset files
  useEffect(() => {
    const fetchAssetFiles = async () => {
        if (!selectedSeriesId) {
            setAssetFiles([]);
            setSelectedPngForAIArt(null); 
            setUploadedAiArtFile(null); // Clear uploaded file
            setGeneratedArtImage(null); // Clear previous results
            setAiArtError(null);
            return;
        }
        setIsLoadingFiles(true);
        setFetchFilesError(null);
        try {
            if (!isAuthenticated) {
                console.warn("User not authenticated for fetching asset files.");
                setFetchFilesError("User not authenticated");
                setAssetFiles([]);
                return; 
            }
            const response = await fetch(`/api/asset-files?seriesId=${selectedSeriesId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
                throw new Error(errorData.error || `Failed to fetch asset files: ${response.statusText}`);
            }
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || "API returned unsuccessful status for asset files.");
            }
            setAssetFiles(data.data || []);
            setSelectedPngForAIArt(null); 
            setUploadedAiArtFile(null); // Clear uploaded file
            setGeneratedArtImage(null); // Clear previous results
            setAiArtError(null);
        } catch (error: any) {
            console.error("Error fetching asset files:", error);
            setFetchFilesError(error.message);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    // Fetch when selectedSeriesId changes, OR when assetFiles/elementBuilder tab becomes active with a series selected
    if (selectedSeriesId && (activeTab === 'assetFiles' || activeTab === 'elementBuilder')) {
        fetchAssetFiles();
    } else if (!selectedSeriesId) {
      setAssetFiles([]);
      setSelectedPngForAIArt(null);
      setUploadedAiArtFile(null);
      setGeneratedArtImage(null);
      setAiArtError(null);
    }
  // Depend on activeTab as well, so if user switches to elementBuilder and series is selected, files are fetched.
  }, [activeTab, selectedSeriesId, isAuthenticated]); 





  const handleFileCheckChange = (filename: string, isChecked: boolean) => {
    setCheckedFiles(prev => {
        const newSet = new Set(prev);
        if (isChecked) {
            newSet.add(filename);
        } else {
            newSet.delete(filename);
        }
        return newSet;
    });
  };

  // Save Series Concept Handler (for updating existing)
  const handleSaveSeriesConcept = useCallback(async () => {
    if (!selectedSeriesId) {
        setSaveConceptStatus({ type: 'error', message: 'No series selected to update.' });
        return;
    }
    if (!isAuthenticated) {
        setSaveConceptStatus({ type: 'error', message: 'User not authenticated. Please log in.' });
        return;
    }
    if (!seriesConceptName.trim()) {
        setSaveConceptStatus({ type: 'error', message: 'Series Name cannot be empty.' });
        return;
    }

    setIsSavingConcept(true);
    setSaveConceptStatus(null);

    const updatedConceptData = {
        name: seriesConceptName,
        description: seriesDescription,
        style_keywords: seriesStyleKeywords,
        color_notes: seriesColorNotes,
        influences: seriesInfluences,
    };

    try {
        console.log(`[StudioPage] Updating series concept ${selectedSeriesId}...`, updatedConceptData);
        const response = await fetch('/api/update-series-concept', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                seriesId: selectedSeriesId, 
                ...updatedConceptData 
            }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            // Attempt to get a more specific error message from the API response
            const errorMessage = result.error || (response.statusText || `HTTP error! status: ${response.status}`);
            throw new Error(errorMessage);
        }

        console.log('[StudioPage] Series concept updated successfully:', result.data);
        setSaveConceptStatus({ type: 'success', message: 'Concept updated successfully!' });
        
        // Update the name in the dropdown list if it changed
        setAvailableSeriesList(prevList => 
            prevList.map(series => 
                series.id === selectedSeriesId ? { ...series, name: seriesConceptName } : series
            )
        );

    } catch (error: any) {
        console.error('[StudioPage] Error updating series concept:', error);
        setSaveConceptStatus({ type: 'error', message: error.message || 'Failed to update concept.' });
    } finally {
        setIsSavingConcept(false);
    }
  }, [
      isAuthenticated, 
      selectedSeriesId, 
      seriesConceptName, 
      seriesDescription, 
      seriesStyleKeywords, 
      seriesColorNotes, 
      seriesInfluences
  ]); // Dependencies for the useCallback

  // <<< Add handler for PNG Cutter >>>
  const handleCutterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCutterSourceImage(file);
    }
  };

  const handleCutImage = async () => {
    if (!cutterSourceImage) return;

    setIsCutting(true);
    setCutterResultPng(null);
    setCutterError(null);

    try {
      const formData = new FormData();
      formData.append('image', cutterSourceImage, cutterSourceImage.name);

      const response = await fetch('/api/cut-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful status');
      }

      setCutterResultPng(result.data.cutResultPng);
    } catch (error: any) {
      console.error('Error cutting image:', error);
      setCutterError(error.message || 'An unknown error occurred');
    } finally {
      setIsCutting(false);
    }
  };

  // <<< Add Effect to Fetch Series CONCEPT >>>
  useEffect(() => {
    const fetchConceptDetails = async () => {
      if (!selectedSeriesId) {
        if (!isCreatingNewSeries) {
           setSeriesConceptName(''); setSeriesDescription(''); setSeriesStyleKeywords(''); setSeriesColorNotes(''); setSeriesInfluences(''); setLoadConceptError(null);
        }
        setIsLoadingConcept(false);
        return;
      }
      setIsLoadingConcept(true); setLoadConceptError(null);
      console.log(`Fetching concept: ${selectedSeriesId}`);
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");

        // --- Fetch without .single() ---
        const { data: conceptDataArray, error: conceptError } = await supabase
            .from('series_concepts')
            .select('*') // Select all columns
            .eq('id', selectedSeriesId) // Filter by selected ID
            .eq('user_id', user.id); // Ensure it belongs to the logged-in user

        // --- Handle potential errors and different numbers of results ---
        if (conceptError) {
            // Handle specific Supabase errors if needed, otherwise throw generic
             if (conceptError.code === 'PGRST116' || conceptError.message.includes("multiple") || conceptError.message.includes("no rows")) {
                // This case shouldn't technically happen if .single() isn't used, but good practice
                console.warn(`Supabase query for ID ${selectedSeriesId} returned an unexpected state: ${conceptError.message}`);
                setSeriesConceptName(''); setSeriesDescription(''); setSeriesStyleKeywords(''); setSeriesColorNotes(''); setSeriesInfluences(''); // Clear form
             } else {
                throw conceptError; // Throw other database errors
             }
        } else if (!conceptDataArray || conceptDataArray.length === 0) {
            // Case: No concept found for this user and ID
            console.warn(`No concept found in DB for ID: ${selectedSeriesId}. Clearing form.`);
            setSeriesConceptName(''); setSeriesDescription(''); setSeriesStyleKeywords(''); setSeriesColorNotes(''); setSeriesInfluences(''); // Clear form
            // Optionally set an error message if needed:
            // setLoadConceptError('No concept found for this ID.');
        } else if (conceptDataArray.length > 1) {
            // Case: Multiple concepts found (unexpected, indicates potential data issue)
            console.error(`Multiple concepts found for ID: ${selectedSeriesId}. Using the first one found.`);
            const conceptData = conceptDataArray[0]; // Use the first one
            setSeriesConceptName(conceptData.name || '');
            setSeriesDescription(conceptData.description || '');
            setSeriesStyleKeywords(conceptData.style_keywords || '');
            setSeriesColorNotes(conceptData.color_notes || '');
            setSeriesInfluences(conceptData.influences || '');
            setLoadConceptError('Warning: Multiple entries found for this ID; displayed first.'); // Inform user
        } else {
            // Case: Exactly one concept found (the expected case)
            const conceptData = conceptDataArray[0];
            console.log("Concept data fetched successfully:", conceptData);
            setSeriesConceptName(conceptData.name || '');
            setSeriesDescription(conceptData.description || '');
            setSeriesStyleKeywords(conceptData.style_keywords || '');
            setSeriesColorNotes(conceptData.color_notes || '');
            setSeriesInfluences(conceptData.influences || '');
        }
      } catch (error: any) {
         console.error("Error fetching concept details:", error);
         setLoadConceptError(error.message || 'Failed to load concept details.');
         // Clear form on error as well? Maybe not, depends on desired UX
         // setSeriesConceptName(''); setSeriesDescription(''); // etc.
      } finally {
        setIsLoadingConcept(false);
      }
    };
    fetchConceptDetails();
  }, [selectedSeriesId, isCreatingNewSeries]); // Dependencies remain the same

  // <<< Add handler for Creating Series Concept >>>
  const handleCreateSeriesConcept = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        setSaveConceptStatus({ type: 'error', message: 'Please log in first.' });
        return;
    }
    if (!seriesConceptName.trim()) {
        setSaveConceptStatus({ type: 'error', message: 'Series Name cannot be empty.' });
        return;
    }

    setIsSavingConcept(true);
    setSaveConceptStatus(null);

    const newConceptData = {
        user_id: currentUser.id, // Associate with the current user
        name: seriesConceptName,
        description: seriesDescription,
        style_keywords: seriesStyleKeywords,
        color_notes: seriesColorNotes,
        influences: seriesInfluences,
    };

    try {
        console.log(`[StudioPage] Creating new series concept...`, newConceptData);

        // --- Modify query: Remove .single() ---
        const { data: createdDataArray, error: insertError } = await supabase
            .from('series_concepts')
            .insert(newConceptData)
            .select('id, name'); // Select the new ID and name (returns array now)

        if (insertError) {
            // Handle potential insert errors directly
            console.error('[StudioPage] Error inserting series concept:', insertError);
            throw insertError; // Rethrow to be caught below
        }

        // --- Handle the returned array ---
        if (!createdDataArray || createdDataArray.length === 0) {
            // Case: Insert might have succeeded but select failed to return the row immediately
            console.error('[StudioPage] Failed to retrieve concept details immediately after creation.');
            throw new Error("Failed to retrieve concept details after creation.");
        } else if (createdDataArray.length > 1) {
             // Case: Unexpectedly got multiple rows back after insert/select
             console.error('[StudioPage] Multiple rows returned after creating concept. Using first.', createdDataArray);
             // Decide how to handle this - using the first one is a reasonable default
             const createdData = createdDataArray[0];
             setSaveConceptStatus({ type: 'success', message: 'New concept created! (Multiple rows returned, used first)' });
             setAvailableSeriesList(prevList => [...prevList, { id: createdData.id, name: createdData.name }]);
             setSelectedSeriesId(createdData.id); // Auto-select new series
        } else {
             // Case: Exactly one row returned (expected)
             const createdData = createdDataArray[0];
             console.log('[StudioPage] New series concept created successfully:', createdData);
             setSaveConceptStatus({ type: 'success', message: 'New concept created successfully!' });
             setAvailableSeriesList(prevList => [...prevList, { id: createdData.id, name: createdData.name }]);
             setSelectedSeriesId(createdData.id); // Auto-select new series
        }

        // --- Logic after successful creation (moved inside the else block essentially) ---
        // No need to clear form usually, user might want to see what they created
        // setIsCreatingNewSeries(false); // Already handled by selecting the new ID

    } catch (error: any) {
        console.error('[StudioPage] Error during series concept creation process:', error);
        // Use a more specific message if available from the error object
        const message = error.message || 'Failed to create concept.';
        setSaveConceptStatus({ type: 'error', message: message });
    } finally {
        setIsSavingConcept(false);
    }
  }, [
      // Dependencies: Ensure all state variables used are listed
      seriesConceptName,
      seriesDescription,
      seriesStyleKeywords,
      seriesColorNotes,
      seriesInfluences
  ]);
  // <<< END handler for Creating Series Concept >>>

  // <<< Add handler for Asset Sharing Toggle (Placeholder) >>>
  const handleShareToggle = (assetId: string, targetSeriesId: string, currentSharedStatus: boolean) => {
     console.log(`[Asset Sharing] Toggling share for asset ${assetId} with series ${targetSeriesId}. Current status: ${currentSharedStatus}. New status: ${!currentSharedStatus}`);
     // TODO: Implement API call to /api/share-asset (or similar)
     // TODO: Update local assetFiles state optimistically or re-fetch
  };

  const handleAiArtFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setUploadedAiArtFile(file);
        setSelectedPngForAIArt(null); // Clear any dropdown selection if a file is uploaded
        setGeneratedArtImage(null); // Clear previous result
        setAiArtError(null);
        console.log("File selected for AI Art (upload):", file.name);
    } else {
        setUploadedAiArtFile(null);
    }
  };

  const handleGenerateArtisticImage = async () => {
    if (!selectedPngForAIArt && !uploadedAiArtFile) {
        setAiArtError("Please select an image from the series or upload a PNG.");
        return;
    }
    if (!aiArtPrompt.trim()) {
        setAiArtError("Please enter a prompt for the AI.");
        return;
    }

    setIsGeneratingArt(true);
    setAiArtError(null);
    setGeneratedArtImage(null);

    const formData = new FormData();
    formData.append('prompt', aiArtPrompt);
    formData.append('stylePreset', aiArtStylePreset);
    formData.append('imageStrength', aiArtImageStrength.toString());

    if (uploadedAiArtFile) {
        formData.append('image', uploadedAiArtFile);
    } else if (selectedPngForAIArt) {
        formData.append('imagePath', selectedPngForAIArt); // Pass the public path
    }

    try {
        const response = await fetch('/api/stability-ai/transform', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to generate artistic image.');
        }

        setGeneratedArtImage(`data:image/png;base64,${result.imageBase64}`);
    } catch (error: any) {
        console.error("Error generating artistic image:", error);
        setAiArtError(error.message || "An unexpected error occurred.");
    } finally {
        setIsGeneratingArt(false);
    }
  };

  // --- Tab Rendering Logic --- 
  const renderActiveTabContent = () => {
    const pngAssetFiles = assetFiles.filter(file => file.filename.toLowerCase().endsWith('.png'));
    // Available Stability AI Style Presets (example list)
    const stabilityStylePresets = [
        { label: 'Photographic', value: 'photographic' },
        { label: 'Cinematic', value: 'cinematic' },
        { label: 'Anime', value: 'anime' },
        { label: 'Fantasy Art', value: 'fantasy-art' },
        { label: 'Neon Punk', value: 'neon-punk' },
        { label: 'Digital Art', value: 'digital-art' },
        { label: 'Comic Book', value: 'comic-book' },
        { label: 'Low Poly', value: 'low-poly' },
        { label: 'Origami', value: 'origami' },
        { label: 'Pixel Art', value: 'pixel-art' },
        { label: 'Line Art', value: 'line-art' },
        { label: 'Enhance (Subtle)', value: 'enhance' },
        { label: 'Isometric', value: 'isometric' },
        { label: '3D Model', value: '3d-model' },
    ];

    switch (activeTab) {
      case 'backgroundDesigner':
        return <BackgroundDesigner selectedSeriesId={selectedSeriesId} />;
      case 'layerManager':
        // === Layer Manager Content Replaced with Placeholder ===
        return (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl text-blue-400 mb-4">Layer Manager & Preview</h2>
            <p className="text-gray-400">This section is currently under development.</p>
          </div>
        );
        // === End Placeholder ===
      case 'npgAi':
        return <div className="max-w-5xl mx-auto">
          {/* Tab Title */}
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6 text-center">Studio Overview</h2>
          
          {/* Introductory Text */}
          <p className="text-center text-lg text-gray-300 mb-8">
             Welcome to the NPG Studio! This is your creative hub for designing and building your own unique Ninja Punk Girls series.
             Leverage AI tools and intuitive designers to bring your vision to life.
             <br />
             Select a series below or start a new one!
          </p>

          {/* Render Cards using toolTabDetails */}
          <div className="mt-10 border-t border-gray-700 pt-8">
            <h3 className="text-xl font-semibold text-gray-300 mb-6 text-center">Studio Tools:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Map over the orderedToolTabs array */} 
                {orderedToolTabs.map((tabKey) => {
                    const details = toolTabDetails[tabKey];
                    if (!details) return null; // Should not happen with proper types
                    
                    return (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`p-6 rounded-lg shadow-lg text-left transition-transform transform hover:scale-105 ${details.color}`}
                        >
                            <h2 className="text-xl font-semibold text-white mb-2 text-shadow-md shadow-black/60">{details.title}</h2>
                            <p className="text-gray-100 text-sm text-shadow shadow-black/60">{details.description}</p>
                        </button>
                    );
                })}
            </div>
          </div>
          {/* <<< END Card Rendering >>> */}
          
        </div>;
      case 'nftCardDesign':
        return <NftCardDesigner selectedSeriesId={selectedSeriesId} />;
      case 'elementCardDesign':
        return <ElementCardDesigner
          initialLayout={elementLayoutPositions}
          onSaveLayout={handleElementLayoutSave}
          selectedSeriesId={selectedSeriesId}
        />;
      case 'seriesMaker':
        return <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
            {isCreatingNewSeries ? 'Define Your New Series Concept' : 'Edit Series Concept'}
          </h2>
          
          {/* Explanatory Text */} 
          <p className="text-center text-gray-400 mb-6 text-sm">
              {isCreatingNewSeries 
                 ? "Fill out the details below to create the core concept for your new series."
                 : "Select a series from the dropdown above. Use the fields below to update its core concept."
              }
          </p>

          {/* Content Area */} 
          <div className="mt-4 border-t border-gray-700 pt-6">
            {isLoadingConcept && selectedSeriesId && ( 
                <p className="text-center text-yellow-400 animate-pulse my-4">Loading concept details...</p>
            )}
            {loadConceptError && selectedSeriesId && ( 
                <p className="text-center text-red-500 my-4">Error loading concept: {loadConceptError}</p>
            )}
            
            {/* *** UPDATED Form Rendering Condition *** */}
            {(!isLoadingConcept || !selectedSeriesId) && !loadConceptError && (selectedSeriesId || isCreatingNewSeries) && (
              <div className="space-y-4">
                 {/* Series Name */}
                 <div>
                    <label htmlFor="seriesConceptName" className="block text-sm font-medium text-gray-300 mb-1">Series Name:</label>
                    <input 
                       type="text" id="seriesConceptName" value={seriesConceptName}
                       onChange={(e) => setSeriesConceptName(e.target.value)}
                       placeholder="e.g., Cybernetic Crusaders"
                       className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                 </div>
                  {/* Series Description */}
                  <div>
                    <label htmlFor="seriesDescription" className="block text-sm font-medium text-gray-300 mb-1">Description / Concept:</label>
                    <textarea
                       id="seriesDescription" rows={3} value={seriesDescription}
                       onChange={(e) => setSeriesDescription(e.target.value)}
                       placeholder="Briefly describe the theme, story, or core idea of your series..."
                       className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    ></textarea>
                  </div>
                  {/* Style Keywords */}
                  <div>
                    <label htmlFor="seriesStyleKeywords" className="block text-sm font-medium text-gray-300 mb-1">Style Keywords:</label>
                    <input 
                       type="text" id="seriesStyleKeywords" value={seriesStyleKeywords}
                       onChange={(e) => setSeriesStyleKeywords(e.target.value)}
                       placeholder="e.g., cyberpunk, anime, retro, pixel art, watercolor"
                       className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                  {/* Color Palette Notes */}
                  <div>
                    <label htmlFor="seriesColorNotes" className="block text-sm font-medium text-gray-300 mb-1">Color Palette Notes:</label>
                    <input 
                       type="text" id="seriesColorNotes" value={seriesColorNotes}
                       onChange={(e) => setSeriesColorNotes(e.target.value)}
                       placeholder="e.g., neon blues & pinks, earthy tones, pastel gradients"
                       className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                  {/* Character/Art Influences */}
                  <div>
                    <label htmlFor="seriesInfluences" className="block text-sm font-medium text-gray-300 mb-1">Character / Art Influences:</label>
                    <input 
                       type="text" id="seriesInfluences" value={seriesInfluences}
                       onChange={(e) => setSeriesInfluences(e.target.value)}
                       placeholder="e.g., Ghost in the Shell, Studio Ghibli, 80s arcade games"
                       className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                    />
                  </div>
                  {/* Save/Create Button and Status Message */} 
                  <div className="mt-6 flex items-center justify-center gap-4">
                     <button
                        onClick={isCreatingNewSeries ? handleCreateSeriesConcept : handleSaveSeriesConcept}
                        disabled={isSavingConcept || !user || (!isCreatingNewSeries && !selectedSeriesId)}
                        className={`font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCreatingNewSeries 
                                ? 'bg-teal-600 hover:bg-teal-700 text-white' // Style for Create
                                : 'bg-green-600 hover:bg-green-700 text-white' // Style for Save
                            }`}
                     >
                        {isSavingConcept ? 'Saving...' : (isCreatingNewSeries ? 'Create Concept' : 'Save Concept')}
                     </button>
                     {saveConceptStatus && (
                        <p className={`text-sm ${saveConceptStatus.type === 'success' ? 'text-green-400' : 'text-red-500'}`}>
                          {saveConceptStatus.message}
                        </p>
                     )}
                  </div>
                  {!user && !authLoading && (
                      <p className="text-center text-xs text-yellow-500 mt-2">Connect HandCash to save or create concepts.</p>
                  )}
               </div>
             )} 
             
             {/* *** UPDATED Placeholder Rendering Condition *** */}
             {/* Show placeholder if NOT loading, NO error, NOT editing existing, AND NOT creating new */}
             {!isLoadingConcept && !loadConceptError && !selectedSeriesId && !isCreatingNewSeries && (
                 <p className="text-center text-gray-500 my-4">Please select a series from the dropdown above or choose '+ Create New'.</p>
             )}
          </div> 
         </div>
      case 'elementBuilder':
        return <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl text-cyan-400 mb-4">Element Builder & AI Tools</h2>
          


          {/* Section 2: AI PNG Art Generator (Stability AI) */}
          <div className="mb-6 p-4 border border-gray-700 rounded-md">
            <h3 className="text-lg text-violet-400 mb-3">2. AI Artistic PNG Recreation (Stability AI)</h3>
            <p className="text-sm text-gray-400 mb-4">
              Select a PNG from the series, or upload a new one. Then, provide a prompt and select a style to generate an artistic version using Stability AI.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Image Selection & Upload */}
              <div>
                {selectedSeriesId && pngAssetFiles.length > 0 && (
                  <div className="flex flex-col space-y-2 mb-4">
                      <label htmlFor="pngForAIArtSelect" className="text-sm font-medium text-gray-300">
                          Select PNG from Series for AI Art:
                      </label>
                      <select
                          id="pngForAIArtSelect"
                          value={selectedPngForAIArt || ''}
                          onChange={(e) => {
                            setSelectedPngForAIArt(e.target.value || null);
                            setUploadedAiArtFile(null); // Clear uploaded file if dropdown is used
                            setGeneratedArtImage(null);
                            setAiArtError(null);
                          }}
                          className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-violet-500 focus:border-violet-500"
                          disabled={isGeneratingArt}
                      >
                          <option value="" disabled>-- Select from series --</option>
                          {pngAssetFiles.map(file => (
                              <option key={file.filename} value={`/assets/${file.directory}/${file.filename}`}>
                              {file.filename}
                              </option>
                          ))}
                      </select>
                      {selectedPngForAIArt && <p className="text-xs text-gray-400 mt-1">Using from series: {selectedPngForAIArt.split('/').pop()}</p>}
                  </div>
                )}
                <div className="mb-4">
                  <label htmlFor="aiArtUpload" className="text-sm font-medium text-gray-300 block mb-1">
                    {selectedSeriesId && pngAssetFiles.length > 0 ? 'Or Upload New PNG:' : 'Upload PNG:'}
                  </label>
                  <input 
                    type="file" 
                    id="aiArtUpload"
                    accept="image/png"
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-500/80 file:text-white hover:file:bg-violet-600/80 disabled:opacity-50"
                    onChange={handleAiArtFileSelect}
                    disabled={isGeneratingArt}
                  />
                  {uploadedAiArtFile && <p className="text-xs text-gray-400 mt-1">Using uploaded: {uploadedAiArtFile.name}</p>}
                </div>
              </div>

              {/* Right Column: Prompt, Style, Strength, and Generate Button */}
              <div>
                <div className="mb-4">
                  <label htmlFor="aiArtPrompt" className="text-sm font-medium text-gray-300 block mb-1">Prompt:</label>
                  <textarea 
                    id="aiArtPrompt"
                    rows={3}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50"
                    value={aiArtPrompt}
                    onChange={(e) => setAiArtPrompt(e.target.value)}
                    placeholder="e.g., A futuristic cyberpunk version, impressionist painting, cartoon style..."
                    disabled={isGeneratingArt}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="aiArtStylePreset" className="text-sm font-medium text-gray-300 block mb-1">Style Preset:</label>
                  <select
                    id="aiArtStylePreset"
                    value={aiArtStylePreset}
                    onChange={(e) => setAiArtStylePreset(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:ring-violet-500 focus:border-violet-500 disabled:opacity-50"
                    disabled={isGeneratingArt}
                  >
                    {stabilityStylePresets.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                    ))}
                  </select>
                </div>

                {/* New Image Strength Slider/Input */}
                <div className="mb-4">
                  <label htmlFor="aiArtImageStrength" className="text-sm font-medium text-gray-300 block mb-1">
                    Image Strength (Interpretation Level):
                  </label>
                  <input 
                    type="range" 
                    id="aiArtImageStrength"
                    min="0.05" 
                    max="0.95" 
                    step="0.01" 
                    value={aiArtImageStrength}
                    onChange={(e) => setAiArtImageStrength(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500 disabled:opacity-50"
                    disabled={isGeneratingArt}
                  />
                  <div className="text-xs text-gray-400 text-center mt-1">Current: {aiArtImageStrength.toFixed(2)}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Lower values (e.g., 0.1-0.3) = more creative interpretation, less like original. <br/>
                    Higher values (e.g., 0.7-0.9) = more faithful to original, less interpretation.
                  </p>
                </div>

                {/* Generate Button (existing) */}
                <button 
                    onClick={handleGenerateArtisticImage}
                    className="w-full mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-md text-sm font-semibold disabled:bg-gray-600 flex items-center justify-center"
                    disabled={isGeneratingArt || (!selectedPngForAIArt && !uploadedAiArtFile)}
                >
                  {isGeneratingArt ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Artistic Version'
                  )}
                </button>
              </div>
            </div>

            {aiArtError && (
                <p className="mt-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-md">Error: {aiArtError}</p>
            )}
            {generatedArtImage && (
                <div className="mt-6">
                    <h4 className="text-md text-gray-300 mb-2">Generated Image:</h4>
                    <img src={generatedArtImage} alt="Generated Artistic PNG" className="max-w-full md:max-w-md rounded border border-gray-600" />
                </div>
            )}
            {!isGeneratingArt && !generatedArtImage && !aiArtError && selectedSeriesId && (selectedPngForAIArt || uploadedAiArtFile) && (
                 <p className="mt-4 text-sm text-gray-500">Ready to generate. Click the button above.</p>
            )}
          </div>
          
          {/* Original PNG Cutter Section (Kept for context, can be removed/refactored) */}
          <div className="mt-8 p-4 border border-gray-700 rounded-md bg-gray-800/30">
            <h3 className="text-lg text-orange-400 mb-3">Legacy PNG Background Remover</h3>
            <p className="text-sm text-gray-500">This section previously contained tools for background removal.</p>
            {/* Existing PNG cutter JSX (if any was there) would be here or refactored */}
            {/* For example:
            <input type="file" onChange={handleCutterFileChange} />
            {cutterSourceImage && <button onClick={handleCutImage}>Cut Background</button>}
            {isCutting && <p>Cutting...</p>}
            {cutterResultPng && <img src={cutterResultPng} alt="Cutter Result" />}
            {cutterError && <p className="text-red-500">{cutterError}</p>}
            */}
          </div>
        </div>;
      case 'assetFiles':
        return <div className="bg-gray-900 p-4 rounded-lg shadow-lg overflow-x-auto">
          <h2 className="text-xl text-green-400 mb-4">Asset Files: {availableSeriesList.find(s => s.id === selectedSeriesId)?.name || 'Select Series'}</h2>
          {isLoadingFiles && (
            <p className="text-center text-gray-400 animate-pulse py-4">Loading file list...</p>
          )}
          {fetchFilesError && (
            <p className="text-center text-red-500 py-4">Error loading files: {fetchFilesError}</p>
          )}
          {!isLoadingFiles && !fetchFilesError && selectedSeriesId && assetFiles.length === 0 && (
            <p className="text-center text-gray-500 py-4">No asset files found for this series.</p>
          )}
          {!isLoadingFiles && !fetchFilesError && selectedSeriesId && assetFiles.length > 0 && (
            renderAssetFilesTable(
               assetFiles, 
               checkedFiles, 
               handleFileCheckChange, 
               getLayerColor, 
               availableSeriesList, 
               selectedSeriesId,
               handleShareToggle,
               assetFilePartHeaders
            )
          )}
          {!selectedSeriesId && !isLoadingFiles && (
               <p className="text-center text-yellow-500 py-4">Please select a series from the dropdown above.</p>
          )}
        </div>;

      case 'aiInteraction':
        return <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-red-400 mb-6 text-center">NPG AI Interaction Center</h2>
          <p className="text-gray-400 text-center">This section is under construction.</p>
          <p className="text-gray-500 text-sm mt-4 text-center">(Will include features like concept brainstorming, character chat, etc.)</p>
        </div>;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-200">
      {/* Header/Top Bar */}
      <header className="bg-gray-900 p-4 shadow-md flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-semibold text-orange-400">NPG Studio</h1>
        {/* User profile/wallet info can go here */}
        {user && <span className="text-sm">User: ${user.handle ?? user.email ?? 'Logged In'}</span>}
      </header>

      {/* <<< Updated Main Layout: Now 3 Columns >>> */}
      <div className="flex flex-grow overflow-hidden">
        
        {/* 1. Left Sidebar: Tab Selection */}
        <aside className="w-64 bg-gray-800 p-4 overflow-y-auto flex-shrink-0 border-r border-gray-700/50">
           {/* Tab Navigation */}
           <nav className="space-y-2 mb-6">
             <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Studio Tools</h3>
             {/* <<< Add Tab Buttons Back >>> */}
             <TabButton label="NPG AI" tabKey="npgAi" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Series Maker" tabKey="seriesMaker" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Background Designer" tabKey="backgroundDesigner" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Layer Manager & Preview" tabKey="layerManager" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="NFT Card Design" tabKey="nftCardDesign" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Element Card Design" tabKey="elementCardDesign" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Element Builder" tabKey="elementBuilder" activeTab={activeTab} setActiveTab={setActiveTab} />
             <TabButton label="Asset Files" tabKey="assetFiles" activeTab={activeTab} setActiveTab={setActiveTab} />

             {/* <TabButton label="AI Interaction" tabKey="aiInteraction" activeTab={activeTab} setActiveTab={setActiveTab} /> */}
           </nav>
           {/* --- Series Management Section can stay here OR move to the new middle column --- */}
           {/* For now, let's keep it simple and leave management controls here */}
           <div className="border-t border-gray-700 pt-4 space-y-3">
               <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1">Manage Series</h3>
               {/* <<< Add Dropdown and Create Button Back >>> */}
               {/* Series Dropdown */}
               <div className="space-y-1">
                  <label htmlFor="seriesSelectSidebar" className="text-sm text-gray-300 block">Select Series:</label> {/* Changed id slightly */}
                  {isLoadingSeriesList ? (
                     <p className="text-xs text-gray-500 animate-pulse">Loading series...</p>
                  ) : availableSeriesList.length > 0 ? (
                      <select
                         id="seriesSelectSidebar" // Changed id slightly
                         value={selectedSeriesId || ''}
                         onChange={(e) => {
                           const newId = e.target.value;
                           setSelectedSeriesId(newId || null);
                           if (newId) {
                              setIsCreatingNewSeries(false);
                              // setActiveTab('seriesMaker'); // Let card selection handle tab switching
                           }
                         }}
                         className="w-full p-1.5 rounded bg-gray-700 border border-gray-600 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                         disabled={isCreatingNewSeries}
                      >
                          <option value="" disabled={!!selectedSeriesId}>-- Select Existing --</option>
                          {availableSeriesList.map(series => (
                            <option key={series.id} value={series.id}>
                              {series.name} ({series.id.substring(0, 4)}...)
                            </option>
                          ))}
                      </select>
                  ) : (
                     <p className="text-xs text-gray-500">No series found.</p>
                  )}
                </div>
                {/* Create New Series Button (Alternative Trigger) */}
                 <button
                     onClick={() => {
                         setSelectedSeriesId(null);
                         setIsCreatingNewSeries(true);
                         setSeriesConceptName('My New Series'); setSeriesDescription(''); setSeriesStyleKeywords(''); setSeriesColorNotes(''); setSeriesInfluences('');
                         setSaveConceptStatus(null);
                         setActiveTab('seriesMaker');
                     }}
                     disabled={isCreatingNewSeries}
                     className={`w-full py-1.5 px-3 rounded text-sm font-medium transition-colors ${
                        isCreatingNewSeries
                          ? 'bg-teal-800 text-gray-400 cursor-default'
                          : 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60'
                     }`}
                 >
                     + Create New Series
                 </button>
                  {/* Display indicator if creating new */}
                 {isCreatingNewSeries && (
                   <p className="text-xs text-teal-400 text-center mt-1">Use middle column card or 'Series Maker' tab</p> // Updated text slightly
                 )}
               {/* <<< End Dropdown and Create Button >>> */}
           </div>
        </aside>

        {/* <<< 2. Middle Column: Series Selection Cards >>> */}
        <aside className="w-72 bg-gray-850 p-4 overflow-y-auto flex-shrink-0 border-r border-gray-700/50 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3 flex-shrink-0">Select Series</h3>
          
          {/* Create New Series Card (optional but nice) */}
          <button
            onClick={() => {
              setSelectedSeriesId(null); 
              setIsCreatingNewSeries(true); 
              // Reset concept fields
              setSeriesConceptName('My New Series'); setSeriesDescription(''); setSeriesStyleKeywords(''); setSeriesColorNotes(''); setSeriesInfluences('');
              setSaveConceptStatus(null);
              setActiveTab('seriesMaker'); 
            }}
            className={`w-full p-3 mb-3 rounded-lg border-2 border-dashed border-teal-600/50 text-teal-400 hover:bg-teal-600/20 hover:border-teal-500 transition-colors text-center ${isCreatingNewSeries ? 'bg-teal-600/20 border-teal-500' : ''}`}
            disabled={isCreatingNewSeries}
          >
            <span className="block text-lg font-semibold">+</span>
            <span className="block text-sm">Create New Series</span>
          </button>
          
          {/* Existing Series Cards */}
          <div className="flex-grow overflow-y-auto space-y-3 -mr-2 pr-2"> {/* Scrollable area */}
            {isLoadingSeriesList ? (
              <p className="text-center text-gray-500 animate-pulse">Loading...</p>
            ) : availableSeriesList.length > 0 ? (
              availableSeriesList.map(series => (
                <button
                  key={series.id}
                  onClick={() => {
                     setSelectedSeriesId(series.id);
                     setIsCreatingNewSeries(false); // Ensure we are not creating
                     // Optional: Switch to a default tab like 'seriesMaker' when selecting
                     // setActiveTab('seriesMaker'); 
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedSeriesId === series.id 
                      ? 'bg-yellow-600/30 border-yellow-500 shadow-md' // Active style
                      : 'bg-gray-700/40 border-gray-600/50 hover:bg-gray-700/80 hover:border-gray-500' // Inactive style
                  }`}
                >
                  {/* Placeholder for Cover Image */}
                  <div className="h-20 bg-gray-600 rounded mb-2 flex items-center justify-center">
                     <span className="text-xs text-gray-400">Cover Img</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 truncate">{series.name}</h4>
                  <p className="text-xs text-gray-400">ID: {series.id.substring(0, 6)}...</p>
                </button>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 pt-4">No series found. Click 'Create New' to start.</p>
            )}
          </div>
        </aside>

        {/* 3. Main Content Area */}
        {/* <<< Ensure main area flex-grow works correctly >>> */}
        <main className="flex-grow p-6 overflow-y-auto bg-gray-850"> 
            {renderActiveTabContent()} 
        </main>
      </div> {/* End Main Layout Flex Container */}
    </div>
  );
}

// Helper TabButton component (Corrected)
const TabButton: React.FC<{ label: string; tabKey: StudioTab; activeTab: StudioTab; setActiveTab: (tab: StudioTab) => void }> =
  ({ label, tabKey, activeTab, setActiveTab }) => {
    return (
        <button
          onClick={() => setActiveTab(tabKey)}
          className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${ 
            activeTab === tabKey 
            ? 'bg-orange-600 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {label}
        </button>
    );
};

// =======================================
//      Asset Files Table Rendering Logic
// =======================================

const renderAssetFilesTable = (
    assetFiles: ParsedFileInfo[],
    checkedFiles: Set<string>,
    handleFileCheckChange: (filename: string, isChecked: boolean) => void,
    getLayerColor: (layerNumStr?: string) => string,
    availableSeriesList: SeriesListItem[], 
    selectedSeriesId: string | null, 
    handleShareToggle: (assetId: string, targetSeriesId: string, currentStatus: boolean) => void,
    assetFilePartHeaders: string[]
) => {
    // Determine which other series columns to show
    const otherSeries = availableSeriesList.filter(s => s.id !== selectedSeriesId && selectedSeriesId);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-700 text-xs"> 
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
               {/* Checkbox Header (Narrow) */}
               <th className="px-2 py-2 text-left text-gray-300 uppercase tracking-wider font-medium w-10"> 
                 <input type="checkbox" className="form-checkbox h-4 w-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500" disabled title="Select All (Not Implemented)"/>
               </th>
               {/* Filename Header (Wider) */}
               <th className="px-3 py-2 text-left text-gray-300 uppercase tracking-wider font-medium w-64">Filename</th>
               {/* Static Part Headers */}
               {assetFilePartHeaders.map((header: string, i: number) => (
                 <th key={`part-header-${i}`} className="px-2 py-2 text-left text-gray-300 uppercase tracking-wider font-medium align-bottom">
                    {header}
                 </th> 
               ))}
               {/* Dynamic Sharing Columns */}
               {otherSeries.map((series: SeriesListItem) => (
                  <th key={`share-header-${series.id}`} className="px-2 py-2 text-center text-gray-300 uppercase tracking-wider font-medium w-16" title={`Share with ${series.name}?`}>
                    Share<br/>{series.name.split(' ')[0]}
                  </th>
               ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {assetFiles.map((file: ParsedFileInfo, index: number) => {
              const layerNumPart = file.filenameParts[0];
              const rowColor = getLayerColor(layerNumPart);
              const isChecked = checkedFiles.has(file.filename);
              return (
                <tr 
                  key={`${file.filename}-${index}`} 
                  className={`hover:bg-gray-700/50 ${rowColor}`}
                >
                  <td className="px-2 py-1.5 border-r border-gray-700"> 
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-4 w-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 cursor-pointer"
                      checked={isChecked}
                      onChange={(e) => handleFileCheckChange(file.filename, e.target.checked)}
                      title={`Select ${file.filename}`}
                    />
                  </td>
                  <td className="px-3 py-1.5 border-r border-gray-700 text-gray-300 font-mono truncate" title={file.filename}>{file.filename}</td>
                  {/* === UPDATED: Map directly over headers === */}
                  {file.filenameParts.map((part: string, i: number) => (
                     <td key={`part-cell-${index}-${i}`} className="px-2 py-1.5 border-r border-gray-700 text-gray-400 truncate" title={part}>
                       {part} 
                     </td>
                   ))}
                   {/* Dynamic Sharing Checkboxes */}
                   {otherSeries.map((series: SeriesListItem) => {
                      const isShared = !!file.sharedWith?.includes(series.id);
                      const assetId = file.id;
                      return (
                         <td key={`share-cell-${index}-${series.id}`} className="px-2 py-1.5 border-r border-gray-700 text-center">
                           {assetId ? (
                             <input 
                               type="checkbox" 
                               className="form-checkbox h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                               checked={isShared}
                               onChange={() => handleShareToggle(assetId, series.id, isShared)}
                               title={`Toggle share with ${series.name}`}
                              />
                           ) : (
                              <span className="text-gray-600 text-xs" title="Asset ID missing">-</span>
                           )}
                         </td>
                      );
                   })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
};

export default StudioPage;

// <<< Export types from ElementCardDesigner (needed for import in StudioPage) >>>
// export type { PositionState } from '@/components/ElementCardDesigner'; // REMOVING THIS LINE