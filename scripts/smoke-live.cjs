const assert=require('node:assert/strict');
const options={signal:()=>AbortSignal.timeout(30000)};
async function main(){
  const host='https://wakad-circle.web.app';
  const old=await fetch('https://wakad-kissan.web.app/shopkeeper.html?mode=demo',{redirect:'manual',signal:options.signal()});assert.equal(old.status,301);assert.ok(old.headers.get('location').startsWith(host+'/shopkeeper.html'));
  let response=await fetch(host,{signal:options.signal()});assert.equal(response.status,200);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('x-frame-options'),'DENY');
  for(const file of ['/manifest.webmanifest','/sw.js','/icons/icon-192.png','/shopkeeper.html','/commerce.js','/portal.js']){response=await fetch(host+file,{signal:options.signal()});assert.equal(response.status,200,file)}
  const root='https://firestore.googleapis.com/v1/projects/wakad-kissan/databases/(default)/documents';
  response=await fetch(root+'/products?pageSize=50',{signal:options.signal()});assert.equal(response.status,200);const count=(await response.json()).documents?.length||0;assert.ok(count>0);
  response=await fetch(root+'/orders',{signal:options.signal()});assert.equal(response.status,403,'anonymous order reads must be denied');
  response=await fetch(root+'/users/anonymous-test/addresses',{signal:options.signal()});assert.equal(response.status,403,'anonymous address reads must be denied');
  response=await fetch(root+'/paymentReceipts',{signal:options.signal()});assert.equal(response.status,403,'payment receipt records must stay private');
  for(const name of ['saveProduct','placeOrder','seedCatalog','setOrderStatus','saveAddress','deleteAddress','submitPaymentReference','managePayment']){
    response=await fetch('https://asia-south1-wakad-kissan.cloudfunctions.net/'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:{}}),signal:options.signal()});assert.equal(response.status,401,name+' authentication boundary');assert.equal((await response.json()).error.status,'UNAUTHENTICATED');
  }
  console.log(JSON.stringify({host,catalogProducts:count,securityHeaders:'passed',installAssets:'passed',privateOrders:'passed',privateAddresses:'passed',unauthenticatedWrites:'blocked on all eight functions'}));
}
main().catch(err=>{console.error(err.message);process.exitCode=1});
