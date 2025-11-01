const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const requestListener = (req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  if (!path.extname(urlPath)) {
    urlPath += '.html';
  }
  const filePath = path.join(__dirname, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    let ext = path.extname(filePath);
    let type = 'text/html';
    if (ext === '.js') type = 'text/javascript';
    if (ext === '.css') type = 'text/css';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
};

const server = http.createServer(requestListener);
server.listen(PORT, () => {
  // SECURITY: Only log in development mode to prevent information disclosure
  if (process.env.NODE_ENV === 'development') {
    console.log(`Server running on http://localhost:${PORT}`);
  }
});
