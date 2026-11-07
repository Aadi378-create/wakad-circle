const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {validateCheckoutTotal,nextAddressRate,validateProduct,quote,fulfillmentDetails,validateAddress,orderTransition,nextOrderRate,nextProductRevision}=require('./domain.cjs');
const payment=require('./payments.cjs'),{randomBytes}=require('node:crypto');
initializeApp();const db=getFirestore(),options={enforceAppCheck:process.env.ENFORCE_APP_CHECK==='true',region:'asia-south1',maxInstances:5,invoker:'public',cors:[...(process.env.FUNCTIONS_EMULATOR==='true'?['http://localhost:4175']:[]),'https://wakad-circle.web.app','https://wakad-circle.firebaseapp.com','https://wakad-kissan.web.app','https://wakad-kissan.firebaseapp.com','https://wakad-kissan-kirana.peakedbeam2.chatgpt.site']};
function signedIn(request){if(!request.auth||!request.auth.token.phone_number)throw new HttpsError('unauthenticated','Sign in with your phone number first.');}
function owner(request){signedIn(request);if(request.auth.token.shopkeeper!==true)throw new HttpsError('permission-denied','Only the shopkeeper can make this change.');}
function validate(fn){try{return fn()}catch(e){throw new HttpsError('invalid-argument',e.message)}}
exports.saveProduct=onCall(options,async request=>{owner(request);const p=validate(()=>validateProduct(request.data)),ref=db.collection('products').doc(String(p.id));await db.runTransaction(async tx=>{const current=await tx.get(ref);let revision;try{revision=nextProductRevision(current.exists?current.data():null,request.data.revision??0)}catch(err){throw new HttpsError('failed-precondition',err.message)}tx.set(ref,{...p,revision});});return {ok:true};});
exports.placeOrder=onCall(options,async request=>{
  signedIn(request);const details=validate(()=>fulfillmentDetails(request.data));
  const key=request.data.requestId;if(typeof key!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw new HttpsError('invalid-argument','Invalid checkout request.');
  const lines=request.data.items;if(!Array.isArray(lines)||!lines.length||lines.length>50||lines.some(l=>!l||!Number.isSafeInteger(l.id)||l.id<1))throw new HttpsError('invalid-argument','Invalid basket.');
  const orderRef=db.collection('orders').doc(request.auth.uid+'_'+key);
  return db.runTransaction(async tx=>{
    const previous=await tx.get(orderRef);if(previous.exists)return {id:orderRef.id,total:previous.data().total,status:previous.data().status};
    const settings=await tx.get(db.doc('store/config'));const availability=require('./updates.cjs').availability(settings.exists?settings.data():null);if(!availability.open)throw new HttpsError('failed-precondition',availability.message);
    const rateRef=db.collection('orderLimits').doc(request.auth.uid),rateSnapshot=await tx.get(rateRef);
    let rate;try{rate=nextOrderRate(rateSnapshot.exists?rateSnapshot.data():null,Date.now())}catch(err){throw new HttpsError('resource-exhausted',err.message)}
    const refs=lines.map(l=>db.collection('products').doc(String(l.id)));
    const docs=await tx.getAll(...refs);const catalog=new Map(docs.filter(d=>d.exists).map(d=>[d.data().id,d.data()]));
    const bill=validate(()=>quote(lines,catalog,details.fulfillment));
    try{validateCheckoutTotal(request.data.expectedTotal,bill)}catch(e){throw new HttpsError('failed-precondition',e.message)}
    const paymentDetails=validate(()=>payment.choice(request.data,bill.total));
    bill.items.forEach(i=>tx.update(db.collection('products').doc(String(i.id)),{stock:catalog.get(i.id).stock-i.qty,revision:(catalog.get(i.id).revision||0)+1}));
    const order={...details,...bill,...paymentDetails,paymentRef:'WC'+randomBytes(8).toString('hex'),uid:request.auth.uid,phone:request.auth.token.phone_number,status:'Pending confirmation',stockReleased:false,date:new Date().toISOString(),createdAt:FieldValue.serverTimestamp()};
    tx.set(rateRef,rate);
    tx.set(orderRef,order);return {id:orderRef.id,total:order.total,status:order.status};
  });
});
exports.setOrderStatus=onCall(options,async request=>{
  owner(request);const {id,status,reason=''}=request.data||{};
  if(typeof id!=='string'||!id||id.length>250||id.includes('/')||!['Accepted','Preparing','Ready for pickup','Out for delivery','Completed','Rejected'].includes(status)||typeof reason!=='string'||reason.length>200)throw new HttpsError('invalid-argument','Invalid order action.');
  const ref=db.collection('orders').doc(id);
  return db.runTransaction(async tx=>{
    const snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Order not found.');
    const order=snap.data();let change;try{change=orderTransition(order,status)}catch(err){throw new HttpsError('failed-precondition',err.message)}
    if(status==='Accepted'&&order.proposal?.state==='awaiting-customer')throw new HttpsError('failed-precondition','Wait for the customer to approve the revised basket.');
    if(change.unchanged)return {ok:true,status};
    if(change.restore){
      const items=order.items.filter(i=>Number.isSafeInteger(i.id));
      const docs=items.length?await tx.getAll(...items.map(i=>db.collection('products').doc(String(i.id)))):[];
      docs.forEach((doc,index)=>{if(doc.exists)tx.update(doc.ref,{stock:doc.data().stock+items[index].qty,revision:(doc.data().revision||0)+1})});
    }
    tx.update(ref,{status,updatedAt:FieldValue.serverTimestamp(),...(status==='Rejected'?{...(order.paymentStatus==='Paid'?{paymentStatus:'Refund required'}:{}),stockReleased:true,rejectionReason:reason.trim()||'The store could not fulfil this order.'}:{})});
    return {ok:true,status};
  });
});

Object.assign(exports,require('./updates.cjs').build({db,FieldValue,HttpsError,onCall,options,signedIn,owner,validate}));
exports.notifyNewOrder=require('firebase-functions/v2/firestore').onDocumentCreated({document:'orders/{orderId}',region:'asia-south1',maxInstances:5},event=>require('./order-alerts.cjs').sendOrderAlert({db,auth:require('firebase-admin/auth').getAuth(),messaging:require('firebase-admin/messaging').getMessaging()},event));
exports.saveAddress=onCall(options,async request=>{
  signedIn(request);const address=validate(()=>validateAddress(request.data)),collection=db.collection('users').doc(request.auth.uid).collection('addresses');
  await db.runTransaction(async tx=>{const rateRef=db.collection('addressLimits').doc(request.auth.uid),rateSnapshot=await tx.get(rateRef);let rate;try{rate=nextAddressRate(rateSnapshot.exists?rateSnapshot.data():null,Date.now())}catch(e){throw new HttpsError('resource-exhausted',e.message)}const snap=await tx.get(collection);if(snap.size>=10&&!snap.docs.some(d=>d.id===address.id))throw new HttpsError('resource-exhausted','You can save up to 10 addresses.');tx.set(rateRef,rate);tx.set(collection.doc(address.id),{...address,updatedAt:FieldValue.serverTimestamp()})});return {ok:true};
});
exports.deleteAddress=onCall(options,async request=>{signedIn(request);const id=request.data?.id;if(typeof id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(id))throw new HttpsError('invalid-argument','Invalid address.');await db.runTransaction(async tx=>{const rateRef=db.collection('addressLimits').doc(request.auth.uid),snap=await tx.get(rateRef);let rate;try{rate=nextAddressRate(snap.exists?snap.data():null,Date.now())}catch(e){throw new HttpsError('resource-exhausted',e.message)}tx.set(rateRef,rate);tx.delete(db.collection('users').doc(request.auth.uid).collection('addresses').doc(id))});return {ok:true};});

function orderId(data){const id=data?.id;if(typeof id!=='string'||!id||id.length>250||id.includes('/'))throw new HttpsError('invalid-argument','Invalid order.');return id}
exports.submitPaymentReference=onCall(options,async request=>{
 signedIn(request);const id=orderId(request.data),utr=validate(()=>payment.reference(request.data?.reference));
 return db.runTransaction(async tx=>{const ref=db.collection('orders').doc(id),snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Order not found.');const order=snap.data();if(order.uid!==request.auth.uid)throw new HttpsError('permission-denied','This is not your order.');let update;try{update=payment.submission(order,utr)}catch(e){throw new HttpsError('failed-precondition',e.message)}if(update)tx.update(ref,{...update,paymentSubmittedAt:FieldValue.serverTimestamp()});return {ok:true}});
});
exports.managePayment=onCall(options,async request=>{
 owner(request);const id=orderId(request.data),{action,reference:utr,amount}=request.data;
 if(!['confirm','refund','not-received'].includes(action)||request.data.checkedBank!==true)throw new HttpsError('invalid-argument','Check the bank receipt before recording this action.');
 return db.runTransaction(async tx=>{const ref=db.collection('orders').doc(id),snap=await tx.get(ref);if(!snap.exists)throw new HttpsError('not-found','Order not found.');let update;try{update=payment.management(snap.data(),action,utr,amount)}catch(e){throw new HttpsError('failed-precondition',e.message)}if(!update)return {ok:true};if(action!=='not-received'){const receipt=db.collection('paymentReceipts').doc((action==='refund'?'refund-':'paid-')+utr),existing=await tx.get(receipt);if(existing.exists&&existing.data().orderId!==id)throw new HttpsError('already-exists','This bank reference is already recorded against another order.');tx.set(receipt,{orderId:id,type:action,amount:snap.data().total,recordedBy:request.auth.uid,recordedAt:FieldValue.serverTimestamp()})}tx.update(ref,{...update,paymentReviewedBy:request.auth.uid,paymentReviewedAt:FieldValue.serverTimestamp()});return {ok:true}});
});
