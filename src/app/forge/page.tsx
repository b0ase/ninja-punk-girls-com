'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { useNFTStore } from '@/context/NFTStoreContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type NFTType, type StatsType, type NFTAttribute, type AssetDetail } from '@/types';
import { useAssets } from '@/context/AssetContext';
import { LAYER_ORDER, EXCLUDED_LAYERS, LAYER_DETAILS } from '@/data/layer-config';
import { JAPANESE_NAMES } from '@/data/japanese-names';
import { EROBOT_NAMES } from '@/data/erobot-names';
import { INTERFACE_CONFIG, type InterfaceDetail } from '@/data/interface-config';

// Constants for preview canvas
const CANVAS_WIDTH = 961;
const CANVAS_HEIGHT = 1441;

// Constants
const DEFAULT_PRIMARY = 'Default';
const DEFAULT_SECONDARY = 'Default'; 
const NPG_LOGO_PATH = "/assets/01-Logo/01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png";
const EROBOTZ_LOGO_PATH = "/assets/01-Logo/01_002_logo_Erobot-logo_x_Erobot_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png";

// Helper to create empty stats
const createEmptyStats = (): StatsType => ({
  strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0
});

// --- Static Data for New Selectors ---
const TEAM_OPTIONS = [
    { name: "None", filename: null },
    { name: "Ninja Punk Girl", filename: "/assets/04 Team/04_01_team_Ninja-Punk-Girl_x_NPG_x.png" },
    { name: "Meguro Maniacs", filename: "/assets/04 Team/04_02_team_Meguro-Maniacs_x_Erobot_x.png" },
    { name: "Ginza Grinders", filename: "/assets/04 Team/04_03_team_Ginza-Grinders_x_Erobot_x.png" },
    { name: "Shinjuku Cats", filename: "/assets/04 Team/04_04_team_Shinjuku-Cats_x_Erobot_x.png" },
    { name: "Shibuya Psychos", filename: "/assets/04 Team/04_05_team_Shibuya-Psychos_x_Erobot_x.png" },
    { name: "Harajuku Hackers", filename: "/assets/04 Team/04_06_team_Harajuku-Hackers_x_Erobot_x.png" },
];

const LOGO_OPTIONS = [
    { name: "Ninja Punk Girls", filename: "/assets/01-Logo/01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png" },
    { name: "Erobotz", filename: "/assets/01-Logo/01_002_logo_Erobot-logo_x_Erobot_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png" },
];

const FONT_OPTIONS = [
    { name: "Cyberpunk Italic", value: 'cyberpunk-italic' },
];

// --- Helper Type for Combined Item List ---
interface SelectedItemDetail {
    id: string;
    displayName: string;
    type: string;
    stats: StatsType | null;
    cost: number;
}

// --- Define Shared Layers --- 
const SHARED_LAYERS = new Set([
    'BACKGROUND', 'INTERFACE', 'TEAM', 'LOGO', 'GLOW', 'BANNER', 'DECALS', 'EFFECTS'
]);

// Helper Type for the static assets
interface StaticAsset {
  type: string;
  layer: string;
  filename: string | null;
}

export default function ForgePage() {
  return (
    <ErrorBoundary>
      <ForgePageContent />
    </ErrorBoundary>
  );
}

