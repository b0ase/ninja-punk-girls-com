'use server';

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import { Buffer } from 'buffer';

// Define the target directory relative to the project root
const uploadDir = path.join(process.cwd(), 'public', 'assets', '05 Interface');

// Ensure the upload directory exists
const ensureUploadDirExists = async () => {
  try {
    await fs.access(uploadDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadDir, { recursive: true });
      console.log(`Created upload directory: ${uploadDir}`);
    } else {
      throw error; // Re-throw other errors
    }
  }
};

// Sanitize filename function
const sanitizeFilename = (originalName: string): string => {
  return originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
};

export async function POST(request: Request) {
  console.log('[API /upload-interface] Received POST request (using formData)');
  await ensureUploadDirExists();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null; // Assuming input name is 'file'

    if (!file) {
      console.error('[API /upload-interface] No file found in formData.');
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    // --- Basic Validation ---
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.warn(`[API /upload-interface] File rejected (invalid type): ${file.name}, MIME: ${file.type}`);
      return NextResponse.json({ success: false, error: 'Invalid file type. Only PNG, JPG, JPEG allowed.' }, { status: 400 });
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
       console.warn(`[API /upload-interface] File rejected (too large): ${file.name}, Size: ${file.size}`);
      return NextResponse.json({ success: false, error: `File too large. Max size is ${maxSize / 1024 / 1024}MB.` }, { status: 400 });
    }
    // --- End Validation ---

    const originalFilename = file.name;
    const finalFilename = sanitizeFilename(originalFilename);
    const finalFilePath = path.join(uploadDir, finalFilename);

    console.log(`[API /upload-interface] Processing file: ${originalFilename} -> ${finalFilename}`);

    // Get file content as buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get image dimensions from buffer
    let dimensions;
    try {
      console.log(`[API /upload-interface] Attempting to get dimensions from buffer for: ${finalFilename}`);
      dimensions = sizeOf(buffer);
      console.log(`[API /upload-interface] Successfully got dimensions raw:`, dimensions);
      if (!dimensions || !dimensions.width || !dimensions.height) {
         console.error(`[API /upload-interface] sizeOf returned invalid dimensions from buffer:`, dimensions);
        throw new Error('Could not read image dimensions from buffer.');
      }
      console.log(`[API /upload-interface] Dimensions for ${finalFilename}: ${dimensions.width}x${dimensions.height}`);
    } catch (dimError: any) {
      console.error(`[API /upload-interface] Error getting dimensions for ${finalFilename} from buffer:`, dimError);
      // No file to clean up yet, just return error
      return NextResponse.json({ success: false, error: `Failed to read image dimensions: ${dimError.message}` }, { status: 400 });
    }

    // Save the file
    try {
      await fs.writeFile(finalFilePath, buffer);
      console.log(`[API /upload-interface] File saved successfully to: ${finalFilePath}`);
    } catch (writeError: any) {
       console.error(`[API /upload-interface] Error writing file to ${finalFilePath}:`, writeError);
       return NextResponse.json({ success: false, error: `Failed to save file: ${writeError.message}` }, { status: 500 });
    }

    // Return success response
    console.log(`[API /upload-interface] Preparing success response for ${finalFilename}`);
    return NextResponse.json({
      success: true,
      file: {
        filename: finalFilename,
        width: dimensions.width,
        height: dimensions.height,
      },
    });

  } catch (error: any) {
    console.error('[API /upload-interface] CRITICAL ERROR in POST handler:', error);
    // Differentiate between form parsing errors and others
    if (error.message.includes('Could not parse content as FormData')) {
         return NextResponse.json({ success: false, error: 'Invalid form data received.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Failed to upload file due to server error.' }, { status: 500 });
  }
} 