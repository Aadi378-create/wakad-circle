const {canonicalStatus}=require('./domain.cjs');
function choice(data,total){const method=data.paymentChoice||'cash';if(!['cash','upi'].includes(method))throw Error('Choose cash or UPI.');if(method==='upi'&&total>100000)throw Error('UPI is available for orders up to ₹1,00,000.');return {paymentMethod:method==='upi'?'UPI':data.fulfillment==='pickup'?'Pay at pickup':'Cash on delivery',paymentStatus:'Unpaid'}}
function reference(value){if(typeof value!=='string'||!/^\d{12}$/.test(value))throw Error('Enter the 12-digit UPI transaction reference (UTR/RRN).');return value}
function submission(order,utr){reference(utr);if(order.paymentMethod!=='UPI'||['Pending confirmation','Rejected'].includes(canonicalStatus(order.status))||['Paid','Refund required','Refunded'].includes(order.paymentStatus))throw Error('This order is not awaiting a UPI payment.');if(order.paymentReference===utr&&order.paymentStatus==='Verification pending')return null;if((order.paymentAttempts||0)>=3)throw Error('Contact the shop to check this payment.');return {paymentReference:utr,paymentStatus:'Verification pending',paymentAttempts:(order.paymentAttempts||0)+1,paymentIssue:''}}
function management(order,action,utr,receivedAmount){
 if(order.paymentMethod!=='UPI')throw Error('This is not a UPI order.');
 if(action==='not-received'){if(order.paymentStatus!=='Verification pending')throw Error('There is no payment claim to review.');return {paymentStatus:'Unpaid',paymentIssue:'The store could not find this payment. Check with the store before paying again.'}}
 if(!['confirm','refund'].includes(action))throw Error('Invalid payment action.');reference(utr);
 if(!Number.isFinite(receivedAmount)||Math.round(receivedAmount*100)!==Math.round(order.total*100))throw Error('The bank receipt amount must match the full order total.');
 if(action==='refund'){if(order.status!=='Rejected'||order.paymentStatus!=='Refund required')throw Error('This order does not need a refund.');return {paymentStatus:'Refunded',refundReference:utr}}
 if(order.paymentStatus==='Paid'&&order.confirmedPaymentReference===utr)return null;
 if(['New','Pending confirmation'].includes(order.status)||['Paid','Refund required','Refunded'].includes(order.paymentStatus))throw Error('This payment cannot be confirmed in its current state.');
 return {paymentStatus:order.status==='Rejected'?'Refund required':'Paid',confirmedPaymentReference:utr,paidAmount:order.total,paymentIssue:''};
}
module.exports={choice,reference,submission,management};
