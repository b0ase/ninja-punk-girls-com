from http.server import BaseHTTPRequestHandler
import os
import mimetypes
import re

# Add more MIME types
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')
mimetypes.add_type('image/gif', '.gif')
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Normalize path to prevent directory traversal
        path = self.path
        path = re.sub(r'[/]+', '/', path)  # Remove duplicate slashes
        path = path.replace('..', '')  # Remove parent directory references
        
        print(f"Received request for: {path}")
        
        # Default path handling
        if path == "/":
            # Serve the main HTML file
            try:
                with open('output/nft_studio.html', 'rb') as file:
                    self.serve_file('output/nft_studio.html', file.read())
                    return
            except FileNotFoundError:
                self.send_error_response("NFT Studio HTML not found. Please run build.py first.")
                return
        
        # Handle specific paths
        if path.startswith('/assets/'):
            # Handle asset requests directly
            file_path = path[1:]  # Remove leading slash
            try:
                with open(file_path, 'rb') as file:
                    self.serve_file(file_path, file.read())
                    return
            except FileNotFoundError:
                print(f"Asset not found: {file_path}")
                # Continue to other handlers
        
        # Handle output directory requests
        if path.startswith('/output/'):
            file_path = path[1:]  # Remove leading slash
            try:
                with open(file_path, 'rb') as file:
                    self.serve_file(file_path, file.read())
                    return
            except FileNotFoundError:
                print(f"Output file not found: {file_path}")
                # Continue to other handlers
        
        # Try serving from root path if the file exists
        clean_path = path[1:] if path.startswith('/') else path
        if os.path.exists(clean_path):
            try:
                with open(clean_path, 'rb') as file:
                    self.serve_file(clean_path, file.read())
                    return
            except:
                pass
        
        # Try serving nft_studio.html directly for any unmatched path
        try:
            with open('nft_studio.html', 'rb') as file:
                self.serve_file('nft_studio.html', file.read())
                return
        except FileNotFoundError:
            # Fall back to 404
            self.send_error_response("File not found")
            return
    
    def serve_file(self, file_path, content):
        """Serve a file with appropriate content type"""
        content_type = self.get_content_type(file_path)
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)
    
    def get_content_type(self, file_path):
        """Get content type based on file extension"""
        _, ext = os.path.splitext(file_path)
        return mimetypes.types_map.get(ext.lower(), 'application/octet-stream')
    
    def send_error_response(self, message, status=404):
        """Send an error response"""
        self.send_response(status)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        error_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error {status}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 40px;
                    background-color: #8a2be2;
                    color: white;
                    text-align: center;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: rgba(0,0,0,0.3);
                    padding: 40px;
                    border-radius: 10px;
                }}
                h1 {{
                    font-size: 36px;
                }}
                a {{
                    color: white;
                    text-decoration: underline;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Error {status}</h1>
                <p>{message}</p>
                <p><a href="/">Return to homepage</a></p>
            </div>
        </body>
        </html>
        """
        
        self.wfile.write(error_html.encode('utf-8')) 