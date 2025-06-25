from azure.storage.blob import BlobServiceClient
import os
import sys
from pathlib import Path

def upload_directory_to_blob(connection_string, container_name, local_dir):
    """Upload all files from a local directory to Azure Blob Storage."""
    try:
        # Create the BlobServiceClient
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        
        # Get the container client
        container_client = blob_service_client.get_container_client(container_name)
        
        # Create container if it doesn't exist
        try:
            container_client.create_container()
            # Set container to allow CORS
            container_client.set_container_access_policy(signed_identifiers={}, public_access='container')
        except:
            pass

        # Walk through the directory
        for root, dirs, files in os.walk(local_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                    # Get the full path
                    file_path = os.path.join(root, file)
                    
                    # Calculate blob path (preserve directory structure)
                    blob_path = os.path.relpath(file_path, local_dir)
                    blob_path = blob_path.replace("\\", "/")  # Normalize path separators
                    
                    # Get blob client
                    blob_client = container_client.get_blob_client(blob_path)
                    
                    # Upload file
                    with open(file_path, "rb") as data:
                        blob_client.upload_blob(data, overwrite=True)
                        print(f"Uploaded: {blob_path}")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python upload_to_blob.py <connection_string>")
        sys.exit(1)
        
    connection_string = sys.argv[1]
    container_name = "assets"
    local_dir = "assets"
    
    if not os.path.exists(local_dir):
        print(f"Error: Directory '{local_dir}' not found!")
        sys.exit(1)
        
    print(f"Uploading contents of '{local_dir}' to Azure Blob Storage...")
    upload_directory_to_blob(connection_string, container_name, local_dir)
    print("Upload complete!") 