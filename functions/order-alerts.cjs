// Generic lock-screen alerts only. Never include customer identities/addresses.
async function sendOrderAlert({db,auth,messaging},event){
 if(!event.data?.exists)return;
 const devices=await db.collection('orderAlertDevices').limit(500).get(),owners=new Map(),valid=[];
 for(const d of devices.docs){const device=d.data();if(!owners.has(device.uid)){let ok=false;try{const u=await auth.getUser(device.uid);ok=!u.disabled&&!!u.phoneNumber&&u.customClaims?.shopkeeper===true}catch{}owners.set(device.uid,ok)}if(owners.get(device.uid))valid.push(d);else await d.ref.delete()}
 if(!valid.length)return;
 const result=await messaging.sendEachForMulticast({tokens:valid.map(d=>d.data().token),data:{type:'order-alert',tag:'order-'+event.params.orderId},webpush:{headers:{Urgency:'high',TTL:'600'}}});
 await Promise.all(result.responses.map((r,i)=>!r.success&&['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code)?valid[i].ref.delete():Promise.resolve()));
}
module.exports={sendOrderAlert};
