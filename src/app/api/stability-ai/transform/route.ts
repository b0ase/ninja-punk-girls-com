import { NextResponse, NextRequest } from 'next/server';
// import formidable from 'formidable'; // Removed: formidable is not needed
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // Stability AI API likely needs node-fetch in Next.js Edge/Node.js runtime
import sharp from 'sharp'; // Import sharp

// Ensure this is set in your environment variables
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const STABILITY_API_HOST = 'https://api.stability.ai'; // Or the correct host

// You might need to adjust this type based on what Stability AI expects and returns
interface StabilityAIResponse {
    artifacts: Array<{
        base64: string;
        seed: number;
        finishReason: string;
    }>;
}

const ALLOWED_SDXL_DIMENSIONS = [
    { width: 1024, height: 1024 }, { width: 1152, height: 896 }, { width: 1216, height: 832 },
    { width: 1344, height: 768 }, { width: 1536, height: 640 }, { width: 640, height: 1536 },
    { width: 768, height: 1344 }, { width: 832, height: 1216 }, { width: 896, height: 1152 },
];

async function resizeImageToValidSDXLDimensions(imageBuffer: Buffer): Promise<Buffer> {
    try {
        const image = sharp(imageBuffer);
        const metadata = await image.metadata();

        if (!metadata.width || !metadata.height) {
            throw new Error('Could not read image dimensions.');
        }

        const isAlreadyValid = ALLOWED_SDXL_DIMENSIONS.some(
            dim => dim.width === metadata.width && dim.height === metadata.height
        );

        if (isAlreadyValid) {
            console.log('[Stability AI API] Image dimensions are already valid for SDXL.');
            return imageBuffer; // No resize needed
        }

        console.log(`[Stability AI API] Original dimensions: ${metadata.width}x${metadata.height}. Resizing to closest SDXL allowed dimensions.`);

        const originalAspectRatio = metadata.width / metadata.height;
        let bestFit = ALLOWED_SDXL_DIMENSIONS[0]; // Default to 1024x1024
        let minAspectRatioDiff = Infinity;

        for (const dim of ALLOWED_SDXL_DIMENSIONS) {
            const targetAspectRatio = dim.width / dim.height;
            const diff = Math.abs(originalAspectRatio - targetAspectRatio);
            if (diff < minAspectRatioDiff) {
                minAspectRatioDiff = diff;
                bestFit = dim;
            }
        }
        
        console.log(`[Stability AI API] Resizing to: ${bestFit.width}x${bestFit.height} (closest aspect ratio)`);

        // Resize, using 'cover' to fill the dimensions, cropping if necessary.
        // 'contain' would pad, 'fill' would ignore aspect ratio.
        // 'inside' resizes to fit within dimensions, maintaining AR, but SDXL needs exact.
        return image.resize(bestFit.width, bestFit.height, { fit: 'cover' }).toBuffer();

    } catch (error) {
        console.error("[Stability AI API] Error resizing image:", error);
        throw error; // Re-throw to be caught by the main handler
    }
}

// Removed config for bodyParser, as request.formData() will be used.
// export const config = {
//     api: {
//         bodyParser: false, 
//     },
// };

// Removed processUploadedFile helper, direct handling in POST

export async function POST(request: NextRequest) {
    if (!STABILITY_API_KEY) {
        return NextResponse.json({ success: false, error: 'Stability AI API key is not configured.' }, { status: 500 });
    }

    try {
        const requestBodyFormData = await request.formData(); 
        const imageFile = requestBodyFormData.get('image') as File | null;
        const imagePath = requestBodyFormData.get('imagePath') as string | null;
        const prompt = requestBodyFormData.get('prompt') as string || 'A beautiful artistic interpretation of the image.';
        const stylePreset = requestBodyFormData.get('stylePreset') as string | null;
        // Read imageStrength from form data, default to 0.35 if not provided or invalid
        const imageStrengthString = requestBodyFormData.get('imageStrength') as string | null;
        let imageStrength = 0.35;
        if (imageStrengthString) {
            const parsedStrength = parseFloat(imageStrengthString);
            if (!isNaN(parsedStrength) && parsedStrength >= 0.0 && parsedStrength <= 1.0) {
                imageStrength = parsedStrength;
            }
        }

        let sourceImageBuffer: Buffer;

        if (imageFile) {
            console.log("[Stability AI API] Processing uploaded file:", imageFile.name);
            const arrayBuffer = await imageFile.arrayBuffer();
            sourceImageBuffer = Buffer.from(arrayBuffer);
        } else if (imagePath) {
            console.log("[Stability AI API] Processing image from path:", imagePath);
            const fullImagePath = path.join(process.cwd(), 'public', imagePath);
            try {
                sourceImageBuffer = await fs.readFile(fullImagePath);
            } catch (fileError) {
                console.error('Error reading image from path:', fileError);
                return NextResponse.json({ success: false, error: 'Failed to read image from path.' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ success: false, error: 'No image file or image path provided.' }, { status: 400 });
        }

        // Resize image if necessary
        const finalImageBuffer = await resizeImageToValidSDXLDimensions(sourceImageBuffer);

        const engineId = 'stable-diffusion-xl-1024-v1-0'; 
        const apiUrl = `${STABILITY_API_HOST}/v1/generation/${engineId}/image-to-image`;

        const stabilityFormData = new FormData();
        stabilityFormData.append('init_image', new Blob([finalImageBuffer]), imageFile?.name || 'init_image.png');
        stabilityFormData.append('init_image_mode', 'IMAGE_STRENGTH');
        stabilityFormData.append('image_strength', imageStrength.toString()); // Use the received or default imageStrength
        stabilityFormData.append('text_prompts[0][text]', prompt);
        stabilityFormData.append('text_prompts[0][weight]', '1');
        stabilityFormData.append('cfg_scale', '7');
        stabilityFormData.append('samples', '1');
        stabilityFormData.append('steps', '30');
        if (stylePreset) {
            stabilityFormData.append('style_preset', stylePreset);
        }

        console.log("[Stability AI API] Calling Stability AI with prompt:", prompt, "Style:", stylePreset || 'default');

        const stabilityResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${STABILITY_API_KEY}`,
                Accept: 'application/json',
            },
            body: stabilityFormData,
        });

        if (!stabilityResponse.ok) {
            const errorText = await stabilityResponse.text();
            console.error('Stability AI API error:', stabilityResponse.status, errorText);
            // Try to parse the error JSON if possible for a cleaner message
            try {
                const errorJson = JSON.parse(errorText);
                return NextResponse.json({ success: false, error: `Stability AI API Error: ${errorJson.message || errorText}`, details: errorJson }, { status: stabilityResponse.status });
            } catch (e) {
                return NextResponse.json({ success: false, error: `Stability AI API Error: ${errorText}` }, { status: stabilityResponse.status });
            }
        }

        const responseData = await stabilityResponse.json() as StabilityAIResponse;

        if (responseData.artifacts && responseData.artifacts.length > 0) {
            const imageBase64 = responseData.artifacts[0].base64;
            return NextResponse.json({ success: true, imageBase64: imageBase64 });
        } else {
            return NextResponse.json({ success: false, error: 'No image artifact returned from Stability AI.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error in Stability AI transform route:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error.' }, { status: 500 });
    }
} 