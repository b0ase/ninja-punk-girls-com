import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const pattern = searchParams.get('pattern');

    if (!folder || !pattern) {
      return NextResponse.json(
        { success: false, error: 'Missing folder or pattern parameter' },
        { status: 400 }
      );
    }

    // Sanitize folder name to prevent directory traversal
    const sanitizedFolder = folder.replace(/\.\./g, '');
    const folderPath = path.join(process.cwd(), 'public', 'assets', sanitizedFolder);

    // Check if directory exists
    if (!fs.existsSync(folderPath)) {
      console.error(`Folder not found: ${sanitizedFolder}`);
      return NextResponse.json(
        { success: false, error: `Folder not found: ${sanitizedFolder}` },
        { status: 404 }
      );
    }

    // Get all files in the directory
    const files = fs.readdirSync(folderPath);

    // Find the first file that starts with the pattern
    const matchingFile = files.find(file => file.startsWith(pattern));

    if (matchingFile) {
      // Return the full file path relative to public directory
      return NextResponse.json({
        success: true,
        filePath: `/assets/${sanitizedFolder}/${matchingFile}`
      });
    } else {
      console.error(`No files match pattern: ${pattern} in folder: ${sanitizedFolder}`);
      return NextResponse.json(
        { success: false, error: `No files match pattern: ${pattern} in folder: ${sanitizedFolder}` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error finding asset:', error);
    return NextResponse.json(
      { success: false, error: 'Server error finding asset' },
      { status: 500 }
    );
  }
} 