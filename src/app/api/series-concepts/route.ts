import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HandCashConnect } from '@handcash/handcash-connect';

// Define the expected request body structure (matches frontend state)
interface SeriesConceptData {
    name: string;
    description: string;
    style_keywords: string;
    color_notes: string;
    influences: string;
}

// Define the expected structure for PUT request body 
interface UpdateSeriesConceptData extends SeriesConceptData {
    seriesId: string; // Expect seriesId for updates
}

// --- Helper function to verify token and get user ID ---
async function verifyTokenAndGetUser(request: Request): Promise<{ userId: string; handle: string }> {
    // Initialize the required clients INSIDE the helper function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const handcashAppId = process.env.HANDCASH_APP_ID;
    const handcashAppSecret = process.env.HANDCASH_APP_SECRET;

    // Check for required config
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Supabase environment variables are missing! URL or Service Key");
        throw new Error("Server configuration error: Supabase credentials missing");
    }
    
    if (!handcashAppId || !handcashAppSecret) {
        console.error('HandCash App ID or Secret is missing from environment variables.');
        throw new Error("Server configuration error: HandCash credentials missing");
    }

    // Initialize Supabase admin client with verified credentials
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authorizationHeader = request.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw new Error('Authorization token is missing or invalid.');
    }
    const authToken = authorizationHeader.split(' ')[1];

    // --- HandCash Verification ---
    const handCashConnect = new HandCashConnect({ 
        appId: handcashAppId,
        appSecret: handcashAppSecret 
    });
    const cloudAccount = handCashConnect.getAccountFromAuthToken(authToken);
    const { publicProfile } = await cloudAccount.profile.getCurrentProfile();
    const handcashHandle = publicProfile.handle;

    // --- Fetch Supabase Auth User ID using handle from metadata ---
    // IMPORTANT: Replace inefficient listUsers scan with a more direct query if possible in production,
    // e.g., by adding an index on raw_user_meta_data->>'handle' or using a dedicated lookup table.
    console.log(`[verifyTokenAndGetUser] Looking up Supabase auth user for handle '${handcashHandle}' in metadata...`);
    
    // Example using listUsers (inefficient for large scale, but functional)
    // You might need to handle pagination if you have > 1000 users.
    const { data: usersResponse, error: findUserError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (findUserError) {
        console.error(`Error listing Supabase auth users for handle ${handcashHandle}:`, findUserError);
        throw new Error(findUserError.message || 'Database error fetching auth user.');
    }

    const authUser = usersResponse?.users.find(u => u.user_metadata?.handle === handcashHandle);

    if (!authUser) {
        // Case: No Supabase auth user found for this handle
        console.error(`No Supabase auth user found for handle: ${handcashHandle}`);
        // This indicates a potential issue with the signup/sync process in the callback route
        throw new Error('User authentication profile not found in Supabase auth system.');
    }

    // Case: Exactly one auth user found
    const userId = authUser.id;
    console.log(`[verifyTokenAndGetUser] Auth user found for handle '${handcashHandle}'. User ID: ${userId}`);
    return { userId: userId, handle: handcashHandle };

    // --- OLD CODE that used the 'profiles' table (removed) ---
    // console.log(`[verifyTokenAndGetUser] Looking up profile for handle '${handcashHandle}' using ADMIN client...`);
    // const { data: profileDataArray, error: profileError } = await supabaseAdmin
    //         .from('profiles')
    //         .select('id')
    //     .eq('handle', handcashHandle); 

    // if (profileError) {
    //     console.error(`Error fetching profile for handle ${handcashHandle}:`, profileError);
    //     throw new Error(profileError.message || 'Database error fetching profile.');
    // }
    // if (!profileDataArray || profileDataArray.length === 0) {
    //     console.error(`No profile found in Supabase for handle: ${handcashHandle}`);
    //     throw new Error('User profile not found in Supabase.');
    // }
    // if (profileDataArray.length > 1) {
    //     console.error(`!!! Critical: Multiple profiles found for handle: ${handcashHandle}`);
    //     throw new Error(`Multiple profiles found for handle: ${handcashHandle}. Data inconsistency.`);
    // }
    // const profileData = profileDataArray[0];
    // console.log(`[verifyTokenAndGetUser] Profile found for handle '${handcashHandle}'. User ID: ${profileData.id}`);
    // return { userId: profileData.id, handle: handcashHandle };
}

