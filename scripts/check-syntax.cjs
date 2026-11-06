const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const roots=['dist','functions','scripts','tests'];let count=0;
for(const root of roots){if(!fs.existsSync(root))continue;for(const file of fs.readdirSync(root)){if(!/\.(c?js)$/.test(file))continue;const target=path.join(root,file);const result=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});if(result.status!==0){console.error(result.stderr);process.exitCode=1}count++;}}
console.log('Syntax checked '+count+' JavaScript files.');
