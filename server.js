const http = require('http');
const fs = require('fs');
const path = require('path');
const { Parser } = require('node-dbf');

const server = http.createServer((req, res) => {
  if (req.url === '/api/tables') {
    fs.readdir(path.join(__dirname, 'data'), (err, files) => {
      const dbfFiles = files ? files.filter(f => f.endsWith('.dbf')).map(f => f.replace('.dbf', '')) : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(dbfFiles));
    });
    return;
  }
  
  if (req.url.startsWith('/api/query')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q');
    const tableName = extractTableName(query);
    
    if (tableName) {
      const dbfPath = path.join(__dirname, 'data', `${tableName}.dbf`);
      try {
        const parser = new Parser(dbfPath);
        const records = [];
        
        parser.on('record', (record) => {
          records.push(record);
        });
        
        parser.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(records));
        });
        
        parser.on('error', (error) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Failed to read DBF file: ${error.message}` }));
        });
        
        parser.parse();
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Failed to read DBF file: ${error.message}` }));
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid query' }));
    }
    return;
  }
  
  let filePath = req.url === '/' ? '/src/index.html' : req.url;
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript'
  }[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

function extractTableName(query) {
  const match = query.toLowerCase().match(/from\s+(\w+)/);
  return match ? match[1] : null;
}

server.listen(3000, () => console.log('SQL Editor running on http://localhost:3000'));