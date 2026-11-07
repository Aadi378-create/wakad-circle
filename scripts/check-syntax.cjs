const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const roots=['dist','functions','scripts','tests'];let count=0;
function visit(root){if(!fs.existsSync(root))return;for(const entry of fs.readdirSync(root,{withFileTypes:true})){if(entry.name==='node_modules')continue;const target=path.join(root,entry.name);if(entry.isDirectory()){visit(target);continue}if(!/\.(c?js|mjs)$/.test(entry.name))continue;const result=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});if(result.status!==0){console.error(result.stderr);process.exitCode=1}count++;}}
roots.forEach(visit);
console.log('Syntax checked '+count+' JavaScript files.');
