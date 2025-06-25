import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; // Import the Supabase client

// GET handler to fetch all open matches
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('open_matches') // Your table name
      .select('*')
      .order('created_at', { ascending: false }); // Order by creation time, newest first

    if (error) {
      console.error('Supabase GET error:', error);
      throw error; // Throw error to be caught below
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error fetching matches:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve open matches', 
      details: error.message 
    }, { 
      status: 500 
    });
  }
}

// POST handler to create a new open match
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[/api/matches] Received POST request body:", body);
    
    const { initiatorHandle, initiatorNft } = body;

    // Basic validation
    if (!initiatorHandle || !initiatorNft) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: initiatorHandle and initiatorNft' 
      }, { 
        status: 400 
      });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('open_matches')
      .insert([
        { 
          initiator_handle: initiatorHandle, // Ensure column names match your table
          initiator_nft: initiatorNft,  // Store the NFT data as JSONB
          // created_at is handled by Supabase default value
        }
      ])
      .select(); // Select the inserted data to return it

    if (error) {
      console.error('Supabase POST error:', error);
      throw error; // Throw error to be caught below
    }

    // Return the newly created match data
    return NextResponse.json({ success: true, data: data ? data[0] : null }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating match:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create open match', 
      details: error.message 
    }, { 
      status: 500 
    });
  }
} 