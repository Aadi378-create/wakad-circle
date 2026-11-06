const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('./index.cjs');
const customer={uid:'test-customer',token:{phone_number:'+919999999999'}};
const shopkeeper={uid:'test-owner',token:{phone_number:'+919999999999',shopkeeper:true}};
test('all writes require a verified phone account',async()=>{for(const name of ['saveProduct','placeOrder','seedCatalog','setOrderStatus','saveAddress','deleteAddress']){await assert.rejects(api[name].run({data:{}}),{code:'unauthenticated'});await assert.rejects(api[name].run({auth:{uid:'unverified',token:{}},data:{}}),{code:'unauthenticated'})}});
test('customer cannot edit prices, seed inventory, or manage order status',async()=>{for(const name of ['saveProduct','seedCatalog','setOrderStatus'])await assert.rejects(api[name].run({auth:customer,data:{shopkeeper:true}}),{code:'permission-denied'})});
test('authenticated malformed requests are rejected before database writes',async()=>{for(const [name,data]of [['saveProduct',null],['seedCatalog',null],['setOrderStatus',null],['placeOrder',null],['saveAddress',null],['deleteAddress',null]])await assert.rejects(api[name].run({auth:shopkeeper,data}),{code:'invalid-argument'})});
