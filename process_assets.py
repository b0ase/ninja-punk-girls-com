#!/usr/bin/env python3
"""
NPG Asset Processor
Processes all PNG assets in the /public/assets directory:
1. Parses complex filenames to extract metadata
2. Creates individual JSON files with extracted data
3. Renames PNG files to simpler format
"""

import os
import json
import re
import shutil
from pathlib import Path

def parse_filename(filename):
    """
    Parse NPG asset filename to extract all metadata
    
    Pattern: {folder_num}_{asset_num}_{category}_{name}_{character}_{team}_{genes}_{rarity}_Strength_{val}_Speed_{val}_Skill_{val}_Stamina_{val}_Stealth_{val}_Style_{val}_.png
    """
    # Remove .png extension
    base_name = filename.replace('.png', '')
    
    # Split by underscores
    parts = base_name.split('_')
    
    # Initialize data structure
    data = {
        'folder_number': None,
        'asset_number': None,
        'category': None,
        'item_name': None,
        'character': None,
        'team': None,
        'genes': None,
        'rarity': None,
        'stats': {
            'strength': 0,
            'speed': 0,
            'skill': 0,
            'stamina': 0,
            'stealth': 0,
            'style': 0
        },
        'original_filename': filename
    }
    
    try:
        # Basic parsing
        if len(parts) >= 4:
            data['folder_number'] = parts[0]
            data['asset_number'] = parts[1]
            data['category'] = parts[2]
            data['item_name'] = parts[3]
        
        # Look for character, team, genes, rarity in positions 4-7
        pos = 4
        if pos < len(parts) and parts[pos] != 'x':
            data['character'] = parts[pos]
        pos += 1
        
        if pos < len(parts) and parts[pos] != 'x':
            data['team'] = parts[pos]
        pos += 1
        
        if pos < len(parts) and parts[pos] != 'x':
            data['genes'] = parts[pos]
        pos += 1
        
        if pos < len(parts) and parts[pos] != 'x':
            data['rarity'] = parts[pos]
        pos += 1
        
        # Parse stats - look for Strength, Speed, Skill, Stamina, Stealth, Style
        stat_pattern = r'(Strength|Speed|Skill|Stamina|Stealth|Style)_(\d+)'
        full_filename = '_'.join(parts)
        
        for match in re.finditer(stat_pattern, full_filename):
            stat_name = match.group(1).lower()
            stat_value = int(match.group(2))
            if stat_name in data['stats']:
                data['stats'][stat_name] = stat_value
    
    except Exception as e:
        print(f"Error parsing {filename}: {e}")
    
    return data

def create_asset_json(asset_data, json_path):
    """Create JSON file for asset with extracted metadata"""
    try:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(asset_data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error creating JSON {json_path}: {e}")
        return False

def generate_simple_filename(asset_data):
    """Generate a simple filename based on asset data"""
    folder_num = asset_data['folder_number']
    asset_num = asset_data['asset_number']
    category = asset_data['category']
    item_name = asset_data['item_name']
    
    # Clean item name for filename
    clean_name = re.sub(r'[^a-zA-Z0-9-]', '', item_name) if item_name else 'unknown'
    
    return f"{folder_num}_{asset_num}_{category}_{clean_name}.png"

def process_assets():
    """Main function to process all assets"""
    assets_dir = Path("/Users/b0ase/Projects/ninja-punk-girls-com/public/assets")
    
    if not assets_dir.exists():
        print(f"Assets directory not found: {assets_dir}")
        return
    
    # Find all PNG files
    png_files = list(assets_dir.glob("**/*.png"))
    print(f"Found {len(png_files)} PNG files to process")
    
    processed_count = 0
    json_created = 0
    renamed_count = 0
    
    for png_file in png_files:
        try:
            print(f"\nProcessing: {png_file.name}")
            
            # Parse filename
            asset_data = parse_filename(png_file.name)
            
            # Create JSON file path (same directory as PNG)
            json_filename = png_file.stem + '.json'
            json_path = png_file.parent / json_filename
            
            # Create JSON file
            if create_asset_json(asset_data, json_path):
                json_created += 1
                print(f"  ✅ Created JSON: {json_filename}")
            
            # Generate new simple filename
            new_filename = generate_simple_filename(asset_data)
            new_path = png_file.parent / new_filename
            
            # Only rename if the new filename is different and doesn't exist
            if new_filename != png_file.name and not new_path.exists():
                try:
                    shutil.move(str(png_file), str(new_path))
                    renamed_count += 1
                    print(f"  🔄 Renamed: {png_file.name} → {new_filename}")
                    
                    # Update JSON with new filename
                    asset_data['simplified_filename'] = new_filename
                    create_asset_json(asset_data, json_path)
                    
                except Exception as e:
                    print(f"  ❌ Error renaming {png_file.name}: {e}")
            
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing {png_file}: {e}")
    
    print(f"\n📊 Processing Summary:")
    print(f"  Total files processed: {processed_count}")
    print(f"  JSON files created: {json_created}")
    print(f"  PNG files renamed: {renamed_count}")

def preview_parsing():
    """Preview how filenames will be parsed without making changes"""
    assets_dir = Path("/Users/b0ase/Projects/ninja-punk-girls-com/public/assets")
    png_files = list(assets_dir.glob("**/*.png"))
    
    print("🔍 PREVIEW MODE - First 10 files:")
    print("=" * 80)
    
    for i, png_file in enumerate(png_files[:10]):
        asset_data = parse_filename(png_file.name)
        new_name = generate_simple_filename(asset_data)
        
        print(f"\n{i+1}. {png_file.name}")
        print(f"   Category: {asset_data['category']}")
        print(f"   Item: {asset_data['item_name']}")
        print(f"   Character: {asset_data['character']}")
        print(f"   Team: {asset_data['team']}")
        print(f"   Rarity: {asset_data['rarity']}")
        print(f"   Stats: {asset_data['stats']}")
        print(f"   New name: {new_name}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        preview_parsing()
    else:
        print("NPG Asset Processor")
        print("=" * 50)
        
        response = input("This will create JSON files for all assets and rename PNGs. Continue? (y/N): ")
        if response.lower() == 'y':
            process_assets()
        else:
            print("Operation cancelled. Use --preview to see what would happen.") 