const {spawn,execFile}=require('node:child_process');
const http=require('node:http');
const url='http://localhost:4173/?mode=demo';
function open(){execFile('explorer.exe',[url]);console.log('Wakad Kissan demo opened: '+url)}
http.get(url,res=>{res.resume();open()}).on('error',()=>{
  const server=spawn(process.execPath,['server.cjs'],{cwd:__dirname,detached:true,stdio:'ignore',windowsHide:true});server.unref();
  let attempts=0;const timer=setInterval(()=>{http.get(url,res=>{res.resume();clearInterval(timer);open()}).on('error',()=>{if(++attempts>20){clearInterval(timer);console.error('Unable to start demo. Run node server.cjs to inspect the error.')}})},250);
});
