import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const layer = searchParams.get('layer');
    const variant = searchParams.get('variant');

    if (!layer || !variant) {
      return NextResponse.json(
        { success: false, error: 'Missing layer or variant parameter' },
        { status: 400 }
      );
    }

    // Determine folder name based on layer number
    const folderName = getDirectoryByLayerNumber(layer);
    if (!folderName) {
      // Return a basic successful response anyway to avoid blocking the UI
      return NextResponse.json({
        success: true,
        element: `Element ${variant}`,
        character: '',
        genes: '',
        color: '',
        rarity: 'Common'
      });
    }
    
    // Try to find a matching file to extract details from
    try {
      const folderPath = path.join(process.cwd(), 'public', 'assets', folderName);
      
      // If directory doesn't exist, just return a basic response
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
      
      // Try to find a matching file
      const files = fs.readdirSync(folderPath);
      const matchPattern = `${layer}_${variant}`;
      const matchingFile = files.find(file => file.startsWith(matchPattern));
      
      if (!matchingFile) {
        // Return a simple response if no matching file
        console.warn(`No matching file found for pattern ${matchPattern} in ${folderName}`);
        return NextResponse.json({
          success: true,
          element: `Element ${variant}`,
          character: '',
          genes: '',
          color: '',
          rarity: 'Common'
        });
      }
      
      console.log(`Found matching file: ${matchingFile}`);
      
      // Found a matching file - extract information using the structure:
      // XX_YYY_LayerName_ElementName_Character_Genes_Color_Rarity_Stats...
      const parts = matchingFile.split('_');
      
      // Extract element name (typically part 3, index 2) - but only if not 'x'
      let elementName = '';
      if (parts.length > 2 && parts[2] !== 'x') {
        elementName = parts[2].replace(/-/g, ' ');
      }
      
      // If we have a proper element name in part 3 (index 3), use that instead
      if (parts.length > 3 && parts[3] !== 'x') {
        elementName = parts[3].replace(/-/g, ' ');
      }
      
      // Extract character name (typically part 4, index 4)
      let characterName = '';
      if (parts.length > 4 && parts[4] !== 'x') {
        characterName = parts[4];
      }
      
      // Extract genes (typically part 5, index 5)
      let genes = '';
      if (parts.length > 5 && parts[5] !== 'x') {
        genes = parts[5];
      }
      
      // Extract color (check for RGB tag anywhere in the filename)
      let color = '';
      if (matchingFile.includes('RGB') || matchingFile.includes('rgb')) {
        color = 'x';
      }
      
      // Extract rarity (typically comes after character and genes, or as a specific part)
      let rarity = 'Common';
      if (parts.length > 6) {
        const rarityKeywords = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'];
        const potentialRarity = parts.slice(6).find(part => 
          rarityKeywords.includes(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        );
        
        if (potentialRarity) {
          rarity = potentialRarity.charAt(0).toUpperCase() + potentialRarity.slice(1).toLowerCase();
        }
      }
      
      // Layer name is derived from the folder
      const layerName = folderName.split(' ').slice(1).join(' '); // Remove the number prefix
      
      return NextResponse.json({
        success: true,
        element: elementName || `${layerName} ${variant}`,
        character: characterName,
        genes: genes,
        color: color,
        rarity: rarity,
        filename: matchingFile, // Include the filename for debugging
        layerName: layerName
      });
    } catch (error) {
      // Return a simple response if anything goes wrong
      console.error(`Error processing ${folderName}:`, error);
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
  } catch (error) {
    // Return a simple success response even on error to prevent UI blocking
    console.error('Global error in asset-details API:', error);
    return NextResponse.json({
      success: true,
      element: 'Element',
      character: '',
      genes: '',
      color: '',
      rarity: 'Common',
      error: String(error)
    });
  }
}

// Simple mapping function to get folder name from layer number
function getDirectoryByLayerNumber(layerNum: string): string | null {
  const layerMap: Record<string, string> = {
    '29': '29 Background',
    '28': '28 Glow',
    '27': '27 Banner',
    '26': '26 Decals',
    '24': '24 Rear-Hair',
    '23': '23 Rear-Horns',
    '22': '22 Back',
    '21': '21 Body',
    '20': '20 Arms',
    '19': '19 Underwear',
    '18': '18 Face',
    '17': '17 Bottom',
    '16': '16 Bra',
    '15': '15 Accessories',
    '14': '14 Jewellery',
    '13': '13 Boots',
    '12': '12 Top',
    '11': '11 Mask',
    '10': '10 Hair',
    '09': '09 Horns',
    '08': '08 Left-Weapon',
    '07': '07 Right-Weapon',
    '06': '06 Effects',
    '05': '05 Interface',
    '04': '04 Team',
    '03': '03 Scores',
    '02': '02 Copyright',
    '01': '01 Logo'
  };
  
  return layerMap[layerNum] || null;
} 