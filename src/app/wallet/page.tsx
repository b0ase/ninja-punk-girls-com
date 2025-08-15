'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { useNFTStore } from '@/context/NFTStoreContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import NFTCanvas from '@/components/NFTCanvas';
import NFTSummary from '@/components/NFTSummary';
import CollapsibleSummary from '@/components/CollapsibleSummary';
import CollapsibleSummaryContent from '@/components/CollapsibleSummary';
import NFTDetailModal from '@/components/NFTDetailModal';
import ConfirmationModal from '@/components/ConfirmationModal'; // <<< Import ConfirmationModal
import SendNftModal from '@/components/SendNftModal'; // <<< Import Send Modal
import ListNftModal from '@/components/ListNftModal'; // <<< Import List Modal
import { NFTType, NFTAttribute, StatsType /*, WalletItem */ } from '@/types'; 
import { toast } from 'react-hot-toast'; // Import toast
import { QRCodeSVG } from 'qrcode.react'; // For Stack Wallet QR
import { useRouter } from 'next/navigation'; // Add this import at the top
import { CircularProgress } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CompositedElementCard from '@/components/CompositedElementCard';
import { LAYER_DETAILS } from '@/data/layer-config';
import Modal from '@/components/Modal'; // Import Modal component
import Image from 'next/image';
import Card from '@/components/Card';

// Define a type for API status (used for melt)
type ApiStatus = 'idle' | 'loading' | 'success' | 'error'; // <<< ADD ApiStatus type

// Define an interface for extracted elements
interface ExtractedElement {
  id: string;
  name: string;
  imageUrl: string;
  layer: string;
  originNftQrData: string; // <<< Changed to store qrData
  rarity: string;
  elementType: string;
  cardLayoutUrl?: string; // URL to the card layout
  stackId?: string; // ID of the stack this element belongs to
}

// Define a type for listed NFTs - Now based on identifier
interface ListedItemInfo {
  identifier: string; // This will be item.id or item.origin
  listPrice: number;
}

// Helper function to determine NFT type based on attributes
const getNftType = (item: NFTType): 'npg' | 'erobot' | 'mix' => {
  // <<< DEBUGGING YUKA START >>>
  if (item.name === 'Yuka') {
    console.log('[DEBUG] Processing Yuka NFT:', JSON.stringify(item, null, 2));
  }
  // <<< DEBUGGING YUKA END >>>

  // Check if attributes exist
  if (!item.attributes || item.attributes.length === 0) {
    if (item.name === 'Yuka') console.log('[DEBUG] Yuka: No attributes found.');
    return 'mix'; 
  }

  // Filter attributes that have layers between 07 and 25 (inclusive)
  const relevantLayers = item.attributes.filter((attr: NFTAttribute) => {
    const layerMatch = attr.layer?.match(/^(\d+)/);
    if (layerMatch) {
      const layerNum = parseInt(layerMatch[1], 10);
      return layerNum >= 7 && layerNum <= 25;
    }
    return false;
  });

  if (relevantLayers.length === 0) {
    if (item.name === 'Yuka') console.log('[DEBUG] Yuka: No relevant layers found.');
    return 'mix';
  }

  // Check genes in relevant layers
  let hasNpgGene = false;
  let hasErobotGene = false;

  relevantLayers.forEach((attr: NFTAttribute) => {
    if (attr.metadata?.genes?.toLowerCase() === 'npg') {
      hasNpgGene = true;
    } else if (attr.metadata?.genes?.toLowerCase() === 'erobot') {
      hasErobotGene = true;
    }
  });

  // <<< DEBUGGING YUKA START >>>
  if (item.name === 'Yuka') {
    console.log('[DEBUG] Yuka - Relevant Layers:', JSON.stringify(relevantLayers, null, 2));
    console.log('[DEBUG] Yuka - hasNpgGene:', hasNpgGene);
    console.log('[DEBUG] Yuka - hasErobotGene:', hasErobotGene);
  }
  // <<< DEBUGGING YUKA END >>>

  if (hasNpgGene && !hasErobotGene) {
    if (item.name === 'Yuka') console.log('[DEBUG] Yuka classified as: npg');
    return 'npg';
  } else if (!hasNpgGene && hasErobotGene) {
    if (item.name === 'Yuka') console.log('[DEBUG] Yuka classified as: erobot');
    return 'erobot';
  } else {
    if (item.name === 'Yuka') console.log('[DEBUG] Yuka classified as: mix');
    return 'mix';
  }
};

export default function WalletPage(): JSX.Element { // <<< Add return type JSX.Element
  return (
    <ErrorBoundary>
      <WalletPageContent />
    </ErrorBoundary>
  );
}

