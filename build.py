#!/usr/bin/env python3
import json
import os
import shutil
import sys
import re
from src.image_processor import scan_folders, assign_rarity
from src.html_utils import generate_html

# Add src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the main generator function
from generator import main

def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)

def ensure_output_dir(output_dir):
    os.makedirs(output_dir, exist_ok=True)

def is_vercel_env():
    """Check if running in Vercel environment"""
    return os.environ.get('VERCEL') == '1'

def fix_html_paths(html_content):
    """Fix asset paths in HTML content"""
    # First pass - replace relative paths with absolute
    html_content = html_content.replace("../assets/", "/assets/")
    html_content = html_content.replace("assets/", "/assets/")
    
    # Check if any paths still use relative format
    asset_paths = re.findall(r'src=[\'"]([^\'"]*assets[^\'"]*)[\'"]', html_content)
    print(f"Found {len(asset_paths)} asset paths in HTML")
    for path in asset_paths[:10]:  # Show first 10 for debugging
        print(f"Asset path: {path}")
    
    return html_content

def main():
    print("Starting build process...")
    print(f"Python version: {sys.version}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Directory contents: {os.listdir('.')}")
    
    config = load_config()
    base_path = config['assets_dir']
    layers = config['layers']
    output_dir = config['output_dir']
    
    # Ensure output directory exists
    ensure_output_dir(output_dir)
    
    print(f"Scanning folders in {base_path}...")
    if not os.path.isdir(base_path):
        print(f"Warning: Assets directory {base_path} does not exist or is not a directory")
        print(f"Creating empty assets directory")
        os.makedirs(base_path, exist_ok=True)
    
    catalog, image_data = scan_folders(base_path, layers)
    print(f"Generating rarity catalog...")
    rarity_catalog = assign_rarity(catalog)
    
    print(f"Generating HTML...")
    html_content = generate_html(catalog, rarity_catalog, image_data)
    
    # Fix paths for web deployment
    print("Fixing asset paths in HTML...")
    html_content = fix_html_paths(html_content)
    
    output_path = os.path.join(output_dir, 'nft_studio.html')
    with open(output_path, 'w') as f:
        f.write(html_content)
    print(f"Wrote HTML to {output_path}")
    
    # Create a copy of the HTML at the root level for direct access
    with open('nft_studio.html', 'w') as f:
        f.write(html_content)
    print(f"Created root copy at nft_studio.html")
    
    # Create a simple favicon.ico if it doesn't exist
    favicon_path = os.path.join(output_dir, 'favicon.ico')
    if not os.path.exists(favicon_path):
        print(f"Creating empty favicon.ico")
        with open(favicon_path, 'wb') as f:
            # Write an empty ICO file
            f.write(b'\x00\x00\x01\x00\x01\x00\x10\x10\x00\x00\x01\x00\x04\x00\xe8\x02\x00\x00\x16\x00\x00\x00')
    
    # Set up assets directory in output
    output_assets_dir = os.path.join(output_dir, 'assets')
    if not os.path.exists(output_assets_dir):
        print(f"Creating output assets directory...")
        os.makedirs(output_assets_dir, exist_ok=True)
        
        # Copy assets to output
        if os.path.isdir(base_path):
            print(f"Copying assets to output directory...")
            for item in os.listdir(base_path):
                src = os.path.join(base_path, item)
                dst = os.path.join(output_assets_dir, item)
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)
            
            print(f"Assets copied. Output assets directory contents:")
            try:
                assets_contents = os.listdir(output_assets_dir)
                for item in assets_contents[:10]:  # List first 10 for brevity
                    print(f"- {item}")
                if len(assets_contents) > 10:
                    print(f"... and {len(assets_contents) - 10} more")
            except Exception as e:
                print(f"Error listing directory: {str(e)}")
    
    print(f"NFT Studio HTML generated successfully at {output_path}!")
    return 0

if __name__ == "__main__":
    main() 