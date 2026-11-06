const path=require('node:path'),{createRequire}=require('node:module');
const cli=createRequire(path.join(process.argv[2],'package.json'));
const auth=cli('./lib/auth.js');
async function main(){
 const account=auth.getGlobalDefaultAccount();if(!account)throw Error('Firebase sign-in required');
 const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform','https://www.googleapis.com/auth/firebase']);
 const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
 async function request(url,method='GET',body){const r=await fetch(url,{method,headers,...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(method+' '+new URL(url).hostname+' failed: '+r.status);return r.json()}
 const configURL='https://identitytoolkit.googleapis.com/admin/v2/projects/wakad-kissan/config';
 const config=await request(configURL);
 const domains=[...new Set([...(config.authorizedDomains||[]),'wakad-circle.web.app','wakad-circle.firebaseapp.com'])];
 await request(configURL+'?updateMask=authorizedDomains','PATCH',{authorizedDomains:domains});
 await request('https://firebase.googleapis.com/v1beta1/projects/wakad-kissan?updateMask=displayName','PATCH',{displayName:'Wakad Circle'});
 await request('https://firebase.googleapis.com/v1beta1/projects/wakad-kissan/webApps/1:114726270849:web:4277f0fdb91859675b9a80?updateMask=displayName','PATCH',{displayName:'Wakad Circle'});
 console.log(JSON.stringify({displayName:'Wakad Circle',webAppDisplayName:'Wakad Circle',authorizedNewDomains:domains.filter(d=>d.includes('wakad-circle'))}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
