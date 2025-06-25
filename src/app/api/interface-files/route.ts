import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises'; // Use promises API for async/await
import path from 'path';

interface FileInfo {
  name: string;
  path: string;
}

export async function GET(request: NextRequest) {
  console.log('[API/Interface-Files] Received GET request');

  // Get directory and fileType from query parameters
  const searchParams = request.nextUrl.searchParams;
  const requestedDir = searchParams.get('directory'); // e.g., "public/element_cards" or "public/assets/05 Interface"
  const fileType = searchParams.get('fileType') || 'png'; // Default to 'png' if not specified

  if (!requestedDir) {
    return NextResponse.json(
        { success: false, error: "'directory' query parameter is required." }, 
        { status: 400 }
    );
  }

  // Construct the full path - IMPORTANT: Validate requestedDir to prevent path traversal
  // For now, assume it starts with 'public/' as a basic safety measure.
  if (!requestedDir.startsWith('public/')) {
       return NextResponse.json(
         { success: false, error: "Invalid directory specified. Must start with 'public/'." }, 
         { status: 400 }
       );
  }
  // Resolve the path relative to the project root
  const targetDir = path.join(process.cwd(), requestedDir);
  const publicBasePath = requestedDir.replace(/^public/, ''); // Path relative to public for URL construction

  try {
    console.log(`[API/Interface-Files] Reading directory: ${targetDir} for .${fileType} files`);
    const dirents = await fs.readdir(targetDir, { withFileTypes: true });

    const filesData = dirents
      .filter(dirent => dirent.isFile() && dirent.name.toLowerCase().endsWith(`.${fileType.toLowerCase()}`))
      .map((dirent): FileInfo => {
        return {
          name: dirent.name,
          // Construct the public URL path
          path: path.join(publicBasePath, dirent.name).replace(/\\/g, '/'), // Ensure forward slashes
        };
      });

    console.log(`[API/Interface-Files] Found ${filesData.length} .${fileType} files in ${requestedDir}.`);

    return NextResponse.json({ success: true, files: filesData });

  } catch (error: any) {
    console.error(`[API/Interface-Files] Error reading directory ${targetDir}:`, error);
    
    if (error.code === 'ENOENT') {
       return NextResponse.json(
         { success: false, error: `Directory not found: ${requestedDir}` }, 
         { status: 404 }
       );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to read directory files." },
      { status: 500 }
    );
  }
} 