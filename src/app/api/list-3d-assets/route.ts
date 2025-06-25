import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
        return NextResponse.json({ success: false, error: 'Category query parameter is required.' }, { status: 400 });
    }

    const assetsDirectory = path.join(process.cwd(), 'public', '3D_assets', category);

    try {
        await fs.access(assetsDirectory); // Check if directory exists
        const files = await fs.readdir(assetsDirectory);
        const glbFiles = files
            .filter(file => file.toLowerCase().endsWith('.glb'))
            .map(file => `/3D_assets/${category}/${file}`); // Return paths relative to public

        return NextResponse.json({ success: true, files: glbFiles });
    } catch (error) {
        console.error(`[API List 3D Assets] Error reading directory ${assetsDirectory}:`, error);
        // Check if error is because directory doesn't exist
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return NextResponse.json({ success: false, error: `Category '${category}' not found.` }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: 'Failed to list 3D assets.' }, { status: 500 });
    }
} 