function ForgePageContent(): JSX.Element {
  const { isConnected, wallet } = useHandCashWallet();
  const { listNFT } = useNFTStore();
  const { availableAssets, isInitialized: assetsLoaded, assetLoadingProgress } = useAssets();
  
  // Character Type Selection
  type CharacterType = 'all' | 'erobot' | 'ninjapunk';
  const [selectedCharacterType, setSelectedCharacterType] = useState<CharacterType>('all');

  // Interface and Static Asset Selection
  const [selectedInterface, setSelectedInterface] = useState<string | null>(
    INTERFACE_CONFIG.length > 0 ? INTERFACE_CONFIG[0].filename : null
  );
  const [selectedTeam, setSelectedTeam] = useState<string | null>(TEAM_OPTIONS[0]?.filename || null);
  const [selectedLogo, setSelectedLogo] = useState<string>(NPG_LOGO_PATH);
  const [selectedFont, setSelectedFont] = useState<string>(FONT_OPTIONS[0].value);

  // Asset Selection State
  const [selectedAssets, setSelectedAssets] = useState<Record<string, AssetDetail | null>>({});
  const [customNftName, setCustomNftName] = useState<string>('');
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'paying' | 'generating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [calculatedStats, setCalculatedStats] = useState<StatsType>(createEmptyStats());

  // Layer Groupings for UI Organization
  const BODY_LAYERS = ['BODY_SKIN', 'FACE', 'HAIR', 'REAR_HAIR', 'ARMS'];
  const OUTFIT_LAYERS = ['TOP', 'BOTTOM', 'BRA', 'UNDERWEAR', 'BOOTS', 'BACK'];
  const WEAPON_LAYERS = ['LEFT_WEAPON', 'RIGHT_WEAPON', 'BEHIND'];
  const ACCESSORY_LAYERS = ['HORNS', 'REAR_HORNS', 'MASK', 'JEWELLERY', 'ACCESSORIES'];
  const FX_LAYERS = ['BACKGROUND', 'GLOW', 'BANNER', 'DECALS', 'EFFECTS'];

  // Filter valid layers
  const filterValidLayers = (layers: string[]) => layers.filter(key => LAYER_DETAILS[key]);

  const bodyLayers = filterValidLayers(BODY_LAYERS);
  const outfitLayers = filterValidLayers(OUTFIT_LAYERS);
  const weaponLayers = filterValidLayers(WEAPON_LAYERS);
  const accessoryLayers = filterValidLayers(ACCESSORY_LAYERS);
  const fxLayers = filterValidLayers(FX_LAYERS);

  // Memoized Filtered Assets
  const filteredAssets = useMemo(() => {
    if (selectedCharacterType === 'all') {
      return availableAssets;
    }
    
    const filterString = selectedCharacterType === 'erobot' ? 'Erobot' : 'NPG';
    const filtered: typeof availableAssets = {};
    
    Object.entries(availableAssets).forEach(([layer, assets]) => {
      if (SHARED_LAYERS.has(layer)) {
        filtered[layer] = assets;
      } else {
        filtered[layer] = assets.filter(asset => 
          asset.filename.includes(filterString) || 
          asset.character === filterString ||
          asset.team === filterString
        );
      }
    });
    
    return filtered;
  }, [availableAssets, selectedCharacterType]);

  // Filtered Options for Team and Logo
  const filteredTeamOptions = useMemo(() => {
    if (selectedCharacterType === 'all') return TEAM_OPTIONS;
    if (selectedCharacterType === 'ninjapunk') {
      return TEAM_OPTIONS.filter(opt => opt.filename === null || opt.filename?.includes('Ninja-Punk-Girl'));
    }
    return TEAM_OPTIONS.filter(opt => opt.filename === null || opt.filename?.includes('Erobot'));
  }, [selectedCharacterType]);

  const filteredLogoOptions = useMemo(() => LOGO_OPTIONS, []);

  // Filtered Character Names
  const filteredCharacterNames = useMemo(() => {
    switch (selectedCharacterType) {
      case 'erobot': return [...EROBOT_NAMES];
      case 'ninjapunk': return [...JAPANESE_NAMES];
      case 'all':
      default:
        const combined = Array.from(new Set([...JAPANESE_NAMES, ...EROBOT_NAMES]));
        return combined.sort((a, b) => a.localeCompare(b));
    }
  }, [selectedCharacterType]);

  // Find Default Underwear
  const getDefaultUnderwear = useCallback((assets: Record<string, AssetDetail[]>, type: CharacterType): AssetDetail | null => {
    const allUnderwear = assets['UNDERWEAR'] || [];
    let candidates = allUnderwear;
    if (type !== 'all') {
      const prefix = type === 'erobot' ? 'E_' : 'N_';
      candidates = allUnderwear.filter(asset => asset.filename?.startsWith(prefix));
    }
    
    const modestyHeart = candidates.find(asset => asset.name === 'Modesty Heart');
    if (modestyHeart) return modestyHeart;
    
    const commonDefault = candidates.find(asset => asset.rarity === 'Common');
    if (commonDefault) return commonDefault;
    return candidates.length > 0 ? candidates[0] : null;
  }, []);

  // Effect to SET INITIAL/DEFAULT Underwear
  useEffect(() => {
    if (assetsLoaded && Object.keys(selectedAssets).length === 0) {
      const initialDefaultU = getDefaultUnderwear(availableAssets, 'all');
      if (initialDefaultU) {
        setSelectedAssets({ 'UNDERWEAR': initialDefaultU });
      }
    }
  }, [assetsLoaded, availableAssets, getDefaultUnderwear, selectedAssets]);

  // Effect to Reset Selections on Type Change
  useEffect(() => {
    if (!assetsLoaded) return;
    
    const defaultU = getDefaultUnderwear(availableAssets, selectedCharacterType);
    const resetState: Record<string, AssetDetail | null> = {};
    if (defaultU) {
      resetState['UNDERWEAR'] = defaultU;
    }
    
    setSelectedAssets(resetState);
    setPreviewImageUrl(null);
    setCustomNftName('');
    setCalculatedStats(createEmptyStats());
    setSelectedInterface(INTERFACE_CONFIG.length > 0 ? INTERFACE_CONFIG[0].filename : null);
    setSelectedFont(FONT_OPTIONS[0].value);

    if (selectedCharacterType === 'erobot') {
      setSelectedLogo(EROBOTZ_LOGO_PATH);
    } else {
      setSelectedLogo(NPG_LOGO_PATH);
    }

    if (selectedCharacterType === 'ninjapunk') {
      const npgTeam = TEAM_OPTIONS.find(opt => opt.filename?.includes('Ninja-Punk-Girl'));
      setSelectedTeam(npgTeam ? npgTeam.filename : null);
    } else {
      const newFilteredTeams = TEAM_OPTIONS.filter(opt => opt.filename === null || opt.filename?.includes('Erobot'));
      setSelectedTeam(newFilteredTeams[0]?.filename ?? null);
    }
  }, [selectedCharacterType, availableAssets, getDefaultUnderwear, assetsLoaded]);

  // Helper Functions
  const getLayerDisplayName = (layerKey: string): string => {
    if (!layerKey) return '';
    return layerKey.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getAssetName = (asset: AssetDetail | null | undefined): string => {
    if (!asset) return 'None';
    return asset.name || asset.filename?.replace('.png', '') || 'Unknown Asset';
  };

  // Asset Selection Handlers
  const handleAssetSelect = (layer: string, assetFilename: string | null) => {
    const selectedAsset = assetFilename ? filteredAssets[layer]?.find(a => a.filename === assetFilename) || null : null;
    setSelectedAssets(prev => ({ ...prev, [layer]: selectedAsset }));
  };

  const handleRandomizeColumn = useCallback((layersToRandomize: string[]) => {
    const newSelections: Record<string, AssetDetail | null> = {};
    layersToRandomize.forEach(layer => {
      const assetsForLayer = filteredAssets[layer];
      if (assetsForLayer && assetsForLayer.length > 0) {
        const randomIndex = Math.floor(Math.random() * assetsForLayer.length);
        newSelections[layer] = assetsForLayer[randomIndex];
      } else {
        newSelections[layer] = null;
      }
    });
    setSelectedAssets(prev => ({ ...prev, ...newSelections }));
  }, [filteredAssets]);

  const handleClearColumn = (layersToClear: string[]) => {
    const clearedSelections: Record<string, AssetDetail | null> = {};
    layersToClear.forEach(layer => {
      if (layer !== 'UNDERWEAR') {
        clearedSelections[layer] = null;
      }
    });
    
    setSelectedAssets(prev => {
      const newState = { ...prev, ...clearedSelections };
      if (!newState['UNDERWEAR']) {
        const defaultU = getDefaultUnderwear(availableAssets, selectedCharacterType);
        if (defaultU) newState['UNDERWEAR'] = defaultU;
      }
      return newState;
    });
  };

  // Handlers for Misc Section
  const handleClearMisc = useCallback(() => {
    setSelectedInterface(INTERFACE_CONFIG.length > 0 ? INTERFACE_CONFIG[0].filename : null);
    setSelectedTeam(filteredTeamOptions[0]?.filename ?? null);
    setSelectedLogo(NPG_LOGO_PATH);
    setSelectedFont(FONT_OPTIONS[0].value);
  }, [filteredTeamOptions]);

  const handleRandomizeMisc = useCallback(() => {
    if (INTERFACE_CONFIG.length > 0) {
      const randomIndex = Math.floor(Math.random() * INTERFACE_CONFIG.length);
      setSelectedInterface(INTERFACE_CONFIG[randomIndex].filename);
    }
    if (filteredTeamOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredTeamOptions.length);
      setSelectedTeam(filteredTeamOptions[randomIndex].filename);
    }
    if (filteredLogoOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredLogoOptions.length);
      setSelectedLogo(filteredLogoOptions[randomIndex].filename);
    }
    if (FONT_OPTIONS.length > 0) {
      const randomIndex = Math.floor(Math.random() * FONT_OPTIONS.length);
      setSelectedFont(FONT_OPTIONS[randomIndex].value);
    }
  }, [filteredTeamOptions, filteredLogoOptions]);

  // Randomize All Unfiltered
  const handleRandomizeAllUnfiltered = useCallback(() => {
    if (!assetsLoaded) return;
    
    const newSelections: Record<string, AssetDetail | null> = {};
    LAYER_ORDER.forEach(layer => {
      if (['INTERFACE', 'TEAM', 'LOGO', 'COPYRIGHT'].includes(layer)) {
        return;
      }
      const assetsForLayer = availableAssets[layer];
      if (assetsForLayer && assetsForLayer.length > 0) {
        const optionsWithNone = [null, ...assetsForLayer];
        const randomIndex = Math.floor(Math.random() * optionsWithNone.length);
        newSelections[layer] = optionsWithNone[randomIndex];
      } else {
        newSelections[layer] = null;
      }
    });

    // Force selection for required layers
    const forceSelectRandom = (layerKey: string) => {
      if (newSelections[layerKey] === null) {
        const assets = availableAssets[layerKey];
        if (assets && assets.length > 0) {
          const randomIndex = Math.floor(Math.random() * assets.length);
          newSelections[layerKey] = assets[randomIndex];
        }
      }
    };

    forceSelectRandom('BODY_SKIN');
    forceSelectRandom('FACE');
    forceSelectRandom('UNDERWEAR');
    forceSelectRandom('BACKGROUND');

    setSelectedAssets(newSelections);

    // Random Name Selection
    const allNames = Array.from(new Set([...JAPANESE_NAMES, ...EROBOT_NAMES]));
    if (allNames.length > 0) {
      const randomNameIndex = Math.floor(Math.random() * allNames.length);
      setCustomNftName(allNames[randomNameIndex]);
    }
  }, [availableAssets, assetsLoaded]);

  // Preview Generation Logic
  const generatePreview = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewImageUrl(null);

    const layerAssetsToDraw = Object.values(selectedAssets).filter(Boolean) as AssetDetail[];
    const staticAssetsToDraw: StaticAsset[] = [
      { type: 'interface', layer: 'INTERFACE', filename: selectedInterface },
      { type: 'team', layer: 'TEAM', filename: selectedTeam },
      { type: 'logo', layer: 'LOGO', filename: selectedLogo },
    ].filter(asset => asset.filename);

    const isStaticAsset = (asset: AssetDetail | StaticAsset): asset is StaticAsset => {
      return 'type' in asset && 'layer' in asset;
    };

    const allAssetsToDraw = [...layerAssetsToDraw, ...staticAssetsToDraw];

    if (allAssetsToDraw.length === 0) {
      setIsPreviewLoading(false);
      return;
    }

    const getDrawOrder = (asset: AssetDetail | StaticAsset): number => {
      if (isStaticAsset(asset)) {
        switch (asset.layer) {
          case 'INTERFACE': return 500;
          case 'TEAM': return 600;
          case 'LOGO': return 700;
          default: return -1;
        }
      } else {
        const layerKey = asset.layer || '';
        return LAYER_ORDER.includes(layerKey) ? LAYER_ORDER.indexOf(layerKey) : -1;
      }
    };

    const sortedAssetsToDraw = allAssetsToDraw.sort((a, b) => getDrawOrder(a) - getDrawOrder(b));

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsPreviewLoading(false); return; }

    try {
      for (const asset of sortedAssetsToDraw) {
        if (!asset.filename) continue;

        const isModestyHeart = (!isStaticAsset(asset) && asset.name === 'Modesty Heart');
        if (isModestyHeart && Object.keys(selectedAssets).some(([layerKey, asset]) => 
          asset !== null && layerKey !== 'UNDERWEAR' && !['INTERFACE', 'TEAM', 'LOGO'].includes(layerKey)
        )) {
          continue;
        }

        let imagePath = '';
        if (isStaticAsset(asset)) {
          const layerDetail = LAYER_DETAILS[asset.layer];
          if (layerDetail?.folderName && asset.filename) {
            if (asset.filename.startsWith('/assets/')) {
              imagePath = asset.filename;
            } else {
              imagePath = `/assets/${layerDetail.folderName}/${asset.filename}`;
            }
          } else {
            continue;
          }
        } else {
          const layerKey = asset.layer || '';
          const layerDetail = LAYER_DETAILS[layerKey];
          if (layerDetail?.folderName) {
            imagePath = `/assets/${layerDetail.folderName}/${asset.filename}`;
          } else {
            continue;
          }
        }

        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (isModestyHeart) {
              const scale = 2;
              const newWidth = img.width * scale;
              const newHeight = img.height * scale;
              const x = (CANVAS_WIDTH - newWidth) / 2;
              const y = (CANVAS_HEIGHT - newHeight) / 2;
              ctx.drawImage(img, x, y, newWidth, newHeight);
            } else {
              ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load ${imagePath}`));
          img.src = imagePath;
        });
      }

      // Draw Name Text
      const finalNftName = customNftName;
      const currentInterfaceConfig = INTERFACE_CONFIG.find(conf => conf.filename === selectedInterface);

      if (finalNftName && currentInterfaceConfig) {
        const { x, y } = currentInterfaceConfig.placements.name;
        const fontValue = selectedFont || 'sans-serif';
        const fontString = `48px "${fontValue}", sans-serif`;
        ctx.font = fontString;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(finalNftName, x, y);
      }

      setPreviewImageUrl(canvas.toDataURL('image/png'));
    } catch (previewError) {
      console.error("[Preview] Error during drawing loop:", previewError);
      setPreviewImageUrl(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [selectedAssets, selectedInterface, selectedTeam, selectedLogo, customNftName, selectedFont]);

  // Trigger preview effect
  useEffect(() => { generatePreview(); }, [generatePreview]);

  // Calculate stats effect
  useEffect(() => {
    const statsSum = createEmptyStats();
    const selected = Object.values(selectedAssets).filter(Boolean) as AssetDetail[];

    selected.forEach(asset => {
      const layerStats = { ...createEmptyStats(), ...(asset.stats || {}) };
      Object.keys(statsSum).forEach(key => {
        const statKey = key as keyof StatsType;
        statsSum[statKey] += layerStats[statKey] || 0;
      });
    });

    setCalculatedStats(statsSum);
  }, [selectedAssets]);

  // Combined Selected Items List
  const combinedSelectedItems = useMemo((): SelectedItemDetail[] => {
    const items: SelectedItemDetail[] = [];
    const layerCost = 0.01;
    const staticCost = 0;
    const zeroStats = createEmptyStats();

    Object.entries(selectedAssets).forEach(([layerKey, asset]) => {
      if (asset && layerKey !== 'COPYRIGHT') {
        items.push({
          id: asset.filename,
          displayName: `${getLayerDisplayName(layerKey)}: ${getAssetName(asset)}`,
          type: layerKey,
          stats: asset.stats ? { ...zeroStats, ...asset.stats } : zeroStats,
          cost: layerCost
        });
      }
    });

    const findStaticName = (filename: string | null, options: { name: string, filename: string | null }[]) => 
      options.find(opt => opt.filename === filename)?.name || 'Unknown';

    if (selectedInterface) {
      const interfaceName = INTERFACE_CONFIG.find(conf => conf.filename === selectedInterface)?.name || 'Unknown Interface';
      items.push({
        id: 'interface',
        displayName: interfaceName,
        type: 'Interface',
        stats: null,
        cost: staticCost
      });
    }
    if (selectedTeam) {
      items.push({
        id: 'team',
        displayName: findStaticName(selectedTeam, TEAM_OPTIONS),
        type: 'Team',
        stats: null,
        cost: staticCost
      });
    }
    if (selectedLogo) {
      items.push({
        id: 'logo',
        displayName: findStaticName(selectedLogo, LOGO_OPTIONS),
        type: 'Logo',
        stats: null,
        cost: staticCost
      });
    }

    items.sort((a, b) => {
      const aOrder = LAYER_ORDER.includes(a.type) ? LAYER_ORDER.indexOf(a.type) : 800 + ['Interface', 'Team', 'Logo'].indexOf(a.type);
      const bOrder = LAYER_ORDER.includes(b.type) ? LAYER_ORDER.indexOf(b.type) : 800 + ['Interface', 'Team', 'Logo'].indexOf(b.type);
      return bOrder - aOrder;
    });

    return items;
  }, [selectedAssets, selectedInterface, selectedTeam, selectedLogo]);

  // Calculate total cost
  const totalCalculatedCost = useMemo(() => 
    combinedSelectedItems.reduce((sum, item) => sum + item.cost, 0),
    [combinedSelectedItems]
  );

  // Pricing Logic based on Rarity
  const getAssetPrice = (asset: AssetDetail | null): number => {
    if (!asset || !asset.rarity) return 0.000;
    switch (asset.rarity) {
      case 'Common': return 0.001;
      case 'Uncommon': return 0.002;
      case 'Rare': return 0.004;
      case 'Epic': return 0.006;
      case 'Legendary': return 0.008;
      case 'Mythical': return 0.01;
      default: return 0.000;
    }
  };

  const handleMintCustom = async () => {
    setError(null);
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }
    if (combinedSelectedItems.length === 0) {
      setError("Please select at least one element to build.");
      return;
    }
    
    const finalNftName = customNftName;
    if (!finalNftName) {
      setError("Please select a name for your custom NFT.");
      return;
    }

    setMintingStatus('generating');
    
    try {
      const nftData: NFTType = {
        number: Date.now(),
        name: finalNftName,
        team: selectedCharacterType === 'ninjapunk' ? 'Ninja Punk Girls' : 'Erobots',
        series: 'Custom Series',
        totalSupply: 1,
        attributes: Object.entries(selectedAssets).map(([layer, asset]) => ({
          layer: layer,
          name: asset?.name || 'Unknown',
          asset: asset?.filename || '',
          stats: asset?.stats || createEmptyStats(),
          metadata: {
            elementName: asset?.name || 'Unknown',
            characterName: finalNftName,
            genes: asset?.genes || 'Unknown',
            rarity: asset?.rarity || 'Common',
            hasRGB: false
          }
        } as NFTAttribute)).filter(attr => attr.asset),
        stats: calculatedStats,
        qrData: `custom-${Date.now()}`,
        image: previewImageUrl || ''
      };

      await listNFT(nftData, totalCalculatedCost);
      
      setMintingStatus('idle');
      setSelectedAssets({});
      setCustomNftName('');
      setPreviewImageUrl(null);
      
    } catch (error: any) {
      setError(error.message || 'Failed to mint NFT');
      setMintingStatus('idle');
    }
  };

  // Helper function for dynamic placeholder text
  const getNamePlaceholderText = () => {
    const count = filteredCharacterNames.length;
    switch (selectedCharacterType) {
      case 'erobot': return `-- Select Erobot Name (${count}) --`;
      case 'ninjapunk': return `-- Select Ninjapunk Girl Name (${count}) --`;
      case 'all':
      default: return `-- Select Name (${count}) --`;
    }
  };

  // Loading State
  if (!assetsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading Assets...</h1>
          <div className="w-64 bg-gray-700 rounded-full h-2.5 mx-auto">
            <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${assetLoadingProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{assetLoadingProgress}%</p>
        </div>
      </div>
    );
  }

  // Updated reusable component for a selector group (fixed width dropdowns)
  const renderSelectorGroup = (layers: string[], groupTitle: string) => (
    <div className="mb-6 bg-gray-800/30 p-4 rounded border border-gray-700/40">
       <div className="flex justify-between items-center border-b border-pink-400/30 pb-2 mb-4">
         <h2 className="text-xl text-pink-400">{groupTitle}</h2>
         <div className="flex space-x-2"> 
            <button onClick={() => handleClearColumn(layers)} className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-red-100 transition-colors">Clear</button>
            <button onClick={() => handleRandomizeColumn(layers)} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors">Randomize</button>
         </div>
      </div>
      <div className="space-y-2"> 
        {layers.map(layer => {
          const assetsForLayer = filteredAssets[layer] || []; 
          const isLayerDisabled = assetsForLayer.length === 0;
          const currentAsset = selectedAssets[layer];
          const price = getAssetPrice(currentAsset);
          const isUnderwearLayer = layer === 'UNDERWEAR';

          return (
            <div key={layer} className="grid grid-cols-3 items-center gap-2"> 
              <label htmlFor={layer} className="text-sm text-gray-400 truncate pr-1 justify-self-start" title={getLayerDisplayName(layer)}>{getLayerDisplayName(layer)}:</label>
              <select
                id={layer}
                name={layer}
                value={currentAsset?.filename || ''} 
                onChange={(e) => handleAssetSelect(layer, e.target.value || null)}
                className={`w-full p-1.5 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm ${isLayerDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={getLayerDisplayName(layer)}
                disabled={isLayerDisabled} 
              >
                {!isUnderwearLayer && <option value="" disabled className="text-gray-500">-- Select --</option>} 
                {!isUnderwearLayer && <option value="">None</option>} 
                {isUnderwearLayer && !currentAsset && <option value="" disabled>Loading Default...</option>} 
                
                {Array.isArray(assetsForLayer) && assetsForLayer.sort((a, b) => (a.filename || '').localeCompare(b.filename || '')).map(asset => (
                  <option key={asset.filename} value={asset.filename}>{getAssetName(asset)}</option>
                ))}
                {isLayerDisabled && <option value="" disabled>No {selectedCharacterType !== 'all' ? selectedCharacterType : ''} assets</option>} 
              </select>
              <div className="text-xs text-right text-cyan-400 font-mono justify-self-end">
                 {price > 0 ? `${price.toFixed(3)} BSV` : ''} 
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-full mx-auto px-4 relative">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-gray-950 pt-4 pb-2 mb-6 shadow-md">
          <h1 className="text-3xl font-bold text-pink-500 mb-4 text-center">🏭 Forge Your Custom NPG</h1>
          
          {/* Character Type Selector & Randomize All Button */}
          <div className="text-center">
            <label className="block text-lg text-gray-300 mb-2">Select Character Type:</label>
            <div className="inline-flex rounded-md shadow-sm bg-gray-800 p-1 items-center space-x-1" role="group">
              {/* Generate Button (Moved to Left) */}
              <button 
                  type="button"
                  onClick={handleRandomizeAllUnfiltered}
                  title="Randomize all layers using all available assets, ignoring filters"
                  className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 bg-pink-600 hover:bg-pink-700 text-white mr-2"
                >
                  Generate
              </button>
              {/* Filter Buttons */}
              {(['all', 'erobot', 'ninjapunk'] as CharacterType[]).map((type) => {
                  const buttonText = type === 'all' ? 'Mix' : type.charAt(0).toUpperCase() + type.slice(1);
                  return (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => setSelectedCharacterType(type)}
                    className={`px-5 py-2 text-sm font-medium rounded-md transition-colors duration-150 
                      ${selectedCharacterType === type 
                        ? 'bg-pink-600 text-white ring-2 ring-pink-500 ring-offset-2 ring-offset-gray-800' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    {buttonText}
                   </button>
              );})}
            </div>
          </div>
        </div>
        
        {/* --- 2-Column Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* == Left Column: Asset Selection == */}
          <div className="md:col-span-1">
             {/* --- Wrap Selector Groups in a 2-Column Grid --- */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderSelectorGroup(bodyLayers, "Body")}
                {renderSelectorGroup(outfitLayers, "Outfit")}
                {weaponLayers.length > 0 && renderSelectorGroup(weaponLayers, "Weapons")}
                {renderSelectorGroup(accessoryLayers, "Accessories")}
                {renderSelectorGroup(fxLayers, "FX / Background")}
                 
                {/* --- Render Static Selectors (Frame/Misc) as the 6th item --- */}
                <div className="mb-6 bg-gray-800/30 p-4 rounded border border-gray-700/40">
                  <div className="flex justify-between items-center border-b border-pink-400/30 pb-2 mb-4">
                    <h2 className="text-xl text-pink-400">Frame / Misc</h2>
                    <div className="flex space-x-2"> 
                        <button onClick={handleClearMisc} className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-red-100 transition-colors">Clear</button>
                        <button onClick={handleRandomizeMisc} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors">Randomize</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                     {/* Interface Selector */}
                     <div className="flex items-center space-x-2">
                         <label htmlFor="interfaceSelect" className="w-1/2 text-sm text-gray-400">Interface:</label>
                         <select id="interfaceSelect" value={selectedInterface || ''} onChange={(e) => setSelectedInterface(e.target.value || null)} className="w-1/2 p-1.5 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm">
                             <option value="">None</option>
                             {INTERFACE_CONFIG.map(iface => (
                                 <option key={iface.id} value={iface.filename}>{iface.name}</option>
                             ))}
                         </select>
                     </div>
                     {/* Team Selector */}
                     <div className="flex items-center space-x-2">
                         <label htmlFor="teamSelect" className="w-1/2 text-sm text-gray-400">Team:</label>
                         <select id="teamSelect" value={selectedTeam || ''} onChange={(e) => setSelectedTeam(e.target.value || null)} className="w-1/2 p-1.5 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm">
                             {filteredTeamOptions.map(opt => (
                                  <option key={opt.name} value={opt.filename ?? ''}>{opt.name}</option>
                              ))}
                         </select>
                     </div>
                     {/* Logo Selector */}
                     <div className="flex items-center space-x-2">
                         <label htmlFor="logoSelect" className="w-1/2 text-sm text-gray-400">Logo:</label>
                         <select 
                             id="logoSelect" 
                             value={selectedLogo || ''} 
                             onChange={(e) => setSelectedLogo(e.target.value || '')} 
                             className="w-1/2 p-1.5 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                         >
                             {filteredLogoOptions.map(opt => (
                                 <option key={opt.name} value={opt.filename ?? ''}>{opt.name}</option>
                             ))}
                         </select>
                     </div>
                     {/* Font Selector */} 
                      <div className="flex items-center space-x-2">
                         <label htmlFor="fontSelect" className="w-1/2 text-sm text-gray-400">Name Font:</label>
                          <select id="fontSelect" value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="w-1/2 p-1.5 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm">
                            {FONT_OPTIONS.map(opt => (
                                 <option key={opt.value} value={opt.value}>{opt.name}</option>
                             ))}
                           </select>
                      </div>
                  </div>
                </div>
              </div>
           </div> 

          {/* == Right Column: Preview & Mint == */}
          <div className="md:col-span-1 space-y-4 md:sticky md:top-[calc(theme(spacing.16)+4rem)] h-max">
             {/* --- Combined Name + Mint Button Section --- */}
             <div className="bg-gray-800/50 p-4 rounded shadow-sm border border-gray-700/50 flex items-end space-x-4"> 
               {/* Name Dropdown */} 
               <div className="w-1/2">
                 <label htmlFor="nftNameSelect" className="block text-sm font-medium text-pink-500 mb-2">Character Name:</label>
                 <select 
                      id="nftNameSelect"
                      value={customNftName}
                      onChange={(e) => setCustomNftName(e.target.value)}
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-sm"
                  >
                      <option value="" disabled>{getNamePlaceholderText()}</option> 
                      {filteredCharacterNames.map(name => (<option key={name} value={name}>{name}</option>))}
                 </select>
               </div>
               {/* Mint Button */} 
               <div className="w-1/2">
                 <button 
                     onClick={handleMintCustom}
                     disabled={mintingStatus !== 'idle' || !isConnected}
                     className={`w-full px-5 py-2 rounded-md font-semibold text-sm transition-colors ${!isConnected ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : mintingStatus !== 'idle' ? 'bg-yellow-600 text-yellow-100 cursor-wait' : 'bg-pink-600 hover:bg-pink-700 text-white'}`}
                 >
                    {!isConnected ? 'Connect Wallet' 
                      : mintingStatus === 'generating' ? 'Generating...' 
                      : totalCalculatedCost > 0 ? `Mint (Cost: ${totalCalculatedCost.toFixed(3)} BSV)`
                      : 'Mint Custom NFT'
                    }
                 </button>
               </div>
             </div>

             {/* Inner Grid for Preview + Mint Details */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               {/* Preview Box */} 
               <div className="bg-gray-800/50 p-4 rounded shadow-sm border border-gray-700/50 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-pink-500 mb-3 w-full text-center">Preview</h3>
                  <div className="w-full max-w-[350px] aspect-[961/1441] bg-gray-700/50 rounded flex items-center justify-center relative">
                    {isPreviewLoading ? (
                        <div className="text-gray-400">Loading Preview...</div>
                    ) : previewImageUrl ? (
                        <img src={previewImageUrl} alt="NFT Preview" className="object-contain w-full h-full"/>
                    ) : (
                        <div className="text-gray-500 text-center px-4">Select assets to generate preview</div>
                    )}
                  </div>
               </div>
               {/* Mint Details Box */} 
               <div className="bg-gray-800/50 p-4 rounded shadow-sm border border-gray-700/50 space-y-3 flex flex-col">
                  <h3 className="text-lg font-semibold text-pink-500 mb-2">Details</h3>
                  {/* Calculated Stats */} 
                  <div className="bg-gray-700/40 p-3 rounded">
                     <h4 className="text-sm font-medium text-gray-400 mb-2">Calculated Stats (Approx):</h4>
                     <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs text-center">
                         <span>STR: {calculatedStats.strength}</span>
                         <span>SPD: {calculatedStats.speed}</span>
                         <span>SKL: {calculatedStats.skill}</span>
                         <span>STA: {calculatedStats.stamina}</span>
                         <span>STL: {calculatedStats.stealth}</span>
                         <span>STY: {calculatedStats.style}</span>
                     </div>
                  </div>
                  {/* Selected Items Table (Scrollable) */} 
                  <div className="bg-gray-700/40 p-3 rounded flex-grow overflow-y-auto max-h-[300px]">
                       <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Items ({combinedSelectedItems.length}):</h4>
                       {combinedSelectedItems.length > 0 ? (
                           <div className="text-xs space-y-1 font-mono">
                               {/* Header Row */}
                               <div className="grid grid-cols-8 gap-1 font-semibold text-gray-400 border-b border-gray-600 pb-1 mb-1">
                                   <div className="col-span-2">Layer</div>
                                   <div className="col-span-2">Name</div>
                                   <div className="text-center">STR</div>
                                   <div className="text-center">SPD</div>
                                   <div className="text-center">SKL</div>
                                   <div className="text-center">STA</div>
                               </div>
                               {/* Data Rows */}
                               {combinedSelectedItems.map(item => {
                                   const displayNameParts = item.displayName.split(': ');
                                   const assetNameOnly = displayNameParts.length > 1 ? displayNameParts[1] : item.displayName;
                                   const stats = item.stats || createEmptyStats();
                                   const hasRealStats = item.stats !== null;
                                   return (
                                     <div key={item.id} className="grid grid-cols-8 gap-1 text-gray-300 items-center" title={item.displayName}>
                                         <div className="col-span-2 truncate text-pink-400">{item.type}</div>
                                         <div className="col-span-2 truncate">{assetNameOnly}</div>
                                         <div className={`text-center ${hasRealStats ? '' : 'text-gray-500'}`}>{hasRealStats ? stats.strength : '-'}</div>
                                         <div className={`text-center ${hasRealStats ? '' : 'text-gray-500'}`}>{hasRealStats ? stats.speed : '-'}</div>
                                         <div className={`text-center ${hasRealStats ? '' : 'text-gray-500'}`}>{hasRealStats ? stats.skill : '-'}</div>
                                         <div className={`text-center ${hasRealStats ? '' : 'text-gray-500'}`}>{hasRealStats ? stats.stamina : '-'}</div>
                                     </div>
                                   );
                               })}
                           </div>
                       ) : (
                           <p className="text-xs text-gray-500">No items selected.</p>
                        )}
                   </div>
                  {/* Mint Cost */} 
                  <div className="border-t border-gray-700 pt-3">
                      <p className="text-sm text-gray-400 mb-2">Estimated Cost: <span className="font-semibold text-white">{totalCalculatedCost.toFixed(3)} BSV</span></p>
                     {error && <p className="text-xs text-red-400 mb-2">Error: {error}</p>}
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
