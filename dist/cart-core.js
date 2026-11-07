(function(root){
 function normalize(value){const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;for(const [id,qty]of Object.entries(value))if(/^[1-9]\d*$/.test(id)&&Number.isSafeInteger(Number(id))&&Number.isInteger(qty)&&qty>0&&qty<=100)result[id]=qty;return result}
 function reconcile(value,products){const result=normalize(value),byId=new Map(products.map(p=>[String(p.id),p]));for(const id of Object.keys(result)){const product=byId.get(id);if(!product||product.stock<1)delete result[id];else result[id]=Math.min(result[id],product.stock)}return result}
 const api={normalize,reconcile};if(typeof module==='object')module.exports=api;else root.WCCart=api;
})(typeof window==='object'?window:this);
