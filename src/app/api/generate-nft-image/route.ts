import { NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D as NodeCanvasRenderingContext2D } from 'canvas';
import { put } from '@vercel/blob';
import path from 'path';
import qrcode from 'qrcode';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import { NFTType, NFTAttribute } from '@/types';
import { INTERFACE_CONFIG } from '@/data/interface-config';
import { AssetDetail } from '@/app/api/asset-data/route';

// --- Configuration --- 
const CANVAS_WIDTH = 961;
const CANVAS_HEIGHT = 1441;
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'Cyberpunks Italic.ttf');
const FONT_FAMILY = 'Cyberpunks Italic';

// Layer to folder mapping for new structure
const LAYER_TO_FOLDER: Record<string, string> = {
  'LOGO': '01-Logo',
  'COPYRIGHT': '02-Copyright', 
  'TEAM': '04-Team',
  'INTERFACE': '05-Interface',
  'EFFECTS': '06-Effects',
  'RIGHT_WEAPON': '07-Right-Weapon',
  'LEFT_WEAPON': '08-Left-Weapon',
  'HORNS': '09-Horns',
  'HAIR': '10-Hair',
  'MASK': '11-Mask',
  'TOP': '12-Top',
  'BOOTS': '13-Boots',
  'JEWELLERY': '14-Jewellery',
  'ACCESSORIES': '15-Accessories',
  'BRA': '16-Bra',
  'BOTTOM': '17-Bottom',
  'FACE': '18-Face',
  'UNDERWEAR': '19-Underwear',
  'ARMS': '20-Arms',
  'BODY_SKIN': '21-Body',
  'BACK': '22-Back',
  'REAR_HORNS': '23-Rear-Horns',
  'REAR_HAIR': '24-Rear-Hair',
  'DECALS': '26-Decals',
  'BANNER': '27-Banner',
  'GLOW': '28-Glow',
  'BACKGROUND': '29-Background'
};

// --- Apply NEW Coordinates from Positioning Tool ---
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

// Register the font
try {
    registerFont(FONT_PATH, { family: FONT_FAMILY });
    console.log(`[API/Generate] Font registered: ${FONT_FAMILY}`);
} catch (error) {
    console.error("[API/Generate] Failed to register font:", error);
}

// Updated drawText function
function drawText(ctx: NodeCanvasRenderingContext2D, text: string | number, box: typeof coordMap[string]) {
    ctx.font = `${box.fontSize}px "${box.fontFamily || FONT_FAMILY}"`; 
    ctx.fillStyle = box.fillStyle || '#FFFFFF';
    ctx.textAlign = box.textAlign || 'left'; 
    ctx.textBaseline = 'top'; 
    ctx.fillText(String(text).toUpperCase(), box.x, box.y);
}

