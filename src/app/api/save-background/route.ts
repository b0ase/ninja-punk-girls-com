'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Define expected request body structure
interface SaveRequest {
  imageData: string; // Expecting data URI: "data:image/jpeg;base64,..."
  filename: string;
  prompt?: string; // Optional: Prompt used for generation
  seed?: number; // Optional: Seed used for generation
  seriesId?: string | null; // Optional: UUID of the series concept
}

// Ensure environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase URL or Service Key is not set in environment variables.");
  // Optionally throw an error or handle it gracefully during runtime
}

// Initialize Supabase client with Service Role Key
// IMPORTANT: Only use the service key on the server-side!
const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder-service-key',
    {
        auth: { persistSession: false } // Don't persist auth sessions for admin client
    }
);

const BUCKET_NAME = 'generated-backgrounds'; // Match the bucket name you created

// Sanitize filename function (reuse or place in a shared utils file later)
const sanitizeFilename = (originalName: string): string => {
    // Ensure .jpg extension, remove others, sanitize
    const nameWithoutExt = originalName.replace(/\.\w+$/, ''); // Remove existing extension
    const sanitizedBase = nameWithoutExt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    return `${sanitizedBase || 'generated_background'}.jpeg`; // Force .jpeg
};

export async function POST(request: Request) {
  console.log('[API /save-background] Received POST request');

  const cookieStore = cookies();
  const supabaseUserClient = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

  if (userError || !user) {
      console.error('[API /save-background] Authentication error:', userError);
      return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
  }
  console.log(`[API /save-background] Authenticated user ID: ${user.id}`);

  if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Server configuration error: Supabase keys not set.' }, { status: 500 });
  }

  let reqBody: SaveRequest;
  try {
    reqBody = await request.json();
    if (!reqBody.imageData || !reqBody.filename) {
      throw new Error('Missing imageData or filename in request body.')
    }
    console.log(`[API /save-background] Request body parsed for filename: ${reqBody.filename}, seriesId: ${reqBody.seriesId}`);
  } catch (error: any) {
    console.error('[API /save-background] Error parsing request body:', error);
    return NextResponse.json({ success: false, error: `Invalid request body: ${error.message}` }, { status: 400 });
  }

  const { imageData, filename, prompt, seed, seriesId } = reqBody;
  const finalFilename = sanitizeFilename(filename);

  // Extract base64 data and determine content type
  let base64Data: string;
  let contentType: string = 'image/jpeg'; // Assume jpeg if parsing fails or default
  try {
    const match = imageData.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match || match.length < 3) {
      console.warn('[API /save-background] Could not parse content type from image data URI, defaulting to image/jpeg.');
      // Handle case where header might be missing but data is valid base64
      if (imageData.startsWith('data:')) {
         base64Data = imageData.split(',')[1]; // Attempt to get data after comma
      } else {
         base64Data = imageData; // Assume it's just base64
      }
      if (!base64Data) throw new Error('Invalid image data format.');

    } else {
      contentType = match[1]; 
      base64Data = match[2];
    }
    console.log(`[API /save-background] Extracted content type: ${contentType}`);
  } catch (error: any) {
     console.error('[API /save-background] Error parsing image data URI:', error);
     return NextResponse.json({ success: false, error: `Invalid image data: ${error.message}` }, { status: 400 });
  }

  // Convert base64 to Buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // --- Store file path including user ID for better organization ---
  // Example: user_uuid/series_uuid_or_unsaved/sanitized_filename.jpeg
  const seriesFolder = seriesId ? seriesId : 'unsaved';
  const filePath = `${user.id}/${seriesFolder}/${finalFilename}`; 
  // --- End file path modification ---

  console.log(`[API /save-background] Attempting to upload to Supabase bucket: ${BUCKET_NAME}, path: ${filePath}`);

  try {
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: true, // Overwrite if file with the same name exists
      });

    if (uploadError) {
      console.error('[API /save-background] Supabase upload error:', uploadError);
      throw uploadError;
    }

    console.log('[API /save-background] Supabase upload successful:', uploadData);

    // Get the public URL (even for private buckets, this structure is needed for signed URLs later)
    // Note: This URL won't work directly if the bucket is private without RLS/signed URL.
    const { data: urlData } = supabaseAdmin
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
    const publicUrl = urlData?.publicUrl;
    console.log(`[API /save-background] Supabase public URL: ${publicUrl}`);

    // --- Insert Metadata into Database ---
    console.log('[API /save-background] Inserting metadata into saved_backgrounds table using user client...');
    const { data: dbInsertData, error: dbInsertError } = await supabaseUserClient
        .from('saved_backgrounds')
        .insert({
            user_id: user.id, // The authenticated user's ID
            series_id: seriesId || null, // Use provided seriesId or null
            name: filename, // Use the potentially un-sanitized name from user input
            prompt: prompt || null, // Store the prompt if provided
            seed: seed || null, // Store the seed if provided
            image_url: publicUrl, // Store the public URL from storage
            // id and created_at have defaults in the DB
        });

    if (dbInsertError) {
        console.error('[API /save-background] Database insert error:', dbInsertError);
        // Optional: Attempt to delete the file from storage if DB insert fails? (More complex cleanup)
        // await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
        throw new Error(`Failed to save background metadata: ${dbInsertError.message}`);
    }
    console.log('[API /save-background] Metadata saved successfully to database.');
    // --- End Insert Metadata ---

    return NextResponse.json({
      success: true,
      message: 'Background saved successfully.',
      path: uploadData.path, // Path within the bucket
      supabaseUrl: publicUrl // Return the public URL
    });

  } catch (error: any) {
    console.error('[API /save-background] CRITICAL ERROR saving background:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to save background due to server error.' }, { status: 500 });
  }
}

// --- GET Handler to fetch saved backgrounds ---
export async function GET(request: Request) {
    console.log('[API /save-background] Received GET request');

    const cookieStore = cookies();
    const supabaseUserClient = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
        console.error('[API /save-background GET] Authentication error:', userError);
        return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
    }
    console.log(`[API /save-background GET] Authenticated user ID: ${user.id}`);

    try {
        console.log(`[API /save-background GET] Fetching backgrounds for user ${user.id}`);
        const { data: backgrounds, error: fetchError } = await supabaseUserClient
            .from('saved_backgrounds')
            .select('*') // Select all columns for now
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }); // Optional: Order by most recent

        if (fetchError) {
            console.error(`[API /save-background GET] Error fetching backgrounds for user ${user.id}:`, fetchError);
            throw fetchError;
        }

        console.log(`[API /save-background GET] Found ${backgrounds?.length ?? 0} backgrounds for user ${user.id}.`);
        return NextResponse.json({ success: true, data: backgrounds || [] }, { status: 200 });

    } catch (error: any) {
        console.error('[API /save-background GET] Error fetching backgrounds:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to fetch backgrounds.' }, { status: 500 });
    }
} 