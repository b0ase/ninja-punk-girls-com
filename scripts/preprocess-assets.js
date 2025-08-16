
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(process.cwd(), 'assets-source');
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'asset-manifest.json');

const FOLDER_MAPPING = {
  '01-Logo': 'LOGO',
  '02-Copyright': 'COPYRIGHT',
  '04-Team': 'TEAM',
  '05-Interface': 'INTERFACE',
  '06-Effects': 'EFFECTS',
  '07-Right-Weapon': 'RIGHT_WEAPON',
  '08-Left-Weapon': 'LEFT_WEAPON',
  '09-Horns': 'HORNS',
  '10-Hair': 'HAIR',
  '11-Mask': 'MASK',
  '12-Top': 'TOP',
  '13-Boots': 'BOOTS',
  '14-Jewellery': 'JEWELLERY',
  '15-Accessories': 'ACCESSORIES',
  '16-Bra': 'BRA',
  '17-Bottom': 'BOTTOM',
  '18-Face': 'FACE',
  '19-Underwear': 'UNDERWEAR',
  '20-Arms': 'ARMS',
  '21-Body': 'BODY_SKIN',
  '22-Back': 'BACK',
  '23-Rear-Horns': 'REAR_HORNS',
  '24-Rear-Hair': 'REAR_HAIR',
  '26-Decals': 'DECALS',
  '27-Banner': 'BANNER',
  '28-Glow': 'GLOW',
  '29-Background': 'BACKGROUND'
};

function loadAssetFromJSON(folderPath, jsonFilename, layerKey) {
  try {
    const jsonPath = path.join(folderPath, jsonFilename);
    if (!fs.existsSync(jsonPath)) return null;

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const pngFilename = jsonData.simplified_filename || jsonData.original_filename;
    if (!pngFilename) return null;

    const pngPath = path.join(folderPath, pngFilename);
    if (!fs.existsSync(pngPath)) return null;

    return {
      layer: layerKey,
      filename: pngFilename,
      name: jsonData.item_name || jsonData.name || 'Unknown',
      assetNumber: jsonData.asset_number || 'N/A',
      folder_number: jsonData.folder_number || '00',
      category: jsonData.category || 'Unknown',
      item_name: jsonData.item_name || 'Unknown',
      character: jsonData.character || undefined,
      team: jsonData.team || undefined,
      genes: jsonData.genes || undefined,
      rarity: jsonData.rarity || undefined,
      stats: {
        strength: jsonData.stats?.strength || 0,
        speed: jsonData.stats?.speed || 0,
        skill: jsonData.stats?.skill || 0,
        stamina: jsonData.stats?.stamina || 0,
        stealth: jsonData.stats?.stealth || 0,
        style: jsonData.stats?.style || 0
      },
      original_filename: jsonData.original_filename,
      simplified_filename: jsonData.simplified_filename
    };
  } catch (error) {
    console.error(`Error loading asset from JSON ${jsonFilename}:`, error);
    return null;
  }
}

function generateAssetManifest() {
  const assetData = [];
  try {
    if (!fs.existsSync(ASSETS_DIR)) {
      console.warn(`Assets directory not found: ${ASSETS_DIR}`);
      return;
    }

    const folders = fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    folders.forEach(folderName => {
      const folderPath = path.join(ASSETS_DIR, folderName);
      const layerKey = FOLDER_MAPPING[folderName];
      if (!layerKey) return;

      const jsonFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.json'));
      jsonFiles.forEach(jsonFilename => {
        const asset = loadAssetFromJSON(folderPath, jsonFilename, layerKey);
        if (asset) assetData.push(asset);
      });
    });

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(assetData, null, 2));
    console.log(`Asset manifest generated at ${MANIFEST_PATH} with ${assetData.length} assets.`);

  } catch (error) {
    console.error('Error generating asset manifest:', error);
  }
}

generateAssetManifest();
