function validateProduct(p){
  if(!p||!Number.isSafeInteger(p.id)||p.id<1||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.unit!=='string'||!p.unit.trim()||p.unit.length>30||!Number.isInteger(p.cat)||p.cat<0||p.cat>5||!Number.isFinite(p.price)||p.price<=0||p.price>100000||!Number.isInteger(p.stock)||p.stock<0||p.stock>100000)throw Error('Enter a valid product, price and stock.');
  const rawMrp=p.mrp===undefined?p.price:p.mrp;
  if(!Number.isFinite(rawMrp)||rawMrp<=0||rawMrp>100000)throw Error('Enter a valid MRP.');
  const clean={id:p.id,name:p.name.trim(),unit:p.unit.trim(),cat:p.cat,price:Math.round(p.price*100)/100,mrp:Math.round(Math.max(rawMrp,p.price)*100)/100,stock:p.stock,emoji:['🥬','🥛','🌾','🍿','🧃','🧴'][p.cat]};
  if(typeof p.pack==='string'&&p.pack.length<50)clean.pack=p.pack;
  if(typeof p.sub==='string'&&p.sub.length<50)clean.sub=p.sub;
  if(/^#[0-9a-f]{6}$/i.test(p.color||''))clean.color=p.color;
  if(p.white===true)clean.white=true;
  return clean;
}
function quote(lines,catalog){
  if(!Array.isArray(lines)||!lines.length||lines.length>50)throw Error('Choose between 1 and 50 products.');
  const seen=new Set();let subtotalPaise=0;
  const items=lines.map(line=>{
    if(!Number.isSafeInteger(line.id)||!Number.isInteger(line.qty)||line.qty<1||line.qty>100||seen.has(line.id))throw Error('Invalid basket quantity.');
    seen.add(line.id);const p=catalog.get(line.id);if(!p||p.stock<line.qty)throw Error((p?.name||'Product')+' has insufficient stock.');
    subtotalPaise+=Math.round(p.price*100)*line.qty;return {id:p.id,name:p.name,price:p.price,qty:line.qty};
  });
  const deliveryPaise=subtotalPaise>=20000?0:2500;
  return {items,subtotal:subtotalPaise/100,deliveryFee:deliveryPaise/100,total:(subtotalPaise+deliveryPaise)/100};
}
function deliveryDetails(data){
  if(!data||typeof data!=='object')throw Error('Enter delivery details.');
  if(typeof data.name!=='string'||data.name.trim().length<2||data.name.length>80||typeof data.address!=='string'||data.address.trim().length<10||data.address.length>300||data.pin!=='411057')throw Error('Enter a name and complete address in PIN 411057.');
  return {name:data.name.trim(),address:data.address.trim(),pin:data.pin};
}
function nextOrderRate(previous,now){
  const current=previous&&now-previous.windowStart<60000?previous:{windowStart:now,count:0};
  if(current.count>=5)throw Error('Please wait a minute before placing more orders.');
  return {windowStart:current.windowStart,count:current.count+1};
}
function nextProductRevision(current,expected){
  if(!Number.isSafeInteger(expected)||expected<0||expected!==(current?.revision||0))throw Error('Stock or price changed on another device. Refresh and save again.');
  return expected+1;
}
module.exports={validateProduct,quote,deliveryDetails,nextOrderRate,nextProductRevision};
