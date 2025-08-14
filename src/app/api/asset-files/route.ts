import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// === EXPORTED Interface ===
export interface ParsedFileInfo {
  directory: string;
  filename: string;
  layerNum?: string;
  assetNum?: string;
  type?: string;
  name?: string;
  character?: string;
  team?: string;
  genes?: string;
  rarity?: string;
  filenameParts: string[];
  separators: string[];
  error?: string; // Optional error message
  id?: string; // Optional asset ID from DB
  sharedWith?: string[]; // Optional list of series IDs it's shared with
  // JSON data fields
  folder_number?: string;
  category?: string;
  item_name?: string;
  stats?: {
    strength: number;
    speed: number;
    skill: number;
    stamina: number;
    stealth: number;
    style: number;
  };
  original_filename?: string;
  simplified_filename?: string;
}

function loadAssetMetadata(dirPath: string, filename: string): Partial<ParsedFileInfo> {
  try {
    // Find corresponding JSON file
    const baseName = filename.replace(/\.png$/i, '');
    const jsonFilename = `${baseName}.json`;
    const jsonPath = path.join(dirPath, jsonFilename);
    
    if (fs.existsSync(jsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      
      return {
        layerNum: jsonData.folder_number,
        assetNum: jsonData.asset_number,
        type: jsonData.category,
        name: jsonData.item_name,
        character: jsonData.character || undefined,
        team: jsonData.team || undefined,
        genes: jsonData.genes || undefined,
        rarity: jsonData.rarity || undefined,
        folder_number: jsonData.folder_number,
        category: jsonData.category,
        item_name: jsonData.item_name,
        stats: jsonData.stats,
        original_filename: jsonData.original_filename,
        simplified_filename: jsonData.simplified_filename
      };
    } else {
      // Fallback to basic filename parsing if JSON not found
      const parts = filename.replace(/\.png$/i, '').split('_').filter(part => part !== '');
      const metadata: Partial<ParsedFileInfo> = {};

      if (parts.length >= 1) metadata.layerNum = parts[0];
      if (parts.length >= 2) metadata.assetNum = parts[1];
      if (parts.length >= 3) metadata.type = parts[2];
      if (parts.length >= 4) metadata.name = parts[3];
      if (parts.length > 4 && parts[4] !== 'x') metadata.character = parts[4];
      if (parts.length > 5 && parts[5] !== 'x') metadata.team = parts[5];
      if (parts.length > 6 && parts[6] !== 'x') metadata.genes = parts[6];
      
      const rarityIndex = parts.findIndex(part =>
        ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'].includes(part)
      );
      if (rarityIndex !== -1) metadata.rarity = parts[rarityIndex];

      if (!metadata.name) metadata.name = filename.replace(/\.png$/i, '');
      
      return metadata;
    }
  } catch (error) {
    console.error(`Error loading metadata for ${filename}:`, error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets');
    
    if (!fs.existsSync(assetsDir)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Assets directory not found' 
      }, { 
        status: 404 
      });
    }

    const allFilesData: ParsedFileInfo[] = [];

    // Get all directories in assets folder
    const directoriesToScan = fs.readdirSync(assetsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const dir of directoriesToScan) {
      const dirPath = path.join(assetsDir, dir);
      try {
        const files = fs.readdirSync(dirPath)
          .filter(file => !fs.statSync(path.join(dirPath, file)).isDirectory() && file.endsWith('.png'));
        
        files.forEach(file => {
          const parsedData = loadAssetMetadata(dirPath, file);
          const filenameBase = file.replace(/\.png$/i, '');
          const filenameParts = filenameBase.split('_').filter(part => part !== '');
          const separators = filenameParts.length > 1 ? Array(filenameParts.length - 1).fill('_') : [];
          
          allFilesData.push({ 
            directory: dir, 
            filename: file, 
            ...parsedData,
            filenameParts: filenameParts, 
            separators: separators
          });
        });
      } catch (readDirError) {
        console.error(`Error reading directory ${dirPath}:`, readDirError);
      }
    }

    allFilesData.sort((a, b) => {
        if (a.directory < b.directory) return -1;
        if (a.directory > b.directory) return 1;
        if (a.filename < b.filename) return -1;
        if (a.filename > b.filename) return 1;
        return 0;
    });

    return NextResponse.json({ success: true, data: allFilesData });

  } catch (error: any) {
    console.error('Error listing asset files:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to list asset files', 
      details: error.message 
    }, { 
      status: 500 
    });
  }
} 