export async function POST(request: Request) {
  try {
    const { 
      selectedAttributes, 
      name, 
      number, 
      stats, 
      qrData, 
      series,
      interfaceFilename,
      genes
    } = await request.json();

    // Validate required data
    if (!selectedAttributes || !Array.isArray(selectedAttributes) || !name || !number || !stats || !qrData || !series || !interfaceFilename) { 
      return NextResponse.json({ success: false, error: 'Missing required parameters for image generation.' }, { status: 400 });
    }

    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx: NodeCanvasRenderingContext2D = canvas.getContext('2d');
    const assetsPath = path.join(process.cwd(), 'public', 'assets');

    // NEW Drawing Logic using simplified filenames
    console.log('[API/Generate] Starting layer draw based on LAYER_ORDER...');
    for (const layerKey of LAYER_ORDER) {
        const folderName = LAYER_TO_FOLDER[layerKey];
        if (!folderName) {
            console.warn(`[API/Generate] Skipping layer ${layerKey}: No folder mapping found.`);
            continue; 
        }

        // Handle special layers
        if (layerKey === 'LOGO') {
            const originGene = typeof genes === 'string' ? genes.toLowerCase() : null; 
            let logoFilename: string | null = null;

            if (originGene === 'npg') {
                logoFilename = '01_001_logo_NPG-logo.png';
            } else if (originGene === 'erobot' || originGene === 'erobotz') {
                logoFilename = '01_002_logo_Erobot-logo.png';
            }

            if (logoFilename) {
                const logoPath = path.join(assetsPath, folderName, logoFilename);
                try {
                    console.log(`[API/Generate] Drawing LOGO layer from: ${logoPath}`);
                    const logoImg = await loadImage(logoPath);
                    ctx.drawImage(logoImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                } catch (imgErr) {
                    console.error(`[API/Generate] Error loading or drawing logo ${logoFilename}:`, imgErr);
                }
            } else {
                 console.log(`[API/Generate] Skipping LOGO layer: No specific logo for origin '${originGene}'.`);
            }
            continue;
            
        } else if (layerKey === 'INTERFACE') {
            try {
                // Use simplified filename for interface
                const interfacePath = path.join(assetsPath, folderName, '05_001_interface_x.png');
                console.log(`[API/Generate] Drawing INTERFACE layer from: ${interfacePath}`);
                const interfaceImage = await loadImage(interfacePath);
                ctx.drawImage(interfaceImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            } catch (err) {
                 console.error(`[API/Generate] Error loading or drawing interface:`, err);
                 return NextResponse.json({ success: false, error: `Failed to load interface` }, { status: 500 });
            }
            continue;
        }

        // Handle character layers with new simplified filename structure
        const attribute = selectedAttributes.find((attr: NFTAttribute) => attr.layer === layerKey);
        if (attribute && attribute.fullFilename) { 
            const imagePath = path.join(assetsPath, folderName, attribute.fullFilename);
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
    }
    console.log('[API/Generate] Finished drawing layers.');

    // Draw Text Data
    if (coordMap.nameBox)    drawText(ctx, name, coordMap.nameBox);
    if (coordMap.numberBox)  drawText(ctx, String(number), coordMap.numberBox);
    const seriesNumber = String(series).replace(/\D/g, '') || '1';
    if (coordMap.seriesBox)  drawText(ctx, seriesNumber, coordMap.seriesBox);
    
    // Draw Stats Labels
    if (coordMap.strengthLabel) drawText(ctx, 'Strength', coordMap.strengthLabel);
    if (coordMap.speedLabel)    drawText(ctx, 'Speed', coordMap.speedLabel);
    if (coordMap.skillLabel)    drawText(ctx, 'Skill', coordMap.skillLabel);
    if (coordMap.staminaLabel)  drawText(ctx, 'Stamina', coordMap.staminaLabel);
    if (coordMap.stealthLabel)  drawText(ctx, 'Stealth', coordMap.stealthLabel);
    if (coordMap.styleLabel)    drawText(ctx, 'Style', coordMap.styleLabel);
    
    // Draw Stats Values
    if (coordMap.strengthValue) drawText(ctx, stats.strength, coordMap.strengthValue);
    if (coordMap.speedValue)    drawText(ctx, stats.speed, coordMap.speedValue);
    if (coordMap.skillValue)    drawText(ctx, stats.skill, coordMap.skillValue);
    if (coordMap.staminaValue)  drawText(ctx, stats.stamina, coordMap.staminaValue);
    if (coordMap.stealthValue)  drawText(ctx, stats.stealth, coordMap.stealthValue);
    if (coordMap.styleValue)    drawText(ctx, stats.style, coordMap.styleValue);

    // Draw QR Code 
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

    // Convert canvas to PNG buffer
    const buffer = canvas.toBuffer('image/png');
    console.log('[API/Generate] Canvas buffer created.');

    // Upload buffer to Vercel Blob
    const blobFilename = `nfts/npg-${number}-${Date.now()}.png`;
    const blob = await put(
        blobFilename,
        buffer,       
        { 
            access: 'public', 
            contentType: 'image/png'
        }
    );
    console.log('[API/Generate] Image uploaded to Vercel Blob:', blob.url);

    // Return success response
    return NextResponse.json({ 
        success: true, 
        message: 'NFT Image Generated Successfully', 
        imageUrl: blob.url
    });

  } catch (error) {
    console.error('[API/Generate] Error in POST handler:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error during image generation' 
    }, { status: 500 });
  }
} 