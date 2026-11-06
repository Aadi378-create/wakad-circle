const {test}=require('node:test'),assert=require('node:assert/strict'),api=require('./index.cjs'),{getFirestore}=require('firebase-admin/firestore');
const db=getFirestore(),owner={uid:'shopkeeper-test',token:{phone_number:'+919999999999',shopkeeper:true}},customer={uid:'customer-a',token:{phone_number:'+919999999999'}};
test('rejecting a reserved order restores stock exactly once',async()=>{
  const original=db.runTransaction;let order={status:'Pending confirmation',items:[{id:1,qty:2}],stockReleased:false},stock={stock:5,revision:3},writes=0;
  db.runTransaction=async fn=>fn({get:async()=>({exists:true,data:()=>order}),getAll:async(...refs)=>refs.map(ref=>({exists:true,ref,data:()=>stock})),update:(ref,data)=>{writes++;if(ref.path.startsWith('products/'))Object.assign(stock,data);else Object.assign(order,data)}});
  try{await api.setOrderStatus.run({auth:owner,data:{id:'test-order',status:'Rejected',reason:'Unavailable'}});assert.equal(stock.stock,7);assert.equal(stock.revision,4);const once=writes;await api.setOrderStatus.run({auth:owner,data:{id:'test-order',status:'Rejected'}});assert.equal(stock.stock,7);assert.equal(writes,once)}finally{db.runTransaction=original}
});
test('address writes derive the account path from authentication, not a client uid',async()=>{
  const original=db.runTransaction;let writtenPath;
  db.runTransaction=async fn=>fn({get:async()=>({size:0,docs:[]}),set:(ref)=>writtenPath=ref.path});
  try{await api.saveAddress.run({auth:customer,data:{uid:'victim',id:'home-1',label:'Home',name:'Test Customer',address:'Sample address in Wakad',pin:'411057'}});assert.equal(writtenPath,'users/customer-a/addresses/home-1')}finally{db.runTransaction=original}
});
test('address book limit prevents an eleventh address',async()=>{const original=db.runTransaction;db.runTransaction=async fn=>fn({get:async()=>({size:10,docs:[]}),set:()=>{throw Error('must not write')}});try{await assert.rejects(api.saveAddress.run({auth:customer,data:{id:'eleventh',label:'Work',name:'Test Customer',address:'Sample address in Wakad',pin:'411057'}}),{code:'resource-exhausted'})}finally{db.runTransaction=original}});
test('pickup checkout reserves inventory, charges no delivery fee, and is idempotent',async()=>{
  const original=db.runTransaction;let stored,stock={id:1,name:'Small item',price:20,stock:5,revision:0},writes=0;
  db.runTransaction=async fn=>fn({get:async ref=>ref.path.startsWith('orders/')?{exists:!!stored,data:()=>stored}:{exists:false},getAll:async(...refs)=>refs.map(ref=>({exists:true,ref,data:()=>stock})),update:(ref,data)=>{Object.assign(stock,data);writes++},set:(ref,data)=>{writes++;if(ref.path.startsWith('orders/'))stored=data}});
  const request={auth:customer,data:{requestId:'checkout-request-1234',name:'Test Customer',fulfillment:'pickup',pickupMinutes:30,items:[{id:1,qty:1,price:1}]}};
  try{const first=await api.placeOrder.run(request);assert.equal(first.total,20);assert.equal(stored.deliveryFee,0);assert.equal(stored.status,'Pending confirmation');assert.equal(stock.stock,4);const count=writes;await api.placeOrder.run(request);assert.equal(stock.stock,4);assert.equal(writes,count)}finally{db.runTransaction=original}
});
