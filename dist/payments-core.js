(function(root){
  const merchant=Object.freeze({upi:'8262924901@axisbank',name:'Aadi Jain',bank:'Axis Bank'});
  function amount(value){const n=Number(value);if(!Number.isFinite(n)||n<1||n>100000||Math.abs(n*100-Math.round(n*100))>0.00001)throw Error('Enter an amount from ₹1 to ₹1,00,000, with up to two decimal places.');return n.toFixed(2)}
  function uri(value,reference){if(!/^[A-Za-z0-9-]{1,40}$/.test(reference))throw Error('Invalid payment reference.');return 'upi://pay?'+new URLSearchParams({pa:merchant.upi,pn:merchant.name,am:amount(value),cu:'INR',tr:reference,tn:'Wakad Circle '+reference}).toString()}
  function canPay(order){return order.paymentMethod==='UPI'&&!['New','Pending confirmation','Rejected'].includes(order.status)&&!['Paid','Refund required','Refunded'].includes(order.paymentStatus)}
  const api={merchant,amount,uri,canPay};if(typeof module==='object')module.exports=api;else root.WCPayment=api;
})(typeof window==='object'?window:this);
