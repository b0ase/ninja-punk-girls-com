'use server';

import { NextResponse } from 'next/server';
import fetch from 'node-fetch'; // Use node-fetch for server-side API calls

// Define the expected structure of the request body
interface GenerateRequest {
  prompt: string;
  width?: number;
  height?: number;
}

// Define the expected structure of the Stability AI API response
interface StabilitySuccessResponse {
  image: string; // Base64 encoded image data
  finish_reason: string;
  seed: number;
}
interface StabilityErrorResponse {
  errors: string[];
  name: string;
  id: string;
}

// Default dimensions if not provided by client
const DEFAULT_WIDTH = 512; // Use powers of 2 if possible, check Stability constraints
const DEFAULT_HEIGHT = 768;

export async function POST(request: Request) {
  console.log('[API /generate-background] Received POST request');

  let reqBody: GenerateRequest;
  try {
    reqBody = await request.json();
    console.log('[API /generate-background] Request body parsed:', { prompt: reqBody.prompt, width: reqBody.width, height: reqBody.height });
  } catch (error) {
    console.error('[API /generate-background] Error parsing request body:', error);
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { prompt, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = reqBody;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
  }

  // --- API Key Handling (Simplified) ---
  const apiKeyToUse = process.env.STABILITY_API_KEY;

  if (!apiKeyToUse) {
    console.error('[API /generate-background] Server STABILITY_API_KEY is not configured.');
    return NextResponse.json({ success: false, error: 'Background generation is not configured on the server.' }, { status: 500 }); // Use 500 for server config error
  }

  // --- Call Stability AI API ---
  const apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/sd3'; // SD3 endpoint
  const boundary = `boundary-${Date.now()}`;

  // Construct multipart/form-data payload manually using node-fetch capabilities
  let body = ''
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="prompt"\r\n\r\n`
  body += `${prompt}\r\n`
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="output_format"\r\n\r\n`
  body += `jpeg\r\n` // Request jpeg format
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="aspect_ratio"\r\n\r\n`
  // Calculate aspect ratio based on requested width/height (or defaults)
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const commonDivisor = gcd(width, height);
  const aspectRatio = `${width / commonDivisor}:${height / commonDivisor}`;
  body += `${aspectRatio}\r\n`
  body += `--${boundary}--\r\n`

  try {
    console.log(`[API /generate-background] Calling Stability AI (${apiUrl}) with prompt: "${prompt}", aspect_ratio: "${aspectRatio}"`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKeyToUse}`,
        Accept: 'application/json', // We want JSON response containing base64 image
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    console.log(`[API /generate-background] Stability AI response status: ${response.status}`);

    if (!response.ok) {
      // Use 'any' type for error data when parsing non-ok response JSON
      const errorData: any = await response.json(); 
      console.error('[API /generate-background] Stability AI Error:', errorData);
      // Check if errors array exists before trying to join
      const errorMessage = Array.isArray(errorData?.errors) ? errorData.errors.join(', ') : `API Error (${response.status})`;
      return NextResponse.json({ success: false, error: errorMessage }, { status: response.status });
    }

    const successData: any = await response.json();

    // Check if the expected 'image' field is present (based on the successful return path)
    // Log the full response if 'image' is missing or if artifacts indicates filtering
    if (!successData.image) {
      console.error('[API /generate-background] Stability AI call successful, but expected "image" field missing or other issue.');
      // Log the full response to understand why
      console.error('[API /generate-background] Full Stability AI response:', JSON.stringify(successData, null, 2)); // Pretty print JSON
      
      // Determine a more specific error based on finish_reason if available
      let errorMessage = 'No image returned from Stability AI.';
      if (successData.artifacts && Array.isArray(successData.artifacts) && successData.artifacts.length > 0 && successData.artifacts[0].finish_reason) {
          errorMessage += ` Finish Reason: ${successData.artifacts[0].finish_reason}`;
          if (successData.artifacts[0].finish_reason === 'CONTENT_FILTERED') {
              errorMessage += ' (Prompt may have violated safety guidelines)';
          }
      } else if (successData.finish_reason) { // Check top-level finish_reason too (API structure might vary)
          errorMessage += ` Finish Reason: ${successData.finish_reason}`;
          if (successData.finish_reason === 'CONTENT_FILTERED') {
            errorMessage += ' (Prompt may have violated safety guidelines)';
          }
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }

    // Return the base64 image data directly (assuming 'image' field is correct path)
    console.log('[API /generate-background] Stability AI call successful, returning image data.');
    return NextResponse.json({
      success: true,
      imageData: `data:image/jpeg;base64,${successData.image}`,
      seed: successData.seed,
    });

  } catch (error: any) {
    console.error('[API /generate-background] CRITICAL ERROR calling Stability AI:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate background due to server error.' }, { status: 500 });
  }
} 