import { NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import { put } from '@vercel/blob';
import path from 'path';
import qrcode from 'qrcode'; // Import qrcode library
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config'; // Assuming layer config is needed
import { NFTType } from '@/types'; // Assuming types are defined
import { INTERFACE_CONFIG } from '@/data/interface-config'; // Need this for name placement
type Attribute = NFTType['attributes'][number]; // Use indexed access type

// --- Configuration --- 
const CANVAS_WIDTH = 961;
const CANVAS_HEIGHT = 1441;
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'Cyberpunks Italic.ttf'); // Replace with your actual font file
const FONT_FAMILY = 'Cyberpunks Italic'; // The name you want to refer to the font as

// --- <<< Apply NEW Coordinates from Positioning Tool >>> ---
const coordMap: { 
    [key: string]: { 
        x: number; 
        y: number; 
        fontSize: number; 
        fontFamily?: string; 
        fillStyle?: string; 
        textAlign?: CanvasTextAlign; 
        textBaseline?: CanvasTextBaseline; 
        width?: number; 
        height?: number; 
    } 
} = {
  "nameBox": {
    "x": 400,
    "y": 160,
    "fontSize": 50,
    "textAlign": "left",
    "textBaseline": "bottom"
  },
  "numberBox": {
    "x": 458,
    "y": 90,
    "fontSize": 36,
    "textAlign": "left",
    "textBaseline": "bottom"
  },
  "seriesBox": {
    "x": 393,
    "y": 85,
    "fontSize": 40,
    "textAlign": "left",
    "textBaseline": "bottom"
  },
  "qrCodeBox": {
    "x": 749,
    "y": 90,
    "fontSize": 10,
    "width": 130,
    "height": 130
  },
  "strengthLabel": {
    "x": 116,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "speedLabel": {
    "x": 379,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "skillLabel": {
    "x": 631,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "staminaLabel": {
    "x": 116,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "stealthLabel": {
    "x": 378,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "styleLabel": {
    "x": 630,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "strengthValue": {
    "x": 302,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "speedValue": {
    "x": 559,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "skillValue": {
    "x": 814,
    "y": 1210,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "staminaValue": {
    "x": 302,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "stealthValue": {
    "x": 561,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  },
  "styleValue": {
    "x": 814,
    "y": 1282,
    "fontSize": 34,
    "textAlign": "left",
    "textBaseline": "middle"
  }
};
// ------------------------------------------

// Register the font
try {
    registerFont(FONT_PATH, { family: FONT_FAMILY });
    console.log(`[API/Generate] Font registered: ${FONT_FAMILY}`);
} catch (error) {
    console.error("[API/Generate] Failed to register font:", error);
    // Handle font loading error appropriately - maybe use a default system font?
}

// Updated drawText function - Always use textBaseline = 'top'
function drawText(ctx: NodeCanvasRenderingContext2D, text: string | number, box: typeof coordMap[string]) {
    ctx.font = `${box.fontSize}px "${box.fontFamily || FONT_FAMILY}"`; 
    ctx.fillStyle = box.fillStyle || '#FFFFFF';
    // Use horizontal alignment from coordMap entry, fallback to left
    ctx.textAlign = box.textAlign || 'left'; 
    // <<< FORCE textBaseline to 'top' for consistency with visual tool >>>
    ctx.textBaseline = 'top'; 

    // Draw text using the provided x, y as the top-left (or top-center/top-right based on textAlign)
    ctx.fillText(String(text).toUpperCase(), box.x, box.y);
}

// Helper to get layer folder name
const getLayerFolderName = (layerKey: string): string | null => {
  return LAYER_DETAILS[layerKey]?.folderName || null;
};

export async function POST(request: Request) {
  try {
    const { 
      selectedAttributes, 
      name, 
      number, 
      stats, 
      qrData, 
      series,
      interfaceFilename, // <<< ADDED: Receive interface filename
      // --- ADDED: Receive genes --- 
      genes // Add genes to destructuring
    } = await request.json();

    // Validate required data
    // --- MODIFIED: Add validation for genes (optional, but good practice) --- 
    if (!selectedAttributes || !Array.isArray(selectedAttributes) || !name || !number || !stats || !qrData || !series || !interfaceFilename /*|| !genes <- gene could be null/undefined if not applicable */ ) { 
      return NextResponse.json({ success: false, error: 'Missing required parameters for image generation.' }, { status: 400 });
    }

    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx: NodeCanvasRenderingContext2D = canvas.getContext('2d');
    const assetsPath = path.join(process.cwd(), 'public', 'assets');

    // --- NEW Drawing Logic --- 
    console.log('[API/Generate] Starting layer draw based on LAYER_ORDER...');
    for (const layerKey of LAYER_ORDER) {
        const layerDetail = LAYER_DETAILS[layerKey];
        if (!layerDetail) {
            console.warn(`[API/Generate] Skipping layer key ${layerKey} not found in LAYER_DETAILS.`);
            continue; 
        }

        // --- REVISED: Handle Special Layers First --- 
        if (layerKey === 'LOGO') {
            // Calculate originGene directly here now
            const originGene = typeof genes === 'string' ? genes.toLowerCase() : null; 
            let logoFilename: string | null = null;

            // <<< Use the correct, full filenames from the directory listing >>>
            if (originGene === 'npg') {
                logoFilename = '01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png';
            } else if (originGene === 'erobot' || originGene === 'erobotz') { // Allow erobotz as well
                logoFilename = '01_002_logo_Erobot-logo_x_Erobot_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png';
            }

            if (logoFilename) {
                const logoPath = path.join(assetsPath, '01 Logo', logoFilename); // Construct path here
                try {
                    console.log(`[API/Generate] Attempting to load LOGO image: ${logoPath}`); // Added log
                    const logoImg = await loadImage(logoPath);
                    console.log(`[API/Generate] LOGO image loaded successfully. Dimensions: ${logoImg.width}x${logoImg.height}`); // Added log
                    ctx.drawImage(logoImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                    console.log(`[API/Generate] LOGO image drawn onto canvas.`); // Added log
                } catch (imgErr) {
                    // <<< Enhanced Error Logging >>>
                    console.error(`[API/Generate] FAILED to load or draw logo image ${logoPath}. Error details:`, imgErr);
                }
            } else {
                 console.log(`[API/Generate] Skipping LOGO layer: No specific logo for origin '${originGene}'.`);
            }
            continue; // Done with LOGO, move to next layerKey
            
        } else if (layerKey === 'INTERFACE') {
             // Draw the specific interface passed in request
            try {
                const interfacePath = path.join(assetsPath, layerDetail.folderName, interfaceFilename);
                console.log(`[API/Generate] Drawing INTERFACE layer from: ${interfacePath}`);
                const interfaceImage = await loadImage(interfacePath);
                ctx.drawImage(interfaceImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } catch (err) {
                 console.error(`[API/Generate] Error loading or drawing interface ${interfaceFilename}:`, err);
                 // Decide if this is fatal - returning error for now
                 return NextResponse.json({ success: false, error: `Failed to load interface: ${interfaceFilename}` }, { status: 500 });
            }
            continue; // Done with INTERFACE, move to next layerKey
        }
        // --- END REVISED Special Layer Handling ---

        // --- Default handling for CHARACTER layers --- 
        const attribute = selectedAttributes.find((attr: Attribute) => attr.layer === layerKey);
        if (attribute && attribute.fullFilename) { 
            const imagePath = path.join(assetsPath, layerDetail.folderName, attribute.fullFilename);
            try {
                console.log(`[API/Generate] Drawing layer ${layerKey} from: ${imagePath}`);
                const img = await loadImage(imagePath);
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } catch (imgErr) {
                console.error(`[API/Generate] Error loading or drawing image ${imagePath}:`, imgErr);
            }
        } else {
            console.log(`[API/Generate] Skipping layer ${layerKey}: No corresponding attribute found or fullFilename missing.`);
        }
        // --- End CHARACTER layer handling ---
    }
    console.log('[API/Generate] Finished drawing layers.');
    // --- END NEW Drawing Logic ---

    // 2. Draw Text Data uses the new coordMap
    if (coordMap.nameBox)    drawText(ctx, name, coordMap.nameBox);
    if (coordMap.numberBox)  drawText(ctx, String(number), coordMap.numberBox);
    // Extract number from series string (e.g., "Series 1" -> "1")
    const seriesNumber = String(series).replace(/\D/g, '') || '1'; // Remove non-digits, fallback to 1
    if (coordMap.seriesBox)  drawText(ctx, seriesNumber, coordMap.seriesBox);
    
    // Draw Stats Labels (using the label key from coordMap)
    if (coordMap.strengthLabel) drawText(ctx, 'Strength', coordMap.strengthLabel);
    if (coordMap.speedLabel)    drawText(ctx, 'Speed', coordMap.speedLabel);
    if (coordMap.skillLabel)    drawText(ctx, 'Skill', coordMap.skillLabel);
    if (coordMap.staminaLabel)  drawText(ctx, 'Stamina', coordMap.staminaLabel);
    if (coordMap.stealthLabel)  drawText(ctx, 'Stealth', coordMap.stealthLabel);
    if (coordMap.styleLabel)    drawText(ctx, 'Style', coordMap.styleLabel);
    
    // Draw Stats Values (using the value key from coordMap)
    if (coordMap.strengthValue) drawText(ctx, stats.strength, coordMap.strengthValue);
    if (coordMap.speedValue)    drawText(ctx, stats.speed, coordMap.speedValue);
    if (coordMap.skillValue)    drawText(ctx, stats.skill, coordMap.skillValue);
    if (coordMap.staminaValue)  drawText(ctx, stats.stamina, coordMap.staminaValue);
    if (coordMap.stealthValue)  drawText(ctx, stats.stealth, coordMap.stealthValue);
    if (coordMap.styleValue)    drawText(ctx, stats.style, coordMap.styleValue);

    // 4. Draw QR Code 
    if (qrData && coordMap.qrCodeBox) {
        const qrX = coordMap.qrCodeBox.x;
        const qrY = coordMap.qrCodeBox.y;
        const qrWidth = coordMap.qrCodeBox.width ?? 150;
        const qrHeight = coordMap.qrCodeBox.height ?? 150;

        try {
            console.log("[API/Generate] Generating QR Code for data:", qrData);
            const qrCodeDataURL = await qrcode.toDataURL(qrData, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: qrWidth
            });
            
            const qrImage = await loadImage(qrCodeDataURL);
            
            ctx.drawImage(qrImage, qrX, qrY, qrWidth, qrHeight);
            console.log(`[API/Generate] Drawn QR Code at x:${qrX}, y:${qrY}`);
        } catch (qrErr) {
            console.error("[API/Generate] Error generating or drawing QR Code:", qrErr);
        }
    } else {
        console.warn("[API/Generate] QR Data or qrCodeBox coordinates missing, skipping QR draw.");
    }

    // 5. Convert canvas to PNG buffer
    const buffer = canvas.toBuffer('image/png');
    console.log('[API/Generate] Canvas buffer created.');

    // 6. Upload buffer to Vercel Blob using correct signature
    const blobFilename = `nfts/npg-${number}-${Date.now()}.png`; // Use a subfolder like 'nfts/'
    const blob = await put(
        blobFilename, // Use the generated filename/path
        buffer,       // The image buffer
        { 
            access: 'public', 
            contentType: 'image/png' // Ensure correct content type
        }
    );
    console.log('[API/Generate] Image uploaded to Vercel Blob:', blob.url);

    // 7. Return success response with ONLY the image URL
    return NextResponse.json({ 
        success: true, 
        message: 'NFT Image Generated Successfully', 
        imageUrl: blob.url // Only return the URL
        // metadata: finalMetadata // Do NOT return metadata from here
    });

  } catch (error: any) {
    console.error("[API/Generate] Error generating NFT image:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate NFT image." },
      { status: 500 }
    );
  }
} 