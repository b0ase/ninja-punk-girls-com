import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This endpoint helps prime the asset loading pipeline
// and fixes the first-click issue by pre-loading asset directory information
export async function GET() {
  try {
    // Get the assets directory
    const assetsDir = path.join(process.cwd(), 'public', 'assets');
    
    // Check if the directory exists
    if (!fs.existsSync(assetsDir)) {
      return NextResponse.json(
        { success: false, error: 'Assets directory not found' },
        { status: 404 }
      );
    }
    
    // Get all folders in the assets directory
    const folders = fs.readdirSync(assetsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // Count the total assets
    let totalAssets = 0;
    
    // Scan a few key directories to initialize the asset cache
    for (const folder of folders.slice(0, 5)) {  // Just check first 5 folders to be quick
      const folderPath = path.join(assetsDir, folder);
      try {
        const files = fs.readdirSync(folderPath);
        totalAssets += files.length;
      } catch (error) {
        console.error(`Error reading directory ${folder}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Assets initialized',
      folders: folders.length,
      sampleAssetCount: totalAssets
    });
  } catch (error) {
    console.error('Error initializing assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize assets' },
      { status: 500 }
    );
  }
} 