// --- POST Handler (Existing) --- 
export async function POST(request: Request) {
    console.log('[API /series-concepts] Received POST request');
    
    // Get environment variables inside handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
    
    // Check required variables but don't throw - return proper JSON error
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[API /series-concepts POST] Missing Supabase environment variables");
        return NextResponse.json(
            { success: false, error: "Server configuration error: Database credentials missing" },
            { status: 500 }
        );
    }
    
    // Initialize client only when needed
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
        // 1. Verify token and get user
        const { userId, handle } = await verifyTokenAndGetUser(request);
        console.log(`[API /series-concepts POST] Verified user: ${handle} (ID: ${userId})`);

        // 2. Parse request body
        const body: SeriesConceptData = await request.json();
        console.log('[API /series-concepts POST] Received concept data:', body);
        if (!body.name) {
             return NextResponse.json({ success: false, error: 'Series Name is required.' }, { status: 400 });
        }

        // 3. Insert data
        const { data: insertData, error: insertError } = await supabase
            .from('series_concepts') // Make sure table name is correct
            .insert([{ 
                user_id: userId, 
                    name: body.name,
                    description: body.description,
                    style_keywords: body.style_keywords,
                    color_notes: body.color_notes,
                    influences: body.influences,
            }])
            .select() 
            .single();

        if (insertError) throw insertError; 

        console.log('[API /series-concepts POST] Series concept saved successfully:', insertData);
        return NextResponse.json({ success: true, data: insertData }, { status: 201 });

    } catch (error: any) {
        console.error('[API /series-concepts POST] Error:', error);
        const statusCode = error.message.includes('profile not found') ? 404 : (error.message.includes('Authorization') ? 401 : 500);
        return NextResponse.json({ success: false, error: error.message || 'Failed to save concept.' }, { status: statusCode });
    }
}

// --- GET Handler (Revised) --- 
export async function GET(request: Request) {
    console.log('[API /series-concepts] Received GET request');
    
    // Get environment variables inside handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
    
    // Check required variables but don't throw - return proper JSON error
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[API /series-concepts GET] Missing Supabase environment variables");
        return NextResponse.json(
            { success: false, error: "Server configuration error: Database credentials missing" },
            { status: 500 }
        );
    }
    
    // Initialize client only when needed
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { searchParams } = new URL(request.url);
    const seriesId = searchParams.get('seriesId');

    if (!seriesId) {
        console.error('[API /series-concepts GET] Missing seriesId query parameter');
        return NextResponse.json({ success: false, error: 'seriesId query parameter is required.' }, { status: 400 });
    }
    console.log(`[API /series-concepts GET] Requesting concept for seriesId: ${seriesId}`);

    try {
        // 1. Verify token and get user
        const { userId, handle } = await verifyTokenAndGetUser(request);
        console.log(`[API /series-concepts GET] Verified user: ${handle} (ID: ${userId})`);

        // 2. Fetch concept data from Supabase strictly by ID first
        const { data: conceptData, error: fetchError } = await supabase
            .from('series_concepts') 
            .select('*') 
            .eq('id', seriesId) 
            .single(); // Expecting only one concept for the ID

        // Handle fetch errors (including not found)
        if (fetchError) {
            if (fetchError.code === 'PGRST116') { 
                 console.warn(`[API /series-concepts GET] Concept not found for seriesId: ${seriesId}.`);
                 // Return 404, authorization check comes next if found
                 return NextResponse.json({ success: false, error: 'Concept not found.' }, { status: 404 });
            } else {
                 console.error(`[API /series-concepts GET] Supabase fetch error for seriesId ${seriesId}:`, fetchError);
                 throw new Error(fetchError.message || 'Failed to fetch series concept.');
            }
        }
        
        // Double check if data is null/undefined even if no error (shouldn't happen with .single() + error check)
        if (!conceptData) {
            console.warn(`[API /series-concepts GET] No data unexpectedly returned for seriesId: ${seriesId}`);
            return NextResponse.json({ success: false, error: 'Concept not found.' }, { status: 404 });
        }

        // 3. <<< Authorization Check >>>
        const isAdmin = handle === '$boase'; // Check if the verified user is the admin
        const isOwner = conceptData.user_id === userId; // Check if the verified user owns the concept

        if (!isAdmin && !isOwner) {
             console.warn(`[API /series-concepts GET] Access denied for user ${handle} (ID: ${userId}) on seriesId: ${seriesId}`);
             return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 }); // 403 Forbidden
        }

        // 4. Return data if authorized
        console.log(`[API /series-concepts GET] Concept data fetched successfully (Authorized: ${isAdmin ? 'Admin' : 'Owner'}) for seriesId ${seriesId}:`, conceptData);
        return NextResponse.json({ success: true, data: conceptData }, { status: 200 });

    } catch (error: any) {
        console.error('[API /series-concepts GET] Error:', error);
        const statusCode = error.message.includes('profile not found') ? 404 : (error.message.includes('Authorization') ? 401 : 500);
        return NextResponse.json({ success: false, error: error.message || 'Failed to fetch concept.' }, { status: statusCode });
    }
}

