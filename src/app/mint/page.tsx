'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNFTGenerator, NftFilter } from '@/hooks/useNFTGenerator';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { useNFTStore } from '@/context/NFTStoreContext';
import NFTCanvas from '@/components/NFTCanvas';
import ErrorBoundary from '@/components/ErrorBoundary';
import { NFTType, NFTAttribute } from '@/types';
import { INTERFACE_CONFIG } from '@/data/interface-config';
import RecipientInfo from '@/components/RecipientInfo';
import Link from 'next/link';
import NftSummaryModal from '@/components/NftSummaryModal';
import NftAttributesTable from '@/components/NftAttributesTable';
import SendNftModal from '@/components/SendNftModal';
import ListNftModal from '@/components/ListNftModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { getCardBackgroundPath, getElementAssetUrl } from '@/lib/utils';
import { LAYER_DETAILS } from '@/data/layer-config';
import { SupabaseNftData } from '@/lib/types/supabase';
import { useRouter } from 'next/navigation';

// Define simple type for wallet items
interface WalletItem {
  id: string;
  origin: string;
  name: string;
  imageUrl: string;
  attributes?: NFTAttribute[]; // Optional attributes
}

// Define mint price (single price for all types)
const NEW_MINT_PRICE = 0.04; // Approx $1 USD based on 1 BSV = $27

// Define status types
type MintStatus = 'idle' | 'connecting' | 'paying' | 'generating' | 'minting' | 'error' | 'success'; // Unified status type
// Define Melt API Status Type
type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MintPage() {
  return (
    <ErrorBoundary>
      <MintPageContent />
    </ErrorBoundary>
  );
}

