from PIL import Image
import numpy as np
import sys

# Path to the image
image_path = "/Users/FRESH/Library/Mobile Documents/com~apple~CloudDocs/Documents/GitHub/NPGClaude/NPGClaude/red_dots.JPG"

# Load image
try:
    img = Image.open(image_path)
    pixels = np.array(img)
    height, width, _ = pixels.shape
    print(f"Image dimensions: {width}x{height}")
except Exception as e:
    print(f"Error opening image: {e}")
    sys.exit(1)

# Function to determine if a pixel is red
def is_red(pixel):
    # RGB values with some tolerance for variations in red
    r, g, b = pixel
    return r > 200 and g < 100 and b < 100

# Find red pixels
red_pixels = []
for y in range(height):
    for x in range(width):
        if is_red(pixels[y, x]):
            red_pixels.append((x, y))

print(f"Found {len(red_pixels)} red pixels")

# Cluster the red pixels to find the centers of the dots
# Using a simple approach: we consider pixels within 20 pixels distance of each other to be part of the same dot
def cluster_pixels(pixels, distance_threshold=20):
    clusters = []
    for pixel in pixels:
        # Check if this pixel belongs to an existing cluster
        found_cluster = False
        for cluster in clusters:
            for cluster_pixel in cluster:
                # Calculate Euclidean distance
                distance = np.sqrt((pixel[0] - cluster_pixel[0])**2 + (pixel[1] - cluster_pixel[1])**2)
                if distance < distance_threshold:
                    cluster.append(pixel)
                    found_cluster = True
                    break
            if found_cluster:
                break
        
        # If not found in any cluster, create a new one
        if not found_cluster:
            clusters.append([pixel])
    
    return clusters

# Get clusters
red_dots = cluster_pixels(red_pixels)
print(f"Found {len(red_dots)} red dot clusters")

# If we found more than 6 clusters, take the 6 largest ones
if len(red_dots) > 6:
    red_dots = sorted(red_dots, key=len, reverse=True)[:6]

# Calculate the center of each cluster
dot_centers = []
for cluster in red_dots:
    if not cluster:
        continue
    x_sum = sum(pixel[0] for pixel in cluster)
    y_sum = sum(pixel[1] for pixel in cluster)
    center_x = x_sum // len(cluster)
    center_y = y_sum // len(cluster)
    dot_centers.append((center_x, center_y))

# Print the coordinates
print("\nRed dot coordinates (x, y):")
for i, center in enumerate(dot_centers):
    print(f"Dot {i+1}: {center}") 