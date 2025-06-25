const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Display server environment details
console.log("Starting server with environment:", {
  PORT: PORT,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  PWD: process.cwd(),
  LS: fs.readdirSync('.'),
  OUTPUT_DIR: fs.existsSync('./output') ? fs.readdirSync('./output').slice(0, 10) : 'No output dir',
  ASSETS_DIR: fs.existsSync('./assets') ? fs.readdirSync('./assets').slice(0, 5) : 'No assets dir',
  PUBLIC_DIR: fs.existsSync('./public') ? fs.readdirSync('./public').slice(0, 5) : 'No public dir'
});

// Check if output/assets directory exists
if (fs.existsSync('./output/assets')) {
  console.log("output/assets directory exists, listing first 5 items:");
  console.log(fs.readdirSync('./output/assets').slice(0, 5));
} else {
  console.log("WARNING: output/assets directory doesn't exist!");
}

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Parse the URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Normalize path to prevent directory traversal
  pathname = pathname.replace(/\.\.\//g, '').replace(/\/+/g, '/');
  
  // Handle homepage
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = './output/nft_studio.html';
    
    // Check if the file exists, if not try other paths
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync('./public/index.html')) {
        filePath = './public/index.html';
      } else if (fs.existsSync('./nft_studio.html')) {
        filePath = './nft_studio.html';
      }
    }
  } else if (pathname === '/nft_studio.html') {
    filePath = './output/nft_studio.html';
  } else if (pathname.startsWith('/assets/')) {
    // Try multiple potential locations for assets
    const assetsPaths = [
      `.${pathname}`, // Root-relative path
      `./output${pathname}`, // In output directory
      `./public${pathname}`, // In public directory
      `.${pathname.replace('/assets/', '/output/assets/')}`, // Alternate path
      pathname.substring(1) // Without leading slash
    ];
    
    filePath = null;
    for (const path of assetsPaths) {
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      console.log(`Asset not found in any location: ${pathname}`);
      console.log(`Tried: ${assetsPaths.join(', ')}`);
      filePath = `.${pathname}`; // Default to the original path for error handling
    } else {
      console.log(`Asset found at: ${filePath}`);
    }
  } else if (pathname.startsWith('/output/')) {
    // Direct output access
    filePath = '.' + pathname;
  } else {
    // Try from root
    filePath = '.' + pathname;
  }
  
  console.log(`Looking for file: ${filePath}`);
  
  // Get the file extension
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log(`Error reading file: ${filePath}`, err.code);
      
      if (err.code === 'ENOENT') {
        // File not found, try fallbacks
        const fallbacks = [
          // Try multiple fallbacks for each common path
          { test: '/output/', replacements: ['/', '/output/'] },
          { test: '/assets/', replacements: ['/output/assets/', '/public/assets/', 'assets/', '../assets/'] },
          { test: '.html', replacements: ['.html', '/output/nft_studio.html'] },
        ];
        
        let tried = false;
        
        for (const fallback of fallbacks) {
          if (pathname.includes(fallback.test)) {
            for (const replacement of fallback.replacements) {
              const altPath = pathname.replace(fallback.test, replacement);
              const altFilePath = '.' + altPath;
              
              // Skip the original path we already tried
              if (altFilePath === filePath) continue;
              
              tried = true;
              console.log(`Trying fallback: ${altFilePath}`);
              
              if (fs.existsSync(altFilePath)) {
                // Try loading the fallback (asynchronously)
                fs.readFile(altFilePath, (err2, content2) => {
                  if (err2) {
                    console.log(`Fallback failed: ${altFilePath}`, err2.code);
                    return; // Continue to next fallback
                  }
                  
                  console.log(`Fallback succeeded: ${altFilePath}`);
                  res.writeHead(200, { 'Content-Type': contentType });
                  res.end(content2, 'utf-8');
                });
                return;
              } else {
                console.log(`Fallback path doesn't exist: ${altFilePath}`);
              }
            }
          }
        }
        
        // If we didn't try any fallbacks, or as a final fallback, serve nft_studio.html
        if (!tried) {
          const defaultPath = './output/nft_studio.html';
          if (fs.existsSync(defaultPath)) {
            fs.readFile(defaultPath, (err3, content3) => {
              if (err3) {
                res.writeHead(404);
                res.end('404 Not Found - File does not exist and no fallbacks available.');
                return;
              }
              
              console.log(`Using default fallback: output/nft_studio.html`);
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content3, 'utf-8');
            });
            return;
          } else {
            // Last resort - serve an inline HTML error
            console.log(`Default fallback doesn't exist: ${defaultPath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><title>Ninja Punk Girls - Not Found</title></head>
                <body style="background-color: #8a2be2; color: white; font-family: Arial; text-align: center; padding: 50px;">
                  <h1>Ninja Punk Girls</h1>
                  <p>Sorry, the file ${pathname} was not found.</p>
                  <p>Server is running but content is missing.</p>
                  <p>Asset directories:</p>
                  <pre>${fs.existsSync('./assets') 
                    ? JSON.stringify(fs.readdirSync('./assets').slice(0, 5)) 
                    : 'No assets dir'}</pre>
                  <p>Output directory:</p>
                  <pre>${fs.existsSync('./output') 
                    ? JSON.stringify(fs.readdirSync('./output').slice(0, 5)) 
                    : 'No output dir'}</pre>
                </body>
              </html>
            `);
          }
        }
      } else {
        // Some other server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    // Success
    console.log(`Successfully served: ${filePath}`);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
}); 