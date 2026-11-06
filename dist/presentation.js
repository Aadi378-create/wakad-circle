const cloudConfigured=!!window.WK_FIREBASE_CONFIG;
const oldPersist=persist;
if(cloudConfigured){products=[];orders=[];render();persist=()=>localStorage.setItem('wk-cart',JSON.stringify(cart));}
let afterLogin=null,otpPhone='',otpSent=false,resendAt=0,checkoutRequestId=null;
function updateStatus(){
  $('#connectionstatus').textContent=cloudConfigured?(window.WKCloud?(window.WKCloud.user?(window.WKCloud.owner?'Shopkeeper signed in':'Signed in'):'Sign in to place an order'):'Connecting to your shop…'):'Demo · Sample data';
  const accountLabel=window.WKCloud?.user?'My account':'Sign in';$('#signinbutton').setAttribute('aria-label',accountLabel);$('#signinbutton').title=accountLabel;
}
function login(next){
  afterLogin=typeof next==='function'?next:null;
  if(!cloudConfigured){showModal(`<h2>Phone sign-in</h2><p>Firebase setup is not complete yet.</p><p class="form-note">The shopkeeper demo works without signing in. Real OTP sign-in becomes available once the Firebase project is connected.</p><button class="primary wide" id="trytour">Start presentation demo</button>`);$('#trytour').onclick=()=>{$('#modal').close();startTour()};return;}
  if(!window.WKCloud){notify('Firebase is still connecting. Please try again.');return;}
  if(window.WKCloud.user){showModal(`<h2>Your account</h2><p>${escape(window.WKCloud.user.phoneNumber||'Phone verified')}</p><p>${window.WKCloud.owner?'Shopkeeper workspace enabled':'Customer account'}</p><button class="primary wide" id="signout">Sign out</button>`);$('#signout').onclick=async()=>{await window.WKCloud.signOut();$('#modal').close()};return;}
  otpSent=false;otpPhone='';
  showModal(`<h2>Welcome to your kirana.</h2><p>Sign in with your mobile number.</p><form id="phoneform"><label>Mobile number<div class="phone-input"><span>+91</span><input name="phone" required pattern="[6-9][0-9]{9}" maxlength="10" inputmode="tel" autocomplete="tel-national" placeholder="10-digit mobile number"></div></label><label class="consent"><input type="checkbox" required> I agree to receive a verification SMS. Google processes the phone number for authentication and abuse prevention.</label><div id="recaptcha"></div><p id="autherror" role="alert"></p><button class="primary wide" id="sendotp">Send OTP</button></form><form id="otpform" hidden><label>6-digit verification code<input name="code" required pattern="[0-9]{6}" maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="Enter OTP"></label><p id="otperror" role="alert"></p><button class="primary wide" id="verifyotp">Verify & continue</button><button type="button" id="resendotp" class="wide" style="margin-top:14px">Resend OTP (after 60 seconds)</button></form>`);
  $('#phoneform').onsubmit=async e=>{e.preventDefault();otpPhone='+91'+new FormData(e.target).get('phone');await sendOTP()};
  $('#resendotp').onclick=sendOTP;
  $('#otpform').onsubmit=async e=>{e.preventDefault();const b=$('#verifyotp');b.disabled=true;$('#otperror').textContent='';try{await window.WKCloud.verifyOTP(new FormData(e.target).get('code'));$('#modal').close();notify('Phone number verified');const next=afterLogin;afterLogin=null;if(next)next()}catch(err){$('#otperror').textContent=authMessage(err)}finally{b.disabled=false}};
}
async function sendOTP(){
  if(Date.now()<resendAt)return notify('Please wait before requesting another OTP.');
  const b=$('#sendotp');b.disabled=true;$('#autherror').textContent='';
  try{await window.WKCloud.sendOTP(otpPhone);otpSent=true;resendAt=Date.now()+60000;$('#otpform').hidden=false;$('#sendotp').textContent='OTP sent';$('#sendotp').hidden=true;notify('OTP sent. Check your phone.');}
  catch(err){$('#autherror').textContent=authMessage(err)}finally{b.disabled=false}
}
function authMessage(err){const errors={'auth/invalid-verification-code':'That code is incorrect. Please try again.','auth/code-expired':'The code has expired. Request a new OTP.','auth/too-many-requests':'Too many requests. Please wait and try later.','auth/unauthorized-domain':'This domain needs to be authorized in Firebase.','auth/billing-not-enabled':'SMS requires billing to be enabled in Firebase.','auth/invalid-phone-number':'Enter a valid 10-digit mobile number.','auth/network-request-failed':'Connection lost. Please try again.'};return errors[err.code]||err.message||'Unable to sign in. Please try again.'}
window.WK={
  login,
  receiveProducts(ps){products=ps;render();const editing=document.activeElement?.closest('#inventory input');if(admin&&!editing)renderAdmin();if(!$('#drawer').hidden)drawCart()},
  receiveOrders(os){orders=os.sort((a,b)=>String(b.date).localeCompare(String(a.date)));if(admin)renderAdmin()},
  cloudReady(){updateStatus();},
  authChanged(){updateStatus();if(admin&&!window.WKCloud?.owner)toggleAdmin();},
  cloudError(err){$('#connectionstatus').textContent='Firebase connection needs attention';notify(err.message||'Unable to connect to Firebase');},
  async submitCloudOrder(data,form){
    const b=form.querySelector('button');b.disabled=true;checkoutRequestId||=crypto.randomUUID();
    try{const result=await window.WKCloud.placeOrder({...data,requestId:checkoutRequestId,items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,qty:cart[p.id]}))});cart={};checkoutRequestId=null;persist();render();closeCart();showModal(`<div class="order-success"><div>✓</div><h2>Your order is in!</h2><p>Cash on delivery · ${money(result.total)}</p><p class="form-note">Order reference: ${escape(result.id)}</p><p>Your shopkeeper can now see this order.</p><button class="primary wide" onclick="document.querySelector('dialog').close()">Continue shopping</button></div>`)}catch(err){notify(err.message)}finally{b.disabled=false}
  }
};
$('#signinbutton').onclick=()=>{if(!cloudConfigured&&window.WK_FIREBASE_PROJECT){location.href=location.pathname+'?mode=live';return}login()};
const modeButton=document.createElement('button');modeButton.id='modebutton';modeButton.textContent=cloudConfigured?'Try demo':'Back to live shop';modeButton.onclick=()=>{location.href=location.pathname+(cloudConfigured?'?mode=demo':'?mode=live')};$('.demo-menu>div').prepend(modeButton);
let tourStep=0;
const tourSteps=[
  {title:'Your kirana, on a screen.',text:'Show the shopkeeper familiar products, categories, and prices. Customers can search and fill a basket in seconds.',action:'Show a customer basket',target:'.hero'},
  {title:'A basket with free delivery.',text:'Rice ₹139 + butter ₹60 + tomatoes ₹24 = ₹223. Delivery is free because the basket is at least ₹200.',action:'Show demo checkout',target:'#cartbtn'},
  {title:'A simple cash-on-delivery order.',text:'The customer enters their address and confirms. This walkthrough uses sample details and sends no SMS or real order.',action:'Create sample order',target:'#cartbtn'},
  {title:'The shopkeeper sees the order.',text:'Orders show the customer, address, items and total. Move an order from New to Packing, Out for delivery, and Delivered.',action:'Show price management',target:'#orders'},
  {title:'Change a price. Update your shelves.',text:'Edit any product’s price or available quantity, then click Save. The storefront immediately reflects the change. In Firebase mode, changes sync across devices.',action:'Finish demo',target:'#inventory'}
];
function startTour(){
  if(cloudConfigured){showModal(`<h2>Shopkeeper walkthrough</h2><p>The Firebase store uses real accounts and shared inventory.</p><ol><li>Sign in with the shopkeeper’s phone number.</li><li>Update a product price under Manage shop.</li><li>Open a customer session and place a cash-on-delivery order.</li><li>Return to Orders and update its status.</li></ol><p class="form-note">For a sample-data presentation, open the downloadable local demo with Firebase configuration disabled.</p>`);return;}
  tourStep=0;showTour();
}
function showTour(){
  closeCart();$('#modal').close();$('#tourpanel')?.remove();
  if(tourStep===0){if(admin)toggleAdmin();category='All';$('#search').value='';render();window.scrollTo({top:0,behavior:'smooth'})}
  if(tourStep===1){cart={9:1,7:1,1:1};persist();render();$('#cartbtn').click()}
  if(tourStep===2){$('#cartbtn').click();$('#drawer').innerHTML=`<div class="drawer-head"><h2>Demo checkout</h2><button class="close" id="closecart" aria-label="Close cart">×</button></div><p class="form-note">Sample details for the presentation. No real order is sent.</p><form><label>Customer name<input value="Sample Customer" readonly></label><label>Delivery address<textarea readonly>Sample Flat, Wakad, Pune · 411057</textarea></label><label>Payment method<input value="Cash on delivery" readonly></label></form><div class="bill"><p>Item total <span>₹223</span></p><p>Delivery <span>FREE</span></p><p>To pay <span>₹223</span></p></div><p class="form-note">Click “Create sample order” in the guided demo to show the shopkeeper inbox.</p>`;$('#closecart').onclick=closeCart;}
  if(tourStep===3){const sample={id:'DEMO-PRESENTATION',date:new Date().toLocaleString('en-IN'),name:'Sample Customer',phone:'Demo customer',address:'Sample Flat, Wakad, Pune',pin:'411057',total:223,status:'New',items:[{name:'India Gate basmati rice',qty:1,price:139},{name:'Amul butter',qty:1,price:60},{name:'Farm fresh tomatoes',qty:1,price:24}]};orders=orders.filter(o=>o.id!==sample.id);orders.unshift(sample);persist();if(!admin)toggleAdmin();renderAdmin();$('#orderstab').click()}
  if(tourStep===4){if(!admin)toggleAdmin();$('#inventorytab').click()}
  const step=tourSteps[tourStep],panel=document.createElement('section');panel.id='tourpanel';panel.setAttribute('aria-label','Shopkeeper demonstration');panel.innerHTML=`<button class="tour-close" aria-label="Close demonstration">×</button><span class="eyebrow green">SHOPKEEPER DEMO · ${tourStep+1} OF 5</span><h2>${step.title}</h2><p>${step.text}</p><div class="tour-actions"><button id="tourback" ${tourStep===0?'disabled':''}>← Back</button><button class="primary" id="tournext">${step.action} →</button></div>`;document.body.appendChild(panel);panel.querySelector('.tour-close').onclick=()=>panel.remove();$('#tourback').onclick=()=>{tourStep--;showTour()};$('#tournext').onclick=()=>{if(tourStep===4){panel.remove();notify('Demo complete. You can now explore the app.')}else{tourStep++;showTour()}};
}
$('#tourbutton').onclick=startTour;
const originalRenderAdmin=renderAdmin;
renderAdmin=function(){
  originalRenderAdmin();
  if(window.WKCloud?.owner&&products.length===0){
    const seedButton=document.createElement('button');seedButton.className='primary';seedButton.textContent='Load starter catalog';
    seedButton.onclick=async()=>{seedButton.disabled=true;try{await window.WKCloud.seed(seed);notify('Starter catalog loaded')}catch(err){notify(err.message)}finally{seedButton.disabled=false}};
    $('#inventory').prepend(seedButton);
  }
};
updateStatus();
