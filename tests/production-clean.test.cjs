const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const cart=require('../dist/cart-core.js'),domain=require('../functions/domain.cjs');
test('both shipped apps contain no sample-mode branches and customer app exposes no owner portal',()=>{
 function visit(folder){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,item.name);if(item.isDirectory())visit(file);else if(/\.(html|css|js|json|webmanifest)$/.test(file))assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\bdemo\b|presentation\.js|startTour|toggleAdmin/i,file)}}visit('dist');
 const html=fs.readFileSync('dist/index.html','utf8');assert.doesNotMatch(html,/id="(?:admin|manage|inventory)"|(?:href|src)="[^"]*(?:shopkeeper|portal)/i);assert.ok(html.includes('auth-ui.js'));assert.ok(!fs.existsSync('dist/presentation.js'));
});
test('untrusted saved cart values cannot inject markup or invalid basket quantities',()=>{assert.deepEqual(cart.normalize({'1':'<img src=x>','2':-1,'3':1.5,'4':101,'5':2,'__proto__':3}),{'5':2});assert.deepEqual(cart.normalize([]),{});assert.deepEqual(cart.reconcile({'1':4,'2':1},[{id:1,stock:2}]),{'1':2})});
test('fractional-paise prices cannot round a product down to free',()=>{for(const price of [.001,.005,1.001])assert.throws(()=>domain.validateProduct({id:1,name:'Item',unit:'1 pack',cat:0,price,stock:1}));assert.equal(domain.validateProduct({id:1,name:'Item',unit:'1 pack',cat:0,price:.01,stock:1}).price,.01)});
test('checkout requires the displayed total and rejects silent price increases',()=>{assert.equal(domain.validateCheckoutTotal(49,{total:49}),true);for(const expected of [48,50,NaN,undefined,49.001])assert.throws(()=>domain.validateCheckoutTotal(expected,{total:49}))});
test('address edits and deletes share a bounded per-account rate window',()=>{let state;for(let i=0;i<20;i++)state=domain.nextAddressRate(state,1000);assert.equal(state.count,20);assert.throws(()=>domain.nextAddressRate(state,1001));assert.equal(domain.nextAddressRate(state,61000).count,1)});
test('focused inventory form submits its rendered revision rather than adopting a newer snapshot',async()=>{
 const source=fs.readFileSync('dist/portal.js','utf8'),start=source.indexOf('function renderInventory(){'),end=source.indexOf("$('#inventorysearch').oninput",start);
 let saved;const button={dataset:{saveProduct:'1'}},fields={'#inventorysearch':{value:''},'#portalinventory':{},'#portal-price-1':{value:'20'},'#portal-stock-1':{value:'10'}};
 const context={products:[{id:1,name:'Item',unit:'1 pack',price:20,mrp:20,stock:10,revision:1}],$:s=>fields[s],$$:()=>[button],escape:String,allowed:()=>true,notify(){},window:{WKCloud:{saveProduct:async p=>saved=p}}};
 vm.runInNewContext(source.slice(start,end)+';renderInventory()',context);context.products=[{...context.products[0],stock:8,revision:2}];await button.onclick();assert.equal(saved.revision,1);assert.equal(saved.stock,10);
});
test('customer app requests only its orders even when the account is a shopkeeper; stale addresses are discarded',async()=>{
 let authChanged;const listeners=new Map(),starts=[],addresses=[],resets=[];
 const auth={},authSDK={getAuth:()=>auth,onIdTokenChanged:(auth,fn)=>authChanged=fn},dbSDK={getFirestore:()=>({}),doc:(db,...parts)=>({key:parts.join('/')}),collection:(db,...parts)=>({key:parts.join('/')}),onSnapshot:(ref,next)=>{listeners.set(ref.key,next);return()=>{}}};
 const context={URL,Promise,Date,navigator:{onLine:true},document:{visibilityState:'visible',addEventListener(){}},window:{addEventListener(){},WCSession:{persistentAuth:async()=>true,orderChannel:()=>({stop(){},start:(user,owner)=>starts.push({uid:user?.uid,owner}),refresh:async()=>true})},WK_FIREBASE_CONFIG:{projectId:'audit'},WK:{appRole:'customer',receiveProducts(){},receiveOrders(){},receiveAddresses:list=>addresses.push(list),authReset:()=>resets.push(1),authChanged(){},cloudReady(){},cloudError:error=>{throw error}}},appSDK:{initializeApp:()=>({})},authSDK,dbSDK,fnSDK:{getFunctions:()=>({}),httpsCallable:()=>async()=>({data:{}})}};
 context.fixtures={appSDK:context.appSDK,authSDK:context.authSDK,dbSDK:context.dbSDK,fnSDK:context.fnSDK};let source=fs.readFileSync('dist/firebase.js','utf8');for(const [file,sdk]of [['app','appSDK'],['auth','authSDK'],['firestore','dbSDK'],['functions','fnSDK']])source=source.replace("import(base+'firebase-"+file+".js')",'Promise.resolve(fixtures.'+sdk+')');
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 const user=uid=>({uid,getIdTokenResult:async()=>({claims:{shopkeeper:true}})});
 await authChanged(user('alice'));assert.equal(starts.at(-1).owner,false);const oldAddress=listeners.get('users/alice/addresses');await authChanged(user('bob'));oldAddress({docs:[{data:()=>({label:'ALICE PRIVATE'})}]});assert.ok(!addresses.flat().some(x=>x.label==='ALICE PRIVATE'));assert.equal(context.window.WKCloud.user.uid,'bob');assert.ok(resets.length>=2);
 context.window.WK.appRole='shopkeeper';await authChanged(user('owner'));assert.equal(starts.at(-1).owner,true);
});
