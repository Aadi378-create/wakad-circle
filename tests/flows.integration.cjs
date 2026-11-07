const {test,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8085')throw Error('This suite must run only in the isolated audit emulator.');
process.env.GCLOUD_PROJECT='demo-wakad-circle-audit';
const api=require('../functions/index.cjs'),{getFirestore}=require('node:module').createRequire(require('node:path').resolve('functions/package.json'))('firebase-admin/firestore');
const db=getFirestore(),{initializeTestEnvironment}=require('@firebase/rules-unit-testing'),{doc,onSnapshot,setLogLevel}=require('firebase/firestore');setLogLevel('silent');
const customer={uid:'flow-customer',token:{phone_number:'+919999999999'}},shopkeeper={uid:'flow-shop',token:{phone_number:'+919999999999',shopkeeper:true}};
let env,stop=()=>{};after(async()=>{stop();await env?.cleanup();await db.terminate()});
test('connected apps: price, stock, order, payment and refund transitions stay consistent',async()=>{
 env=await initializeTestEnvironment({projectId:'demo-wakad-circle-audit',firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync('firestore.rules','utf8')}});
 const id=700001,product=db.doc('products/'+id);await product.set({id,name:'Integration item',unit:'1 pack',cat:3,price:20,mrp:20,stock:20,revision:0,emoji:'🍿'});
 const request={auth:customer,data:{requestId:'flow-order-request-0001',name:'Integration Customer',fulfillment:'pickup',pickupMinutes:30,paymentChoice:'upi',expectedTotal:40,items:[{id,qty:2}]}};
 const placed=await api.placeOrder.run(request),order=db.doc('orders/'+placed.id);assert.equal(placed.total,40);assert.equal((await product.get()).data().stock,18);await api.placeOrder.run(request);assert.equal((await product.get()).data().stock,18);
 const client=env.authenticatedContext(customer.uid,{phone_number:customer.token.phone_number}).firestore(),states=[];let receive;
 stop=onSnapshot(doc(client,'orders',placed.id),snap=>{states.push(snap.data()?.status);receive?.(snap.data())});
 async function observed(status,action){const wait=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Customer listener did not receive '+status)),5000);receive=data=>{if(data?.status===status){clearTimeout(timer);resolve()}}});await action();await wait}
 await observed('Accepted',()=>api.setOrderStatus.run({auth:shopkeeper,data:{id:placed.id,status:'Accepted'}}));
 await api.saveProduct.run({auth:shopkeeper,data:{id,name:'Integration item',unit:'1 pack',cat:3,price:22,mrp:22,stock:18,revision:1}});
 assert.equal((await product.get()).data().price,22);assert.equal((await order.get()).data().total,40); // A saved order keeps its agreed price.
 await assert.rejects(api.saveProduct.run({auth:shopkeeper,data:{id,name:'Integration item',unit:'1 pack',cat:3,price:21,mrp:22,stock:20,revision:1}}),{code:'failed-precondition'});assert.equal((await product.get()).data().stock,18);
 await api.submitPaymentReference.run({auth:customer,data:{id:placed.id,reference:'111222333444'}});assert.equal((await order.get()).data().paymentStatus,'Verification pending');
 await api.managePayment.run({auth:shopkeeper,data:{id:placed.id,action:'confirm',reference:'111222333444',amount:40,checkedBank:true}});assert.equal((await order.get()).data().paymentStatus,'Paid');
 await observed('Rejected',()=>api.setOrderStatus.run({auth:shopkeeper,data:{id:placed.id,status:'Rejected',reason:'Integration cancellation'}}));
 assert.equal((await order.get()).data().paymentStatus,'Refund required');assert.equal((await product.get()).data().stock,20);
 await api.setOrderStatus.run({auth:shopkeeper,data:{id:placed.id,status:'Rejected'}});assert.equal((await product.get()).data().stock,20);
 await api.managePayment.run({auth:shopkeeper,data:{id:placed.id,action:'refund',reference:'444333222111',amount:40,checkedBank:true}});assert.equal((await order.get()).data().paymentStatus,'Refunded');assert.ok(states.includes('Accepted')&&states.includes('Rejected'));
});
test('connected apps: stale checkout quote is rejected before inventory changes',async()=>{
 const id=700001,before=(await db.doc('products/'+id).get()).data().stock;
 await assert.rejects(api.placeOrder.run({auth:{...customer,uid:'quote-customer'},data:{requestId:'flow-order-request-0002',name:'Integration Customer',fulfillment:'pickup',pickupMinutes:15,paymentChoice:'upi',expectedTotal:20,items:[{id,qty:1}]}}),{code:'failed-precondition'});
 assert.equal((await db.doc('products/'+id).get()).data().stock,before);
});

test('saved addresses: real transactions isolate accounts and share a save/delete rate limit',async()=>{
 const auth={...customer,uid:'address-flow-customer'},data={id:'home',label:'Home',name:'Integration Customer',address:'Integration address, Wakad',pin:'411057'};
 await api.saveAddress.run({auth,data});
 const ref=db.doc('users/'+auth.uid+'/addresses/home');assert.equal((await ref.get()).data().label,'Home');
 await api.deleteAddress.run({auth,data:{id:'home'}});assert.equal((await ref.get()).exists,false);
 for(let n=0;n<18;n++)await api.saveAddress.run({auth,data});
 await assert.rejects(api.deleteAddress.run({auth,data:{id:'home'}}),{code:'resource-exhausted'});
 assert.equal((await ref.get()).exists,true);assert.equal((await db.doc('addressLimits/'+auth.uid).get()).data().count,20);
 assert.equal((await db.doc('users/another-customer/addresses/home').get()).exists,false);
});
