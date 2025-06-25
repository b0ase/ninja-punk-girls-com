import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // Or use global fetch if Next.js version supports it well for FormData server-side

const ANYTHING_WORLD_API_KEY = '9C7W33J-CNC4D9T-Q9Q9CV9-GPYC95M'; // User provided API Key
const ANYTHING_WORLD_API_HOST = 'https://api.anything.world';

export async function POST(request: NextRequest) {
    if (!ANYTHING_WORLD_API_KEY) {
        return NextResponse.json({ success: false, error: 'Anything World API key is not configured.' }, { status: 500 });
    }

    try {
        const requestBodyFormData = await request.formData();
        const imageFile = requestBodyFormData.get('image') as File | null;
        const imagePath = requestBodyFormData.get('imagePath') as string | null; // e.g., /assets/seriesX/image.png
        // const imageName = requestBodyFormData.get('imageName') as string || 'generated_3d_model'; // Optional: name for the model

        let imageBuffer: Buffer;
        let sourceFilename = 'uploaded_image.png';

        if (imageFile) {
            console.log("[Anything World API] Processing uploaded file:", imageFile.name);
            sourceFilename = imageFile.name;
            const arrayBuffer = await imageFile.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } else if (imagePath) {
            console.log("[Anything World API] Processing image from path:", imagePath);
            sourceFilename = imagePath.split('/').pop() || 'image_from_path.png';
            const fullImagePath = path.join(process.cwd(), 'public', imagePath);
            try {
                imageBuffer = await fs.readFile(fullImagePath);
            } catch (fileError) {
                console.error('[Anything World API] Error reading image from path:', fileError);
                return NextResponse.json({ success: false, error: 'Failed to read image from path.' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ success: false, error: 'No image file or image path provided.' }, { status: 400 });
        }

        const apiUrl = `${ANYTHING_WORLD_API_HOST}/image-to-3d`;
        
        const anythingWorldFormData = new FormData();
        anythingWorldFormData.append('image', new Blob([imageBuffer]), sourceFilename); // The API likely expects a file named 'image'
        // anythingWorldFormData.append('name', imageName); // Optional: if the API supports naming the model upon creation
        // Add any other required parameters by Anything World API, e.g., output format if configurable.

        console.log(`[Anything World API] Calling ${apiUrl} to generate 3D model from image: ${sourceFilename}`);

        const anythingWorldResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANYTHING_WORLD_API_KEY}`,
                // 'Accept': 'application/json', // Usually good to have, but check API spec
                // Content-Type is set automatically by FormData with node-fetch
            },
            body: anythingWorldFormData,
        });

        const responseData = await anythingWorldResponse.json() as any; // Expecting JSON response

        if (!anythingWorldResponse.ok) {
            console.error('[Anything World API] Error:', anythingWorldResponse.status, responseData);
            return NextResponse.json(
                { success: false, error: `Anything World API Error: ${responseData.message || responseData.detail || 'Unknown error'}`, details: responseData }, 
                { status: anythingWorldResponse.status }
            );
        }
        
        // According to docs, this should return a model_id for polling
        // The exact structure of success response needs to be confirmed from API behavior or more detailed docs.
        // Assuming it returns something like { ..., "model_id": "some_uuid", ... } or similar
        // For example, from their python lib: data = json.loads(make_response.content.decode("utf-8")) model_id = data["data"]["model_id"]
        // Let's assume the model_id is directly in responseData.model_id or responseData.id or responseData.data.model_id
        const modelId = responseData.model_id || responseData.id || responseData.data?.model_id;

        if (!modelId) {
            console.error('[Anything World API] No model_id found in response:', responseData);
            return NextResponse.json({ success: false, error: 'Anything World API did not return a model_id.', details: responseData }, { status: 500 });
        }

        console.log('[Anything World API] Successfully initiated 3D model generation. Model ID:', modelId);
        return NextResponse.json({ success: true, modelId: modelId });

    } catch (error: any) {
        console.error('[Anything World API] Error in generate-3d-from-image route:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error.' }, { status: 500 });
    }
} 