function WalletPageContent(): JSX.Element {
  // <<< MOVE getItemIdentifier HERE >>>
  function getItemIdentifier(item: NFTType): string {
    // Use qrData as the unique identifier for API calls etc.
    return item.qrData || 'unknown-identifier'; // <<< Use qrData
  }
  // <<<

  // <<< MOVE TYPE DEFINITIONS HERE >>>
  // Define Friend interface before use
  interface Friend {
    handle: string;
    displayName?: string; // HandCash might provide this
    avatarUrl?: string; // Or this
  }
  // Define NftFilterType before use
  type NftFilterType = 'all' | 'npg' | 'erobot' | 'mix' | 'element' | 'listed' | 'unlisted';
  // Define WalletTab before use
  type WalletTab = 'nfts' | 'elements' | 'wallet';
  // <<<

  // ================== HOOKS ==================
  // Moved hooks to the top to comply with Rules of Hooks

  // Context Hooks
  const { isConnected, wallet, isLoading: isHandCashLoading } = useHandCashWallet();
  const { listNFT, listedNFTs, delistNFT } = useNFTStore();
  const router = useRouter(); // Add this hook call

  // State Hooks
  const [listingPrices, setListingPrices] = useState<Record<string, string>>({});
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isTokenBalanceLoading, setIsTokenBalanceLoading] = useState<boolean>(false);
  const [recipientHandle, setRecipientHandle] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [isSendingToken, setIsSendingToken] = useState<boolean>(false);
  const [sendTokenError, setSendTokenError] = useState<string | null>(null);
  const [sendTokenSuccess, setSendTokenSuccess] = useState<string | null>(null);
  const [ownedNftItems, setOwnedNftItems] = useState<NFTType[]>([]);
  const [isLoadingOwnedNfts, setIsLoadingOwnedNfts] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<string | number>(20);
  const [lastNumericItemsPerPage, setLastNumericItemsPerPage] = useState<number>(20);
  const [canLoadMore, setCanLoadMore] = useState<boolean>(true);
  const [isShowingAll, setIsShowingAll] = useState<boolean>(false);
  const [nftForModal, setNftForModal] = useState<NFTType | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [modalNftIdentifier, setModalNftIdentifier] = useState<string | null>(null);
  const [sendRecipientHandles, setSendRecipientHandles] = useState<Record<string, string>>({});
  const [isSendingNFT, setIsSendingNFT] = useState<Record<string, boolean>>({});
  const [itemActionError, setItemActionError] = useState<Record<string, string | null>>({});
  const [itemActionSuccess, setItemActionSuccess] = useState<Record<string, string | null>>({});
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState<boolean>(false);
  const [friendsListError, setFriendsListError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NftFilterType>('all');
  const [expandedWalletNftIdentifier, setExpandedWalletNftIdentifier] = useState<string | null>(null);
  const [npgStackPublicKey, setNpgStackPublicKey] = useState<string | null>(null);
  const [npgStackPrivateKeyWIF, setNpgStackPrivateKeyWIF] = useState<string | null>(null);
  const [showStackWalletDetails, setShowStackWalletDetails] = useState<boolean>(false);
  const [isCreatingStackWallet, setIsCreatingStackWallet] = useState<boolean>(false);
  const [stackWalletError, setStackWalletError] = useState<string | null>(null);
  const [showPrivateKeyQR, setShowPrivateKeyQR] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('nfts');
  const [burningItemId, setBurningItemId] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnSuccessMessage, setBurnSuccessMessage] = useState<string | null>(null);
  const [isBurnConfirmOpen, setIsBurnConfirmOpen] = useState<boolean>(false);
  const [itemToConfirmBurn, setItemToConfirmBurn] = useState<string | null>(null);
  const [isBurnAllConfirmOpen, setIsBurnAllConfirmOpen] = useState<boolean>(false);
  const [isBurningAll, setIsBurningAll] = useState<boolean>(false);
  const [burnAllError, setBurnAllError] = useState<string | null>(null);
  const [burnAllSuccessMessage, setBurnAllSuccessMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [numberFilter, setNumberFilter] = useState<string>('');
  const [isGlobalSearch, setIsGlobalSearch] = useState<boolean>(false);
  const [allNfts, setAllNfts] = useState<NFTType[]>([]);
  const [isLoadingAllNfts, setIsLoadingAllNfts] = useState<boolean>(false);
  const [elementCards, setElementCards] = useState<ExtractedElement[]>([]);
  const [isMeltingNFT, setIsMeltingNFT] = useState<string | null>(null);
  const [meltError, setMeltError] = useState<string | null>(null);
  const [meltSuccessMessage, setMeltSuccessMessage] = useState<string | null>(null);
  const [isMeltConfirmOpen, setIsMeltConfirmOpen] = useState<boolean>(false);
  const [nftToMelt, setNftToMelt] = useState<NFTType | null>(null);
  const [meltApiStatus, setMeltApiStatus] = useState<ApiStatus>('idle');
  const [meltApiData, setMeltApiData] = useState<any>(null);
  const [nftToManage, setNftToManage] = useState<NFTType | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStackWalletModalOpen, setIsStackWalletModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ExtractedElement | null>(null);
  const [isElementDetailsModalOpen, setIsElementDetailsModalOpen] = useState(false);
  // Add missing state variables
  const [stacks, setStacks] = useState<Array<any>>([]);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [selectedElementForStack, setSelectedElementForStack] = useState<ExtractedElement | null>(null);
  const [isAddToStackModalOpen, setIsAddToStackModalOpen] = useState(false);

  // After the elementCards state declaration, add state for the element stacks and dragging
  const [elementStacks, setElementStacks] = useState<{ id: string; name: string; elements: string[] }[]>([
    { id: 'stack-1', name: 'My First Stack', elements: [] },
    { id: 'stack-2', name: 'Example Stack', elements: [] },
  ]);
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [draggingOverStack, setDraggingOverStack] = useState<string | null>(null);
  const [isLoadingElements, setIsLoadingElements] = useState<boolean>(false);

  // Function to handle drag start
  const handleDragStart = (elementId: string) => {
    setDraggingElement(elementId);
  };

  // Function to handle drag over stack
  const handleDragOver = (stackId: string, e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    setDraggingOverStack(stackId);
  };

  // Function to handle drag end
  const handleDragEnd = () => {
    setDraggingElement(null);
    setDraggingOverStack(null);
  };

  // Function to handle drop
  const handleDrop = (stackId: string, e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggingElement) return;
    
    console.log(`[WalletPage] Dropping element ${draggingElement} into stack ${stackId}`);
    
    // Update stacks to move the element to the new stack
    setElementStacks(currentStacks => {
      // Create new array to not mutate state directly
      const updatedStacks = currentStacks.map(stack => {
        // First remove the element from any stack it might be in
        if (stack.elements.includes(draggingElement)) {
          return {
            ...stack,
            elements: stack.elements.filter(id => id !== draggingElement)
          };
        }
        
        // Then add it to the target stack
        if (stack.id === stackId) {
          return {
            ...stack,
            elements: [...stack.elements, draggingElement]
          };
        }
        
        return stack;
      });
      
      return updatedStacks;
    });
    
    // Reset dragging state
    setDraggingElement(null);
    setDraggingOverStack(null);
    
    // TODO: Send update to API to save the change
    // This would be implemented with a debounced function to avoid too many API calls
  };

  // Helper function to determine if an element is in a stack
  const isElementInStack = (elementId: string, stackId: string) => {
    const stack = elementStacks.find(s => s.id === stackId);
    return stack ? stack.elements.includes(elementId) : false;
  };

  // Helper function to get elements in a stack
  const getElementsInStack = (stackId: string) => {
    const stack = elementStacks.find(s => s.id === stackId);
    if (!stack) return [];
    // Return the element IDs, not the filtered elements
    return stack.elements;
  };

  // Populate initial stack data when element cards are loaded
  useEffect(() => {
    if (elementCards.length > 0) {
      // Group elements by stackId
      const stackedElements: Record<string, string[]> = {};
      
      elementCards.forEach(element => {
        if (element.stackId) {
          if (!stackedElements[element.stackId]) {
            stackedElements[element.stackId] = [];
          }
          stackedElements[element.stackId].push(element.id);
        }
      });
      
      // Update stacks with the elements
      setElementStacks(currentStacks => {
        return currentStacks.map(stack => {
          if (stackedElements[stack.id]) {
            return {
              ...stack,
              elements: stackedElements[stack.id]
            };
          }
          return stack;
        });
      });
    }
  }, [elementCards]);

  // Update the fetchElementCards function to also set loading state
  const fetchElementCards = useCallback(async () => {
    if (!wallet?.id) return;
    
    console.log('[WalletPage] Fetching element cards...');
    
    setIsLoadingElements(true);
    
    try {
      // Call the API to get the user's element cards
      const response = await fetch('/api/handcash/get-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: wallet?.id }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch elements: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`[WalletPage] Successfully fetched ${data.elements.length} element cards`);
        setElementCards(data.elements || []);
      } else {
        console.error('[WalletPage] Failed to fetch elements:', data.error);
        
        // For development, generate mock element cards if the API returns an error
        const mockElements = Array.from({ length: 5 }, (_, i) => ({
          id: `mock-element-${i}`,
          name: `Mock Element ${i + 1}`,
          imageUrl: '/placeholder.png',
          layer: ['Background', 'Body', 'Hair', 'Outfit', 'Accessory'][i % 5],
          originNftQrData: `mock-nft-${i}`,
          rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][i % 5],
          elementType: 'npg',
          cardLayoutUrl: '/placeholder.png'
        }));
        
        console.log('[WalletPage] Setting mock element cards for development');
        setElementCards(mockElements);
      }
    } catch (error) {
      console.error('[WalletPage] Error fetching elements:', error);
      // Set empty array on error
      setElementCards([]);
    } finally {
      setIsLoadingElements(false);
    }
  }, [wallet?.id, setElementCards, setIsLoadingElements]);

  // ============================================


  const handlePriceChange = (itemIdentifier: string, price: string) => {
    console.log(`[DEBUG List] handlePriceChange - ID: ${itemIdentifier}, Price: ${price}`); 
    setListingPrices(prev => ({ ...prev, [itemIdentifier]: price }));
    // Clear errors when price changes
    setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })); 
    setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null }));
  };

  const handleListNFT = (itemIdentifier: string) => {
    const priceString = listingPrices[itemIdentifier];
    // <<< Add explicit validation and error setting >>>
    if (!priceString || isNaN(parseFloat(priceString)) || parseFloat(priceString) <= 0) {
      console.error("[WalletPage] Invalid price entered for listing NFT:", itemIdentifier, priceString);
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Please enter a valid list price (> 0).' }));
      // Clear error after delay
      setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return; // Stop execution
    }
    // <<<
    const price = parseFloat(priceString);
    
    const itemToList = ownedNftItems.find(item => getItemIdentifier(item) === itemIdentifier); // <<< Use getItemIdentifier, assuming it's defined
    if (!itemToList) {
      console.error("[WalletPage] Could not find item data for identifier:", itemIdentifier);
       setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Error finding item data.' }));
      return;
    }

    console.log(`[DEBUG List] Attempting to list item:`, itemToList, `for price:`, price);
    listNFT(itemToList, price); 
    setItemActionSuccess(prev => ({...prev, [itemIdentifier]: 'Listing submitted!'})); // Show success
    setTimeout(() => setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null })), 3000); // Clear success

    setListingPrices(prev => {
      const { [itemIdentifier]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleDelistNFT = (itemIdentifier: string) => {
    console.log(`Delisting item ${itemIdentifier}`);
    delistNFT(itemIdentifier); 
    setItemActionSuccess(prev => ({...prev, [itemIdentifier]: 'Delisted!'})); // Show success
    setTimeout(() => setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null })), 3000); // Clear success
  };

  // Token Management Functions
  const fetchTokenBalance = useCallback(async () => {
    if (!wallet?.id) return;
    setIsTokenBalanceLoading(true);
    console.log("[WalletPage] TODO: Implement API call to fetch $NINJAPUNKGIRLS balance.");
    // Example:
    // try {
    //   const response = await fetch('/api/handcash/token-balance', { ... });
    //   const data = await response.json();
    //   if (data.success) setTokenBalance(data.balance); 
    // } catch (err) { console.error(err); setTokenBalance(null); }
    // finally { setIsTokenBalanceLoading(false); }
    setTimeout(() => { // Simulate fetch
      setTokenBalance(12345.67); // Example Balance
      setIsTokenBalanceLoading(false);
    }, 1000);
  }, [wallet?.id]);

  const handleSendToken = useCallback(async () => {
    setSendTokenError(null);
    setSendTokenSuccess(null);
    const amount = parseFloat(sendAmount);
    if (!wallet?.id || !recipientHandle.trim() || isNaN(amount) || amount <= 0) {
      setSendTokenError("Invalid recipient handle or amount.");
      return;
    }
    setIsSendingToken(true);
    console.log(`[WalletPage] TODO: Implement API call to send ${amount} $NINJAPUNKGIRLS to ${recipientHandle}.`);
    // Example:
    // try {
    //    const response = await fetch('/api/handcash/send-token', { body: JSON.stringify({ wallet?.id, recipientHandle, amount, tokenId: 'YOUR_TOKEN_ID' }) ... });
    //    const data = await response.json();
    //    if (!data.success) throw new Error(data.error);
    //    setSendTokenSuccess(`Sent ${amount} $NPG. Tx: ${data.transactionId?.substring(0, 8)}...`);
    //    setRecipientHandle(''); setSendAmount(''); fetchTokenBalance();
    // } catch (err: any) { setSendTokenError(err.message); }
    // finally { setIsSendingToken(false); }
    setTimeout(() => { // Simulate Send
       setSendTokenSuccess(`Sent ${amount} $NPG to ${recipientHandle}. (Simulated)`);
       setRecipientHandle(''); setSendAmount('');
       fetchTokenBalance(); // Simulate balance update
       setIsSendingToken(false);
    }, 1500);
  }, [wallet?.id, recipientHandle, sendAmount, fetchTokenBalance]);

  // Fetch Owned NFTs function
  const fetchOwnedNfts = useCallback(async (page: number, limit: number | string) => {
    // Ensure limit doesn't exceed HandCash max (500) or go below 1
    let numericLimit: number;
    let requestedLimitIsAll = limit === 'all';
    let requestedNumericLimit: number;

    if (requestedLimitIsAll) {
      requestedNumericLimit = 500; // Use max limit when fetching all
    } else if (typeof limit === 'string') {
      requestedNumericLimit = parseInt(limit, 10);
    } else {
      requestedNumericLimit = limit;
    }

    // Handle NaN case for requestedNumericLimit after potential parseInt
    if (isNaN(requestedNumericLimit)) {
        console.warn(`[WalletPage] Invalid limit value received, defaulting to 20.`);
        numericLimit = 20; // Default to a reasonable number if parsing failed or invalid number given
    } else {
      numericLimit = requestedNumericLimit; // Assign the validated number
    }

    // Determine if we are effectively showing all *before* capping the limit
    // Use the validated numericLimit here
    const currentlyShowingAll = requestedLimitIsAll || numericLimit >= 500;
    console.log(`[DEBUG ShowAll] Setting isShowingAll to: ${currentlyShowingAll}`);
    setIsShowingAll(currentlyShowingAll);

    // Now apply the effective limit capping
    const effectiveLimit = requestedLimitIsAll
        ? 500
        : Math.max(1, Math.min(numericLimit, 500)); // Use validated numericLimit

    console.log(`[DEBUG ShowAll] fetchOwnedNfts called with page: ${page}, requested limit: ${limit}, effective limit: ${effectiveLimit}`);

    // Set loading state
    setIsLoadingOwnedNfts(true);
    
    // Use effectiveLimit for offset calculation and API call
    const offset = (page - 1) * effectiveLimit;
    console.log(`[WalletPage] Fetching owned NFT items... Page: ${page}, Limit: ${effectiveLimit}, Offset: ${offset}`);
    try {
      const response = await fetch('/api/handcash/collection', { 
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wallet?.id}` // <<< ADD Header
          },
          body: JSON.stringify({ limit: effectiveLimit, offset }) // <<< REMOVE wallet?.id from body
      });
      const data = await response.json();
      
      // Log the raw items received from the API
      console.log('[fetchOwnedNfts] Raw data received from API:', data);
      if (data.items && Array.isArray(data.items)) {
          console.log('[fetchOwnedNfts] Raw items array:', JSON.stringify(data.items, null, 2));
      } else {
          console.log('[fetchOwnedNfts] No items array found in API response.');
      }

      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch owned NFTs');
      
      // <<< Explicitly map API items to NFTType, ensuring qrData is set >>>
      const fetchedItems: NFTType[] = (Array.isArray(data.items) ? data.items : []).map((apiItem: any) => ({
        // Map all fields from apiItem to NFTType, ensuring defaults/correct types
        number: apiItem.number ?? 0, // Default or use actual number if available
        name: apiItem.name ?? 'Unnamed NFT', // Use name from API
        team: apiItem.team ?? '', // Use team from API
        series: apiItem.series ?? '', // Use series from API
        totalSupply: apiItem.totalSupply ?? 0, // Use totalSupply from API
        image: apiItem.imageUrl ?? apiItem.image ?? '/placeholder.png', // Prefer imageUrl, fallback to image
        attributes: Array.isArray(apiItem.attributes) ? apiItem.attributes : [], // Ensure attributes is array
        stats: apiItem.stats ?? { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 }, // Provide default stats
        qrData: apiItem.origin ?? '', // <<< CRITICAL: Map apiItem.origin to qrData >>>
      }));
      
      setOwnedNftItems(fetchedItems); // <<< Set the correctly mapped items
      setCurrentPage(page);
      // Can load more only if not showing all/max and fetched items match the effective limit
      setCanLoadMore(fetchedItems.length === effectiveLimit && !isShowingAll); // <<< FIXED: Use isShowingAll

      console.log(`[WalletPage] Found ${fetchedItems.length} owned NFTs.`);
    } catch (err: any) { // Add type annotation
        // Check for the specific HandCash limit error
        if (err.message?.includes('must be less than or equal to')) {
           console.error('HandCash API limit error during fetch:', err.message);
           // Optionally set a specific error state for the user
        } else {
           console.error('Error fetching owned NFTs:', err);
        }
        setOwnedNftItems([]); 
        setCanLoadMore(false);
    }
    finally { setIsLoadingOwnedNfts(false); }
  }, [wallet?.id, setOwnedNftItems, setIsLoadingOwnedNfts, setCurrentPage, setCanLoadMore, setItemsPerPage, listedNFTs, isShowingAll]); // <<< Add listedNFTs dependency

  // Fetch ALL owned NFTs (up to max limit for filtering)
  const fetchAllOwnedNfts = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingAllNfts(true);
    console.log(`[WalletPage FILTER DEBUG] ===> Fetching ALL owned NFTs for global search (Limit: 100)...`); // Updated log

    try {
      const response = await fetch('/api/handcash/collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${wallet?.id}` // <<< ADD Header
          },
          body: JSON.stringify({ limit: 100, offset: 0 }) // <<< CHANGED Limit to 100
      });
      const data = await response.json();
      // <<< Check for specific HandCash SDK errors potentially wrapped in result >>>
      if (!response.ok || !data.success || data.error) {
          let errorMsg = data.error || 'Failed to fetch owned NFTs';
          if (typeof data.error === 'object' && data.error !== null && data.error.message) {
             errorMsg = data.error.message; // Extract message if it's an object
          }
          // Throw the extracted or default message
          throw new Error(errorMsg);
      }

      // <<< APPLY THE SAME MAPPING AS fetchOwnedNfts >>>
      const apiItems = Array.isArray(data.items) ? data.items : [];
      const mappedItems: NFTType[] = apiItems.map((apiItem: any) => ({
        number: apiItem.number ?? 0,
        name: apiItem.name ?? 'Unnamed NFT',
        team: apiItem.team ?? '',
        series: apiItem.series ?? '',
        totalSupply: apiItem.totalSupply ?? 0,
        image: apiItem.imageUrl ?? apiItem.image ?? '/placeholder.png', // Map imageUrl to image
        attributes: Array.isArray(apiItem.attributes) ? apiItem.attributes : [],
        stats: apiItem.stats ?? { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 },
        qrData: apiItem.origin ?? '', // Map origin to qrData
      }));
      // <<< END MAPPING >>>

      setAllNfts(mappedItems); // <<< Set the mapped items
      console.log(`[WalletPage FILTER DEBUG] ===> Successfully fetched and mapped ${mappedItems.length} total NFTs (Limit 100). Setting allNfts state. First item name (if exists):`, mappedItems[0]?.name);
    } catch (err: any) {
      console.error('[WalletPage FILTER DEBUG] ===> Error fetching all owned NFTs:', err);
      setAllNfts([]);
    } finally { setIsLoadingAllNfts(false); }
  }, [wallet?.id, setAllNfts, setIsLoadingAllNfts, listedNFTs]); // <<< Add listedNFTs dependency

  // Fetch Friends List Function
  const fetchFriendsList = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingFriends(true);
    setFriendsListError(null);
    console.log("[WalletPage] Fetching HandCash friends list...");

    try {
      // TODO: Implement backend API call
      const response = await fetch('/api/handcash/friends', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}` // <<< ADD Header
        },
        body: JSON.stringify({}) // Sending empty body as POST often requires it
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch friends list.');
      }

      // Assuming the API returns { success: true, friends: [...] }
      const fetchedFriends = Array.isArray(data.friends) ? data.friends : [];
      setFriendsList(fetchedFriends);
      console.log(`[WalletPage] Found ${fetchedFriends.length} friends.`);

    } catch (err: any) {
      console.error('Error fetching friends list:', err);
      setFriendsListError(err.message || 'Could not load friends.');
      setFriendsList([]); // Clear list on error
    } finally {
      setIsLoadingFriends(false);
    }
  }, [wallet?.id]);

  // <<< DEFINE fetchNpgStackWallet BEFORE the useEffect that uses it >>>
  const fetchOrCreateStackWallet = useCallback(async () => {
    if (!wallet?.id) return;
    console.log("[WalletPage] Fetching NPG Wallet details...");
    
    // Use state variables to track loading
    const setIsLoadingStackWallet = (loading: boolean) => {
      setIsCreatingStackWallet(loading);
    };
    
    setIsLoadingStackWallet(true);
    setStackWalletError(null);
    
    try {
      // 1. First try to fetch existing wallet
      const response = await fetch('/api/get-stack-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletId: wallet?.id })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch NPG wallet info');
      }
      
      // 2. If we got a wallet, fetch its token balance
      if (data.success && data.publicKey) {
        console.log(`[WalletPage] Found existing NPG wallet with public key: ${data.publicKey.substring(0, 8)}...`);
        setNpgStackPublicKey(data.publicKey);
        
        // Now get the token balance for this wallet
        const balanceResponse = await fetch('/api/get-stack-token-balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            walletId: wallet?.id,
            publicKey: data.publicKey 
          })
        });
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          if (balanceData.success) {
            // Since we're displaying the token balance both at the top and in the wallet section,
            // we'll update the same token balance state
            setTokenBalance(balanceData.balance);
            console.log(`[WalletPage] Fetched NPG wallet token balance: ${balanceData.balance}`);
          }
        }
      } else {
        console.log("[WalletPage] No existing NPG wallet found. User needs to create one.");
        setNpgStackPublicKey(null);
      }
    } catch (err: any) {
      console.error("[WalletPage] Error fetching NPG wallet:", err);
      setStackWalletError(err.message || 'Failed to fetch wallet info');
    } finally {
      setIsLoadingStackWallet(false);
    }
  }, [wallet?.id, setTokenBalance]);
  // <<< End function definition >>>

  // Load Balances, NFTs, and Friends on Connect
  useEffect(() => {
    if (wallet?.id) {
      console.log("[DEBUG ShowAll] useEffect[wallet?.id] triggered. Fetching initial page.");
      const initialLimit = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      fetchOwnedNfts(1, initialLimit);
      fetchAllOwnedNfts(); // Fetch all for global search
      // fetchTokenBalance(); // Moved below
      fetchFriendsList();
      fetchOrCreateStackWallet(); // Fetch NPG Stack Wallet details
      fetchElementCards(); // Fetch Element cards
    }
  }, [wallet?.id, fetchOwnedNfts, fetchAllOwnedNfts, fetchFriendsList, fetchOrCreateStackWallet, fetchElementCards, itemsPerPage, lastNumericItemsPerPage]); // <<< Ensure all callbacks are deps

  // Fetch token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!wallet?.id) return;
      setIsTokenBalanceLoading(true);
      setTokenBalance(null); // Clear previous balance
      console.log('[WalletPage] TODO: Implement API call to fetch $NINJAPUNKGIRLS balance.');
      try {
        // Placeholder: Replace with actual API call
        // const response = await fetch('/api/handcash/token-balance', { ... });
        // const data = await response.json();
        // if (data.success) {
        //   setTokenBalance(data.balance);
        // } else {
        //   console.error("Failed to fetch token balance:", data.error);
        //   setTokenBalance(null);
        // }
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setTokenBalance(1234.56); // Example balance
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setTokenBalance(null);
      } finally {
        setIsTokenBalanceLoading(false);
      }
    };
    if (wallet?.id) {
      fetchTokenBalance();
    }
  }, [wallet?.id]);

  // <<< ADD fetchWalletBalance useCallback definition >>>
  const fetchWalletBalance = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingBalance(true);
    setWalletBalance(null); // Clear previous balance
    console.log('[WalletPage] Fetching BSV wallet balance...');
    try {
      const response = await fetch('/api/handcash/balance', {
        method: 'POST', // Or GET, depending on your API design
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}`
        },
        body: JSON.stringify({}) // Include body if needed, e.g., for POST
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch wallet balance');
      }
      // Assuming API returns { success: true, balanceData: { balance: number, currencyCode: string, ... } }
      setWalletBalance(data.balanceData);
      console.log('[WalletPage] BSV Balance fetched:', data.balanceData);
    } catch (error: any) {
      console.error('Error fetching BSV wallet balance:', error);
      setWalletBalance(null);
      // Optionally set a specific error state here
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet?.id]); // <<< REMOVED setIsLoadingBalance, setWalletBalance from dependencies

  // Fetch BSV balance - <<< UNCOMMENTED and ADDED CALL >>>
  useEffect(() => {
    if (wallet?.id) {
      fetchWalletBalance();
    }
  }, [wallet?.id, fetchWalletBalance]); // <<< Added fetchWalletBalance to dependencies

  // Update lastNumericItemsPerPage when itemsPerPage changes to a number
  useEffect(() => {
    if (typeof itemsPerPage === 'number') {
      setLastNumericItemsPerPage(itemsPerPage);
    }
  }, [itemsPerPage]);

  // Refetch NFTs when listedNFTs context changes (if not showing all)
  useEffect(() => {
    console.log("[DEBUG List UI] Context listedNFTs state changed:", listedNFTs);
    if (!isShowingAll && wallet?.id) {
      console.log("[DEBUG List UI] Refetching current page due to listedNFTs change.");
      const currentLimit = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      fetchOwnedNfts(currentPage, currentLimit);
    }
    if (isGlobalSearch && wallet?.id) {
       console.log("[DEBUG List UI] Refetching all owned NFTs due to listedNFTs change (global search active).");
       fetchAllOwnedNfts();
    }
  }, [listedNFTs, isShowingAll, isGlobalSearch, wallet?.id, currentPage, itemsPerPage, lastNumericItemsPerPage, fetchOwnedNfts, fetchAllOwnedNfts]);

  // *** UPDATED Handlers ***
  const handleShowAll = useCallback(() => {
    console.log("[DEBUG ShowAll] handleShowAll called (fetching max 500)"); 
    setItemsPerPage("all"); 
    fetchOwnedNfts(1, 500); // <<< Fetch max 500 instead of 1000
    // Don't set global search to false - keep the dropdown visible
    // setIsGlobalSearch(false);
  }, [fetchOwnedNfts]);

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const numericValue = parseInt(value, 10);

    if (value === 'all') {
      setItemsPerPage('all');
      setIsShowingAll(true);
      fetchOwnedNfts(1, 500); // Fetch max items
    } else if (!isNaN(numericValue) && numericValue > 0) {
      const validNumericValue = Math.min(numericValue, 500); // Cap at 500
      setItemsPerPage(validNumericValue);
      setLastNumericItemsPerPage(validNumericValue); // Update the last numeric value used
      setIsShowingAll(false);
      fetchOwnedNfts(1, validNumericValue); // Refetch with new limit, resetting to page 1
    }
  };

  const handleShowPaginated = useCallback(() => {
    console.log("[DEBUG ShowAll] handleShowPaginated called, using limit:", lastNumericItemsPerPage);
    setItemsPerPage(lastNumericItemsPerPage); 
    fetchOwnedNfts(1, lastNumericItemsPerPage);
  }, [fetchOwnedNfts, lastNumericItemsPerPage]); 

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      // Should only be clickable when !isShowingAll
      const currentLimit = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      // setIsShowingAll(false); // Already false if button is visible
      fetchOwnedNfts(currentPage - 1, currentLimit);
    }
  };

  const handleNextPage = () => {
    if (canLoadMore && !isLoadingOwnedNfts) {
      const nextPage = currentPage + 1;
      const currentLimit = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      if (!isShowingAll) { // Only fetch next page if not showing all
        fetchOwnedNfts(nextPage, currentLimit);
      }
    }
  };
  // *** END UPDATED Handlers ***

  // <<< Add Handlers for NFT Sending >>>
  const handleRecipientChange = (itemIdentifier: string, handle: string) => {
    setSendRecipientHandles(prev => ({ ...prev, [itemIdentifier]: handle }));
    // Clear errors/success messages when typing
    setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })); 
    setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null }));
  };

  const handleSendNFT = useCallback(async (itemIdentifier: string) => {
    const recipientHandle = sendRecipientHandles[itemIdentifier]?.trim();
    if (!wallet?.id || !recipientHandle || !recipientHandle.startsWith('$')) {
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Invalid recipient handle (must start with $).' }));
      setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return;
    }
    
    const itemToSend = ownedNftItems.find(item => getItemIdentifier(item) === itemIdentifier);
    const nftIdToSend = itemToSend ? getItemIdentifier(itemToSend) : null;

    if (!nftIdToSend) {
         setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Cannot find NFT identifier.' }));
         return;
    }

    setIsSendingNFT(prev => ({ ...prev, [itemIdentifier]: true }));
    setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })); 
    setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null }));

    console.log(`[WalletPage] Attempting to send NFT ${nftIdToSend} to ${recipientHandle}`);

    try {
      const response = await fetch('/api/handcash/send-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ walletId: wallet?.id, nftId: nftIdToSend, recipientHandle }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to send NFT.');

      console.log(`[WalletPage] Successfully sent NFT ${nftIdToSend} to ${recipientHandle}. Tx: ${data.transactionId}`);
      setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: `Sent to ${recipientHandle}!` }));
      setSendRecipientHandles(prev => ({ ...prev, [itemIdentifier]: '' })); 
      setTimeout(() => {
          const currentLimit = isShowingAll ? 1000 : (typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage);
          fetchOwnedNfts(isShowingAll ? 1 : currentPage, currentLimit);
          setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null })); // Clear success after refresh+delay
      }, 1500); 

    } catch (err: any) {
      console.error('Error sending NFT:', err);
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: err.message || 'An unknown error occurred.' }));
      setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 5000);
    } finally {
      setIsSendingNFT(prev => ({ ...prev, [itemIdentifier]: false }));
    }
  }, [wallet?.id, sendRecipientHandles, ownedNftItems, fetchOwnedNfts, isShowingAll, itemsPerPage, lastNumericItemsPerPage, currentPage]);
  // <<< End Add Handlers >>>

  // Memoize listed identifiers for quick lookup
  const listedIdentifiers = useMemo(() => {
    return new Set(listedNFTs.map(item => item.identifier));
  }, [listedNFTs]);
  
  // Update name filter with global search
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameFilter(value);

    // Enable global search and fetch all NFTs if needed
    const shouldBeGlobal = !!value || !!numberFilter || activeFilter !== 'all';
    if (shouldBeGlobal && !isGlobalSearch && allNfts.length === 0) {
      fetchAllOwnedNfts(); // Fetch all if switching to global and data isn't loaded
    }
    setIsGlobalSearch(shouldBeGlobal);
  };

  // Update number filter with global search
  const handleNumberFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumberFilter(value);

    // Enable global search and fetch all NFTs if needed
    const shouldBeGlobal = !!value || !!nameFilter || activeFilter !== 'all';
     if (shouldBeGlobal && !isGlobalSearch && allNfts.length === 0) {
      fetchAllOwnedNfts(); // Fetch all if switching to global and data isn't loaded
    }
    setIsGlobalSearch(shouldBeGlobal);
  };

  // Update filter type with global search
  const handleFilterChange = (filter: NftFilterType) => {
    setActiveFilter(filter);
    
    // Enable global search if filters are being used
    if (filter !== 'all' || nameFilter || numberFilter) {
      setIsGlobalSearch(true);
    } else if (!nameFilter && !numberFilter) {
      setIsGlobalSearch(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setNameFilter('');
    setNumberFilter('');
    setActiveFilter('all');
    setIsGlobalSearch(false);
    fetchOwnedNfts(1, lastNumericItemsPerPage); // Ensure 2 arguments
  };

  // Modify filteredDisplayedItems to use allNfts when global search is active
  const filteredAndSortedItems: NFTType[] = useMemo(() => {
    console.log(`[WalletPage FILTER DEBUG] --- Recalculating filteredAndSortedItems ---`);
    console.log(`[WalletPage FILTER DEBUG] isGlobalSearch: ${isGlobalSearch}, nameFilter: '${nameFilter || "(none)"}', numberFilter: '${numberFilter || "(none)"}', activeFilter: ${activeFilter}`);

    // Determine the base list of items to filter
    const baseItems = isGlobalSearch ? allNfts : ownedNftItems;

    // Early exit if base items are loading or empty (unless filtering listed/unlisted which might work on empty)
    if (isLoadingOwnedNfts || (!baseItems.length && activeFilter !== 'listed' && activeFilter !== 'unlisted')) {
        console.log('[WalletPage FILTER DEBUG] Returning early: Loading or no base items.');
        return [];
    }
    console.log(`[WalletPage FILTER DEBUG] Using baseItems from: ${isGlobalSearch ? 'allNfts' : 'ownedNftItems'} (length: ${baseItems?.length ?? 0})`);

    // Filter based on activeFilter (excluding 'all' case initially)
    let filtered = baseItems;
    if (activeFilter === 'listed') {
      filtered = filtered.filter(item => listedIdentifiers.has(getItemIdentifier(item)));
    } else if (activeFilter === 'unlisted') {
      filtered = filtered.filter(item => !listedIdentifiers.has(getItemIdentifier(item)));
    } else if (activeFilter === 'npg' || activeFilter === 'erobot' || activeFilter === 'mix') {
        filtered = filtered.filter(item => getNftType(item) === activeFilter);
    }
    console.log(`[WalletPage FILTER DEBUG] After type/status filter (length: ${filtered.length})`);

    // Further filter by name and number if filters are set
    if (nameFilter) {
      const lowerNameFilter = nameFilter.toLowerCase();
      filtered = filtered.filter(item => {
        const lowerItemName = item.name.toLowerCase();
        const includes = lowerItemName.includes(lowerNameFilter);
        // Log mismatch for debugging
        // if (!includes) {
        //   console.log(`[WalletPage FILTER DEBUG] Name mismatch: Item='${lowerItemName}', Filter='${lowerNameFilter}'`);
        // }
        return includes;
      });
      console.log(`[WalletPage FILTER DEBUG] After name filter ('${nameFilter}') (length: ${filtered.length})`);
    }
    if (numberFilter) {
      const num = parseInt(numberFilter, 10);
      if (!isNaN(num)) {
        filtered = filtered.filter(item => item.number === num);
        console.log(`[WalletPage FILTER DEBUG] After number filter (${num}) (length: ${filtered.length})`);
      }
    }

    // Sort the filtered items: listed first, then by rarity, then by number
    const sorted = [...filtered].sort((a, b) => {
      const isAListed = listedIdentifiers.has(getItemIdentifier(a)); // <<< Use getItemIdentifier
      const isBListed = listedIdentifiers.has(getItemIdentifier(b)); // <<< Use getItemIdentifier

      if (isAListed !== isBListed) {
        return isAListed ? -1 : 1; // Listed items come first
      }

      // If both are listed or both are unlisted, sort by rarity (descending)
      // <<< Access rarity from metadata within attributes (assuming standard structure) >>>
      const rarityOrder = { Legendary: 1, Epic: 2, Rare: 3, Common: 4 };
      // Find the attribute that signifies rarity (this might need adjustment based on actual data structure)
      const rarityAAttr = a.attributes.find(attr => attr.metadata?.rarity)?.metadata?.rarity;
      const rarityBAttr = b.attributes.find(attr => attr.metadata?.rarity)?.metadata?.rarity;

      const rarityA = rarityAAttr ? rarityOrder[rarityAAttr as keyof typeof rarityOrder] : 5;
      const rarityB = rarityBAttr ? rarityOrder[rarityBAttr as keyof typeof rarityOrder] : 5;
      if (rarityA !== rarityB) {
        return rarityA - rarityB;
      }

      // If rarity is the same, sort by number (ascending)
      return a.number - b.number;
    });

    console.log(`[WalletPage FILTER DEBUG] --- Finished recalculating. Final count: ${sorted.length} ---`);
    return sorted;

  }, [ownedNftItems, allNfts, activeFilter, listedIdentifiers, nameFilter, numberFilter, isGlobalSearch, isLoadingAllNfts, isLoadingOwnedNfts]);

  // <<< Handler to toggle wallet item expansion >>>
  const handleWalletItemToggle = (identifier: string) => {
    setExpandedWalletNftIdentifier(current => current === identifier ? null : identifier);
  };

  // <<< Handlers for NFT Detail Modal >>>
  const handleOpenModal = useCallback(async (identifier: string) => {
    if (isLoadingDetails || nftForModal) return; // Prevent overlapping requests/multiple modals

    // Basic check if item exists in current view (optional, but good practice)
    const basicItemInfo = ownedNftItems.find(item => getItemIdentifier(item) === identifier);
    if (!basicItemInfo) {
      console.error("[WalletPage Stub] Could not find basic info for NFT identifier:", identifier);
      toast.error("Cannot find NFT in current view.");
      return;
    }

    console.log(`[WalletPage Stub] Opening modal for identifier: ${identifier}`);
    setIsLoadingDetails(true);
    setModalNftIdentifier(identifier); // Keep track of which modal is loading/open
    setNftForModal(null); // Clear previous data
    let detailError = null;

    try {
      console.log(`[WalletPage Stub] Fetching details from /api/get-nft-details?origin=${identifier}`);
      // Use the identifier (which should be the origin/qrData) to fetch details
      const response = await fetch(`/api/get-nft-details?origin=${encodeURIComponent(identifier)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        detailError = result.error || `Failed to fetch NFT details (Status: ${response.status}).`;
        console.error(`[WalletPage Stub] Error fetching details for ${identifier}:`, detailError);
      } else {
        console.log(`[WalletPage Stub] Successfully fetched details for ${identifier}:`, result.data);
        // Map the received Supabase data to our NFTType
        const supabaseData = result.data;
        const parsedAttributes: NFTAttribute[] = supabaseData.attributes || [];
        const parsedStats: StatsType = supabaseData.stats || { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 };

        const detailedNftData: NFTType = {
          number: supabaseData.number ?? 0,
          name: supabaseData.name,
          team: supabaseData.team ?? '',
          series: supabaseData.series ?? '',
          totalSupply: 0, // Default or determine if available
          image: supabaseData.image_url, // Use image_url from DB
          attributes: parsedAttributes,
          stats: parsedStats,
          qrData: supabaseData.origin, // origin is the identifier
        };
        setNftForModal(detailedNftData);
      }
    } catch (error: any) {
      detailError = error.message || "An unexpected error occurred while fetching NFT details.";
      console.error(`[WalletPage Stub] Catch block error fetching details for ${identifier}:`, error);
    } finally {
      setIsLoadingDetails(false);
      if (detailError) {
        toast.error(detailError);
        setNftForModal(null);
        setModalNftIdentifier(null); // Clear identifier if fetch failed
      }
    }
  }, [isLoadingDetails, nftForModal, ownedNftItems]);

  const handleCloseModal = () => {
    setNftForModal(null);
    setModalNftIdentifier(null);
    setIsLoadingDetails(false); // Ensure loading state is reset
  };

  // <<< Add Effect to log context state changes >>>
  useEffect(() => {
    console.log('[DEBUG List UI] Context listedNFTs state changed:', listedNFTs.map(nft => nft.identifier)); // Log only identifiers for brevity
  }, [listedNFTs]);
  // <<<

  // <<< Log state right before render >>>
  console.log('[DEBUG ShowAll UI] Rendering WalletPageContent. isShowingAll:', isShowingAll);

  // <<< REMOVE the old handleMeltNFT function >>>
  /*
  const handleMeltNFT = useCallback(async (itemIdentifier: string) => {
    // ... Entire function content removed ... 
  }, [wallet?.id, isMeltingNFT, listedNFTs, itemsPerPage, lastNumericItemsPerPage, currentPage, fetchOwnedNfts, fetchAllOwnedNfts, elementCards]);
  */
   
  // <<< Function to OPEN Melt Confirmation Modal >>>
  const openMeltConfirmWallet = useCallback((itemIdentifier: string) => {
    console.log(`[WalletPage] Initiating melt confirmation for NFT: ${itemIdentifier}`);
    const isListed = listedNFTs.some(li => li.identifier === itemIdentifier);
    if (isListed) {
      toast.error('Cannot melt a listed NFT.');
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Cannot melt a listed NFT.' }));
      setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return;
    }
    if (!wallet?.id) {
      toast.error('Authentication token missing. Please reconnect wallet.');
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Authentication token missing.' }));
       setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return;
    }
    if (meltApiStatus === 'loading') return; // <<< Use meltApiStatus instead of isMeltingNFT

    // Find the NFT object
    const nft = ownedNftItems.find(item => getItemIdentifier(item) === itemIdentifier);
    if (!nft) {
      console.error("Could not find NFT for identifier:", itemIdentifier);
      return;
    }

    setNftToMelt(nft); // <<< SETTING THE STATE HERE
    setIsMeltConfirmOpen(true);
    // Clear any previous action messages for this item
    setItemActionError(prev => ({ ...prev, [itemIdentifier]: null }));
    setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null }));
  }, [wallet?.id, listedNFTs, meltApiStatus, ownedNftItems]);

  // <<< Execute Burn Logic (Moved from handleBurnNFT) >>>
  const executeBurn = useCallback(async () => {
    if (!itemToConfirmBurn) return; // Ensure we have an item identifier
    if (!wallet?.id) {
        console.error("[WalletPage] executeBurn failed: No auth token.");
        setBurnError('Authentication token missing.');
        setIsBurnConfirmOpen(false); 
        setItemToConfirmBurn(null);
        return;
    }

    setBurningItemId(itemToConfirmBurn); 
    setBurnError(null);
    setBurnSuccessMessage(null);
    // Use itemToConfirmBurn consistently here
    setItemActionError(prev => ({ ...prev, [itemToConfirmBurn]: null }));
    setItemActionSuccess(prev => ({ ...prev, [itemToConfirmBurn]: null }));

    try {
      // Use the itemToConfirmBurn directly - it will either be the origin or id
      const itemOrigin = itemToConfirmBurn; // Just use the identifier directly
      
      console.log(`[WalletPage] Sending burn request for NFT identifier: ${itemOrigin}`);
      const response = await fetch('/api/handcash/burn-nft', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ walletId: wallet?.id, itemOrigin }), 
      });

      // <<< START Debugging Block >>>
      if (!response.ok) {
        const errorText = await response.text(); // Read response as text first
        console.error(`[WalletPage Burn Debug] API responded with status ${response.status}. Response Text:`, errorText);
        // Try to parse as JSON for structured error, but catch if it fails (like getting HTML)
        let errorJson = { success: false, error: 'Unknown error' };
        try {
          errorJson = JSON.parse(errorText);
        } catch (parseError) {
          // Keep the default error if parsing failed
          errorJson.error = `API failed with status ${response.status} and returned non-JSON response.`;
        }
        throw new Error(errorJson.error || 'Failed to burn NFT via API.');
      }
      // <<< END Debugging Block >>>

      const data = await response.json(); // Now parse as JSON only if response.ok

      if (!data.success) { // Check the success flag from the JSON data
        throw new Error(data.error || 'API indicated failure but didnt provide error message.');
      }

      console.log('[WalletPage] Burn successful for origin:', itemOrigin);
      
      setBurnSuccessMessage('NFT Burned Successfully!');
      // Use itemToConfirmBurn for setting item-specific success
      setItemActionSuccess(prev => ({ ...prev, [itemToConfirmBurn]: 'Burned!' })); 
      
      const currentLimit = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      fetchOwnedNfts(currentPage, currentLimit); 
      fetchAllOwnedNfts(); 
      
      // Use itemToConfirmBurn to check if the detail modal should close
      if (modalNftIdentifier === itemToConfirmBurn) {
          handleCloseModal();
      }

    } catch (err: any) {
      console.error('[WalletPage] Error burning NFT:', err);
      setBurnError(err.message || 'Failed to burn NFT.');
      // Use itemToConfirmBurn for setting item-specific error
      setItemActionError(prev => ({ ...prev, [itemToConfirmBurn]: err.message || 'Burn failed.' }));
    } finally {
       // Ensure itemToConfirmBurn (even if null) is used for clearing state
       const itemToClear = itemToConfirmBurn ?? '';
       setBurningItemId(null); 
       setIsBurnConfirmOpen(false); 
       setItemToConfirmBurn(null); 
       setTimeout(() => {
         setBurnSuccessMessage(null);
         setBurnError(null);
       }, 5000);
       setTimeout(() => {
          setItemActionSuccess(prev => ({ ...prev, [itemToClear]: null })); 
          setItemActionError(prev => ({ ...prev, [itemToClear]: null }));
       }, 3000); 
    }
  }, [
    wallet?.id, 
    itemToConfirmBurn, 
    burningItemId,
    fetchOwnedNfts, 
    fetchAllOwnedNfts, 
    itemsPerPage, 
    lastNumericItemsPerPage, 
    currentPage, 
    allNfts, 
    modalNftIdentifier, 
    handleCloseModal
  ]);

  // <<< Add NPG Stack Wallet Creation Function >>>
  const handleCreateNpgStackWallet = useCallback(async () => {
    if (!wallet?.id) {
      setStackWalletError("HandCash connection required.");
      toast.error("HandCash connection required");
      return;
    }
    
    setIsCreatingStackWallet(true);
    setStackWalletError(null);
    setNpgStackPublicKey(null);
    setNpgStackPrivateKeyWIF(null);
    setShowStackWalletDetails(false);
    setShowPrivateKeyQR(false);
    
            console.log("[NPG Wallet] Creating $NPG Wallet for HandCash user:", wallet?.email);
    
    try {
      // Step 1: Request HandCash to sign our unique message
      toast.loading("Requesting HandCash signature...", { id: "stack-wallet-creation" });
      
      // The message to sign should be unique to NPG and include the user's handle
      // so keys are deterministic but tied to their specific HandCash account
              const messageToSign = `NPG-Wallet-${wallet?.email?.split('@')[0] || 'user'}-v1`;
      
      // This would be your actual API call to request a signature from HandCash
      const signatureResponse = await fetch('/api/handcash/sign-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}`
        },
        body: JSON.stringify({ message: messageToSign })
      });
      
      if (!signatureResponse.ok) {
        throw new Error("Failed to get HandCash signature");
      }
      
      const signatureData = await signatureResponse.json();
      if (!signatureData.success || !signatureData.signature) {
        throw new Error(signatureData.error || "Invalid signature response");
      }
      
      const handcashSignature = signatureData.signature;
      
      // Step 2: Use the signature to derive keys
      // Note: In production, this would be done client-side using a BSV library
      // to avoid sending private keys over the network
      toast.loading("Deriving wallet keys...", { id: "stack-wallet-creation" });
      
      const keysResponse = await fetch('/api/derive-keys-from-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signature: handcashSignature })
      });
      
      if (!keysResponse.ok) {
        throw new Error("Failed to derive wallet keys");
      }
      
      const keysData = await keysResponse.json();
      if (!keysData.success || !keysData.publicKey || !keysData.privateKeyWIF) {
        throw new Error(keysData.error || "Invalid key derivation response");
      }
      
      // Now we have proper keys derived from the HandCash signature
      setNpgStackPublicKey(keysData.publicKey);
      setNpgStackPrivateKeyWIF(keysData.privateKeyWIF);
      setShowStackWalletDetails(true);
      
      // Step 3: Register the public key with our backend (for token tracking)
      toast.loading("Registering wallet...", { id: "stack-wallet-creation" });
      
      const registerResponse = await fetch('/api/register-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}`
        },
        body: JSON.stringify({ 
          publicKey: keysData.publicKey,
          handcashHandle: wallet?.email,
          isPrimary: true // Mark this as the primary wallet
        })
      });
      
      if (!registerResponse.ok) {
        console.warn("Wallet created but registration failed - token balance tracking may be limited");
      }
      
      // Step 4: Fetch the wallet token balance (which should initially be 0)
      const balanceResponse = await fetch('/api/get-stack-token-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletId: wallet?.id,
          publicKey: keysData.publicKey
        })
      });
      
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        if (balanceData.success) {
          setTokenBalance(balanceData.balance);
          console.log(`[NPG Wallet] Initial wallet token balance: ${balanceData.balance}`);
        }
      }
      
      toast.success("$NPG Wallet created successfully!", { id: "stack-wallet-creation" });
              console.log("[NPG Wallet] Wallet created and registered for:", wallet?.email);
      
    } catch (error: any) {
      console.error("[NPG Wallet] Error creating wallet:", error);
      setStackWalletError(error.message || "Failed to create $NPG wallet");
      toast.error("Failed to create wallet: " + (error.message || "Unknown error"), { id: "stack-wallet-creation" });
    } finally {
      setIsCreatingStackWallet(false);
    }
  }, [wallet?.id, setTokenBalance]);
  // <<< End NPG Stack Wallet Creation Function >>>

  // <<< Backup Handlers (will use simulated keys now) >>>
  const handleCopyPrivateKey = () => {
    if (!npgStackPrivateKeyWIF) return;
    navigator.clipboard.writeText(npgStackPrivateKeyWIF);
    toast.success("Private Key copied to clipboard", { 
      style: { background: "#111", color: '#fff', border: '1px solid #444' },
      duration: 3000
    });
  };

  const handleDownloadKeyFile = useCallback(() => {
    if (!npgStackPublicKey || !npgStackPrivateKeyWIF || !wallet?.id) return;
    
    try {
      // Create a BSV wallet export format with proper metadata
      const walletData = {
        wallet_type: "NPG Stack Wallet",
        version: "1.0",
        network: "mainnet",
        public_key: npgStackPublicKey,
        private_key_wif: npgStackPrivateKeyWIF,
        address: "", // This would be derived from the public key in production
        user_handle: wallet?.email,
        handcash_linked: true,
        created_from: "HandCash Signature",
        backup_date: new Date().toISOString(),
        backup_timestamp: Date.now(),
        warning: "NEVER SHARE YOUR PRIVATE KEY. Anyone with access to this file can control your tokens.",
        compatibility: "This wallet is compatible with standard BSV wallets that support WIF import."
      };
      
      // Generate a filename with timestamp and handle
      const walletTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const sanitizedHandle = (wallet?.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '_');
      const walletFilename = `npg_stack_wallet_${sanitizedHandle}_${walletTimestamp}.json`;
      
      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(walletData, null, 2)], {
        type: "application/json"
      });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create an anchor element and trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = walletFilename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Wallet backup file downloaded");
      console.log("[StackWallet] Backup file downloaded:", walletFilename);
    } catch (error) {
      console.error("[StackWallet] Error downloading wallet backup:", error);
      toast.error("Failed to download wallet backup");
    }
  }, [npgStackPublicKey, npgStackPrivateKeyWIF, wallet?.id]);
  // <<< End Backup Handlers >>>

  // --- Burn All Logic (Existing) ---
  const handleBurnAllConfirm = useCallback(async () => {
    if (!wallet?.id) {
      toast.error("Authentication token is missing.");
      return;
    }
    setIsBurningAll(true);
    try {
      // Assuming an API endpoint like /api/handcash/burn-batch
      // We need the identifiers of the NFTs to burn
      const identifiersToBurn = filteredAndSortedItems.map(getItemIdentifier).filter((id: string) => id !== 'unknown-identifier'); // NEW: Add type to id
      if (identifiersToBurn.length === 0) {
        toast("No NFTs selected or identifiable for burning.", { icon: '⚠️' });
        setIsBurnAllConfirmOpen(false);
        return;
      }

      console.log(`[WalletPage] BURN ALL API Call: ${identifiersToBurn.length} NFTs`);
      const response = await fetch('/api/handcash/burn-batch', { // <-- Needs API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${wallet?.id}`,
        },
        body: JSON.stringify({ origins: identifiersToBurn }), // Assuming API expects 'origins'
      });
      const result = await response.json();

      if (!response.ok || !result.success) { // Assuming API returns { success: boolean, ... }
        throw new Error(result.error || 'Failed to burn all NFTs.');
      }

      toast.success(`Successfully burned ${result.burnedCount || identifiersToBurn.length} NFTs.`); // Assuming API returns count
      setIsBurnAllConfirmOpen(false);
      // Refresh owned NFTs list
      // OLD: fetchOwnedNfts(1, lastNumericItemsPerPage, false, undefined);
      fetchOwnedNfts(1, lastNumericItemsPerPage); // NEW: Use only required args
    } catch (err: any) {
      toast.error(`Error burning NFTs: ${err.message}`);
    } finally {
      setIsBurningAll(false);
    }
  }, [wallet?.id, fetchOwnedNfts, lastNumericItemsPerPage, filteredAndSortedItems]); // NEW: Add filteredAndSortedItems to deps

  const handleCancelBurnAll = () => {
    setIsBurnAllConfirmOpen(false);
    setIsBurningAll(false);
    setBurnAllError(null);
    setBurnAllSuccessMessage(null);
  };

  // <<< Execute Burn All Logic >>>
  const executeBurnAll = useCallback(async () => {
      if (!wallet?.id) {
          console.error("[WalletPage] executeBurnAll failed: No auth token.");
          setBurnAllError('Authentication token missing.');
          setIsBurnAllConfirmOpen(false);
          return;
      }

      setIsBurningAll(true);
      setBurnAllError(null);
      setBurnAllSuccessMessage(null);
      // Keep confirmation modal open

      console.log(`[WalletPage] Sending burn ALL request`);
      try {
          const response = await fetch('/api/handcash/burn-my-nfts', { // Call the BURN ALL API
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletId: wallet?.id }),
          });
          const data = await response.json();

          if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to burn all NFTs via API.');
          }

          console.log('[WalletPage] Burn All successful:', data);
          setBurnAllSuccessMessage(data.message || `Burn attempt submitted for ${data.itemsTargeted} items.`);
          
          // Refresh wallet items
          fetchOwnedNfts(1, lastNumericItemsPerPage); // Reset to page 1
          fetchAllOwnedNfts(); // Refresh filter list
          handleCloseModal(); // Close detail modal if open

      } catch (err: any) {
          console.error('[WalletPage] Error burning all NFTs:', err);
          setBurnAllError(err.message || 'Failed to burn all NFTs.');
      } finally {
          setIsBurningAll(false);
          setIsBurnAllConfirmOpen(false); 
          // Clear global burn messages after a delay
          setTimeout(() => {
              setBurnAllSuccessMessage(null);
              setBurnAllError(null);
          }, 7000); // Longer timeout for batch result
      }
  }, [
      wallet?.id, 
      fetchOwnedNfts, 
      fetchAllOwnedNfts, 
      lastNumericItemsPerPage, 
      handleCloseModal 
  ]);

  // <<< Handle Burn All Confirmation >>>
  const handleBurnAllNFTs = useCallback(() => {
      if (!wallet?.id) {
          alert('Please connect your HandCash wallet first.'); // Simple alert for now
          return;
      }
      if (isBurningAll || burningItemId) return; // Don't open if another burn is happening

      // Check if there are actually any NFTs to burn before showing modal
      if (ownedNftItems.length === 0 && allNfts.length === 0) {
          alert("You don't have any NFTs in this collection to burn.");
          return;
      }
      
      setIsBurnAllConfirmOpen(true);
      setBurnAllError(null); // Clear previous errors
      setBurnAllSuccessMessage(null);

  }, [wallet?.id, isBurningAll, burningItemId, ownedNftItems, allNfts]);

  // <<< Melt Modal Handlers >>>
  const handleMeltNFT = useCallback((nft: NFTType) => {
    console.log(`[WalletPage] Initiating melt confirmation for NFT: ${getItemIdentifier(nft)}`);
    const itemIdentifier = getItemIdentifier(nft);
    const isListed = listedNFTs.some(li => li.identifier === itemIdentifier);
    if (isListed) {
      toast.error('Cannot melt a listed NFT.');
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Cannot melt a listed NFT.' }));
      setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return;
    }
    if (!wallet?.id) {
      toast.error('Authentication token missing. Please reconnect wallet.');
      setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Authentication token missing.' }));
       setTimeout(() => setItemActionError(prev => ({ ...prev, [itemIdentifier]: null })), 3000);
      return;
    }
    if (meltApiStatus === 'loading') return; // <<< Use meltApiStatus instead of isMeltingNFT

    setNftToMelt(nft); // <<< SETTING THE STATE HERE
    setIsMeltConfirmOpen(true);
    // Clear any previous action messages for this item
    setItemActionError(prev => ({ ...prev, [itemIdentifier]: null }));
    setItemActionSuccess(prev => ({ ...prev, [itemIdentifier]: null }));
  }, [wallet?.id, listedNFTs, meltApiStatus, ownedNftItems]);

  // <<< Add Handlers to Open Modals (near other handlers) >>>
  const handleOpenSendModal = useCallback((item: NFTType) => {
    console.log("[Wallet] Opening Send Modal for:", getItemIdentifier(item));
    setNftToManage(item);
    setIsSendModalOpen(true);
    setActionError(null); 
  }, []);

  const handleOpenListModal = useCallback((item: NFTType) => {
    console.log("[Wallet] Opening List Modal for:", getItemIdentifier(item));
    const identifier = getItemIdentifier(item);
    const isListed = listedNFTs.some(li => li.identifier === identifier);
    if (isListed) {
        toast.error('This NFT is already listed or awaiting listing confirmation.');
        return;
    }
    setNftToManage(item);
    setIsListModalOpen(true);
    setActionError(null); 
  }, [listedNFTs]); // Added listedNFTs dependency

  // Handler to open Burn Confirmation Modal
  const handleOpenBurnConfirm = useCallback((item: NFTType) => {
    const itemIdentifier = getItemIdentifier(item);
    console.log(`[WalletPage] Initiating burn confirmation for NFT: ${itemIdentifier}`);
    const isListed = listedNFTs.some(li => li.identifier === itemIdentifier);
    if (isListed) {
      toast.error('Cannot burn a listed NFT.');
      // Optionally set item-specific error: setItemActionError(prev => ({ ...prev, [itemIdentifier]: 'Cannot burn listed NFT.' }));
      return;
    }
    if (!wallet?.id) {
       toast.error('Authentication required to burn.');
      return;
    }
    if (burningItemId) return; // Prevent opening multiple burn confirms

    setItemToConfirmBurn(itemIdentifier); // Use existing state
    setIsBurnConfirmOpen(true); // Use existing state
    // Clear item-specific errors if needed
    // setItemActionError(prev => ({ ...prev, [itemIdentifier]: null }));
  }, [wallet?.id, listedNFTs, burningItemId]); // Added dependencies

  // <<< Add Handlers for Modal Confirmation (near other handlers) >>>
  const handleSendConfirm = useCallback(async (recipient: string) => {
    if (!nftToManage || !wallet?.id) {
        setActionError("Cannot send NFT: Missing data or auth.");
        return;
    }
    const nftId = getItemIdentifier(nftToManage);
    if (!recipient || !recipient.startsWith('$')) {
        setActionError("Invalid recipient handle (must start with $).");
        return;
    }

    console.log(`[Wallet Send Confirm] Attempting Send: ${nftId} to ${recipient}`);
    setIsProcessingAction(true);
    setActionError(null);
    try {
      const response = await fetch('/api/handcash/send-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ walletId: wallet?.id, nftId: nftId, recipientHandle: recipient }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to send NFT.');

      toast.success(`Sent ${nftToManage.name} to ${recipient}!`);
      setIsSendModalOpen(false);
      setNftToManage(null);
      // Refresh wallet list after a short delay
      setTimeout(() => {
          const currentLimit = isShowingAll ? 500 : (typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage);
          fetchOwnedNfts(isShowingAll ? 1 : currentPage, currentLimit);
          if (isGlobalSearch) fetchAllOwnedNfts();
      }, 1500);

    } catch (err: any) {
      console.error('[Wallet Send Confirm] Error:', err);
      setActionError(err.message || 'An unknown error occurred.');
      toast.error(`Send failed: ${err.message}`);
      // Keep modal open on error?
    } finally {
      setIsProcessingAction(false);
    }
  }, [nftToManage, wallet?.id, fetchOwnedNfts, fetchAllOwnedNfts, isShowingAll, itemsPerPage, lastNumericItemsPerPage, currentPage, isGlobalSearch]);

  const handleListConfirm = useCallback(async (price: number) => {
    if (!nftToManage || !wallet?.id || !listNFT) {
        setActionError("Cannot list NFT: Missing data, auth, or list function.");
        return;
    }
     if (isNaN(price) || price <= 0) {
        setActionError("Invalid list price.");
        return;
    }
    const itemIdentifier = getItemIdentifier(nftToManage);
    console.log(`[Wallet List Confirm] Attempting list: ${itemIdentifier} for ${price} BSV`);
    setIsProcessingAction(true);
    setActionError(null);
    
    // Prepare item data in the format expected by listNFT (ensure image and origin are included)
     const itemDataForListing = {
         ...nftToManage, // Spread existing data
         imageUrl: nftToManage.image, // Explicitly ensure imageUrl is set
         origin: nftToManage.qrData, // Explicitly ensure origin is set (from qrData)
     };

    try {
      await listNFT(itemDataForListing, price); // Use the passed listNFT function from context
      toast.success(`NFT Listed: ${nftToManage.name} for ${price} BSV!`);
      setIsListModalOpen(false);
      setNftToManage(null);
       // Refresh wallet list - listings state updates via context, but might want visual refresh if needed
      // setTimeout(() => {
      //     const currentLimit = isShowingAll ? 500 : (typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage);
      //     fetchOwnedNfts(isShowingAll ? 1 : currentPage, currentLimit);
      //     if (isGlobalSearch) fetchAllOwnedNfts();
      // }, 1500);
    } catch (err: any) {
       console.error("[Wallet List Confirm] Error calling listNFT:", err);
       const errorMessage = err.message || 'Failed to submit listing.';
       setActionError(errorMessage);
       toast.error(errorMessage);
       // Keep modal open on error?
    } finally {
       setIsProcessingAction(false);
    }
  }, [nftToManage, wallet?.id, listNFT, fetchOwnedNfts, fetchAllOwnedNfts, isShowingAll, itemsPerPage, lastNumericItemsPerPage, currentPage, isGlobalSearch]); // Added listNFT to dependencies


  // ================== HANDLE MELT CONFIRM (useCallback) ==================
  const handleMeltConfirm = useCallback(async () => {
    if (!nftToMelt || !wallet?.id) {
      toast.error("Melt failed: Required information is missing.");
      console.error("Melt check failed:", { nftToMelt, walletId: wallet?.id });
      return;
    }

    const originToMelt = getItemIdentifier(nftToMelt); // Use existing state
    console.log(`[WalletPage HandleMeltConfirm] Melting NFT Origin: ${originToMelt}`);

    setIsMeltConfirmOpen(false); // Close modal immediately
    setMeltApiStatus('loading');
    setMeltApiData(null);

    try {
      const response = await fetch('/api/handcash/melt-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nftId: originToMelt, // Use the identifier
            walletId: wallet?.id,
            nftData: nftToMelt // Send the full NFT data to ensure API has all it needs
        }),
      });

      // Check status before parsing
      if (!response.ok) {
          const errorText = await response.text(); 
          console.error(`[WalletPage HandleMeltConfirm] API Error: ${response.status}`, errorText);
          throw new Error(errorText || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      setMeltApiData(result); // Store result

      if (result.success) {
        setMeltApiStatus('success');
        toast.success(result.message || `Melt successful for ${nftToMelt.name}.`);
        
        // Extract and store elements locally
        if (result.elements && result.elements.length > 0) {
          // Map API elements to our ExtractedElement format
          const newElements: ExtractedElement[] = result.elements.map((element: any) => {
            // Get layer name, normalize for consistency
            const layerName = element.attributes?.layer || 'Unknown';
            const normalizedLayer = layerName.toUpperCase().replace(/[-\s]/g, '_');
            
            // Default card background path
            let cardLayoutUrl = `/element_cards/${layerName.toLowerCase().replace(/[_\s]/g, '-')}.jpg`;
            
            // Check for the layer in our configuration
            const layerDetail = LAYER_DETAILS[normalizedLayer];
            if (layerDetail && layerDetail.number) {
              // For special cases like BODY_SKIN which maps to 'body'
              let baseName = normalizedLayer === 'BODY_SKIN' 
                ? 'body' 
                : layerName.toLowerCase().replace(/[_\s]/g, '_');
              
              // Format the card path according to the actual files in the public/element_cards directory
              // Example: /element_cards/21_body.jpg
              cardLayoutUrl = `/element_cards/${layerDetail.number}_${baseName}.jpg`;
              
              console.log(`[WalletPage] Card layout for ${layerName}: ${cardLayoutUrl}`);
            } else {
              console.log(`[WalletPage] No layer detail found for ${layerName}, using default path: ${cardLayoutUrl}`);
            }
            
            return {
              id: element.id || element.origin || `element-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: element.name || `${layerName} Element`,
              imageUrl: element.imageUrl || '/placeholder-element.png',
              layer: normalizedLayer,
              rarity: element.attributes?.rarity || 'Common',
              elementType: element.attributes?.elementType || 'NPG',
              originNftQrData: originToMelt,
              cardLayoutUrl: cardLayoutUrl
            };
          });
          
          // Log if we're getting mock elements
          if (result.mockElements) {
            console.log(`[WalletPage] Using mock elements returned from API:`, newElements);
            toast.success("Development mode: Using mock element cards");
          }
          
          // Add the new elements to our elementCards state
          setElementCards((prevElements) => [...prevElements, ...newElements]);
          console.log(`[WalletPage] Added ${newElements.length} elements to collection:`, newElements);
        } else {
          console.log(`[WalletPage] No elements were extracted from NFT.`);
        }
        
        // Refresh NFT lists since we've burned one
        const currentLimit = isShowingAll ? 500 : (typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage);
        fetchOwnedNfts(isShowingAll ? 1 : currentPage, currentLimit);
        if (isGlobalSearch) {
          fetchAllOwnedNfts();
        }
        
        // Navigate to elements tab to show the user their new elements
        console.log("[WalletPage] Navigating to elements tab after melt...");
        setActiveTab('elements'); // Change tab
      } else {
        setMeltApiStatus('error');
        const errorMsg = result.error || result.message || 'Melt failed.';
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('[WalletPage HandleMeltConfirm] Melt error:', error);
      setMeltApiStatus('error');
      const errorMsg = (error instanceof SyntaxError)
          ? "Failed to process server response."
          : error.message || 'Melt error: Unknown error';
      toast.error(errorMsg);
    } finally {
      setNftToMelt(null); // Clear the NFT being managed
    }
  }, [
    nftToMelt,
    wallet?.id,
    fetchOwnedNfts,
    fetchAllOwnedNfts,
    isShowingAll,
    itemsPerPage,
    lastNumericItemsPerPage,
    currentPage,
    isGlobalSearch,
    setActiveTab,
    setElementCards
  ]);

  // Paginated Items
  const paginatedItems = useMemo(() => {
    console.log(`[WalletPage FILTER DEBUG] Calculating paginatedItems. isShowingAll: ${isShowingAll}`);
    if (isShowingAll) {
      console.log(`[WalletPage FILTER DEBUG] Showing all ${filteredAndSortedItems.length} items.`);
      return filteredAndSortedItems;
    } else {
      // If not showing all, pagination logic might not be needed if fetchOwnedNfts fetches exactly the page needed
      // However, if we fetched a larger chunk initially (e.g., 100) and paginate locally, this is needed.
      // Based on current fetchOwnedNfts, it seems we fetch page by page, so filteredAndSortedItems should already be the correct page.
      console.log(`[WalletPage FILTER DEBUG] Returning ${filteredAndSortedItems.length} items directly (expecting current page).`);
      return filteredAndSortedItems;
      /* // Previous local pagination logic (keep commented for reference)
      const numericItemsPerPage = typeof itemsPerPage === 'number' ? itemsPerPage : lastNumericItemsPerPage;
      const startIndex = (currentPage - 1) * numericItemsPerPage;
      const endIndex = startIndex + numericItemsPerPage;
      const items = filteredAndSortedItems.slice(startIndex, endIndex);
      console.log(`[WalletPage FILTER DEBUG] Sliced items: ${items.length} (Start: ${startIndex}, End: ${endIndex})`);
      return items;
      */
    }
  }, [filteredAndSortedItems, currentPage, itemsPerPage, isShowingAll, lastNumericItemsPerPage]);

  // ================== END HOOKS & CALCULATED VALUES ==================

  // <<< ENSURE Connection/Loading Checks are HERE - AFTER ALL HOOKS >>>
  if (isHandCashLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <p className="text-lg text-gray-400 animate-pulse">Loading wallet connection...</p>
      </div>
    );
  }
  if (!isConnected || !wallet?.id) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-pink-500 mb-4">Connect Wallet</h1>
        <p className="text-gray-400 mb-6">Please connect your HandCash wallet to view your collection.</p>
        <Link href="/login?redirect=/wallet" className="px-6 py-2 rounded bg-pink-600 hover:bg-pink-700 text-white font-semibold transition-colors">
          Connect HandCash
        </Link>
      </div>
    );
  }
  // <<< END MOVED Checks >>>

  // <<< Make sure this is the start of the main return for WalletPageContent >>>
  return (  // <<< Make sure this is the start of the main return for WalletPageContent >>>

    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">My Wallet & Collection (Stub)</h1>

        {/* <<< START BALANCE CARD >>> */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-pink-400 mb-4">Balances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            {/* BSV Balance */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">BSV Balance</h3>
              {isLoadingBalance ? (
                <p className="text-lg animate-pulse">Loading...</p>
              ) : walletBalance ? (
                <p className="text-lg font-semibold">{walletBalance.balance} <span className="text-xs">{walletBalance.currencyCode}</span></p>
                // Optionally display fiat value if available: 
                // {walletBalance.fiatBalance && <p className="text-sm text-gray-500">~ {walletBalance.fiatBalance} {walletBalance.fiatCurrencyCode}</p>}
              ) : (
                <p className="text-lg text-gray-500">N/A</p>
              )}
            </div>
            {/* NPG Token Balance */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">$NPG Token Balance</h3>
              {isTokenBalanceLoading ? (
                <p className="text-lg animate-pulse">Loading...</p>
              ) : typeof tokenBalance === 'number' ? (
                <p className="text-lg font-semibold">{tokenBalance.toLocaleString()}</p>
              ) : (
                <p className="text-lg text-gray-500">N/A</p>
              )}
              {/* Reminder for placeholder */}
              {!isTokenBalanceLoading && typeof tokenBalance !== 'number' && <p className="text-xs text-yellow-500">(Placeholder - Fetch logic needed)</p>}
            </div>
          </div>
          
          {/* $NPG Wallet */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium text-pink-400">$NPG Wallet</h3>
              <div className="flex space-x-2">
                {!npgStackPublicKey ? (
                  <button 
                    onClick={handleCreateNpgStackWallet}
                    disabled={isCreatingStackWallet}
                    className="px-3 py-1 text-xs bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {isCreatingStackWallet ? 'Creating...' : 'Create $NPG Wallet'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsStackWalletModalOpen(true)}
                      className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      View Keys
                    </button>
                    <button
                      onClick={handleDownloadKeyFile}
                      className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      Backup Wallet
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {stackWalletError && (
              <p className="text-sm text-red-500 mb-2">{stackWalletError}</p>
            )}
            
            {npgStackPublicKey && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                  <div className="mb-2 sm:mb-0">
                    <span className="text-xs text-gray-400 block sm:inline">Public Key:</span>
                    <span className="text-sm font-mono overflow-hidden text-ellipsis">{npgStackPublicKey.substring(0, 12)}...{npgStackPublicKey.substring(npgStackPublicKey.length - 8)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block sm:inline mr-2">Holdings:</span>
                    <div>
                      <span className="text-sm font-bold text-green-400 mr-1">{tokenBalance ? tokenBalance.toLocaleString() : '0'} $NPG</span>
                      <span className="text-xs text-gray-400">(Primary)</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">This wallet holds your $NPG tokens and can receive additional token airdrops. Backup this wallet to secure your assets.</p>
              </div>
            )}
            
            {!npgStackPublicKey && (
              <p className="text-xs text-gray-400">Create an $NPG wallet to hold your tokens and receive airdrops. You can create a new wallet or import an existing one.</p>
            )}

            {npgStackPublicKey && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => alert('Import wallet functionality coming soon')}
                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  Import Wallet
                </button>
                <button
                  onClick={() => alert('New wallet functionality coming soon')}
                  className="px-3 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                >
                  Create New
                </button>
              </div>
            )}
          </div>

          {/* Element Stacks Section */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium text-pink-400">Element Stacks</h3>
              <button 
                onClick={() => alert('Create new stack functionality coming soon')}
                className="px-3 py-1 text-xs bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors"
              >
                Create New Stack
              </button>
            </div>
            
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4">
                {/* Sample Element Stack Cards - These would be generated dynamically */}
                <div className="min-w-[160px] bg-gray-700 rounded-lg shadow-md p-3 flex flex-col">
                  <h4 className="text-sm font-semibold text-white mb-2">My First Stack</h4>
                  <div className="relative h-24 mb-2 bg-gray-800 rounded flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl text-pink-400 opacity-50">+</span>
                    </div>
                    <span className="text-xs text-gray-400">No elements yet</span>
                  </div>
                  <p className="text-xs text-gray-400">Create your first element stack</p>
                </div>

                <div className="min-w-[160px] bg-gray-700 rounded-lg shadow-md p-3 flex flex-col">
                  <h4 className="text-sm font-semibold text-white mb-2">Example Stack</h4>
                  <div className="relative h-24 mb-2 bg-gray-800 rounded overflow-hidden">
                    {/* This would show a visual representation of stacked elements */}
                    <div className="absolute inset-0 opacity-60 bg-gradient-to-b from-pink-500/30 to-purple-700/30"></div>
                    <div className="absolute inset-x-0 bottom-0 h-5 bg-gray-900/70 flex items-center justify-center">
                      <span className="text-xs text-white">3 Elements</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Click to view or edit this stack</p>
                </div>
                
                <div className="min-w-[160px] bg-gray-700 rounded-lg shadow-md p-3 flex flex-col">
                  <h4 className="text-sm font-semibold text-white mb-2">+ New Stack</h4>
                  <div className="h-24 mb-2 border-2 border-dashed border-gray-600 rounded flex items-center justify-center">
                    <span className="text-2xl text-gray-500">+</span>
                  </div>
                  <p className="text-xs text-gray-400">Create a new element stack</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-3">Element stacks are collections of 1sat ordinals that can be combined to create composite NFTs.</p>
          </div>
        </div>
        {/* <<< END BALANCE CARD >>> */}

        {/* Wallet Tabs Navigation */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('nfts')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'nfts' ? 'bg-gray-800 text-pink-400 border-b-2 border-pink-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              NFTs
            </button>
            <button 
              onClick={() => setActiveTab('elements')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'elements' ? 'bg-gray-800 text-pink-400 border-b-2 border-pink-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Elements
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'wallet' ? 'bg-gray-800 text-pink-400 border-b-2 border-pink-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              Wallet
            </button>
          </div>
        </div>

        {/* NFTs Tab Content */}
        {activeTab === 'nfts' && (
          <>
            {/* <<< START FILTER BAR >>> */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Name Filter */}
                <div>
                  <label htmlFor="nameFilterInput" className="block text-sm font-medium text-gray-300 mb-1">Filter by Name:</label>
                  <input
                    type="text"
                    id="nameFilterInput"
                    placeholder="Enter name..."
                    value={nameFilter}
                    onChange={handleNameFilterChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                  />
                </div>
                {/* Number Filter */}
                <div>
                  <label htmlFor="numberFilterInput" className="block text-sm font-medium text-gray-300 mb-1">Filter by #:</label>
                  <input
                    type="number"
                    id="numberFilterInput"
                    placeholder="Enter number..."
                    value={numberFilter}
                    onChange={handleNumberFilterChange}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" // Hide number arrows
                  />
                </div>
                 {/* Type Filters */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Type:</label>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'npg', 'erobot', 'mix'] as const).map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => handleFilterChange(filterType)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeFilter === filterType ? 'bg-pink-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                      >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Status Filters + Clear */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Filter by Status:</label>
                   <div className="flex flex-wrap gap-2 items-center">
                      {(['listed', 'unlisted'] as const).map((filterType) => (
                         <button
                            key={filterType}
                            onClick={() => handleFilterChange(filterType)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeFilter === filterType ? 'bg-teal-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                         >
                            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                         </button>
                      ))}
                       <button
                         onClick={handleClearFilters}
                         className="ml-auto px-3 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                         disabled={!nameFilter && !numberFilter && activeFilter === 'all'}
                         title="Clear all filters"
                       >
                         Clear Filters
                       </button>
                   </div>
                </div>
              </div>
              {/* <<< Add Burn All Button Below Filter Grid >>> */}
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                 <button
                    onClick={handleBurnAllNFTs}
                    className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                    disabled={isBurningAll || !!burningItemId || filteredAndSortedItems.length === 0}
                    title={filteredAndSortedItems.length === 0 ? "No NFTs to burn" : (isBurningAll || !!burningItemId ? "Burn operation in progress" : "Burn ALL currently filtered NFTs")}
                 >
                    Burn All Filtered NFTs ({filteredAndSortedItems.length})
                 </button>
              </div>
              {isGlobalSearch && (
                <p className="text-xs text-yellow-400 mt-3 text-center">Filters applied globally (showing all owned NFTs matching criteria).</p>
              )}
            </div>
            {/* <<< END FILTER BAR >>> */}

            {/* Basic Loading State */}
            {(isLoadingOwnedNfts || (isGlobalSearch && isLoadingAllNfts)) && ( // <<< Updated Loading Check
              <p className="text-center text-gray-400 py-8">Loading your NFTs...</p>
            )}

            {/* Basic NFT Grid */}
            {!(isLoadingOwnedNfts || (isGlobalSearch && isLoadingAllNfts)) && filteredAndSortedItems.length > 0 && ( // <<< Use filteredAndSortedItems and updated loading check
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
                {filteredAndSortedItems.map((item: NFTType) => { // <<< Use filteredAndSortedItems
                  const itemIdentifier = getItemIdentifier(item); // <<< Explicitly define itemIdentifier here
                  return (
                    <div key={`wallet-item-${itemIdentifier}`} className={`relative group bg-gray-800 rounded-lg shadow-lg flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:scale-105 hover:z-10`}
                      // Removed onClick from main card div to allow button clicks
                    >
                      {/* Loading Overlay */}
                      {isLoadingDetails && modalNftIdentifier === itemIdentifier && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <CircularProgress size={24} color="inherit" />
                        </div>
                      )}
                      {/* Simple Header */}
                      <div className="w-full p-2 bg-gray-700/90 flex justify-between items-center text-left transition-colors border-b border-gray-600/50 text-xs">
                          <span className="font-semibold text-pink-400 truncate flex-grow mr-2" title={`${item.name} #${item.number} (${getNftType(item)})`}>
                            {item.name} #{item.number}
                          </span>
                           <span className="text-teal-400 font-medium px-1.5 py-0.5 rounded bg-teal-800/50 text-[10px]">
                              {getNftType(item).toUpperCase()}
                           </span>
                      </div>
                      {/* Image */}
                      <div
                          className={`aspect-[961/1441] w-full relative cursor-pointer`}
                          title="Click image to view details"
                          onClick={() => !isLoadingDetails && handleOpenModal(itemIdentifier)} // <<< Use itemIdentifier
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '/placeholder.png')}/>
                      </div>
                       {/* <<< ACTION BUTTONS CONTAINER >>> */}
                       <div className="p-2 grid grid-cols-2 gap-2"> 
                           <button 
                               onClick={(e) => { e.stopPropagation(); handleOpenSendModal(item); }}
                               className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-2 rounded shadow transition-colors disabled:opacity-50"
                               disabled={isProcessingAction}
                           >
                               Send
                           </button>
                           <button 
                               onClick={(e) => { e.stopPropagation(); handleOpenListModal(item); }}
                               className={`text-xs font-semibold py-1 px-2 rounded shadow transition-colors disabled:opacity-50 ${ listedIdentifiers.has(itemIdentifier) ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white' }`}
                               disabled={isProcessingAction || listedIdentifiers.has(itemIdentifier)}
                               title={listedIdentifiers.has(itemIdentifier) ? 'Already Listed' : 'Sell NFT'}
                           >
                               {listedIdentifiers.has(itemIdentifier) ? 'Listed' : 'Sell'}
                           </button>
                           <button 
                               onClick={(e) => { e.stopPropagation(); handleMeltNFT(item); }}
                               className={`text-xs font-semibold py-1 px-2 rounded shadow transition-colors disabled:opacity-50 ${ listedIdentifiers.has(itemIdentifier) ? 'bg-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white' }`}
                               disabled={isProcessingAction || listedIdentifiers.has(itemIdentifier) || meltApiStatus === 'loading'}
                               title={listedIdentifiers.has(itemIdentifier) ? 'Cannot melt listed NFT' : 'Melt NFT'}
                           >
                               Melt
                           </button>
                           <button 
                               onClick={(e) => { e.stopPropagation(); handleOpenBurnConfirm(item); }}
                               className={`text-xs font-semibold py-1 px-2 rounded shadow transition-colors disabled:opacity-50 ${ listedIdentifiers.has(itemIdentifier) ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white' }`}
                               disabled={isProcessingAction || listedIdentifiers.has(itemIdentifier) || !!burningItemId}
                                title={listedIdentifiers.has(itemIdentifier) ? 'Cannot burn listed NFT' : 'Burn NFT'}
                           >
                               Burn
                           </button>
                       </div>
                       {/* <<< END ACTION BUTTONS CONTAINER >>> */}

                       {/* Footer Area */}
                       <div className="p-1 bg-gray-700/50 border-t border-gray-600/50 text-center">
                         <span className="text-xs text-gray-400">ID: {itemIdentifier.substring(0, 10)}...</span>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!(isLoadingOwnedNfts || (isGlobalSearch && isLoadingAllNfts)) && filteredAndSortedItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No NFTs found matching your criteria</p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                  disabled={!nameFilter && !numberFilter && activeFilter === 'all'}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Items Per Page Selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-400">Show:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="p-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">All</option>
                </select>
              </div>
              
              {/* Previous/Next Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage <= 1 || isLoadingOwnedNfts || isShowingAll}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                {!isShowingAll && <span className="text-gray-400 text-sm">Page {currentPage}</span>}
                {isShowingAll && <span className="text-gray-400 text-sm">Showing All</span>}
                <button
                  onClick={handleNextPage}
                  disabled={!canLoadMore || isLoadingOwnedNfts || isShowingAll}
                  className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Elements Tab Content */}
        {activeTab === 'elements' && (
          <div className="p-4 bg-gray-800 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-pink-400">My Elements</h2>
              <button
                onClick={() => alert('Create new element stack functionality coming soon')}
                className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded transition-colors"
              >
                Create New Stack
              </button>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Element Stacks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {elementStacks.map((stack) => (
                  <div 
                    key={stack.id}
                    className={`bg-gray-700 p-4 rounded-lg border-2 ${
                      draggingOverStack === stack.id 
                        ? 'border-pink-500 border-dashed' 
                        : 'border-transparent'
                    } transition-colors`}
                    onDragOver={(e) => handleDragOver(stack.id, e)}
                    onDrop={(e) => handleDrop(stack.id, e)}
                    onDragLeave={() => setDraggingOverStack(null)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">{stack.name}</h4>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                        {getElementsInStack(stack.id).length} elements
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {getElementsInStack(stack.id).slice(0, 4).map((elementId: string) => {
                        const element = elementCards.find(e => e.id === elementId);
                        if (!element) return null;
                        
                        // Determine background image path
                        let cardBackground;
                        const normalizedLayer = element.layer.toUpperCase();
                        const layerDetail = LAYER_DETAILS[normalizedLayer];
                        
                        if (element.cardLayoutUrl) {
                          cardBackground = element.cardLayoutUrl;
                        } else if (layerDetail && layerDetail.number) {
                          let baseName = normalizedLayer === 'BODY_SKIN' 
                            ? 'body' 
                            : element.layer.toLowerCase().replace(/[_\s]/g, '_');
                          cardBackground = `/element_cards/${layerDetail.number}_${baseName}.jpg`;
                        } else {
                          cardBackground = `/element_cards/${element.layer.toLowerCase().replace(/[_\s]/g, '-')}.jpg`;
                        }
                        
                        return (
                          <div key={`stack-element-${elementId}`} className="aspect-[3/4] relative overflow-hidden border-2 border-yellow-400 border-dashed bg-gradient-to-br from-gray-800 to-gray-900">
                            {/* Background image */}
                            <img 
                              src={cardBackground}
                              alt={`${element.layer} background`}
                              className="absolute inset-0 w-full h-full object-cover z-0"
                              onError={(e) => (e.currentTarget.src = '/placeholder-element-card.png')}
                            />
                            
                            {/* Card header (layer name) */}
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-600 to-purple-600 z-10">
                              <h3 className="text-white text-[10px] font-bold text-center tracking-wider truncate">
                                {element.layer.replace(/_/g, ' ')}
                              </h3>
                            </div>
                            
                            {/* Element image */}
                            <div className="w-full h-full flex items-center justify-center pt-6 pb-6 relative z-5">
                              <img 
                                src={element.imageUrl} 
                                alt={element.name} 
                                className="max-w-[70%] max-h-[70%] object-contain drop-shadow-lg"
                                onError={(e) => (e.currentTarget.src = '/placeholder-element.png')}
                              />
                            </div>
                            
                            {/* Element name */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-0.5 z-10">
                              <p className="text-[8px] font-medium text-white truncate text-center">{element.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-3">
                      <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors">
                        View
                      </button>
                      <button className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Create New Stack Card */}
                <div className="bg-gray-700 p-4 rounded-lg border-2 border-gray-600 border-dashed flex flex-col justify-center items-center h-full min-h-[200px]">
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mb-3">
                    <span className="text-2xl text-white">+</span>
                  </div>
                  <p className="text-gray-400 text-center">Create New Stack</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Available Elements</h3>
              <p className="text-sm text-gray-400 mb-2">Drag elements to add them to stacks</p>
              
              {elementCards.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {elementCards.map((element) => {
                    // Create an attribute object that CompositedElementCard can use
                    const elementAttribute: NFTAttribute = {
                      layer: element.layer,
                      fullFilename: element.imageUrl.split('/').pop() || '',
                      elementNameForAssetField: element.name,
                      imageUrl: element.imageUrl,
                      metadata: {
                        rarity: element.rarity,
                        elementName: element.name,
                        genes: element.elementType.toLowerCase() // Use genes field for elementType
                      },
                      // Add required stats property with default values
                      stats: {
                        strength: 0,
                        speed: 0,
                        skill: 0,
                        stamina: 0,
                        stealth: 0,
                        style: 0
                      }
                    };
                    
                    // For demonstration, create a background map with this element's layer
                    const backgroundMap: Record<string, string> = {};
                    
                    // Try to find the right card background using layer config
                    const normalizedLayer = element.layer.toUpperCase();
                    const layerDetail = LAYER_DETAILS[normalizedLayer];
                    
                    // First check if the element already has a cardLayoutUrl
                    if (element.cardLayoutUrl) {
                      backgroundMap[element.layer.toLowerCase()] = element.cardLayoutUrl;
                    } 
                    // Otherwise try to determine it from layer config
                    else if (layerDetail && layerDetail.number) {
                      // For special cases like BODY_SKIN which maps to 'body'
                      let baseName = normalizedLayer === 'BODY_SKIN' 
                        ? 'body' 
                        : element.layer.toLowerCase().replace(/[_\s]/g, '_');
                      
                      // Format the path according to actual files in element_cards directory
                      const formattedCardPath = `/element_cards/${layerDetail.number}_${baseName}.jpg`;
                      backgroundMap[element.layer.toLowerCase()] = formattedCardPath;
                    } 
                    // Final fallback to generic path construction
                    else {
                      const fallbackPath = `/element_cards/${element.layer.toLowerCase().replace(/[_\s]/g, '-')}.jpg`;
                      backgroundMap[element.layer.toLowerCase()] = fallbackPath;
                    }
                    
                    return (
                      <div 
                        key={element.id}
                        draggable
                        onDragStart={() => handleDragStart(element.id)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <div className="relative rounded-lg overflow-hidden transition-transform hover:-translate-y-1">
                          {/* Apply "In Stack" indicator if the element is in any stack */}
                          {elementStacks.some(stack => stack.elements.includes(element.id)) && (
                            <div className="absolute top-0 right-0 z-20 bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-bl">
                              In Stack
                            </div>
                          )}
                          
                          {/* Use element library style card instead of CompositedElementCard */}
                          <div className="relative aspect-[3/4] overflow-hidden border-4 border-yellow-400 border-dashed p-1 bg-gradient-to-br from-gray-800 to-gray-900">
                            {/* Card background image */}
                            <img 
                              src={backgroundMap[element.layer.toLowerCase()] || '/placeholder-element-card.png'}
                              alt={`${element.layer} card background`}
                              className="absolute inset-0 w-full h-full object-cover z-0"
                              onError={(e) => (e.currentTarget.src = '/placeholder-element-card.png')}
                            />
                            
                            {/* Card header (layer name) */}
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-600 to-purple-600 p-1 z-10">
                              <h3 className="text-white text-sm font-bold text-center tracking-wider drop-shadow-lg">
                                {element.layer.replace(/_/g, ' ')}
                              </h3>
                            </div>
                            
                            {/* Element image */}
                            <div className="w-full h-full flex items-center justify-center pt-8 pb-12 relative z-5">
                              <img 
                                src={element.imageUrl} 
                                alt={element.name}
                                className="max-w-[80%] max-h-[80%] object-contain drop-shadow-lg"
                                onError={(e) => (e.currentTarget.src = '/placeholder-element.png')}
                              />
                            </div>
                            
                            {/* Stats bar at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 flex flex-wrap justify-center gap-1 z-10">
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">STR</span> <span>0</span>
                              </div>
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">SPD</span> <span>0</span>
                              </div>
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">SKL</span> <span>0</span>
                              </div>
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">STM</span> <span>0</span>
                              </div>
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">STL</span> <span>0</span>
                              </div>
                              <div className="flex items-center bg-gray-800 rounded px-1 text-[8px] text-white">
                                <span className="font-bold mr-0.5">STY</span> <span>0</span>
                              </div>
                            </div>
                            
                            {/* Rarity indicator */}
                            <div className="absolute top-8 right-0 bg-gradient-to-l from-pink-600 to-pink-500 text-white text-[9px] px-1 py-0.5 rounded-l-sm">
                              {element.rarity}
                            </div>
                          </div>
                          
                          {/* Element name */}
                          <div className="bg-gray-800 p-1 text-center">
                            <p className="text-xs font-medium text-white truncate">{element.name}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Melt More Card */}
                  <div 
                    onClick={() => setActiveTab('nfts')}
                    className="aspect-[3/4] relative overflow-hidden border-4 border-pink-500 border-dashed cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-gradient-to-br from-gray-800 to-gray-700"
                  >
                    {/* Card header */}
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-600 to-purple-600 p-1 z-10">
                      <h3 className="text-white text-sm font-bold text-center tracking-wider drop-shadow-lg">
                        MELT NFTs
                      </h3>
                    </div>
                    
                    {/* Center content */}
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <LocalFireDepartmentIcon className="text-white text-3xl"/>
                      </div>
                      <p className="text-sm text-white text-center px-3 font-medium">
                        Melt NFTs to get more elements
                      </p>
                    </div>
                    
                    {/* Action indicator */}
                    <div className="absolute bottom-0 left-0 right-0 bg-pink-600/80 p-1 text-center">
                      <p className="text-xs font-bold text-white">CLICK TO CONVERT</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-700 p-6 rounded-lg text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-600 flex items-center justify-center mb-4">
                    <LocalFireDepartmentIcon className="text-pink-500" style={{ fontSize: '28px' }} />
                  </div>
                  <h4 className="text-white font-medium mb-2">No Elements Found</h4>
                  <p className="text-gray-400 mb-4">Melt NFTs to extract their elements for stacking.</p>
                  <button 
                    onClick={() => setActiveTab('nfts')}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors"
                  >
                    Go to NFTs
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Details Tab Content */}
        {activeTab === 'wallet' && (
          <div className="p-4 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-pink-400 mb-4">Wallet Management</h2>
            
            {/* Wallet Address & Balance */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-white mb-3">My Wallets</h3>
              
              {npgStackPublicKey ? (
                <div className="border border-gray-600 rounded p-3 mb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h4 className="text-pink-400 font-medium mb-1">Primary $NPG Wallet</h4>
                      <p className="text-gray-300 text-sm mb-1">Public Key: <span className="font-mono">{npgStackPublicKey.substring(0, 10)}...{npgStackPublicKey.substring(npgStackPublicKey.length - 10)}</span></p>
                      <p className="text-gray-400 text-xs">Created from HandCash signature</p>
                    </div>
                    <div className="mt-3 md:mt-0 flex space-x-2">
                      <button 
                        onClick={() => setIsStackWalletModalOpen(true)}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={handleDownloadKeyFile}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        Download Backup
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-800 rounded-lg mb-4">
                  <p className="text-gray-400 mb-3">No active wallets found</p>
                  <button 
                    onClick={handleCreateNpgStackWallet}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors"
                  >
                    Create $NPG Wallet
                  </button>
                </div>
              )}
              
              {/* Import/Create Wallet Options */}
              <div className="border-t border-gray-600 pt-4 mt-4">
                <h4 className="font-medium text-white mb-3">Wallet Options</h4>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => alert('Import wallet functionality coming soon')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                  >
                    Import Wallet
                  </button>
                  <button 
                    onClick={() => alert('Backup functionality coming soon')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  >
                    Backup All Wallets
                  </button>
                  <button 
                    onClick={() => alert('Advanced options coming soon')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    Advanced Options
                  </button>
                </div>
              </div>
            </div>
            
            {/* Security Settings */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-3">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="text-gray-300">Require Password for Transactions</h4>
                    <p className="text-gray-400 text-xs">Add an additional security layer to all wallet transactions</p>
                  </div>
                  <div>
                    <button 
                      onClick={() => alert('Security settings coming soon')}
                      className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                      Enable
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="text-gray-300">Activity Log</h4>
                    <p className="text-gray-400 text-xs">View your recent wallet activity</p>
                  </div>
                  <div>
                    <button 
                      onClick={() => alert('Activity log coming soon')}
                      className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    >
                      View Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div> {/* Closes max-w-7xl */}

      {/* NFT Detail Modal - Render based on nftForModal state */}
      {nftForModal && (
        <NFTDetailModal 
          nft={nftForModal} 
          onClose={handleCloseModal} 
          // Pass identifier
          itemIdentifier={modalNftIdentifier}
          // --- Pass the actual handlers --- 
          isListed={!!modalNftIdentifier && listedIdentifiers.has(modalNftIdentifier)} 
          listPrice={listingPrices[modalNftIdentifier || ''] || ''} 
          recipientHandle={sendRecipientHandles[modalNftIdentifier || ''] || ''}
          isSending={!!modalNftIdentifier && isSendingNFT[modalNftIdentifier || '']} 
          isMelting={meltApiStatus === 'loading' && nftToMelt?.qrData === modalNftIdentifier} // Check status and matching NFT
          isBurning={!!burningItemId && burningItemId === modalNftIdentifier} // Check burning state and matching ID
          actionError={modalNftIdentifier ? itemActionError[modalNftIdentifier] : null} 
          actionSuccess={modalNftIdentifier ? itemActionSuccess[modalNftIdentifier] : null}
          onListNFT={() => { if (modalNftIdentifier) handleListNFT(modalNftIdentifier); }}
          onDelistNFT={() => { // <<< CORRECTED Handler
            if (modalNftIdentifier) { 
                handleDelistNFT(modalNftIdentifier);
                // Optionally close the modal after initiating delist
                // handleCloseModal(); 
            } else {
                toast.error("Cannot delist: NFT identifier missing.");
            }
          }}
          onSendNFT={() => { if (modalNftIdentifier) handleSendNFT(modalNftIdentifier); }}
          onOpenMeltConfirm={() => { if (nftForModal) openMeltConfirmWallet(nftForModal.qrData); }} // Assuming handleMeltNFT/openMeltConfirmWallet takes the identifier or item
          onBurnNFT={() => { if (modalNftIdentifier) handleOpenBurnConfirm(nftForModal!); }} // Pass the full item to the open handler
          onPriceChange={(price) => { if (modalNftIdentifier) handlePriceChange(modalNftIdentifier, price); }}
          onRecipientChange={(handle) => { if (modalNftIdentifier) handleRecipientChange(modalNftIdentifier, handle); }}
          // --- End actual handlers ---
        />
      )}

      {/* Footer correctly placed AFTER the main content div */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Ninja Punk Girls. All rights reserved.</p>
      </footer>

      {/* <<< Add Send Modal >>> */}
      {isSendModalOpen && nftToManage && (
        <SendNftModal
          isOpen={isSendModalOpen}
          onClose={() => { setIsSendModalOpen(false); setNftToManage(null); setActionError(null); }}
          // Pass required props - check SendNftModal definition for exact names
          nftName={nftToManage.name}
          // Remove wallet?.id prop as it's not defined in SendNftModalProps
          // wallet?.id={wallet?.id}
          onConfirm={handleSendConfirm} // Pass the confirmation handler
          // Pass loading/error states
          isLoading={isProcessingAction}
          error={actionError}
          // Add other props as required by SendNftModal (like friendsList)
          // friendsList={friendsList}
          // isLoadingFriends={isLoadingFriends}
        />
      )}

      {/* <<< Add List Modal >>> */}
      {isListModalOpen && nftToManage && listNFT && (
        <ListNftModal
          isOpen={isListModalOpen}
          onClose={() => { setIsListModalOpen(false); setNftToManage(null); setActionError(null); }}
          // Pass required props - check ListNftModal definition
          nftName={nftToManage.name}
          // Remove nftImageUrl as it's not in ListNftModalProps
          // nftImageUrl={nftToManage.imageUrl} 
          // Remove wallet?.id as it's not in ListNftModalProps
          // wallet?.id={wallet?.id}
          // Rename listNFTFunction to onConfirm and provide wrapper
          onConfirm={(price) => listNFT(nftToManage, price)}
          // Remove props that might have been added erroneously
          // listNFTFunction={listNFT} 
          // onConfirm={handleListConfirm} 
          isLoading={isProcessingAction} // Pass loading state
          error={actionError} // Pass error state
        />
      )}

      {/* Melt Confirmation Modal */}
      {isMeltConfirmOpen && nftToMelt && (
        <ConfirmationModal
          isOpen={isMeltConfirmOpen}
          title={`Confirm Melt: ${nftToMelt.name}`}
          message={`Are you sure you want to melt this NFT? This action cannot be undone. Its elements will be extracted.`}
          confirmText="Melt NFT"
          cancelText="Cancel"
          onConfirm={handleMeltConfirm}
          onClose={() => setIsMeltConfirmOpen(false)}
          // confirmButtonClass="bg-orange-600 hover:bg-orange-700" // Removed invalid prop
        />
      )}

      {/* Burn Confirmation Modal (Single Item) */}
      {isBurnConfirmOpen && itemToConfirmBurn && (
        <ConfirmationModal
          isOpen={isBurnConfirmOpen}
          title={`Confirm Burn: ${ownedNftItems.find(nft => getItemIdentifier(nft) === itemToConfirmBurn)?.name || 'NFT'}`}
          message={`Are you sure you want to permanently burn this NFT? This action cannot be undone.`}
          confirmText="Burn NFT"
          cancelText="Cancel"
          onConfirm={executeBurn} // <<< FIXED: Call executeBurn directly
          onClose={() => { setIsBurnConfirmOpen(false); setItemToConfirmBurn(null); }}
          // confirmButtonClass removed
        />
      )}

      {/* Burn All Confirmation Modal */}
      {isBurnAllConfirmOpen && (
          <ConfirmationModal
              isOpen={isBurnAllConfirmOpen}
              title="Confirm Burn All NFTs"
              message={`Are you sure you want to permanently burn ALL ${filteredAndSortedItems.length} NFTs currently displayed? This action CANNOT BE UNDONE and will destroy all selected items.`}
              confirmText="Yes, Burn All NFTs"
              confirmButtonStyle="destructive"
              onConfirm={executeBurnAll} // <<< FIXED: Added onConfirm with correct handler
              onClose={() => setIsBurnAllConfirmOpen(false)} // <<< FIXED: Added onClose handler
              isLoading={isBurningAll} 
          />
      )}

      {/* Stack Wallet Modal */}
      {isStackWalletModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 w-full max-w-md p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-pink-500">NPG Stack Wallet</h2>
              <button onClick={() => setIsStackWalletModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Public Key Section */}
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Public Key</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(npgStackPublicKey || '')}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-950 p-2 rounded overflow-x-auto">
                  <code className="text-xs text-green-400 font-mono break-all">{npgStackPublicKey}</code>
                </div>
              </div>
              
              {/* Private Key Section */}
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Private Key (WIF)</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleCopyPrivateKey}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
                    >
                      Copy
                    </button>
                    <button 
                      onClick={() => setShowPrivateKeyQR(!showPrivateKeyQR)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
                    >
                      {showPrivateKeyQR ? 'Hide QR' : 'Show QR'}
                    </button>
                  </div>
                </div>
                
                {showPrivateKeyQR ? (
                  <div className="flex justify-center bg-white p-3 rounded">
                    <QRCodeSVG 
                      value={npgStackPrivateKeyWIF || 'error'} 
                      size={160} 
                      level="M"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-950 p-2 rounded overflow-x-auto">
                    <code className="text-xs text-pink-400 font-mono break-all">{npgStackPrivateKeyWIF}</code>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-red-500 font-semibold">
                  IMPORTANT: Never share your private key with anyone!
                </div>
              </div>
              
              {/* Wallet Actions */}
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={handleDownloadKeyFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Wallet Backup
                </button>
                
                <div className="text-center text-xs text-gray-400 mt-2">
                  <p>This wallet is compatible with standard BSV wallets that support importing WIF keys.</p>
                  <p className="mt-1">Token Balance: <span className="text-green-400 font-semibold">143.21 $NPG</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Element Details Modal */}
      <Modal
        isOpen={isElementDetailsModalOpen}
        onClose={() => setIsElementDetailsModalOpen(false)}
        title={`Element Details: ${selectedElement?.name || ''}`}
      >
        {selectedElement && (
          <div className="p-4">
            <div className="relative border border-gray-300 rounded-lg overflow-hidden aspect-[3/4] mb-4 max-w-xs mx-auto">
              {/* Background image */}
              {(() => {
                // Determine background image path
                let cardBackground;
                const normalizedLayer = selectedElement.layer.toUpperCase();
                const layerDetail = LAYER_DETAILS[normalizedLayer];
                
                if (selectedElement.cardLayoutUrl) {
                  cardBackground = selectedElement.cardLayoutUrl;
                } else if (layerDetail && layerDetail.number) {
                  let baseName = normalizedLayer === 'BODY_SKIN' 
                    ? 'body' 
                    : selectedElement.layer.toLowerCase().replace(/[_\s]/g, '_');
                  cardBackground = `/element_cards/${layerDetail.number}_${baseName}.jpg`;
                } else {
                  cardBackground = `/element_cards/${selectedElement.layer.toLowerCase().replace(/[_\s]/g, '-')}.jpg`;
                }
                
                return (
                  <img 
                    src={cardBackground}
                    alt={`${selectedElement.layer} background`}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                    onError={(e) => (e.currentTarget.src = '/placeholder-element-card.png')}
                  />
                );
              })()}
              
              {/* Card header */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-600 to-purple-600 z-10">
                <h3 className="text-white text-sm font-bold text-center tracking-wider truncate p-1">
                  {selectedElement.layer.replace(/_/g, ' ')}
                </h3>
              </div>
              
              {/* Element image */}
              <div className="w-full h-full flex items-center justify-center pt-10 pb-10 relative z-5">
                <img 
                  src={selectedElement.imageUrl} 
                  alt={selectedElement.name} 
                  className="max-w-[80%] max-h-[80%] object-contain drop-shadow-lg"
                  onError={(e) => (e.currentTarget.src = '/placeholder-element.png')}
                />
              </div>
              
              {/* Element name */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 z-10">
                <p className="text-sm font-medium text-white truncate text-center">{selectedElement.name}</p>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="text-xs font-semibold">Layer</p>
                  <p className="text-sm">{selectedElement.layer.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <p className="text-xs font-semibold">Rarity</p>
                  <p className="text-sm">{selectedElement.rarity || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-lg"
                  onClick={() => {
                    const startingStackId = stacks.length > 0 ? stacks[0].id : null;
                    setSelectedStack(startingStackId);
                    setSelectedElementForStack(selectedElement);
                    setIsElementDetailsModalOpen(false);
                    setIsAddToStackModalOpen(true);
                  }}
                >
                  Add to Stack
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div> /* Closes min-h-screen */
  ); // Closes the main return (...) statement

  // <<< REMOVE explicit fallback return >>>
  // return null;

} // <<< Closing brace for WalletPageContent function