// --- PUT Handler (Revised) ---
export async function PUT(request: Request) {
    console.log('[API /series-concepts] Received PUT request');

    // Get environment variables inside handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[API /series-concepts PUT] Missing Supabase environment variables (URL or Anon Key)");
        return NextResponse.json(
            { success: false, error: "Server configuration error: Database credentials missing" },
            { status: 500 }
        );
    }
    
    // 1. Extract Auth Token from header
    const authorizationHeader = request.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        console.error('[API /series-concepts PUT] Authorization token is missing or invalid.');
        return NextResponse.json({ success: false, error: 'Authorization token is missing or invalid.' }, { status: 401 });
    }
    const authToken = authorizationHeader.split(' ')[1];

    // Initialize standard client *without* injecting the user's HC auth token.
    // Rely on server-side cookie auth for RLS context.
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        // 2. Verify token and get user (Still useful for logging/potentially other checks)
        const { userId, handle } = await verifyTokenAndGetUser(request);
        console.log(`[API /series-concepts PUT] Verified user: ${handle} (ID: ${userId})`);

        // 3. Parse request body
        const body: UpdateSeriesConceptData = await request.json();
        console.log('[API /series-concepts PUT] Received update data:', body);

        const { seriesId, ...updateData } = body;

        if (!seriesId) {
            return NextResponse.json({ success: false, error: 'seriesId is required in the request body for updates.' }, { status: 400 });
        }
        if (!updateData.name?.trim()) { // Also check if name is not just whitespace
            return NextResponse.json({ success: false, error: 'Series Name cannot be empty.' }, { status: 400 });
        }

        // 4. Update data in Supabase using STANDARD client (now configured with user auth)
        console.log(`[API /series-concepts PUT] Attempting update with STANDARD client (auth set) for seriesId: ${seriesId}`);
        const { data: updatedDataArray, error: updateError } = await supabase // Use STANDARD client with user auth context
            .from('series_concepts')
            .update(updateData)
            .eq('id', seriesId)
            // RLS policy should now pass: USING (auth.uid() = user_id)
            .select(); 

        // --- Handle potential errors and different numbers of results ---
        if (updateError) {
            // Handle specific Supabase errors if needed, otherwise throw generic
            console.error(`[API /series-concepts PUT] Supabase update error for seriesId ${seriesId}:`, updateError);
            // Don't check for PGRST116 here, as zero rows updated isn't necessarily a DB error,
            // but rather an authorization/not found issue handled below.
            throw new Error(updateError.message || 'Failed to update series concept.');
        }

        // --- Check the result array ---
        if (!updatedDataArray || updatedDataArray.length === 0) {
            // Case: No rows were updated. This means either the seriesId didn't exist OR
            // the seriesId existed but didn't belong to the authenticated user (userId).
            console.warn(`[API /series-concepts PUT] Update failed: Concept not found for seriesId: ${seriesId} or user ${handle} lacks permission.`);
            // Return 404 Not Found, implying the resource (for this user) wasn't there to update.
            return NextResponse.json({ success: false, error: 'Concept not found or update permission denied.' }, { status: 404 });
        } else if (updatedDataArray.length > 1) {
            // Case: Update affected multiple rows (should not happen with unique ID).
            // This indicates a potential data integrity issue.
            console.error(`[API /series-concepts PUT] !!! Critical: Update affected multiple rows for seriesId ${seriesId}. Data:`, updatedDataArray);
            // Still return success, but maybe log this prominently. Use the first updated record.
            const updatedData = updatedDataArray[0];
            return NextResponse.json({ success: true, data: updatedData, warning: 'Update affected multiple rows.' }, { status: 200 });
        } else {
            // Case: Exactly one row updated (the expected case)
            const updatedData = updatedDataArray[0];
            console.log('[API /series-concepts PUT] Series concept updated successfully:', updatedData);
            return NextResponse.json({ success: true, data: updatedData }, { status: 200 });
        }

    } catch (error: any) {
        console.error('[API /series-concepts PUT] General error:', error);
        // Determine status code based on error type
        const isAuthError = error.message.includes('Authorization') || error.message.includes('profile not found');
        const statusCode = isAuthError ? 401 : 500; // Use 401 for auth issues, 500 otherwise
        return NextResponse.json({ success: false, error: error.message || 'Failed to update concept.' }, { status: statusCode });
    }
}

// Optional: Add GET handler later to fetch concepts
// export async function GET(request: Request) { ... }

// Optional: Add PUT/PATCH handler later to update concepts
// export async function PUT(request: Request) { ... } 