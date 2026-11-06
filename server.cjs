const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
function createServer(){return http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(req.url.split('?')[0]);if(name.includes('\0'))throw Error('Invalid path')}catch{res.writeHead(400);return res.end('Invalid request')}
  const file=path.join(root,name==='/'?'index.html':name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}
    const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.end(data);
  });
})}
if(require.main===module)createServer().listen(4173,'127.0.0.1',()=>console.log('Local: http://localhost:4173'));
module.exports={createServer};
