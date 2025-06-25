import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabaseClient';

// === EXPORTED Interface ===
export interface ParsedFileInfo {
  directory: string;
  filename: string;
  layerNum?: string;
  assetNum?: string;
  type?: string;
  name?: string;
  character?: string;
  genes?: string;
  rarity?: string;
  filenameParts: string[];
  separators: string[];
  error?: string; // Optional error message
  id?: string; // Optional asset ID from DB
  sharedWith?: string[]; // Optional list of series IDs it's shared with
}

function parseFilenameForList(filename: string): Partial<ParsedFileInfo> {
  const parts = filename.replace(/\.png$/i, '').split('_').filter(part => part !== '');
  const metadata: Partial<ParsedFileInfo> = {};

  if (parts.length >= 1) metadata.layerNum = parts[0];
  if (parts.length >= 2) metadata.assetNum = parts[1];
  if (parts.length >= 3) metadata.type = parts[2];
  if (parts.length >= 4) metadata.name = parts[3];
  if (parts.length > 4 && parts[4] !== 'x') metadata.character = parts[4];
  if (parts.length > 5 && parts[5] !== 'x') metadata.genes = parts[5];
  
  const rarityIndex = parts.findIndex(part =>
    ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'].includes(part)
  );
  if (rarityIndex !== -1) metadata.rarity = parts[rarityIndex];

  if (!metadata.name) metadata.name = filename.replace(/\.png$/i, '');
  
  return metadata;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('seriesId');

  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const allFilesData: ParsedFileInfo[] = [];

  try {
    let directoriesToScan: string[];

    if (seriesId) {
      // If seriesId is provided, only scan that directory
      const seriesDirPath = path.join(assetsDir, seriesId);
      if (fs.existsSync(seriesDirPath) && fs.statSync(seriesDirPath).isDirectory()) {
        directoriesToScan = [seriesId];
      } else {
        // Series directory not found, return empty or error
        console.warn(`Series directory not found: ${seriesDirPath}`);
        // Return empty list if specific series not found, or handle as an error
        return NextResponse.json({ success: true, data: [] }); 
      }
    } else {
      // If no seriesId, scan all directories as before
      directoriesToScan = fs.readdirSync(assetsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    }

    for (const dir of directoriesToScan) {
      const dirPath = path.join(assetsDir, dir);
      try {
        const files = fs.readdirSync(dirPath)
          .filter(file => !fs.statSync(path.join(dirPath, file)).isDirectory() && file.endsWith('.png'));
        
        files.forEach(file => {
          const parsedData = parseFilenameForList(file);
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