function MintPageContent(): React.ReactElement {
  const router = useRouter();
  const { 
    isInitialized, 
    assetLoadingProgress, 
    availableAssets,
    generateNewNFTData
  } = useNFTGenerator();

  // HandCash context
  const { 
    isConnected, 
    wallet,
    isLoading: isHandCashLoading, 
    error: handCashError 
  } = useHandCashWallet();
  
  // Ensure useNFTGenerator hook is called correctly and returns expected values
  const { availableAssets: nftGeneratorAvailableAssets, generateNewNFTData: nftGeneratorGenerateNewNFTData, isInitialized: isAssetsInitialized, assetLoadingProgress: nftGeneratorAssetLoadingProgress } = useNFTGenerator();

  // <<< Corrected State Definitions >>>
  // Single Mint State
  const [singleMintStatus, setSingleMintStatus] = useState<MintStatus>('idle');
  const [singleMintError, setSingleMintError] = useState<string | null>(null);
  const [singleMintOrderId, setSingleMintOrderId] = useState<string | null>(null);
  const [singleNftData, setSingleNftData] = useState<NFTType | null>(null);
  const [isGeneratingSingleApi, setIsGeneratingSingleApi] = useState<boolean>(false);
  const [singleMintApiStatus, setSingleMintApiStatus] = useState<ApiStatus>('idle');
  const [singleMintApiError, setSingleMintApiError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  // <<< Add state to store the randomly chosen mint type label >>>
  const [mintingTypeLabel, setMintingTypeLabel] = useState<string>(''); 
  // <<< ADD State to store the confirmed origin after successful mint >>>
  const [mintedNftOrigin, setMintedNftOrigin] = useState<string | null>(null);

  // Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);

  // <<< State for Progress Bar >>>
  const [imageGenerationProgress, setImageGenerationProgress] = useState<number>(0);
  const [generationMessage, setGenerationMessage] = useState<string>('Building NFT...'); // Add state for message
  // <<<

  // Wallet State (Remains the same)
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [walletItems, setWalletItems] = useState<WalletItem[]>([]); 
  const [isLoadingNpgBalance, setIsLoadingNpgBalance] = useState<boolean>(false);
  // <<<

  // <<< State for Action Modals & Feedback >>>
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [isBurnConfirmOpen, setIsBurnConfirmOpen] = useState<boolean>(false); 
  const [isMeltConfirmOpen, setIsMeltConfirmOpen] = useState<boolean>(false); 
  const [isKeepInfoModalOpen, setIsKeepInfoModalOpen] = useState<boolean>(false); 
  const [nftToManage, setNftToManage] = useState<NFTType | null>(null); // Use NFTType from singleNftData
  
  // State for Element Card Backgrounds
  const [elementCardBackgrounds, setElementCardBackgrounds] = useState<Record<string, string>>({});
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState<boolean>(true);
  const [backgroundFetchError, setBackgroundFetchError] = useState<string | null>(null);

  const [meltApiStatus, setMeltApiStatus] = useState<ApiStatus>('idle');
  const [meltApiData, setMeltApiData] = useState<any>(null);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false); 
  // <<<

  // <<< Add state for "Coming Soon" Modal >>>
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState<boolean>(false);

  // <<< Get listNFT from store >>>
  const { listNFT } = useNFTStore(); 

  // <<< Add state for dynamic height >>>
  const [contentHeight, setContentHeight] = useState<string | number>('auto');

  // <<< Add Refs >>>
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const summaryCardRef = useRef<HTMLDivElement>(null);

  // <<< ADD useEffect to Fetch Backgrounds >>>
  useEffect(() => {
    const fetchBackgrounds = async () => {
      console.log("[MintPage] Attempting to fetch element card backgrounds...");
      setIsLoadingBackgrounds(true);
      setBackgroundFetchError(null);
      try {
        const params = new URLSearchParams({
          directory: 'public/element_cards',
          fileType: 'jpg' 
        });
        const apiUrl = `/api/interface-files?${params.toString()}`;
        console.log(`[MintPage] Fetching backgrounds from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error fetching backgrounds! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && Array.isArray(data.files)) {
          const backgroundMap: Record<string, string> = {};
          data.files.forEach((file: any) => {
            const nameWithoutExtension = file.name.split('.')[0];
            backgroundMap[nameWithoutExtension] = file.path; // Don't convert to lowercase
          });
          setElementCardBackgrounds(backgroundMap);
          console.log('[MintPage] Element card background map loaded:', backgroundMap);
          console.log('[MintPage] Available background keys:', Object.keys(backgroundMap));
        } else {
          throw new Error(data.error || 'Invalid response structure for backgrounds');
        }
      } catch (error: any) {
        console.error("Error fetching element card backgrounds:", error);
        setBackgroundFetchError(error.message || 'Failed to load element card backgrounds.');
        setElementCardBackgrounds({});
      } finally {
        setIsLoadingBackgrounds(false);
      }
    };
    fetchBackgrounds();
  }, []); // Fetch once on mount
  // <<< END useEffect >>>

  // <<< DEFINE Layers to Exclude from Gallery >>>
  const NON_DISPLAY_LAYERS_GALLERY = useMemo(() => new Set([
    'BACKGROUND', 'GLOW', 'BANNER', 'DECALS', 'TEAM', 
    'LOGO', 'INTERFACE', 'SCORES', 'COPYRIGHT', 'EFFECTS'
    // Add others if needed
  ]), []);
  // <<< END Definition >>>

  // Helper function to check if ANY minting process is active
  const isMintingActive = () => {
    const activeStates: MintStatus[] = ['connecting', 'paying', 'generating', 'minting'];
    // Only need to check singleMintStatus and spinning now
    return activeStates.includes(singleMintStatus) || isSpinning || isGeneratingSingleApi;
  };

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/handcash-wallet/balance', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: wallet.id })
       });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch balance');
      setWalletBalance(data);
    } catch (err) { console.error('Error fetching balance:', err); setWalletBalance(null); }
    finally { setIsLoadingBalance(false); }
  }, [wallet?.id]);

  // Fetch NPG balance (update function name potentially later, but keep for now)
  const fetchNpgBalance = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingNpgBalance(true);
    setWalletItems([]); // Reset the correct state
    try {
      const response = await fetch('/api/handcash-wallet/collection', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: wallet.id })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch wallet items');
      // Read data.items instead of data.npgOrigins
      setWalletItems(Array.isArray(data.items) ? data.items : []); 
    } catch (err) { console.error('Error fetching wallet items:', err); setWalletItems([]); } // Update log and state reset
    finally { setIsLoadingNpgBalance(false); }
  }, [wallet?.id]);

  // Load balances on connect
  useEffect(() => {
    if (isConnected && wallet?.id) {
      fetchWalletBalance();
      fetchNpgBalance();
    } else {
      setWalletBalance(null);
      setWalletItems([]); // Reset correct state
    }
  }, [isConnected, wallet?.id, fetchWalletBalance, fetchNpgBalance]);

  // <<< Add useEffect for Progress Bar Simulation >>>
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isGeneratingSingleApi) {
      setImageGenerationProgress(0); 
      setGenerationMessage('Building NFT...'); 
      intervalId = setInterval(() => {
        setImageGenerationProgress(prevProgress => { 
          const nextProgress = prevProgress + 10; 

          // Update message based on progress
          // Add "Printing NFT..." as the final stage
          if (nextProgress >= 100) {
            setGenerationMessage('Printing NFT...'); 
            if (intervalId) clearInterval(intervalId);
            return 100;
          } else if (nextProgress >= 80) {
            setGenerationMessage('Estimating Value...');
          } else if (nextProgress >= 40) {
            setGenerationMessage('Calculating Stats...');
          } // else keep 'Building NFT...'
          return nextProgress;
        });
      }, 150); 
    } else {
      setImageGenerationProgress(0);
      setGenerationMessage('Building NFT...'); 
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGeneratingSingleApi]);
  // <<<

  // <<< REPURPOSED: handleGenerateSingle - Now takes chosen type >>>
  const handleGenerateSingle = useCallback(async (
    filter: NftFilter, 
    caller: 'mix' | 'erobot' | 'npg' // Still use caller to log/potentially adapt backend later
  ) => {
    // Status setting now only uses singleMintStatus for UI feedback
    const setStatus = setSingleMintStatus; 
    const setError = setSingleMintError;
    const setOrderId = setSingleMintOrderId;

    // Reset main error/orderId/data
    setError(null);
    setOrderId(null);
    setSingleNftData(null);
    setSingleMintApiStatus('idle');
    setSingleMintApiError(null);
    
    if (!isConnected || !wallet?.id) { console.log('Not connected...'); return; }
    if (!isInitialized || Object.keys(availableAssets).length === 0) { setError("Assets not loaded."); setStatus('error'); return; }

    let paymentSuccess = false;
    let imageSuccess = false;
    let newNftData: Omit<NFTType, 'image'> | null = null;
    const currentPrice = NEW_MINT_PRICE;

    try {
      setStatus('generating'); 
      console.log(`[handleGenerate] Generating with filter:`, filter, `Caller type:`, caller);
      newNftData = generateNewNFTData(filter); 
      if (!newNftData) throw new Error("Failed to generate base NFT data."); 
      console.log(`[handleGenerate - ${caller}] Generated NFT Data:`, newNftData);
      
      setStatus('paying');
      const userHandle = wallet?.email?.split('@')[0];
      if (userHandle === 'boase') { // Keep skip logic if needed
        console.log(`[handleGenerate - ${caller}] Skipping payment for user: $boase`);
        paymentSuccess = true;
      } else {
        console.log(`[handleGenerate - ${caller}] Initiating payment for user: $${userHandle || 'Unknown'}`);
        const paymentResponse = await fetch('/api/handcash/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletId: wallet?.id, amount: currentPrice }),
        });
        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok || !paymentData.success) throw new Error(paymentData.error || 'Payment failed.');
        paymentSuccess = true;
        console.log(`[handleGenerate - ${caller}] Payment Successful:`, paymentData.transactionId);
      }

      setStatus('generating'); 
      setIsGeneratingSingleApi(true); 
      const defaultInterfaceFilename = INTERFACE_CONFIG[0]?.filename;
      if (!defaultInterfaceFilename) throw new Error('Default interface configuration not found.');

      // --- MODIFIED: Extract genes from BODY_SKIN metadata --- 
      const bodySkinAttribute = newNftData.attributes.find((attr: NFTAttribute) => attr.layer === 'BODY_SKIN');
      const genes = bodySkinAttribute?.metadata?.genes; // Get from metadata
      // --- END MODIFIED ---

      const generationParams = { 
         selectedAttributes: newNftData.attributes, 
         name: newNftData.name,
         number: newNftData.number,
         stats: newNftData.stats,
         qrData: newNftData.qrData,
         series: newNftData.series,
         interfaceFilename: defaultInterfaceFilename,
         genes: genes ?? null // Send null if not found, backend should handle
      };
      
      // --- MODIFIED: Log parameters being sent (ensure full depth) --- 
      console.log(`[handleGenerate - ${caller}] Calling /api/generate-nft-image with params:`, JSON.stringify(generationParams, null, 2));
      // --- END MODIFIED ---

      const generationResponse = await fetch('/api/generate-nft-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generationParams),
      });
      const generationData = await generationResponse.json();
      if (!generationResponse.ok || !generationData.success || !generationData.imageUrl) {
        throw new Error(generationData.error || 'NFT Image Generation failed.');
      }
      imageSuccess = true;
      console.log(`[handleGenerate - ${caller}] NFT Image Generated:`, generationData.imageUrl);
      setIsGeneratingSingleApi(false); 

      const finalNFTDataForDisplay: NFTType = { ...newNftData, image: generationData.imageUrl };
      setSingleNftData(finalNFTDataForDisplay);

      setStatus('minting'); 
      setSingleMintApiStatus('loading'); 
      console.log(`[handleGenerate - ${caller}] Calling mint API...`);
      const mintApiResponse = await fetch('/api/handcash/mint-nft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              walletId: wallet?.id, 
              name: finalNFTDataForDisplay.name,
              imageUrl: finalNFTDataForDisplay.image,
              attributes: finalNFTDataForDisplay.attributes,
              description: `Ninja Punk Girls NFT - ${finalNFTDataForDisplay.name}`,
          }),
      });
      const mintApiData = await mintApiResponse.json();
      if (mintApiResponse.ok && mintApiData.success && mintApiData.origin) {
        console.log('[Mint] NFT Mint API Success:', mintApiData);
        setSingleMintApiStatus('success');
        setSingleMintApiError(null);
        setMintedNftOrigin(mintApiData.origin); // <<< STORE THE CONFIRMED ORIGIN
        setSingleNftData((prev: NFTType | null) => prev ? { ...prev, qrData: mintApiData.origin } : null);
        setOrderId(mintApiData.orderId); 
        setStatus('success'); // Set overall status to success
        toast.success(`Minted ${newNftData.name} successfully!`);
        // Consider fetching balance/items again here if needed
        fetchNpgBalance(); // Optionally refresh wallet items
      } else {
          setSingleMintApiError(mintApiData.error || 'Failed to submit mint order or origin missing.');
          throw new Error(mintApiData.error || 'Backend mint submission failed or origin missing.');
      }
      
      // Reset to idle after timeout
      setTimeout(() => setStatus('idle'), 4000);

    } catch (err: any) {
      console.error(`Error during mint process (${caller}):`, err);
      setStatus('error');
      // Set general error for the main status
      setError(err.message || 'An error occurred.'); 
      // Set API error state if applicable
      if (paymentSuccess && imageSuccess && singleMintApiStatus !== 'success') {
          setSingleMintApiStatus('error');
          setSingleMintApiError(err.message || 'Minting API call failed.');
          setError(null); // Don't show general error if API error is specific
      }
    } finally {
      setIsGeneratingSingleApi(false); 
      // Ensure status is set to error if not idle or success
      if (singleMintStatus !== 'idle' && singleMintStatus !== 'success') { 
         setStatus('error');
      }
      // Ensure spinner stops if it was running
      setIsSpinning(false);
    }
  // Dependencies might need adjustment
  }, [isConnected, wallet?.id, isInitialized, availableAssets, generateNewNFTData, singleMintStatus, setSingleMintStatus, setSingleMintError, setSingleMintOrderId, setSingleMintApiStatus, setSingleMintApiError, isSpinning, setIsSpinning, setMintedNftOrigin]); 

  // <<< REPURPOSED: handleMint - Single button click handler >>>
  const handleMint = useCallback(() => { 
    if (isMintingActive()) return;
    
    setIsSpinning(true);
    setSingleMintError(null);
    setSingleNftData(null); 
    setSingleMintApiStatus('idle');
    setSingleMintApiError(null);
    setSingleMintOrderId(null);
    setSingleMintStatus('idle'); // Ensure starts idle
    setMintingTypeLabel(''); // Reset label
    setMintedNftOrigin(null); // Reset origin

    console.log("[Mint] Starting randomized mint process...");

    // Short delay for spinning effect
    setTimeout(() => {
      const randomValue = Math.random(); // Value between 0 and 1
      let selectedFilter: NftFilter;
      let selectedCaller: 'npg' | 'erobot' | 'mix';
      let selectedLabel: string;

      // Determine type based on probability
      if (randomValue < 0.2) { // 0.0 <= x < 0.2 (20% NPG)
        selectedFilter = { type: 'gene', value: 'npg' };
        selectedCaller = 'npg';
        selectedLabel = 'NPG';
      } else if (randomValue < 0.6) { // 0.2 <= x < 0.6 (40% Erobot)
        selectedFilter = { type: 'gene', value: 'erobot' };
        selectedCaller = 'erobot';
        selectedLabel = 'Erobot';
      } else { // 0.6 <= x < 1.0 (40% Mix)
        selectedFilter = { type: 'all' };
        selectedCaller = 'mix';
        selectedLabel = 'Mixed NFT';
      }
      
      console.log(`[Mint] Randomly selected: ${selectedLabel}`);
      setMintingTypeLabel(selectedLabel); // Store the label for later use

      // Call the generate function with the selected parameters
      handleGenerateSingle(selectedFilter, selectedCaller); 
      
      setIsSpinning(false); // Stop initial spin, handleGenerate takes over status

    }, 500); // Reduced spin duration

  }, [isMintingActive, handleGenerateSingle]); 
  
  // <<< Handlers to OPEN Action Modals (called from NftSummaryModal) >>>
  const openSendModal = useCallback(() => {
    if (!singleNftData) return;
    setNftToManage(singleNftData);
    setIsSummaryModalOpen(false); // Close summary modal first
    setIsSendModalOpen(true);
  }, [singleNftData]);

  // <<< RESTORE openListModal >>>
  const openListModal = useCallback(() => {
    if (!singleNftData) return;
    setNftToManage(singleNftData);
    setIsSummaryModalOpen(false);
    setIsListModalOpen(true);
  }, [singleNftData]);

  const openBurnConfirm = useCallback(() => {
    if (!singleNftData) return;
    setNftToManage(singleNftData);
    setIsSummaryModalOpen(false);
    setIsBurnConfirmOpen(true);
  }, [singleNftData]);

  const openMeltConfirm = useCallback(() => {
    if (!singleNftData) {
      toast.error("NFT data not available for melting.");
      return;
    }
    if (!mintedNftOrigin) {
      toast.error("Mint must be completed and confirmed before melting.");
      return;
    }
    setNftToManage(singleNftData);
    setIsSummaryModalOpen(false);
    setIsMeltConfirmOpen(true);
  }, [singleNftData, mintedNftOrigin]);

  // <<< Handler to open KEEP info modal >>>
  const openKeepInfoModal = useCallback(() => {
    setIsKeepInfoModalOpen(true);
  }, []);

  // <<< CONFIRM Handlers for Action Modals (contain API logic placeholders) >>>
  const handleSendConfirm = useCallback(async (recipient: string) => {
    if (!nftToManage || !wallet?.id) return;
    const origin = nftToManage.qrData; // Use qrData which should hold the origin
    if (!origin) { setActionError("NFT origin not found."); toast.error("NFT origin is missing."); return; }
    
    console.log(`[MintPage] SEND API Call: Origin ${origin} to ${recipient}`);
    setIsProcessingAction(true); setActionError(null);
    try {
      const response = await fetch('/api/handcash/send-nft', { // Assuming this is the endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: wallet?.id, origin, recipientHandle: recipient }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to send NFT.');
      }
      toast.success(`Sent ${nftToManage.name} to ${recipient}!`);
      setIsSendModalOpen(false); setNftToManage(null);
      // Maybe clear the displayed NFT or update wallet state?
      setSingleNftData(null);
      fetchNpgBalance(); // Refresh wallet items
    } catch (err: any) {
        setActionError(err.message);
        toast.error(`Send failed: ${err.message}`);
    } finally {
        setIsProcessingAction(false);
    }
  }, [nftToManage, wallet?.id, fetchNpgBalance]);

  // <<< RESTORE handleListConfirm (with toast added) >>>
  const handleListConfirm = useCallback(async (price: number) => {
    console.log("[handleListConfirm] Initiated. NFT:", nftToManage, "Price:", price);
    if (!nftToManage || !wallet?.id || !listNFT) {
      console.error("[handleListConfirm] Aborting: Missing required data or function.");
      toast.error("Listing function not available or missing data.");
      setActionError("Listing function not available or missing data.");
      return;
    }
    if (isNaN(price) || price <= 0) {
        console.error("[handleListConfirm] Aborting: Invalid price.");
        toast.error("Please enter a valid price greater than 0.");
        setActionError("Invalid price entered.");
        return;
    }
     if (!nftToManage.qrData) {
        console.error("[handleListConfirm] Aborting: NFT origin (qrData) missing.");
        toast.error("NFT origin data is missing, cannot list.");
        setActionError("NFT origin data is missing.");
        return;
    }

    const itemDataForListing = {
        ...nftToManage,
        imageUrl: nftToManage.image,
        origin: nftToManage.qrData,
    };

    console.log(`[MintPage] Attempting to list NFT: ${itemDataForListing.name} (#${itemDataForListing.number}) for ${price} BSV`);
    setIsProcessingAction(true);
    setActionError(null);
    
    try {
      await listNFT(itemDataForListing, price);
      console.log("[handleListConfirm] listNFT call successful.");
      toast.success(
        `NFT Listed: ${itemDataForListing.name} for ${price} BSV!`,
        { className: 'bg-green-600 text-white p-3 rounded-md shadow-lg', duration: 4000, }
      );
      setIsListModalOpen(false);
      setNftToManage(null);
      // No need to clear singleNftData, listing doesn't remove it immediately
    } catch (err: any) {
       console.error("[MintPage] Error calling listNFT:", err);
       const errorMessage = err.message || 'Failed to submit listing.';
       toast.error(errorMessage);
       setActionError(errorMessage);
    } finally {
       console.log("[handleListConfirm] Setting isProcessingAction to false.");
       setIsProcessingAction(false);
    }
  }, [nftToManage, wallet?.id, listNFT]);

  // <<< Uncommented: Handle Burn Confirmation >>>
  const handleBurnConfirm = useCallback(async () => {
    if (!nftToManage || !wallet?.id) return;
    const origin = nftToManage.qrData;
    if (!origin) { setActionError("NFT origin not found."); toast.error("NFT origin is missing."); return; }

    console.log(`[MintPage] BURN API Call: Origin ${origin}`);
    setIsProcessingAction(true); setActionError(null);
    try {
      const response = await fetch('/api/handcash/burn-nft', { // Assuming endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: wallet?.id, origin }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to burn NFT.');
      }
      toast.success(`Burned ${nftToManage.name}!`);
      setIsBurnConfirmOpen(false); setNftToManage(null);
      // After burning, clear the preview and refresh wallet
      setSingleNftData(null);
      fetchNpgBalance();
    } catch (err: any) {
        setActionError(err.message);
        toast.error(`Burn failed: ${err.message}`);
    } finally {
        setIsProcessingAction(false);
    }
  }, [nftToManage, wallet?.id, fetchNpgBalance]);

  // <<< Uncommented: Handle Melt Confirmation >>>
  const handleMeltConfirm = useCallback(async () => {
    // Use the confirmed origin stored in state
    if (!mintedNftOrigin || !nftToManage || !wallet?.id || nftToManage.qrData !== mintedNftOrigin) {
      toast.error("Cannot confirm melt: Invalid state or data mismatch.");
      return;
    }
     // Double check managed NFT matches confirmed origin
     if (nftToManage.qrData !== mintedNftOrigin) {
        toast.error("Data mismatch. Cannot confirm melt.");
        console.error("Melt confirm failed data mismatch. Managed:", nftToManage.qrData, "Confirmed:", mintedNftOrigin);
        return;
    }

    console.log(`[MintPageContent HandleMeltNFT] Melting NFT Origin: ${mintedNftOrigin}`);
    setIsMeltConfirmOpen(false); // Close modal immediately
    setMeltApiStatus('loading');
    setMeltApiData(null); // Clear previous data
    setActionError(null); // Clear previous errors

    try {
      const response = await fetch('/api/handcash/melt-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}`, // Use Authorization header if API expects it
        },
        body: JSON.stringify({ nftId: mintedNftOrigin }), // Use the confirmed origin
      });

      const result = await response.json();
      console.log("[MintPageContent HandleMeltNFT] API Response Data:", result);
      setMeltApiData(result); // Store API response

      if (result.success) {
        setMeltApiStatus('success');
        toast.success(result.message || `Melt successful for ${nftToManage.name}.`);
        setSingleNftData(null); // Clear the displayed NFT
        setMintedNftOrigin(null); // Clear the confirmed origin
        setSingleMintStatus('idle'); // Reset mint status
        setSingleMintApiStatus('idle');
        fetchNpgBalance(); // Refresh wallet items
        fetchWalletBalance(); // Refresh balance
        // <<< ADD REDIRECT HERE >>>
        console.log("[MintPage] Redirecting to /wallet/elements after successful melt...");
        router.push('/wallet/elements'); // Redirect to element card page
      } else {
        setMeltApiStatus('error');
        const errorMsg = result.error || result.message || 'Melt failed.';
        setActionError(errorMsg); // Set action error for potential display
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('[MintPageContent HandleMeltNFT] Melt error:', error);
      setMeltApiStatus('error');
      const errorMsg = `Melt error: ${error.message || 'Unknown error'}`;
      setActionError(errorMsg);
      toast.error(errorMsg);
    } finally {
        setNftToManage(null); // Clear managed NFT after attempt
    }
  }, [nftToManage, wallet?.id, mintedNftOrigin, fetchNpgBalance, fetchWalletBalance, router]); // Added router to dependencies

  
  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
    // Don't clear nftToManage here, action modals might need it briefly after close
  };

  // <<< useEffect to sync heights >>>
  useEffect(() => {
    if (singleNftData && canvasContainerRef.current) {
      const height = canvasContainerRef.current.offsetHeight;
      console.log(`[HeightSync] Measured canvas height: ${height}px`);
      setContentHeight(`${height}px`);
    } else {
      setContentHeight('auto');
    }

    const handleResize = () => {
        if (singleNftData && canvasContainerRef.current) {
             const height = canvasContainerRef.current.offsetHeight;
             setContentHeight(`${height}px`);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [singleNftData]);

  // <<< DEFINE Inline Element Card Component for Gallery >>>
  const GalleryElementCard: React.FC<{ attribute: NFTAttribute; backgroundMap: Record<string, string> }> = ({ attribute, backgroundMap }) => {
      
      // Get the background URL using the attribute's layer key directly with the map
      const backgroundUrl = getCardBackgroundPath(attribute.layer, backgroundMap);
      const elementUrl = getElementAssetUrl(attribute);

      // Debug logging
      console.log(`[GalleryElementCard] Rendering for layer: ${attribute.layer}`);
      console.log(`[GalleryElementCard] Background URL: ${backgroundUrl}`);
      console.log(`[GalleryElementCard] Element URL: ${elementUrl}`);
      console.log(`[GalleryElementCard] Background map keys:`, Object.keys(backgroundMap));

      if (!attribute || !attribute.layer) {
        return <div className="bg-gray-700 rounded aspect-[2/3] flex items-center justify-center text-xs text-red-400">Invalid Attr</div>;
      }

      return (
          <div
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden relative aspect-[2/3] border border-gray-700/50"
            title={`${attribute.layer} (${attribute.metadata?.rarity || 'N/A'})`}
          >
              <img
                  src={backgroundUrl}
                  alt={`${attribute.layer} background`}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-element-card.png'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center z-10 p-[15%]">
                <img
                    src={elementUrl}
                    alt={attribute.layer}
                    className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="absolute bottom-1 left-1 right-1 text-center z-20">
                  <span className="text-white text-[9px] px-1 py-0.5 rounded bg-black bg-opacity-60 leading-tight truncate block">
                      {/* Safely display layer name */}
                      {typeof attribute.layer === 'string' ? attribute.layer.replace(/_/g, ' ') : 'Unknown Layer'}
                  </span>
              </div>
          </div>
      );
  };
  // <<< END Inline Component Definition >>>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mt-8"> 
          
          <div className="flex flex-col gap-6 md:sticky md:top-24 overflow-hidden"> 
             <RecipientInfo /> 
             
             {/* Your Wallet Card */}
             <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg shadow-lg text-sm flex flex-col justify-between"> 
               <div>
                 <h3 className="text-lg font-semibold mb-3 text-pink-400 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H7a3 3 0 00-3 3v8a3 3 0 003 3z" />
                   </svg>
                    Your Wallet
                 </h3>
                                   {isConnected && wallet ? (
                   <div className="space-y-3">
                      <div className="border-b border-gray-700/50 pb-3 mb-3">
                          <p className="text-gray-400 text-xs mb-1">Receive NPG Tokens & BSV at:</p>
                          <p className="font-mono text-green-400 break-all cursor-pointer" title="Click to copy"                 onClick={() => navigator.clipboard.writeText(`$${wallet?.email?.split('@')[0] || 'user'}`)}>
                ${wallet?.email?.split('@')[0] || 'user'}
                          </p>
                      </div>
                      
                      <div className="border-b border-gray-700/50 pb-3 mb-3">
                          {isLoadingBalance ? (
                            <p className="text-gray-400 animate-pulse">Loading BSV...</p>
                          ) : walletBalance ? ( 
                              <p className="flex justify-between items-center text-gray-300">
                                  <span>BSV Balance:</span> 
                                  <span className="font-mono text-white">{walletBalance.totalBalance?.satoshiBalance?.toLocaleString() || 0} sats</span>
                              </p>
                           ) : (
                             <p className="text-yellow-400">Cannot load BSV</p>
                           )}
                       </div>
                       
                       <div>
                          {isLoadingNpgBalance ? (
                            <p className="text-gray-400 animate-pulse">Loading NPG...</p>
                          ) : (
                              <p className="flex justify-between items-center text-gray-300">
                                  <span>NPG Tokens Held:</span> 
                                  <span className="font-mono text-white text-lg">{walletItems.length}</span>
                              </p>
                          )}
                       </div>
                   </div>
                 ) : (
                   <p className="text-gray-400">Connect wallet to view details.</p>
                 )}
               </div>
               
               {isConnected && (!isLoadingBalance || !isLoadingNpgBalance) && (
                   <button 
                      onClick={() => { fetchWalletBalance(); fetchNpgBalance();}} 
                      className="mt-4 text-xs text-blue-400 hover:text-blue-300 self-start flex items-center gap-1"
                      disabled={isLoadingBalance || isLoadingNpgBalance}
                   >
                       <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isLoadingBalance || isLoadingNpgBalance ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" />
                       </svg>
                       {isLoadingBalance || isLoadingNpgBalance ? 'Refreshing...' : 'Refresh Balances'}
                   </button>
               )}
             </div>

             {/* Standalone Notification Area */}
             <div className="mt-0 text-xs"> {/* Add mt-0 or adjust spacing as needed */}
                 {/* Melt Status */}
                 {meltApiStatus === 'loading' && (
                     <div className="bg-yellow-900/40 text-yellow-300 p-2 rounded border border-yellow-700/50 mb-2 flex items-center gap-2">
                         <svg className="animate-spin h-4 w-4 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         <span>Melting NFT... Please wait.</span>
                     </div>
                 )}
                 {meltApiStatus === 'success' && meltApiData?.message && (
                    <div className="bg-green-900/40 text-green-300 p-2 rounded border border-green-700/50 mb-2">
                      <span className="font-bold block mb-1">Melt Complete</span>
                      {meltApiData.message}
                      <button onClick={() => setMeltApiStatus('idle')} className="text-green-300 hover:text-green-100 text-xs block mt-1">(dismiss)</button>
                    </div>
                  )}
                 {meltApiStatus === 'error' && (actionError || meltApiData?.error) && (
                     <div className="bg-red-900/40 text-red-300 p-2 rounded border border-red-700/50 mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-red-200">Melt Error</span>
                        <button onClick={() => { setMeltApiStatus('idle'); setActionError(null); }} className="text-red-300 hover:text-red-100 text-xs">(dismiss)</button>
                      </div>
                      {actionError || meltApiData?.error || 'An unknown error occurred.'}
                    </div>
                 )}

                 {/* Mint Success Notification (only if not melting) */}
                 {meltApiStatus === 'idle' && singleMintApiStatus === 'success' && singleMintOrderId && (
                    <div className="bg-green-900/40 text-green-300 p-2 rounded border border-green-700/50 mb-2">
                      <span className="font-bold block mb-1">{mintingTypeLabel || 'NFT'} Mint Submitted!</span>
                      Order ID: <span className="font-mono break-all">{singleMintOrderId}</span>
                      {/* Keep link to wallet, not elements */}
                      <Link href="/wallet" className="text-green-400 hover:text-green-200 underline block mt-1">(View in Wallet)</Link>
                      <button onClick={() => setSingleMintApiStatus('idle')} className="text-green-300 hover:text-green-100 text-xs block mt-1">(dismiss)</button>
                    </div>
                  )}

                  {/* Mint Error Notification (only if not melting) */}
                  {meltApiStatus === 'idle' && (singleMintError || singleMintApiError) && (
                    <div className="bg-red-900/40 text-red-300 p-2 rounded border border-red-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-red-200">Mint Error</span>
                        <button onClick={() => { setSingleMintError(null); setSingleMintApiError(null); setSingleMintStatus('idle'); }} className="text-red-300 hover:text-red-100 text-xs">(dismiss)</button>
                      </div>
                      {singleMintError || singleMintApiError}
                    </div>
                  )}
            </div>
          </div>

          <div className="flex flex-col items-center w-full gap-4 relative overflow-hidden"> 
             <div ref={canvasContainerRef} className="w-full max-w-lg relative group">
                <ErrorBoundary fallback={<div>Error rendering NFT canvas.</div>}>
                  {singleNftData ? (
                    <div className="aspect-[961/1441] bg-black/5 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg">
                        <NFTCanvas nft={singleNftData} />
                    </div>
                  ) : (
                    <div
                      className="bg-gray-900 rounded-lg shadow-lg flex items-center justify-center w-full aspect-[961/1441] text-gray-500 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-700/50"
                      onClick={handleMint}
                      title="Click to Mint Ninja Punk Girls NFT"
                    >
                      <img
                        src="/NPGHandCash_Cover.png"
                        alt="Click to Mint Ninja Punk Girls NFT"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-xl font-semibold">Click to Mint!</p>
                      </div>
                    </div>
                  )}
                </ErrorBoundary>
                {(isGeneratingSingleApi || singleMintStatus === 'minting' || isSpinning) && ( // Added isSpinning
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg z-10">
                     {isSpinning ? (
                         <svg className="animate-spin -ml-1 mr-1 h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                     ) : (
                        <div className="w-3/4 max-w-xs bg-gray-700 rounded-full h-2.5 overflow-hidden mb-3">
                           <div
                              className={`h-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full ${isGeneratingSingleApi ? 'transition-all duration-150 ease-linear' : ''}`}
                              style={{ width: `${isGeneratingSingleApi ? imageGenerationProgress : 100}%` }}
                           ></div>
                        </div>
                     )}
                     <p className="text-sm text-gray-300 font-semibold">
                       {isSpinning ? 'Choosing NFT Type...' :
                        isGeneratingSingleApi ? generationMessage :
                        singleMintStatus === 'minting' ? `Submitting Your ${mintingTypeLabel || 'NFT'} Mint...` : 'Processing...'}
                     </p>
                  </div>
                )}
                {/* Overlay: Only show if NFT exists AND not minting/spinning */}
                {singleNftData && !isMintingActive() && meltApiStatus !== 'loading' && (
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 rounded-lg cursor-default gap-y-3"
                  >
                    {/* Single Column Layout */}
                    
                    {/* View Details */}
                    <button
                        onClick={() => setIsSummaryModalOpen(true)}
                        className="w-4/5 max-w-xs bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                        View Details
                    </button>
                    
                    {/* Send */}
                    <button 
                        onClick={openSendModal} 
                        disabled={isProcessingAction} 
                        className="w-4/5 max-w-xs bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                    
                    {/* Sell */}
                    <button 
                        onClick={openListModal} 
                        disabled={isProcessingAction} 
                        className="w-4/5 max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sell
                    </button>
                    
                    {/* Melt */}
                    <button 
                        onClick={openMeltConfirm} 
                        disabled={isProcessingAction || singleNftData.qrData !== mintedNftOrigin} 
                        className="w-4/5 max-w-xs bg-orange-500 hover:bg-orange-600 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={singleNftData.qrData !== mintedNftOrigin ? "Melt only available for the most recently minted NFT in this session." : ""}
                    >
                        Melt
                    </button>
                    
                    {/* Burn */}
                    <button 
                        onClick={openBurnConfirm} 
                        disabled={isProcessingAction} 
                        className="w-4/5 max-w-xs bg-red-600 hover:bg-red-700 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Burn
                    </button>

                    {/* View in Wallet */}
                    <button
                        onClick={() => { if (singleNftData?.qrData) { router.push(`/wallet?highlight=${encodeURIComponent(singleNftData.qrData)}`); } }}
                        disabled={!singleNftData?.qrData}
                        className="w-4/5 max-w-xs bg-lime-500 hover:bg-lime-600 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        View in Wallet
                    </button>
                    
                    {/* <<< Convert to 3D Button (Moved Here) >>> */}
                    <button
                        onClick={() => setIsComingSoonModalOpen(true)}
                        className="w-4/5 max-w-xs bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    >
                        Convert to 3D
                    </button>
                    
                    {/* Mint Another NFT */}
                    <button
                        onClick={handleMint}
                        disabled={isProcessingAction}
                        className="w-4/5 max-w-xs text-white text-base font-semibold py-2 px-4 rounded-lg shadow-lg transition-colors disabled:opacity-70 disabled:cursor-wait animate-pulsate-glow-color animate-rotate-bg-color"
                    >
                        Mint Another NFT
                    </button>
                  </div>
                )}
             </div>
          </div>
           
          <div className="lg:col-span-1 flex flex-col items-center overflow-hidden"> 
             <div 
               ref={summaryCardRef}
               className={`w-full max-w-lg bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 flex flex-col overflow-hidden group relative ${!singleNftData ? 'items-center justify-center' : ''}`}
               title={singleNftData ? "Click summary content to view details" : ""}
               style={{ height: contentHeight, minHeight: '400px' }} // Ensure min-height
             >
                  <div
                     className={`flex-grow overflow-y-auto overflow-x-auto custom-scrollbar p-3 min-h-0 ${!singleNftData ? 'hidden' : ''} ${singleNftData ? 'cursor-pointer' : ''}`}
                     onClick={() => singleNftData && setIsSummaryModalOpen(true)}
                   >
                    {singleNftData ? (
                       <>
                           <div className="mb-3 pb-2 border-b border-gray-700">
                              <h4 className="text-lg font-semibold text-purple-300 text-center">{singleNftData.name}</h4>
                              <p className="text-sm text-gray-400 text-center">#{singleNftData.number}</p>
                              {/* Display confirmed origin if available */}
                              {mintedNftOrigin === singleNftData.qrData && (
                                <p className="text-xs text-green-400 text-center mt-1">Mint Confirmed</p>
                              )}
                           </div>
                           <div className="mb-3 pb-3 border-b border-gray-700">
                               <h5 className="text-sm font-semibold text-purple-300 mb-1">Total Stats</h5>
                               <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                   <div className="flex justify-between"><span className="text-gray-400">Strength:</span><span className="text-white font-medium">{singleNftData.stats.strength}</span></div>
                                   <div className="flex justify-between"><span className="text-gray-400">Speed:</span><span className="text-white font-medium">{singleNftData.stats.speed}</span></div>
                                   <div className="flex justify-between"><span className="text-gray-400">Skill:</span><span className="text-white font-medium">{singleNftData.stats.skill}</span></div>
                                   <div className="flex justify-between"><span className="text-gray-400">Stamina:</span><span className="text-white font-medium">{singleNftData.stats.stamina}</span></div>
                                   <div className="flex justify-between"><span className="text-gray-400">Stealth:</span><span className="text-white font-medium">{singleNftData.stats.stealth}</span></div>
                                   <div className="flex justify-between"><span className="text-gray-400">Style:</span><span className="text-white font-medium">{singleNftData.stats.style}</span></div>
                               </div>
                           </div>
                           <h5 className="text-sm font-semibold text-purple-300 mb-1">Attributes</h5>
                           <NftAttributesTable
                             attributes={singleNftData.attributes.filter((attr: NFTAttribute) => attr.layer !== 'GLOW' && attr.layer !== 'TEAM')} // Ensure TEAM is filtered
                             isCollapsed={true}
                           />
                       </>
                    ) : null}
                  </div>
                  {!singleNftData && (
                     <p className="text-sm text-gray-500 p-10 text-center m-auto">Generate an NFT to see its summary preview.</p>
                  )}

                  {singleNftData && (
                     <div
                       className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                       aria-hidden="true"
                     >
                         <p className="text-white text-lg font-semibold">View Details</p>
                     </div>
                  )}
             </div>
          </div>
        </div> 

        {/* NFT Element Breakdown Section */}
        {singleNftData && singleNftData.attributes && (
          <div className="md:col-span-3 mt-8">
            <h2 className="text-xl font-semibold text-center text-teal-400 mb-4">NFT Element Breakdown</h2>
            {/* <<< RESTORED Grid Container with 8 columns >>> */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {(() => {
                console.log('[MintPage] Attributes for Breakdown:', JSON.stringify(singleNftData.attributes, null, 2));
                return singleNftData.attributes;
              })()
                // <<< FILTER OUT non-display layers >>>
                .filter(attr => !NON_DISPLAY_LAYERS_GALLERY.has(attr.layer))
                // <<< END FILTER >>>
                .map((attribute, index) => (
                  <GalleryElementCard
                    key={index}
                    attribute={attribute}
                    backgroundMap={elementCardBackgrounds}
                  />
                ))}
            </div>
             {/* <<< End Grid Container >>> */}
          </div>
        )}
      </div>
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Ninja Punk Girls. All rights reserved.</p>
      </footer>

      <NftSummaryModal
        nftData={singleNftData}
        isOpen={isSummaryModalOpen}
        onClose={handleCloseSummaryModal}
        // Action handlers passed down:
        onSendClick={openSendModal} 
        onListClick={openListModal} 
        onBurnClick={openBurnConfirm} 
        onMeltClick={openMeltConfirm} 
        // onKeep={handleSummaryModalClose} // KEEP button is likely just closing the modal
      />
      {nftToManage && (
        <SendNftModal
          isOpen={isSendModalOpen}
          onClose={() => { setIsSendModalOpen(false); setNftToManage(null); setActionError(null); }}
          nftName={nftToManage.name}
          onConfirm={handleSendConfirm} 
          error={actionError}           
          isLoading={isProcessingAction} 
        />
      )}
      {/* List Modal */}
      {isListModalOpen && nftToManage && listNFT && (
          <ListNftModal
            isOpen={isListModalOpen}
            onClose={() => setIsListModalOpen(false)}
            nftName={nftToManage.name}
            onConfirm={(price) => listNFT(nftToManage, price)} 
            isLoading={isProcessingAction}
            error={actionError}
          />
        )}
      {/* Burn Confirm */}
      {isBurnConfirmOpen && nftToManage && (
           <ConfirmationModal
             isOpen={isBurnConfirmOpen}
             onClose={() => setIsBurnConfirmOpen(false)}
             onConfirm={handleBurnConfirm} // Reference the correct burn handler
             title="Confirm Burn NFT"
              // Added null checks with ?. and default text ?? 'NFT' / ?? 'origin'
             message={`Are you sure you want to permanently burn ${nftToManage?.name ?? 'NFT'} (${nftToManage?.qrData?.substring(0, 10) ?? 'origin'}...)? This action cannot be undone.`}
             confirmText="Burn NFT" // Use confirmText
             confirmButtonStyle="destructive" // Keep style
             isLoading={isProcessingAction} // Use isLoading
           />
         )}
      {/* Melt Confirm */}
      {isMeltConfirmOpen && nftToManage && (
           <ConfirmationModal
             isOpen={isMeltConfirmOpen}
             onClose={() => setIsMeltConfirmOpen(false)}
             onConfirm={handleMeltConfirm} // Reference the melt handler
             title="Confirm Melt NFT"
              // Added null checks with ?. and default text ?? 'NFT' / ?? 'origin'
             message={`Are you sure you want to melt ${nftToManage?.name ?? 'NFT'} (${nftToManage?.qrData?.substring(0, 10) ?? 'origin'}...)? This action cannot be undone.`}
             confirmText="Melt NFT" // Use confirmText
             confirmButtonStyle="destructive" // Keep style
             isLoading={isProcessingAction} // Use isLoading
           />
         )}
      {/* Info modal for keeping NFT */}
      <ConfirmationModal
          isOpen={isKeepInfoModalOpen}
          onClose={() => setIsKeepInfoModalOpen(false)}
          onConfirm={() => setIsKeepInfoModalOpen(false)} // Restore onConfirm
          title="NFT Kept"
          message="Your newly minted NFT has been added to your HandCash wallet. You can view it in the 'My NPGs' section or directly in your HandCash app under 'Collectibles'."
          confirmText="Got it!" // Use confirmText
          confirmButtonStyle="primary" // Keep style
       />

       {/* Placeholder/Coming Soon Modal */}
       <ConfirmationModal
         isOpen={isComingSoonModalOpen}
         onClose={() => setIsComingSoonModalOpen(false)}
         onConfirm={() => setIsComingSoonModalOpen(false)} // Restore onConfirm
         title="Feature Coming Soon!"
         message="The ability to convert your NPG to a 3D model for game integration is under development. Stay tuned!"
         confirmText="Got it!" // Use confirmText
         confirmButtonStyle="primary" // Keep style
       />
    </div>
  );
} 
