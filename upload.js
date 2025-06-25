import { put } from '@vercel/blob';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const STORE_ID = 'store_YcP0WQnRuiNTpnBU';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
    console.error('Please set BLOB_READ_WRITE_TOKEN environment variable');
    process.exit(1);
}

async function uploadDirectory(dir) {
    try {
        const files = readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = join(dir, file.name);
            
            if (file.isDirectory()) {
                // Get directory name for path preservation
                const relativePath = fullPath.replace('assets/', '');
                await uploadDirectory(fullPath, relativePath);
            } else if (file.name.match(/\.(png|jpg|jpeg|gif)$/i)) {
                const content = readFileSync(fullPath);
                // Preserve directory structure in blob path
                const blobPath = fullPath.replace('assets/', '');
                const blob = await put(blobPath, content, {
                    access: 'public',
                    addRandomSuffix: false,
                    store: STORE_ID,
                    token: BLOB_READ_WRITE_TOKEN
                });
                
                console.log(`Uploaded ${blobPath} to ${blob.url}`);
            }
        }
    } catch (error) {
        console.error(`Error processing ${dir}:`, error);
    }
}

// Start upload from assets directory
uploadDirectory('assets').catch(console.error); 