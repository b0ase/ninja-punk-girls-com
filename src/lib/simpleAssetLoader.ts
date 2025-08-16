// Simple asset loader that reads directly from public/assets without preprocessing
export interface SimpleAsset {
  layer: string;
  filename: string;
  name: string;
  rarity?: string;
  character?: string;
  genes?: string;
  team?: string;
  stats?: {
    strength: number;
    speed: number;
    skill: number;
    stamina: number;
    stealth: number;
    style: number;
  };
}

export async function loadAssetsFromDirectory(directory: string): Promise<SimpleAsset[]> {
  try {
    const response = await fetch(`/api/list-assets?directory=${directory}`);
    if (!response.ok) {
      throw new Error(`Failed to load assets from ${directory}`);
    }
    
    const files = await response.json();
    const assets: SimpleAsset[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const jsonResponse = await fetch(`/assets/${directory}/${file}`);
          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json();
            
            // Extract basic info from JSON
            const asset: SimpleAsset = {
              layer: directory,
              filename: file.replace('.json', '.png'),
              name: jsonData.item_name || jsonData.name || 'Unknown',
              rarity: jsonData.rarity,
              character: jsonData.character,
              genes: jsonData.genes,
              team: jsonData.team,
              stats: jsonData.stats || {
                strength: 0,
                speed: 0,
                skill: 0,
                stamina: 0,
                stealth: 0,
                style: 0
              }
            };
            
            assets.push(asset);
          }
        } catch (error) {
          console.warn(`Failed to load JSON for ${file}:`, error);
        }
      }
    }
    
    return assets;
  } catch (error) {
    console.error(`Error loading assets from ${directory}:`, error);
    return [];
  }
}

export function getAssetUrl(directory: string, filename: string): string {
  return `/assets/${directory}/${filename}`;
}
