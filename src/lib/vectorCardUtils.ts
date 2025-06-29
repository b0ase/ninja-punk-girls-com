import { ELEMENT_CARDS } from '@/components/VectorElementCard';

// Map your existing layer keys to vector element keys (comprehensive mapping)
export const LAYER_TO_VECTOR_MAP: Record<string, string> = {
  // Frame elements
  'LOGO': 'LOGO',
  'COPYRIGHT': 'COPYRIGHT', 
  'TEAM': 'TEAM',
  'INTERFACE': 'INTERFACE',
  
  // Effects elements
  'EFFECTS': 'EFFECTS',
  'DECALS': 'DECALS',
  'BANNER': 'BANNER',
  'GLOW': 'GLOW',
  'BACKGROUND': 'BACKGROUND',
  
  // Combat elements
  'RIGHT_WEAPON': 'RIGHT_WEAPON',
  'LEFT_WEAPON': 'LEFT_WEAPON',
  
  // Head elements
  'HORNS': 'HORNS',
  'HAIR': 'HAIR',
  'REAR_HAIR': 'REAR_HAIR',
  'MASK': 'MASK',
  'FACE': 'FACE',
  'REAR_HORNS': 'REAR_HORNS',
  
  // Clothing elements
  'TOP': 'TOP',
  'BOTTOM': 'BOTTOM',
  'BRA': 'BRA',
  'UNDERWEAR': 'UNDERWEAR',
  'BOOTS': 'BOOTS',
  
  // Accessory elements
  'JEWELLERY': 'JEWELLERY',
  'ACCESSORIES': 'ACCESSORIES',
  
  // Body elements
  'ARMS': 'ARMS',
  'BODY': 'BODY',
  'BACK': 'BACK',
  
  // Mapped aliases for existing system compatibility
  'BODY_SKIN': 'BODY', // Map BODY_SKIN to BODY
  'CLOTHING': 'UNDERWEAR', // Map CLOTHING to UNDERWEAR
};

// Check if a layer has a vector card available
export const hasVectorCard = (layerKey: string): boolean => {
  const vectorKey = LAYER_TO_VECTOR_MAP[layerKey];
  return !!(vectorKey && ELEMENT_CARDS[vectorKey]);
};

// Get the vector element key for a layer
export const getVectorElementKey = (layerKey: string): string | null => {
  const vectorKey = LAYER_TO_VECTOR_MAP[layerKey];
  return vectorKey && ELEMENT_CARDS[vectorKey] ? vectorKey : null;
};

// Generate CSS background for a vector card (for use in existing components)
export const getVectorCardBackground = (layerKey: string): string | null => {
  const vectorKey = getVectorElementKey(layerKey);
  if (!vectorKey) return null;
  
  const element = ELEMENT_CARDS[vectorKey];
  if (!element) return null;
  
  return `linear-gradient(135deg, ${element.gradient.from}, ${element.gradient.to})`;
};

// Enhanced version of getCardBackgroundPath that can use vector cards
export const getCardBackgroundPath = (
  layerKey: string, 
  backgroundMap: Record<string, string>,
  useVectorCards: boolean = false
): string => {
  // If vector cards are enabled and available, return a special identifier
  if (useVectorCards && hasVectorCard(layerKey)) {
    return `vector:${getVectorElementKey(layerKey)}`;
  }
  
  // Fall back to existing JPG logic
  if (!layerKey) return '/element_cards/default_background.jpg';
  
  const normalizedLayer = layerKey.toUpperCase();
  const backgroundPath = backgroundMap[normalizedLayer];
  
  if (backgroundPath) {
    return backgroundPath;
  }
  
  // Fallback to numbered format if available (comprehensive mapping)
  const layerNumbers: Record<string, string> = {
    'LOGO': '01',
    'COPYRIGHT': '02',
    'TEAM': '04',
    'INTERFACE': '05',
    'EFFECTS': '06',
    'RIGHT_WEAPON': '07',
    'LEFT_WEAPON': '08', 
    'HORNS': '09',
    'HAIR': '10',
    'MASK': '11',
    'TOP': '12',
    'BOOTS': '13',
    'JEWELLERY': '14',
    'ACCESSORIES': '15',
    'BRA': '16',
    'BOTTOM': '17',
    'FACE': '18',
    'UNDERWEAR': '19',
    'ARMS': '20',
    'BODY': '21',
    'BACK': '22',
    'REAR_HORNS': '23',
    'REAR_HAIR': '24',
    'DECALS': '26',
    'BANNER': '27',
    'GLOW': '28',
    'BACKGROUND': '29'
  };
  
  const layerNumber = layerNumbers[normalizedLayer];
  if (layerNumber) {
    const baseName = normalizedLayer === 'BODY_SKIN' ? 'body' : layerKey.toLowerCase().replace(/[_\s]/g, '_');
    return `/element_cards/${layerNumber}_${baseName}.jpg`;
  }
  
  return '/element_cards/default_background.jpg';
};

// Get all available vector elements grouped by category
export const getVectorElementsByCategory = (): Record<string, string[]> => {
  const categories: Record<string, string[]> = {};
  
  Object.entries(ELEMENT_CARDS).forEach(([key, element]) => {
    if (!categories[element.category]) {
      categories[element.category] = [];
    }
    categories[element.category].push(key);
  });
  
  return categories;
};

// Get complementary colors for a given element (useful for UI theming)
export const getElementThemeColors = (elementKey: string) => {
  const element = ELEMENT_CARDS[elementKey];
  if (!element) return null;
  
  return {
    primary: element.gradient.from,
    secondary: element.gradient.to,
    background: `linear-gradient(135deg, ${element.gradient.from}, ${element.gradient.to})`,
    text: '#ffffff',
    border: element.gradient.from + '40' // 25% opacity
  };
}; 