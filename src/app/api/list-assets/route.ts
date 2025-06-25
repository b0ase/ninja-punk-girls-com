import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the structure for a file/directory node
interface FileNode {
  name: string;
  path: string; // Relative path from the requested root directory
  type: 'file' | 'directory';
  children?: FileNode[];
}

// Recursive function to list directory contents
function listDirectoryRecursive(dirPath: string, relativePath: string = ''): FileNode[] {
  const nodes: FileNode[] = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    // Sort items alphabetically, directories first
    items.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      // Skip hidden files/directories like .DS_Store
      if (item.name.startsWith('.')) {
        continue;
      }

      const currentPath = path.join(relativePath, item.name);
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        nodes.push({
          name: item.name,
          path: currentPath,
          type: 'directory',
          children: listDirectoryRecursive(fullPath, currentPath), // Recurse
        });
      } else {
        nodes.push({
          name: item.name,
          path: currentPath,
          type: 'file',
        });
      }
    }
  } catch (error: any) {
    console.error(`Error reading directory ${dirPath}:`, error);
    // Return empty array or throw error, depending on desired handling
    // throw new Error(`Failed to read directory: ${dirPath}`); 
    return []; // Return empty on error for robustness
  }
  return nodes;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDirectory = searchParams.get('directory');

  if (!targetDirectory) {
    return NextResponse.json({ success: false, error: 'Missing "directory" query parameter' }, { status: 400 });
  }

  // Basic security check: prevent traversing up the directory tree
  if (targetDirectory.includes('..')) {
    return NextResponse.json({ success: false, error: 'Invalid directory path' }, { status: 400 });
  }

  // Construct the full path relative to the project root
  const projectRoot = process.cwd();
  const fullPath = path.join(projectRoot, targetDirectory);

  console.log(`[API list-assets] Requested directory: ${targetDirectory}, Full path: ${fullPath}`);

  try {
    // Check if the directory exists and is accessible
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      console.error(`[API list-assets] Directory not found or is not a directory: ${fullPath}`);
      return NextResponse.json({ success: false, error: `Directory not found: ${targetDirectory}` }, { status: 404 });
    }

    const fileTree = listDirectoryRecursive(fullPath);
    console.log(`[API list-assets] Successfully listed directory: ${targetDirectory}`);
    return NextResponse.json({ success: true, tree: fileTree }, { status: 200 });

  } catch (error: any) {
    console.error(`[API list-assets] Error processing request for ${targetDirectory}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to list directory contents' }, { status: 500 });
  }
} 