// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Use bare specifiers defined in import_map.json
import { createClient } from "@supabase/supabase-js"
import { HandCashConnect, Environments } from "@handcash/handcash-connect"
import * as djwt from "djwt"

// Define interfaces for clarity
interface RequestBody {
  handcashAuthToken?: string;
}

interface Profile {
  id: string; // Supabase profile UUID
  handle: string; // HandCash handle
}

// --- Environment Variable Checks ---
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseJwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
const handcashAppId = Deno.env.get('NEXT_PUBLIC_HANDCASH_APP_ID');
const handcashAppSecret = Deno.env.get('HANDCASH_APP_SECRET');
const handcashEnv = Deno.env.get('HANDCASH_ENVIRONMENT') ?? 'iae'; // Default to iae

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseJwtSecret || !handcashAppId || !handcashAppSecret) {
  console.error("Missing required environment variables.");
  // Optionally throw an error to prevent the function from starting
  // throw new Error("Missing required environment variables.");
}

// --- Initialize Clients (only once) ---
const supabaseAdmin = createClient(supabaseUrl ?? '', supabaseServiceRoleKey ?? '');

// Determine HandCash environment
const hcEnvironment = handcashEnv.toLowerCase() === 'prod'
  ? Environments.prod
  : Environments.iae;

const handCashConnect = new HandCashConnect({
  appId: handcashAppId ?? '',
  appSecret: handcashAppSecret ?? '',
  env: hcEnvironment
});

console.log(`HandCash Auth Function Initialized for Env: ${hcEnvironment.apiEndpoint}`);

// --- Main Request Handler ---
Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
        'Access-Control-Allow-Origin': '*', // Adjust for production
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
    } });
  }

  try {
    // 2. Get HandCash Auth Token from request body
    const { handcashAuthToken }: RequestBody = await req.json();
    if (!handcashAuthToken) {
      throw new Error("handcashAuthToken is required.");
    }
    console.log(`Received auth token prefix: ${handcashAuthToken.substring(0,6)}...`);

    // 3. Verify token and get HandCash profile
    console.log("Verifying token with HandCash...");
    const account = handCashConnect.getAccountFromAuthToken(handcashAuthToken);
    const { publicProfile } = await account.profile.getCurrentProfile();
    const userHandle = publicProfile.handle;
    console.log(`HandCash handle verified: ${userHandle}`);

    // 4. Find or Create Supabase Profile
    let profileId: string;

    console.log(`Checking Supabase profiles for handle: ${userHandle}`);
    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('handle', userHandle)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

    if (selectError) {
      console.error("Error selecting profile:", selectError);
      throw new Error("Database error checking profile.");
    }

    if (existingProfile) {
      profileId = existingProfile.id;
      console.log(`Existing profile found. ID: ${profileId}`);
    } else {
      console.log(`Profile not found for ${userHandle}. Creating new profile...`);
      // Assume 'id' column in profiles has a default UUID generator (e.g., gen_random_uuid())
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({ handle: userHandle }) 
        .select('id') // Select the ID of the newly inserted row
        .single(); // Expect exactly one row back

      if (insertError || !newProfile) {
        console.error("Error inserting profile:", insertError);
        throw new Error("Database error creating profile.");
      }
      profileId = newProfile.id;
      console.log(`New profile created. ID: ${profileId}`);
    }

    // 5. Generate Custom JWT
    console.log(`Generating custom JWT for profile ID: ${profileId}`);
    const customJwt = await djwt.create(
        { alg: "HS256", typ: "JWT" },
        { 
            sub: profileId, // Subject is the Supabase profile ID
            role: "authenticated", // Standard Supabase role for logged-in users
            // Add expiry (e.g., 1 hour) - adjust as needed
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
            // You can add other claims if needed by your RLS policies
        },
        supabaseJwtSecret! // Use the non-null assertion as we checked above
    );
    console.log("Custom JWT generated.");

    // 6. Return the Custom JWT
    return new Response(
      JSON.stringify({ customJwt: customJwt }),
      { headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*' // Adjust for production
      } }
    );

  } catch (error) {
    console.error("Error in handcash-auth function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*' // Adjust for production
        } 
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/handcash-auth' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
