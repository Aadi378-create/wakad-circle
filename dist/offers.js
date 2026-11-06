const basketIllustration=`<svg viewBox="0 0 180 160" fill="none" aria-hidden="true"><ellipse cx="91" cy="143" rx="66" ry="9" fill="#103b29" opacity=".18"/><path d="M115 63c10-26 25-30 29-27-1 19-9 33-25 38" fill="#e9bf52"/><path d="M113 66c-2-22 5-35 11-35 7 17 7 30-2 43" fill="#f9d878"/><path d="M49 81c-16-14-25-37-12-46 15-3 26 19 29 40" fill="#87b874"/><path d="M52 77c-4-20-1-42 13-44 12 10 7 30-3 45" fill="#b0cf85"/><path d="M53 73c3-15 13-27 22-23 6 15-4 27-12 32" fill="#70a563"/><circle cx="89" cy="72" r="24" fill="#eb785f"/><path d="m89 43 3 14 12-7-7 14 14 1-17 5-7-9-13 5 8-11-4-8 11 4Z" fill="#416b43"/><path d="M30 89h123l-15 46H46L30 89Z" fill="#f4d79a"/><path d="M36 94h111M58 100l5 27m26-27v27m28-27-5 27" stroke="#c2995f" stroke-width="5" stroke-linecap="round"/><path d="m55 90 28-47m46 47-27-47" stroke="#fff2ce" stroke-width="7" stroke-linecap="round"/><path d="M26 89h132" stroke="#fae8ba" stroke-width="9" stroke-linecap="round"/><circle cx="151" cy="32" r="4" fill="#d9e9ab"/><path d="m19 64 3 7 8 3-8 3-3 7-3-7-8-3 8-3 3-7Z" fill="#d9e9ab"/></svg>`;
function renderOffers(){
  const deals=products.filter(p=>p.stock>0&&p.mrp>p.price);
  const best=deals.reduce((winner,p)=>!winner||p.mrp-p.price>winner.mrp-winner.price?p:winner,null);
  const maxDiscount=deals.reduce((max,p)=>Math.max(max,Math.round((1-p.price/p.mrp)*100)),0);
  $('#offers').innerHTML=`<div class="offers-heading"><span>Good things. Better prices.</span><small>YOUR LOCAL LITTLE EXTRAS</small></div><div class="offers-track"><button class="offer-card delivery-offer" data-offer="delivery"><span class="offer-copy"><small>THE DELIVERY IS ON US</small><b>A full basket.<br>Zero delivery fee.</b><em>On orders of ₹200 or more</em><span class="offer-cta">Build your basket ↗</span></span><span class="offer-illustration">${basketIllustration}</span><span class="offer-stamp">LOCAL<br>LOVE</span></button>${deals.length?`<button class="offer-card savings-offer" data-offer="deals"><span class="offer-copy"><small>SMALL PRICES. BIG SMILES.</small><b>Your favourites,<br>for a little less.</b><em>${deals.length} picks with everyday savings</em><span class="offer-cta">Explore the deals ↗</span></span><span class="discount-sun"><small>UP TO</small><strong>${maxDiscount}<sup>%</sup></strong><b>OFF</b></span><span class="offer-spark spark-one">✳</span><span class="offer-spark spark-two">✦</span></button><button class="offer-card pick-offer" data-offer="product" data-product="${best.id}"><span class="offer-copy"><small>THE SHELF SPOTLIGHT</small><b>Save ${money(best.mrp-best.price)}<br>on this good pick.</b><em>${escape(best.name)}</em><span class="offer-cta">Take a closer look ↗</span></span><span class="product-spotlight">${art(best)}</span><span class="spotlight-ring"></span></button>`:''}</div>`;
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
