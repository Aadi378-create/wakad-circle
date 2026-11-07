let afterLogin=null,otpPhone='',otpSent=false,resendAt=0,checkoutRequestId=null;
function updateStatus(){
  const cloud=window.WKCloud;
  $('#connectionstatus').textContent=!cloud||cloud.restoring?'Restoring your saved sign-in…':cloud.user?'Signed in':'Sign in to order';
  const label=cloud?.user?'My account':'Sign in';$('#signinbutton').setAttribute('aria-label',label);$('#signinbutton').title=label;
}
function login(next){
  afterLogin=typeof next==='function'?next:null;
  if(!window.WKCloud){notify('Firebase is still connecting. Please try again.');return;}
  if(window.WKCloud.user){showModal(`<h2>Your account</h2><p>${escape(window.WKCloud.user.phoneNumber||'Phone verified')}</p><p>${'Customer account'}</p><button class="primary wide" id="signout">Sign out</button>`);$('#signout').onclick=async()=>{await window.WKCloud.signOut();$('#modal').close()};return;}
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
  appRole:'customer',login,
  receiveProducts(ps){products=ps.filter(p=>p&&Number.isSafeInteger(p.id)&&p.id>0&&typeof p.name==='string'&&typeof p.unit==='string'&&Number.isInteger(p.cat)&&p.cat>=0&&p.cat<=5&&Number.isInteger(p.stock)&&p.stock>=0&&Number.isFinite(p.price)&&p.price>=.01);catalogReady=true;const next=WCCart.reconcile(cart,products);if(!window.WK.isCheckoutPending?.()&&JSON.stringify(next)!==JSON.stringify(cart)){cart=next;persist();notify('Your basket was adjusted to current stock. Please review it.')}render();if(!$('#drawer').hidden)drawCart();window.WK.catalogChanged?.()},
  receiveOrders(os){orders=os.sort((a,b)=>String(b.date).localeCompare(String(a.date)))},
  authReset(){if($('#modal').open)$('#modal').close()},
  authChanged:updateStatus,cloudReady:updateStatus,
  sessionError(err){$('#connectionstatus').textContent=err.message},
  cloudError(err){$('#connectionstatus').textContent='Connection needs attention';notify(err.message||'Unable to connect to your shop.')}
};
updateStatus();
