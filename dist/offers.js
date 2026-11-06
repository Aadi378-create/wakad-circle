function renderOffers(){
  const deals=products.filter(p=>p.stock>0&&p.mrp>p.price);
  const best=deals.reduce((winner,p)=>!winner||p.mrp-p.price>winner.mrp-winner.price?p:winner,null);
  const maxDiscount=deals.reduce((max,p)=>Math.max(max,Math.round((1-p.price/p.mrp)*100)),0);
  $('#offers').innerHTML=`<button class="offer-card delivery-offer" data-offer="delivery"><span class="offer-icon">♧</span><span><small>A LITTLE EXTRA, ON US</small><b>Free delivery on ₹200+</b><em>Your everyday essentials, delivered.</em></span><span class="offer-arrow">↗</span></button>${deals.length?`<button class="offer-card savings-offer" data-offer="deals"><span class="offer-icon">%</span><span><small>EVERYDAY SAVINGS</small><b>Up to ${maxDiscount}% off</b><em>Good prices on your daily favourites.</em></span><span class="offer-arrow">↗</span></button><button class="offer-card pick-offer" data-offer="product" data-product="${best.id}"><span class="offer-icon">₹</span><span><small>A GOOD PICK FOR YOUR BASKET</small><b>Save ${money(best.mrp-best.price)}</b><em>${escape(best.name)}</em></span><span class="offer-arrow">↗</span></button>`:''}`;
}
const renderBeforeOffers=render;
render=function(){renderBeforeOffers();renderOffers()};
document.addEventListener('click',event=>{
  const offer=event.target.closest('[data-offer]');if(!offer)return;
  if(admin)toggleAdmin();category='All';filter=offer.dataset.offer==='deals'?'deals':'all';
  const product=offer.dataset.offer==='product'?products.find(p=>p.id===Number(offer.dataset.product)):null;
  $('#search').value=product?.name||'';
  $$('[data-filter]').forEach(button=>button.classList.toggle('selected',button.dataset.filter===filter));
  render();$('#products-section').scrollIntoView({behavior:'smooth',block:'start'});
});
renderOffers();
