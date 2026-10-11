// Temporary, unlinked visual test harness. Removed from the public Worker after review.
import {renderProduct,products} from './product-pages.mjs';
import {renderServicePage} from './service-pages.mjs';
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderReview(u,home){
 const width=[320,360,390,768,1024].includes(Number(u.searchParams.get('width')))?Number(u.searchParams.get('width')):390;
 const page=u.searchParams.get('page')||'about';
 const body=page==='home'?home:page==='product'?renderProduct(products.find(p=>p.sku==='HSG2422')):renderServicePage(page==='contact'?'/contact':'/about');
 const content=body.replace('<head>','<head><base href="https://elvarins.com/">').replace('<head><meta','<head><base href="https://elvarins.com/"><meta');
 const frames=`<form><label>Page <select name="page">${['about','contact','home','product'].map(p=>`<option${p===page?' selected':''}>${p}</option>`).join('')}</select></label><label>Viewport <select name="width">${[320,360,390,768,1024].map(w=>`<option${w===width?' selected':''}>${w}</option>`).join('')}</select></label><button>View layout</button></form><iframe title="Retail responsive preview" width="${width}" height="850" sandbox="allow-scripts" srcdoc="${escape(content)}"></iframe>`;
 const images=products.map(p=>`<section data-review-sku="${escape(p.sku)}"><h2>${escape(p.sku)} · ${escape(p.title)}</h2>${[...new Set(p.images||[p.image])].map((src,i)=>`<figure><img src="${escape(src)}" alt="${escape(p.sku)} photo ${i+1}" width="120" height="120"><figcaption>Photo ${i+1}</figcaption></figure>`).join('')}</section>`).join('');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Elvarins layout verification</title><style>body{font:15px system-ui;background:#e9edf2;padding:20px;color:#17203d}form{display:flex;gap:20px;margin:20px 0}label{display:flex;gap:8px}iframe{display:block;background:white;border:1px solid #adb8cc;max-width:100%}section{padding:15px;margin:12px 0;background:white;border-radius:10px}figure{display:inline-block;margin:8px}img{object-fit:contain}h2{font-size:16px}</style></head><body><h1>Elvarins visual verification</h1><p>Temporary review preview of production markup and assets. Form submissions are not tested inside this sandbox. Not a customer shopping page.</p>'+(page==='photos'?images:frames)+'</body></html>';
}
