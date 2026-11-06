// Run only with an authorized Firebase Admin environment for project wakad-kissan.
// The phone must already have completed Firebase sign-in. Never expose an Admin key in the browser.
const requireFunctions=require('node:module').createRequire(require('node:path').join(__dirname,'../functions/package.json'));
const {initializeApp,applicationDefault}=requireFunctions('firebase-admin/app');
const {getAuth}=requireFunctions('firebase-admin/auth');
const phone=process.argv[2];if(!/^\+91[6-9]\d{9}$/.test(phone||''))throw Error('Usage: node scripts/set-shopkeeper.cjs +91XXXXXXXXXX');
initializeApp({credential:applicationDefault(),projectId:'wakad-kissan'});
(async()=>{const auth=getAuth(),user=await auth.getUserByPhoneNumber(phone);await auth.setCustomUserClaims(user.uid,{...user.customClaims,shopkeeper:true});console.log('Shopkeeper role applied. Sign out and sign back in to refresh access.');})().catch(e=>{console.error(e.message);process.exitCode=1});
