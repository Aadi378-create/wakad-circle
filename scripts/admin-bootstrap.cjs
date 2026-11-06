// Uses the existing, explicitly authorized Firebase CLI login, entirely in memory.
// CLI module location is supplied as argv[2]; no credentials are printed or copied.
const path=require('node:path'),vm=require('node:vm'),fs=require('node:fs');
const {createRequire}=require('node:module');
const cliRequire=createRequire(path.join(process.argv[2],'package.json'));
const cliAuth=cliRequire('./lib/auth.js');
const functionsRequire=createRequire(path.join(__dirname,'../functions/package.json'));
const {initializeApp}=functionsRequire('firebase-admin/app');
const {getAuth}=functionsRequire('firebase-admin/auth');
async function main(){
  const account=cliAuth.getGlobalDefaultAccount();if(!account)throw Error('Firebase CLI sign-in required.');
  initializeApp({projectId:'wakad-kissan',credential:{async getAccessToken(){const token=await cliAuth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);return {access_token:token.access_token,expires_in:3600}}}});
  const mode=process.argv[3];
  if(mode==='seed'){
    const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
    const end=source.indexOf('function read(');const context={};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const seed='),end)+';this.catalog=seed;',context);
    const {validateProduct}=require('../functions/domain.cjs');
    const token=await cliAuth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
    const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
    const root='https://firestore.googleapis.com/v1/projects/wakad-kissan/databases/(default)/documents';
    const existing=await fetch(root+'/products?pageSize=1',{headers,signal:AbortSignal.timeout(20000)});if(!existing.ok)throw Error('Firestore catalog check failed: '+existing.status);
    if(!(await existing.json()).documents?.length){
      const writes=context.catalog.map(raw=>{const p=validateProduct(raw);const fields=Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?(Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}):{stringValue:v}]));return {update:{name:root.replace('https://firestore.googleapis.com/v1/','')+'/products/'+p.id,fields},currentDocument:{exists:false}}});
      const response=await fetch(root+':commit',{method:'POST',headers,body:JSON.stringify({writes}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Catalog creation failed: '+response.status);
    }
    console.log('Starter catalog verified in Firestore.');
  }else if(mode==='owner'){
    const phone=process.argv[4];if(!/^\+91[6-9]\d{9}$/.test(phone||''))throw Error('Provide the approved shopkeeper mobile number.');
    const auth=getAuth();let user;try{user=await auth.getUserByPhoneNumber(phone)}catch(err){if(err.code!=='auth/user-not-found')throw err;user=await auth.createUser({phoneNumber:phone})}
    await auth.setCustomUserClaims(user.uid,{...user.customClaims,shopkeeper:true});console.log('Approved shopkeeper role assigned. Phone verification is required to sign in.');
  }else throw Error('Choose seed or owner.');
}
main().catch(err=>{console.error(err.message);process.exitCode=1});
