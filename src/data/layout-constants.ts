import { type PositionState } from '@/components/ElementCardDesigner'; // Assuming PositionState is needed and exported

// Define the type for keys if it's not already globally available
export type ElementPositionKeys =
  | 'elementName'
  | 'elementImage'
  | 'seriesNumber'
  | 'layerName'
  | 'elementNumber'
  | 'rarity'
  | 'strengthStat'
  | 'speedStat'
  | 'skillStat'
  | 'staminaStat'
  | 'stealthStat'
  | 'styleStat'
  | 'characterName';

// Moved from ElementCardDesigner.tsx
export const initialElementCoords: Record<ElementPositionKeys, PositionState> = {
    elementName: { x: 50, y: 50, fontSize: 32 },
    elementImage: { x: 50, y: 100, fontSize: 10, width: 300, height: 300 }, // Adjusted size/pos
    seriesNumber: { x: 300, y: 50, fontSize: 20 }, // New
    layerName: { x: 50, y: 80, fontSize: 18 },    // New
    elementNumber: { x: 300, y: 80, fontSize: 18 }, // New
    rarity: { x: 50, y: 420, fontSize: 16 },      // New
    strengthStat: { x: 50, y: 450, fontSize: 20 }, // New (S6)
    speedStat: { x: 200, y: 450, fontSize: 20 },    // New (S6)
    skillStat: { x: 50, y: 480, fontSize: 20 },     // New (S6)
    staminaStat: { x: 200, y: 480, fontSize: 20 },   // New (S6)
    stealthStat: { x: 50, y: 510, fontSize: 20 },    // New (S6)
    styleStat: { x: 200, y: 510, fontSize: 20 },     // New (S6)
    characterName: { x: 50, y: 540, fontSize: 18 },  // New
}; 