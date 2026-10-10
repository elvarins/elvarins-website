'use strict';
(() => {
 const cleanups=new WeakMap();
 function mount(root,product){
  cleanups.get(root)?.();
  const images=[...new Set([product.image,...(product.images||[])])].filter(s=>typeof s==='string'&&/^https:\/\//.test(s));
  const image=root.querySelector('[data-gallery-image]'),thumbs=root.querySelector('[data-gallery-thumbs]'),status=root.querySelector('[data-gallery-status]');
  if(!image||!thumbs||!images.length)return;
  const oldZoom=root.querySelector('[data-gallery-zoom]');if(oldZoom){oldZoom.hidden=true;oldZoom.textContent='';}
  let trigger=image.closest('.gallery-open');
  if(!trigger){trigger=document.createElement('button');trigger.type='button';trigger.className='gallery-open';image.replaceWith(trigger);trigger.append(image);}
  trigger.setAttribute('aria-label','Open fullscreen photos for '+product.title);
  let index=0;
  const controls=document.createElement('div');controls.className='gallery-slider-controls';
  const makeButton=(label,text)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.textContent=text;return b;};
  const prev=makeButton('Previous product photo','‹'),next=makeButton('Next product photo','›'),counter=document.createElement('span');
  controls.append(prev,counter,next);trigger.after(controls);prev.hidden=next.hidden=images.length<2;
  const hint=document.createElement('p');hint.className='gallery-hint';hint.textContent='Tap photo to enlarge'+(images.length>1?' · Swipe to explore':'');controls.after(hint);
  const lightbox=document.createElement('dialog');lightbox.className='gallery-lightbox';lightbox.setAttribute('aria-label',product.title+' fullscreen photos');
  const close=makeButton('Close fullscreen photos','×'),fullPrev=makeButton('Previous fullscreen photo','‹'),fullNext=makeButton('Next fullscreen photo','›'),fullImage=document.createElement('img'),fullCount=document.createElement('p');
  close.className='gallery-lightbox-close';fullPrev.className='gallery-lightbox-prev';fullNext.className='gallery-lightbox-next';fullCount.className='gallery-lightbox-count';fullImage.referrerPolicy='no-referrer';
  lightbox.append(close,fullPrev,fullImage,fullNext,fullCount);document.body.append(lightbox);fullPrev.hidden=fullNext.hidden=images.length<2;
  thumbs.replaceChildren();thumbs.hidden=images.length<2;const buttons=[];
  function select(i){index=(i+images.length)%images.length;image.src=fullImage.src=images[index];image.alt=fullImage.alt=product.title+' — photo '+(index+1);counter.textContent=(index+1)+' / '+images.length;fullCount.textContent='Photo '+(index+1)+' of '+images.length;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===index)));if(status)status.textContent=fullCount.textContent;}
  images.forEach((src,i)=>{const b=makeButton('Show product photo '+(i+1),'');b.className='gallery-thumb';const t=document.createElement('img');t.src=src;t.alt='';t.width=t.height=72;t.loading='lazy';t.referrerPolicy='no-referrer';b.append(t);b.onclick=()=>select(i);buttons.push(b);thumbs.append(b);});
  prev.onclick=fullPrev.onclick=()=>select(index-1);next.onclick=fullNext.onclick=()=>select(index+1);
  trigger.onclick=()=>{select(index);lightbox.showModal();close.focus();};close.onclick=()=>lightbox.close();
  lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();select(index-1);}if(e.key==='ArrowRight'){e.preventDefault();select(index+1);}});
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
  function swipe(el){let start=null;el.onpointerdown=e=>{start={x:e.clientX,y:e.clientY};};el.onpointerup=e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){select(index+(dx<0?1:-1));el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();},{once:true,capture:true});}};el.onpointercancel=()=>{start=null;};}
  swipe(trigger);swipe(fullImage);select(0);
  cleanups.set(root,()=>{if(lightbox.open)lightbox.close();lightbox.remove();controls.remove();hint.remove();});
 }
 window.ElvarinsGallery={mount};const data=document.getElementById('product-data'),root=document.querySelector('[data-product-gallery]');if(data&&root)mount(root,JSON.parse(data.textContent));
})();
