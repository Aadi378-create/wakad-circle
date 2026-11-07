let fulfillment=read('wc-fulfillment','delivery')==='pickup'?'pickup':'delivery',savedAddresses=[],selectedAddressId='';
let storeAddress=window.WC_STORE_ADDRESS||'Wakad, Pune · 411057';
const addressKey=()=>`wc-address-${window.WKCloud?.user?.uid||'signed-out'}`;
const currentAddress=()=>savedAddresses.find(a=>a.id===selectedAddressId)||savedAddresses[0];
const deliveryFee=(amount=total())=>fulfillment==='pickup'||amount>=499?0:25;
const canonicalOrderStatus=status=>({New:'Pending confirmation',Packing:'Preparing',Delivered:'Completed'}[status]||status);
const statusLabel=status=>({'Pending confirmation':'Awaiting store confirmation',Accepted:'Accepted by the store',Preparing:'Being prepared','Ready for pickup':'Ready for pickup','Out for delivery':'Out for delivery',Completed:'Completed',Rejected:'Could not be fulfilled'}[canonicalOrderStatus(status)]||status);
const indiaTime=value=>new Date(value).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Kolkata'});
const baseCommerceModal=showModal;
showModal=function(html){$('#modal').dataset.view='';baseCommerceModal(html)};
function commerceModal(view,html){showModal(html);$('#modal').dataset.view=view;}
function setFulfillment(mode){fulfillment=mode;saveLocal('wc-fulfillment',mode);updateFulfillmentHeader();if(!$('#drawer').hidden)drawCart();}
function updateFulfillmentHeader(){
  const address=currentAddress();$('#location b').innerHTML=fulfillment==='pickup'?'Store pickup <span>⌄</span>':'Delivery in 25–35 mins <span>⌄</span>';
  $('#location small').textContent=fulfillment==='pickup'?'⌖ '+storeAddress:'⌖ '+(address?address.label+' · '+address.address:'Choose a delivery address');
}
function fulfillmentPicker(){return `<div class="fulfillment-picker" role="group" aria-label="Choose delivery or pickup"><button type="button" data-fulfillment="delivery" class="${fulfillment==='delivery'?'selected':''}">⌂ Delivery<small>₹25 · free on ₹499+</small></button><button type="button" data-fulfillment="pickup" class="${fulfillment==='pickup'?'selected':''}">♧ Store pickup<small>Always free · no minimum</small></button></div>`;}
drawCart=function(){
  const items=products.filter(p=>cart[p.id]);
  $('#drawer').innerHTML=`<div class="drawer-head"><h2>Your basket (${items.reduce((n,p)=>n+cart[p.id],0)})</h2><button class="close" id="closecart" aria-label="Close cart">×</button></div><p class="form-note">Wakad Circle · Your neighbourhood, ready when you are.</p>${fulfillmentPicker()}${items.length?items.map(p=>`<div class="cart-item"><span>${escape(p.emoji)}</span><div><b>${escape(p.name)}</b><small>${escape(p.unit)} · ${money(p.price)}</small>${qty(p)}</div><b>${money(p.price*cart[p.id])}</b></div>`).join('')+`<div class="bill"><b>Bill details</b><p>Items <span>${money(total())}</span></p><p>${fulfillment==='pickup'?'Store pickup':'Delivery'} <span>${deliveryFee()===0?'FREE':money(deliveryFee())}</span></p><p>To pay <span>${money(total()+deliveryFee())}</span></p></div><p class="form-note">${fulfillment==='pickup'?'No minimum order. Choose your arrival time at checkout.':total()<499?`Add ${money(499-total())} more for free delivery.`:'Your order qualifies for free delivery.'}</p><button id="checkout" class="primary wide">${fulfillment==='pickup'?'Choose pickup time':'Continue to delivery'} →</button><p class="form-note">The shopkeeper checks availability before accepting your order.</p>`:'<div class="empty"><h2>Your basket is waiting.</h2><p>Add a few neighbourhood favourites to get started.</p><button class="primary" id="continue">Browse products</button></div>'}`;
  $('#closecart').onclick=closeCart;if($('#checkout'))$('#checkout').onclick=checkout;if($('#continue'))$('#continue').onclick=closeCart;
};
document.addEventListener('click',event=>{const button=event.target.closest('[data-fulfillment]');if(button)setFulfillment(button.dataset.fulfillment)});
function needAccount(next){if(!window.WKCloud||window.WKCloud.restoring){notify('Restoring your saved sign-in. Please wait a moment.');return true}if(!window.WKCloud?.user){login(next);return true}return false;}
function manageAddresses(back=''){
  if(needAccount(()=>manageAddresses(back)))return;
  commerceModal('addresses',`<h2>Your saved addresses</h2><p class="form-note">Save Home, Work, or another address. Delivery currently serves PIN 411057.</p><div class="address-list">${savedAddresses.length?savedAddresses.map(a=>`<article class="address-card ${a.id===currentAddress()?.id?'chosen':''}"><div><b>${escape(a.label)}</b><small>${escape(a.name)}</small><p>${escape(a.address)} · ${escape(a.pin)}</p></div><div class="address-actions"><button class="add" data-address-use="${a.id}">${a.id===currentAddress()?.id?'Selected':'Use address'}</button><button data-address-edit="${a.id}">Edit</button><button data-address-delete="${a.id}">Remove</button></div></article>`).join(''):'<div class="empty">No saved addresses yet.</div>'}</div><button class="primary wide" id="addaddress">+ Add address</button><button class="text-button wide" id="addressback">${back==='checkout'?'Back to checkout':'Done'}</button>`);
  $('#addaddress').onclick=()=>editAddress(null,back);
  $('#addressback').onclick=()=>{if(back==='checkout')checkout();else $('#modal').close()};
  $$('[data-address-use]').forEach(button=>button.onclick=()=>{selectedAddressId=button.dataset.addressUse;saveLocal(addressKey(),selectedAddressId);fulfillment='delivery';saveLocal('wc-fulfillment',fulfillment);updateFulfillmentHeader();if(back==='checkout')checkout();else $('#modal').close()});
  $$('[data-address-edit]').forEach(button=>button.onclick=()=>editAddress(savedAddresses.find(a=>a.id===button.dataset.addressEdit),back));
  $$('[data-address-delete]').forEach(button=>button.onclick=async()=>{button.disabled=true;try{const id=button.dataset.addressDelete;await window.WKCloud.deleteAddress(id);savedAddresses=savedAddresses.filter(a=>a.id!==id);updateFulfillmentHeader();manageAddresses(back)}catch(err){notify(err.message);button.disabled=false}});
}
function editAddress(address,back){
  commerceModal('address-edit',`<h2>${address?'Edit address':'Save a new address'}</h2><form id="addressform"><label>Label<input name="label" required maxlength="30" placeholder="Home or Work" value="${escape(address?.label||'')}"></label><label>Recipient name<input name="name" required minlength="2" maxlength="80" value="${escape(address?.name||'')}"></label><label>Full address<textarea name="address" required minlength="10" maxlength="300" placeholder="Flat, building, street, Wakad">${escape(address?.address||'')}</textarea></label><label>PIN code<input name="pin" required pattern="411057" value="${escape(address?.pin||'411057')}" title="Currently delivering to 411057"></label><button class="primary wide">Save address</button></form>`);
  $('#addressform').onsubmit=async event=>{event.preventDefault();const button=event.target.querySelector('button');button.disabled=true;const data={...Object.fromEntries(new FormData(event.target)),id:address?.id||crypto.randomUUID()};try{await window.WKCloud.saveAddress(data);savedAddresses=[...savedAddresses.filter(a=>a.id!==data.id),data];selectedAddressId=data.id;saveLocal(addressKey(),data.id);updateFulfillmentHeader();if(back==='checkout')checkout();else manageAddresses(back);notify('Address saved')}catch(err){notify(err.message);button.disabled=false}};
}
let checkoutDraft={},checkoutSubmitting=false;
window.WK.isCheckoutPending=()=>checkoutSubmitting;
checkout=function(){
  if(!window.WKCloud)return notify('Connecting to the shop. Please try again.');if(needAccount(checkout))return;
  if(!products.some(p=>cart[p.id]))return notify('Your basket is empty.');
  const address=currentAddress(),checkoutTotal=total()+deliveryFee();
  if((checkoutTotal<1||checkoutTotal>100000)&&checkoutDraft.paymentChoice==='upi')checkoutDraft.paymentChoice='cash';
  commerceModal('checkout',`<h2>${fulfillment==='pickup'?'When should we expect you?':'Where should we deliver?'}</h2><p class="form-note">Your order is sent to the shopkeeper for confirmation.</p>${fulfillmentPicker()}<form id="circlecheckout"><label>Your name<input name="name" required minlength="2" maxlength="80" value="${escape(checkoutDraft.name||address?.name||circleProfile?.displayName||'')}"></label>${fulfillment==='pickup'?`<div class="pickup-location"><b>♧ Wakad Circle</b><p>${escape(storeAddress)}</p><small>No minimum order · No delivery fee</small></div><label>I’ll arrive in<select name="pickupMinutes">${[15,30,45,60,90,120].map(n=>`<option value="${n}" ${Number(checkoutDraft.pickupMinutes||30)===n?'selected':''}>${n<60?n+' minutes':n===60?'1 hour':n===90?'1½ hours':'2 hours'}</option>`).join('')}</select></label><p class="form-note">Arrival time is a request. Wait for the store to accept and mark your items ready.</p>`:`<div class="checkout-address"><b>${address?escape(address.label):'Choose a saved address'}</b><p>${address?escape(address.address)+' · '+escape(address.pin):'Add an address to continue with delivery.'}</p><button type="button" class="text-button" id="chooseaddress">${address?'Change / add address':'Add delivery address'}</button></div>`}<label>Payment method<select name="paymentChoice"><option value="cash" ${checkoutDraft.paymentChoice!=="upi"?"selected":""}>Cash ${fulfillment==="pickup"?"at pickup":"on delivery"}</option><option value="upi" ${checkoutDraft.paymentChoice==="upi"?"selected":""}>UPI · pay after store accepts</option></select></label><p class="form-note">UPI opens with the bill amount filled in. The store verifies receipt manually.</p><div class="bill"><p>Items <span>${money(total())}</span></p><p>${fulfillment==='pickup'?'Pickup':'Delivery'} <span>${deliveryFee()===0?'FREE':money(deliveryFee())}</span></p><p>Order total <span>${money(total()+deliveryFee())}</span></p></div><button class="primary wide">Request order · ${money(total()+deliveryFee())}</button></form>`);
  if($('#chooseaddress'))$('#chooseaddress').onclick=()=>{checkoutDraft=Object.fromEntries(new FormData($('#circlecheckout')));manageAddresses('checkout')};
  $$('[data-fulfillment]').forEach(button=>button.onclick=event=>{event.stopPropagation();checkoutDraft=Object.fromEntries(new FormData($('#circlecheckout')));setFulfillment(button.dataset.fulfillment);checkout()});
  $('#circlecheckout').onsubmit=async event=>{
    event.preventDefault();const data=Object.fromEntries(new FormData(event.target));checkoutDraft=data;
    if(fulfillment==='delivery'&&!currentAddress())return manageAddresses('checkout');
    const payload={expectedTotal:checkoutTotal,name:data.name,fulfillment,paymentChoice:data.paymentChoice,...(fulfillment==='pickup'?{pickupMinutes:Number(data.pickupMinutes)}:{address:currentAddress().address,pin:currentAddress().pin})};
    const button=event.target.querySelector('button[type="submit"]')||event.target.querySelector('.primary');button.disabled=true;
    checkoutSubmitting=true;
    try{
      checkoutRequestId||=crypto.randomUUID();const result=await window.WKCloud.placeOrder({...payload,requestId:checkoutRequestId,items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,qty:cart[p.id]}))});
      cart={};checkoutRequestId=null;checkoutDraft={};persist();render();closeCart();
      commerceModal('success',`<div class="order-success"><div>✓</div><h2>Sent to Wakad Circle.</h2><p>The shopkeeper is checking your order.</p><p class="form-note">${fulfillment==='pickup'?'Pickup request sent. Check My orders for acceptance and readiness.':'We’ll show acceptance and delivery progress in My orders.'}</p><b>${money(result.total)}</b><button class="primary wide" id="trackorder">Track my order</button></div>`);$('#trackorder').onclick=showCustomerOrders;
    }catch(err){notify(err.message);button.disabled=false}finally{checkoutSubmitting=false}
  };
};
function showCustomerOrders(){
  if(needAccount(showCustomerOrders))return;
  const mine=orders.filter(o=>o.uid===window.WKCloud.user.uid);
  commerceModal('orders',`<h2>Your orders</h2><p class="form-note">Live updates from your neighbourhood shop.</p>${mine.length?mine.map(o=>`<article class="customer-order"><div class="order-topline"><b>${o.fulfillment==='pickup'?'♧ Store pickup':'⌂ Delivery'}</b><span class="status-badge status-${canonicalOrderStatus(o.status).split(' ')[0].toLowerCase()}">${escape(statusLabel(o.status))}</span></div><p>${o.items.map(i=>escape(i.name)+' × '+i.qty).join(', ')}</p>${o.fulfillment==='pickup'?`<small>Requested arrival: ${o.pickupMinutes} min after ordering · ${indiaTime(o.pickupAt)}</small>`:`<small>${escape(o.address||'')} · ${escape(o.pin||'')}</small>`}${o.rejectionReason?`<p class="rejection-note">${escape(o.rejectionReason)}</p>`:''}${window.WCOrderPayment?.(o)||''}<div class="order-total"><span>${new Date(o.date).toLocaleDateString('en-IN')}</span><b>${money(o.total)}</b></div></article>`).join(''):'<div class="empty">No orders yet. Your next neighbourhood basket will appear here.</div>'}`);
}
function showCircleAccount(){
  if(needAccount(showCircleAccount))return;
  commerceModal('account',`<h2>Your circle.</h2><p class="form-note">${escape(window.WKCloud.user.phoneNumber||'Phone verified')}</p><div class="account-menu"><button id="myorders">My orders <span>→</span></button><button id="myaddresses">Saved addresses <span>${savedAddresses.length} →</span></button><button id="circlelogout">Sign out <span>↗</span></button></div>`);
  $('#myorders').onclick=showCustomerOrders;$('#myaddresses').onclick=()=>manageAddresses();if($('#circlelogout'))$('#circlelogout').onclick=async()=>{await window.WKCloud.signOut();$('#modal').close()};
}
$('#signinbutton').onclick=showCircleAccount;
$('#location').onclick=()=>{commerceModal('fulfillment',`<h2>Your neighbourhood, your way.</h2>${fulfillmentPicker()}<button class="primary wide" id="openaddresses">Choose a delivery address</button><p class="form-note">Store pickup: ${escape(storeAddress)}</p>`);$$('[data-fulfillment]').forEach(button=>button.onclick=event=>{event.stopPropagation();setFulfillment(button.dataset.fulfillment);if(fulfillment==='delivery')manageAddresses();else $('#modal').close()});$('#openaddresses').onclick=()=>manageAddresses()};
const previousOrdersReceiver=window.WK.receiveOrders,previousAuthChanged=window.WK.authChanged;
window.WK.receiveOrders=function(os){previousOrdersReceiver(os);if($('#modal').open&&$('#modal').dataset.view==='orders')showCustomerOrders()};
window.WK.catalogChanged=function(){if($('#modal').open&&$('#modal').dataset.view==='checkout'&&!checkoutSubmitting){checkoutDraft=Object.fromEntries(new FormData($('#circlecheckout')));checkout();notify('Prices or stock updated. Please review the total.')}};
window.WK.receiveAddresses=function(addresses){savedAddresses=addresses;selectedAddressId=read(addressKey(),'');updateFulfillmentHeader();if($('#modal').open&&$('#modal').dataset.view==='addresses')manageAddresses()};
window.WK.authChanged=function(){previousAuthChanged();selectedAddressId=read(addressKey(),'');updateFulfillmentHeader()};
selectedAddressId=read(addressKey(),'');updateFulfillmentHeader();
