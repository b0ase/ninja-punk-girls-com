import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';
import jwt from 'jsonwebtoken';

// IMPORTANT: Ensure these environment variables are set in your deployment environment (e.g., Vercel, .env.local)
// Server-side variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod'; // Default to production

// Basic check for required variables
if (!supabaseUrl || !supabaseServiceKey || !supabaseJwtSecret || !handcashAppId || !handcashAppSecret) {
    console.error("API Route Error: Missing required environment variables.");
    // In a real app, you might want more robust startup checks
}

// Initialize Supabase Admin Client (use service role key for server-side operations)
// Note: It's generally recommended to create the client once, maybe in a separate lib file,
// but for simplicity here, we create it per request. Consider optimizing for production.
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key'
);

// Determine HandCash environment - default to production
const hcEnvironment = handcashEnv.toLowerCase() === 'iae'
  ? Environments.iae
  : Environments.prod;

// Initialize HandCash Connect SDK
const handCashConnect = new HandCashConnect({
    appId: handcashAppId || 'placeholder-app-id',
    appSecret: handcashAppSecret || 'placeholder-app-secret',
    env: hcEnvironment
});

console.log(`HandCash API Route Initialized for Env: ${hcEnvironment.apiEndpoint}`);


export async function POST(request: NextRequest) {
  console.log("--- API Route /api/auth/handcash/callback POST request received ---");
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const body = await request.json();
    const { handcashAuthToken } = body;

    if (!handcashAuthToken) {
      console.error("API Route Error: handcashAuthToken missing in request body.");
      return NextResponse.json({ error: 'Missing handcashAuthToken' }, { status: 400 });
    }
    console.log(`API Route: Received auth token prefix: ${handcashAuthToken.substring(0,6)}...`);


    // Verify token and get HandCash profile
    console.log("API Route: Verifying token with HandCash...");
    const account = handCashConnect.getAccountFromAuthToken(handcashAuthToken);
    const { publicProfile } = await account.profile.getCurrentProfile();
    const userHandle = publicProfile.handle;
    console.log(`API Route: HandCash handle verified: ${userHandle}`);

    // --- Find or Create Supabase Auth User ---
    let supabaseAuthUserId: string;

    // Check if a Supabase auth user already exists for this handle (using metadata)
    // WARNING: listUsers() is inefficient for many users. Consider a dedicated table or different lookup strategy for production.
    console.log(`API Route: Checking Supabase auth users for handle: ${userHandle}`);
    const { data: usersResponse, error: findUserError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 /* Adjust as needed, handle pagination if >1000 */ });

    if (findUserError) {
        console.error("API Route Error: Error listing Supabase auth users:", findUserError);
        throw new Error(`Database error checking auth users: ${findUserError.message}`);
    }

    const existingAuthUser = usersResponse?.users.find(u => u.user_metadata?.handle === userHandle);

    if (existingAuthUser) {
      supabaseAuthUserId = existingAuthUser.id;
      console.log(`API Route: Existing Supabase auth user found: ${supabaseAuthUserId}`);
      // Optionally: Update user_metadata if needed (e.g., avatar changed)
      // await supabaseAdmin.auth.admin.updateUserById(supabaseAuthUserId, { user_metadata: { ...existingAuthUser.user_metadata, avatar_url: publicProfile.avatarUrl } });

    } else {
      console.log(`API Route: Supabase auth user not found for ${userHandle}. Creating new auth user...`);
      const { data: newUserResponse, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        // Using a dummy email - ensure this pattern doesn't conflict with real emails
        email: `${userHandle}@handcash.user`,
        email_confirm: true, // Assume verified via HandCash
        user_metadata: {
          handle: userHandle,
          provider: 'handcash',
          // Optional: Store other details from HandCash publicProfile
          // name: publicProfile.displayName,
          // avatar_url: publicProfile.avatarUrl,
        }
      });

      if (createUserError || !newUserResponse?.user) {
        console.error("API Route Error: Error creating Supabase auth user:", createUserError);
        throw new Error(`Database error creating Supabase auth user: ${createUserError?.message}`);
      }
      supabaseAuthUserId = newUserResponse.user.id;
      console.log(`API Route: New Supabase auth user created: ${supabaseAuthUserId}`);

      // --- Link or Create Profile Entry (Optional but Recommended) ---
      // Assuming your 'profiles' table `id` column is designed to store the auth user's UUID
      // and is the primary key. Adjust if your schema is different.
      console.log(`API Route: Upserting profile entry linked to auth user ${supabaseAuthUserId}`);
      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: supabaseAuthUserId, // Link profile ID to auth user ID
          handle: userHandle,
          // updated_at: new Date().toISOString(), // Optional: track updates
          // Add/update other profile fields as needed
        })
        .select('id'); // Select something to confirm success

      if (profileUpsertError) {
        // Log the error, but decide if it's critical. The auth user exists, maybe proceed?
        console.error("API Route Warning: Error upserting profile data:", profileUpsertError);
        // Depending on requirements, you might throw an error here or just log it.
      } else {
        console.log(`API Route: Profile created/updated for handle ${userHandle}`);
      }
    }
    // --- End Find or Create Supabase Auth User ---


    // Generate Custom Supabase JWT using the Supabase Auth User ID
    const profileId = supabaseAuthUserId; // Use the correct ID for the JWT 'sub' claim
    console.log(`API Route: Generating custom JWT for Supabase auth user ID: ${profileId}`);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload = {
        sub: profileId, // Subject MUST be the Supabase auth.users ID (UUID)
        role: 'authenticated',
        aud: 'authenticated',
        iat: nowSeconds,
        exp: nowSeconds + (60 * 60 * 24), // Extend session to 24 hours for example
        // Add other claims if needed by your RLS policies
        // app_metadata: { provider: 'handcash' } // Example
    };

    const customJwt = jwt.sign(payload, supabaseJwtSecret || 'placeholder-jwt-secret');
    console.log("API Route: Custom JWT generated.");

    // Set session using server client and custom JWT
    console.log("API Route: Setting session cookie using server client...");
    const { error: sessionError } = await supabase.auth.setSession({
        access_token: customJwt,
        // Provide a long-lived refresh token if you want sessions to persist beyond JWT expiry
        // For custom JWTs, refresh tokens aren't automatically handled, so you might
        // need a strategy to re-issue JWTs or stick to shorter sessions.
        // Setting an empty one might be okay if you rely only on the access token expiry.
        refresh_token: customJwt // Or use a dedicated refresh token strategy if needed
    });

    if (sessionError) {
        console.error("API Route Error: Failed to set session cookie:", sessionError);
        // Provide the original error message for clarity
        throw new Error(`Failed to set Supabase session cookie: ${sessionError.message}`);
    }
    console.log("API Route: Session cookie set successfully.");

    // Return success, not the JWT
    return NextResponse.json({ success: true, message: "Authentication successful, session set." });

  } catch (error: any) {
    console.error("API Route Error:", error);
    // Determine if it's a HandCash specific error or a general one
    const message = error.message || 'An unknown error occurred';
    // Avoid leaking sensitive details in production errors
    return NextResponse.json({ error: `Authentication failed: ${message}` }, { status: 500 });
  }
}

// Optional: Handle GET requests or other methods if needed, otherwise they default to 405 Method Not Allowed
// export async function GET(request: NextRequest) {
//   return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
// } 