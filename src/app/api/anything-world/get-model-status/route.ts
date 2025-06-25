import { NextResponse, NextRequest } from 'next/server';
import fetch from 'node-fetch';

const ANYTHING_WORLD_API_KEY = '9C7W33J-CNC4D9T-Q9Q9CV9-GPYC95M'; // User provided API Key
const ANYTHING_WORLD_API_HOST = 'https://api.anything.world';

// Basic interface for the expected polling response. This should be refined based on actual API output.
interface AnythingWorldPollResponse {
    // Common fields, might include status, stage, progress, error messages, etc.
    status?: string; 
    stage?: string; 
    progress?: number;
    message?: string;
    detail?: string;
    // If successful and model is ready, it might contain model details
    // This structure is a guess based on library model responses & common patterns.
    // It will need verification with actual image-to-3d completion responses.
    id?: string; // model_id itself
    name?: string;
    type?: string; // e.g., "user-generated-model"
    files?: {
        gltf?: string;
        glb?: string; 
        usdz?: string;
        fbx?: string;
        // ... other file types
    };
    model?: { // Nested structure as seen in their library example for /anything endpoint
        parts?: any; // Adjust as needed
        animations?: any;
        [key: string]: any; // For other potential fields
    };
    data?: any; // Fallback for nested data structures
    [key: string]: any; // Allow other top-level fields
}

export async function GET(request: NextRequest) {
    if (!ANYTHING_WORLD_API_KEY) {
        return NextResponse.json({ success: false, error: 'Anything World API key is not configured.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('model_id');

    if (!modelId) {
        return NextResponse.json({ success: false, error: 'model_id query parameter is required.' }, { status: 400 });
    }

    // The documentation mentions /user-generated-model for polling status of generated models.
    // It also mentions /user-processed-model with a 'stage' parameter for other types of processing.
    // For image-to-3d, /user-generated-model seems to be the one.
    const apiUrl = `${ANYTHING_WORLD_API_HOST}/user-generated-model?model_id=${modelId}`; 
    // Note: The API key for this endpoint might be passed as a header or a query param.
    // The main doc example (https://api.anything.world/anything?key=<API_KEY>&name=<NAME>) uses a 'key' query param.
    // Let's try with 'key' query param first as it's common for GET requests if not specified as Bearer token.
    // If that fails, we might need to use Authorization: Bearer header.
    // The endpoint /image-to-3d used Bearer, so it's more likely this one does too.
    // Let's stick to Bearer token for consistency with the POST request.

    console.log(`[Anything World API] Polling status for model_id: ${modelId} at ${apiUrl}`);

    try {
        const anythingWorldResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANYTHING_WORLD_API_KEY}`,
                'Accept': 'application/json',
            },
        });

        // Using the defined interface for better type safety, though it's a preliminary structure.
        const responseData = await anythingWorldResponse.json() as AnythingWorldPollResponse;

        if (!anythingWorldResponse.ok) {
            console.error('[Anything World API] Error polling status:', anythingWorldResponse.status, responseData);
            return NextResponse.json(
                { success: false, error: `Anything World API Error: ${responseData.message || responseData.detail || 'Unknown error'}`, details: responseData }, 
                { status: anythingWorldResponse.status }
            );
        }
        
        // The response structure for a completed model needs to be known to extract the actual .glb or model URL.
        // Example from docs for a library model: responseData.model.parts.body etc.
        // For a generated model, it might be different. We're looking for a stage indicating completion and model URLs.
        // Common status indicators: "processing", "completed", "done", "succeeded", "failed".
        // Common model URL fields: "url", "download_url", "asset_url", "files.glb"
        
        console.log('[Anything World API] Status received for model_id:', modelId, JSON.stringify(responseData, null, 2));
        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        console.error('[Anything World API] Error in get-model-status route:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error.' }, { status: 500 });
    }
} 