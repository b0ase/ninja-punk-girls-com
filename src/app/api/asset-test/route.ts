import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const elementsDir = path.join(publicDir, 'assets', 'elements');
    
    // Check if the directory exists
    if (!fs.existsSync(elementsDir)) {
      return NextResponse.json({
        error: 'Elements directory not found',
        checkedPath: elementsDir
      }, { status: 404 });
    }
    
    // Get all files
    const files = fs.readdirSync(elementsDir);
    
    // Group files by layer number prefix
    const filesByLayer: Record<string, string[]> = {};
    
    files.forEach(file => {
      const match = file.match(/^(\d+)_/);
      if (match && match[1]) {
        const layerNum = match[1];
        if (!filesByLayer[layerNum]) {
          filesByLayer[layerNum] = [];
        }
        filesByLayer[layerNum].push(file);
      }
    });
    
    return NextResponse.json({
      success: true,
      elementsPath: elementsDir,
      totalFiles: files.length,
      filesByLayer,
      files: files.slice(0, 20) // Just show the first 20 for brevity
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch assets',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 