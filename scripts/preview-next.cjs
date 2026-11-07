// Explicitly local, isolated QA. This script does not deploy or connect to the live project.
const {createServer}=require('../server.cjs');
const server=createServer(),handler=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',(req,res)=>{if(req.url.split('?')[0]==='/firebase-config.js'){res.setHeader('Content-Type','text/javascript');res.setHeader('Cache-Control','no-store');return res.end("window.WK_FIREBASE_CONFIG={apiKey:'not-a-real-key',authDomain:'localhost',projectId:'demo-wakad-circle-audit',appId:'audit-only',messagingSenderId:'123456'};window.WC_EMULATOR_HOSTS=true;window.WK_FUNCTIONS_REGION='asia-south1';window.WC_STORE_ADDRESS='Wakad, Pune · 411057';")}handler(req,res)});
server.listen(4175,'127.0.0.1',()=>console.log('Isolated next-release preview: http://localhost:4175/'));
