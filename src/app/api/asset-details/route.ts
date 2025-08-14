import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');
  const variant = searchParams.get('variant');

  if (!layer || !variant) {
    return NextResponse.json({
      success: false,
      error: 'Missing layer or variant parameter'
    }, {
      status: 400
    });
  }

  try {
    // Map layer number to folder name
    const folderName = `${layer.padStart(2, '0')}-${getFolderNameFromLayer(layer)}`;
    
    if (!folderName) {
      console.error(`Unknown layer: ${layer}`);
      return NextResponse.json({
        success: true,
        element: `Element ${variant}`,
        character: '',
        genes: '',
        color: '',
        rarity: 'Common'
      });
    }

    const folderPath = path.join(process.cwd(), 'public', 'assets', folderName);
    
    // If directory doesn't exist, return a basic response
    if (!fs.existsSync(folderPath)) {
      console.error(`Directory not found: ${folderPath}`);
      return NextResponse.json({
        success: true,
        element: `Element ${variant}`,
        character: '',
        genes: '',
        color: '',
        rarity: 'Common'
      });
    }
    
    // Look for JSON file with matching pattern
    const files = fs.readdirSync(folderPath);
    const matchPattern = `${layer}_${variant.padStart(3, '0')}`;
    const matchingJsonFile = files.find(file => file.startsWith(matchPattern) && file.endsWith('.json'));
    
    if (!matchingJsonFile) {
      console.warn(`No matching JSON file found for pattern ${matchPattern} in ${folderName}`);
      return NextResponse.json({
        success: true,
        element: `Element ${variant}`,
        character: '',
        genes: '',
        color: '',
        rarity: 'Common'
      });
    }

    console.log(`Found matching JSON file: ${matchingJsonFile}`);
    
    // Load JSON data
    const jsonPath = path.join(folderPath, matchingJsonFile);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Extract data from JSON
    const elementName = jsonData.item_name || jsonData.category || `Element ${variant}`;
    const characterName = jsonData.character || '';
    const genes = jsonData.genes || '';
    const rarity = jsonData.rarity || 'Common';
    const team = jsonData.team || '';
    
    // Color handling (placeholder for now)
    let color = '';
    if (jsonData.original_filename && (jsonData.original_filename.includes('RGB') || jsonData.original_filename.includes('rgb'))) {
      color = 'RGB';
    }
    
    // PNG filename (use simplified name)
    const pngFilename = jsonData.simplified_filename || jsonData.original_filename;
    
    return NextResponse.json({
      success: true,
      element: elementName,
      character: characterName,
      team: team,
      genes: genes,
      color: color,
      rarity: rarity,
      filename: pngFilename,
      stats: jsonData.stats || {
        strength: 0,
        speed: 0,
        skill: 0,
        stamina: 0,
        stealth: 0,
        style: 0
      },
      assetNumber: jsonData.asset_number,
      folderNumber: jsonData.folder_number,
      category: jsonData.category
    });
    
  } catch (error) {
    console.error(`Error processing asset details for ${layer}-${variant}:`, error);
    return NextResponse.json({
      success: true,
      element: `Element ${variant}`,
      character: '',
      genes: '',
      color: '',
      rarity: 'Common',
      error: String(error)
    });
  }
}

// Helper function to map layer numbers to folder names
function getFolderNameFromLayer(layer: string): string {
  const layerMap: { [key: string]: string } = {
    '01': 'Logo',
    '02': 'Copyright',
    '04': 'Team',
    '05': 'Interface',
    '06': 'Effects',
    '07': 'Right-Weapon',
    '08': 'Left-Weapon',
    '09': 'Horns',
    '10': 'Hair',
    '11': 'Mask',
    '12': 'Top',
    '13': 'Boots',
    '14': 'Jewellery',
    '15': 'Accessories',
    '16': 'Bra',
    '17': 'Bottom',
    '18': 'Face',
    '19': 'Underwear',
    '20': 'Arms',
    '21': 'Body',
    '22': 'Back',
    '23': 'Rear-Horns',
    '24': 'Rear-Hair',
    '26': 'Decals',
    '27': 'Banner',
    '28': 'Glow',
    '29': 'Background'
  };
  
  return layerMap[layer] || '';
} 