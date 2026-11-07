const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createServer}=require('../server.cjs');
test('local preview server rejects malformed/traversal paths and serves install assets correctly',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
  const request=path=>new Promise((resolve,reject)=>http.get({host:'127.0.0.1',port,path},res=>{res.resume();res.on('end',()=>resolve(res))}).on('error',reject));
  try{assert.equal((await request('/%ZZ')).statusCode,400);assert.equal((await request('/%2e%2e%2fREADME.md')).statusCode,403);assert.equal((await request('/')).statusCode,200);assert.equal((await request('/manifest.webmanifest')).headers['content-type'],'application/manifest+json');assert.equal((await request('/icons/icon-192.png')).headers['content-type'],'image/png')}finally{await new Promise(resolve=>server.close(resolve))}
});
