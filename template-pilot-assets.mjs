export const pilotStyles = String.raw`
.pilot{--ink:#172941;--muted:#4e6075;--paper:#fffaf5;--coral:#f0a483;--line:#dce3e9;--wash:#f6f7f8;background:var(--paper);color:var(--ink);margin:0}
.pilot *{box-sizing:border-box}.pilot [hidden]{display:none!important}
.pilot a{color:inherit}.pilot a:hover{text-decoration:underline}.pilot :focus-visible{outline:3px solid #006b6f;outline-offset:3px}
.pilot-shell{width:min(100%,1280px);margin-inline:auto;padding-inline:24px}
.pilot-header{background:white;border-bottom:1px solid var(--line);position:static}
.pilot-nav{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;min-height:68px;line-height:1.2;padding-block:7px}
.pilot-nav a,.pilot-link{display:inline-flex;align-items:center;min-height:44px;font-weight:650;font-size:14px}
.pilot-header .pilot-nav .elv-cart-launcher{position:static;display:inline-flex;align-items:center;justify-content:center;gap:5px;margin:0;padding:4px 8px;min-width:44px;width:auto;min-height:44px;height:44px;font-size:13px;box-shadow:none;white-space:nowrap}.pilot-wordmark{gap:8px;margin-right:auto;text-decoration:none}.pilot-wordmark img{display:block}
.pilot-link{border:0;background:none;color:inherit;cursor:pointer}.pilot-skip{position:absolute;left:16px;top:-100px;background:white;padding:12px;z-index:20}.pilot-skip:focus{top:8px}
.pilot-footer{margin-top:42px;border-top:1px solid var(--line);background:white}.pilot-footer .pilot-shell{display:flex;gap:16px;flex-wrap:wrap}.pilot-footer a{display:inline-flex;align-items:center;min-height:48px}
.pilot-breadcrumb ol{display:flex;flex-wrap:wrap;align-items:center;gap:0;margin:10px 0 16px;padding:0;list-style:none;font-size:13px;color:var(--muted)}
.pilot-breadcrumb li{display:flex;align-items:center}.pilot-breadcrumb li+li::before{content:'›';padding:0 6px}.pilot-breadcrumb a{display:inline-flex;align-items:center;min-height:44px}
.pilot-product,.pilot-gallery,.pilot-buy{min-width:0}
.pilot-gallery{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:start}
.pilot-track{display:flex;width:100%;max-width:640px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;background:var(--wash);border-radius:12px;min-width:0}.pilot-track::-webkit-scrollbar{display:none}
.pilot-slide{position:relative;flex:0 0 100%;min-width:0;scroll-snap-align:start;aspect-ratio:1;max-width:640px}
.pilot-zoom-link{display:block;width:100%;height:100%;cursor:zoom-in;overflow:hidden}
.pilot-slide img,.pilot-card-media img,.pilot-lightbox img{width:100%;height:100%;display:block;object-fit:contain;transition:opacity 250ms ease}
.pilot-thumbs{display:none}.pilot-thumbs button,.pilot-dots button{cursor:pointer;color:var(--ink)}
.pilot-dots{display:flex;justify-content:center;gap:0}.pilot-dots button{width:44px;height:44px;padding:0;border:0;display:grid;place-items:center;background:transparent}
.pilot-dots span{width:8px;height:8px;border-radius:50%;background:#66788c}.pilot-dots [aria-current=true] span{background:var(--ink);outline:2px solid var(--ink);outline-offset:2px}
.pilot-buy{border:1px solid var(--line);background:white;padding:18px;border-radius:14px}
.pilot-buy h1{max-width:none;font-size:21px;line-height:1.19;letter-spacing:-.025em;margin:4px 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:var(--ink)}
.pilot-brand-link{display:inline-flex;align-items:center;min-height:44px;font-size:14px;font-weight:650}
.pilot-price{font-size:30px;font-weight:800;line-height:1.08;margin:8px 0 4px}.pilot-shipping{margin:0 0 8px;font-size:14px;color:var(--muted)}
.pilot-stock{font-size:14px;font-weight:650;color:#526176;margin:2px 0 8px}.pilot-stock[data-in-stock=false]{color:#8b3c35}
.pilot-facts{display:flex;gap:6px;flex-wrap:wrap;list-style:none;margin:0 0 8px;padding:0}.pilot-facts li{background:#edf1f5;padding:0 10px;min-height:32px;border-radius:99px;display:flex;align-items:center;font-size:13px}
.pilot-qty{display:inline-flex;gap:10px;align-items:center;font-size:14px;margin:0 0 10px}.pilot-qty select{min-width:64px}
.pilot select,.pilot input,.pilot textarea{font:inherit;min-width:0;min-height:44px;border:1px solid #7b8b9a;border-radius:8px;background:white;color:var(--ink);padding:6px 8px}
.pilot-button{font:inherit;font-size:16px;font-weight:750;min-height:44px;display:inline-flex;justify-content:center;align-items:center;text-align:center;text-decoration:none;gap:8px;padding:7px 13px;border:1px solid #9d4e35;border-radius:12px;background:var(--coral);color:#201910;cursor:pointer;transition:background 250ms ease,transform 250ms ease}
.pilot-button:hover{background:#f4b197;text-decoration:none}.pilot-button:active{transform:scale(.98)}
.pilot-button:disabled{background:#e5e9ec;color:#4a5664;border-color:#a8b4be;cursor:not-allowed}.pilot-outline{border-color:#67788a;background:white;color:var(--ink)}
.pilot-primary{display:grid;gap:8px}.pilot-primary .pilot-button:first-child{min-height:48px}.pilot-primary .pilot-outline{min-height:44px}
.pilot-trust{display:grid;gap:5px;list-style:none;padding:0;margin:12px 0 7px}.pilot-trust li{display:flex;align-items:center;gap:9px;font-size:13px}.pilot-trust a{display:inline-flex;align-items:center;min-height:44px}.pilot-trust svg,.pilot-quick svg{flex:none}
.pilot-seller{font-size:13px;margin:8px 0 0;color:var(--muted)}
.pilot-sections{display:none}.pilot-details{margin-top:24px}
.pilot-details details{background:white;border-top:1px solid var(--line);scroll-margin-top:64px}.pilot-details details:last-child{border-bottom:1px solid var(--line)}
.pilot-details summary h2{display:inline;margin:0;font:inherit}.pilot-details summary{font-size:19px;font-weight:750;padding:10px 8px;min-height:44px;cursor:pointer}
.pilot-detail-body{padding:0 8px 16px;font-size:15px;line-height:1.6}.pilot-detail-body p,.pilot-detail-body ul{margin:5px 0 10px}
.pilot-spec-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:15px;margin-bottom:12px;overflow-wrap:anywhere}
.pilot-spec-table caption{text-align:left;font-weight:750;padding:8px;background:#eef2f5}.pilot-spec-table tr{border-bottom:1px solid var(--line)}.pilot-spec-table th,.pilot-spec-table td{padding:8px;text-align:left;vertical-align:top}.pilot-spec-table th{width:35%}
.pilot-dialog{width:min(94vw,470px);max-height:88dvh;border:1px solid var(--line);border-radius:14px;background:white;color:var(--ink);padding:22px;overflow:auto;margin:auto}
.pilot-dialog::backdrop,.pilot-filters::backdrop{background:#14253a99}.pilot-close{width:44px;height:44px;float:right;display:grid;place-items:center;border:1px solid #7b8b9a;background:white;color:var(--ink);border-radius:8px;font-size:23px;cursor:pointer}.pilot-inquiry{display:grid;gap:9px}.pilot-inquiry label,.pilot-filter-form label{display:grid;gap:4px;font-size:14px;font-weight:650}
.pilot-lightbox{width:min(94vw,730px)}.pilot-lightbox img{clear:both;aspect-ratio:1;height:auto}
.pilot-sticky{position:fixed;inset:auto 0 0;z-index:20;background:white;box-shadow:0 -6px 20px #1729411d;min-height:calc(64px + env(safe-area-inset-bottom));padding:6px 16px calc(6px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:space-between;gap:12px}.pilot-sticky .pilot-button{min-height:48px}.pilot:has(.pilot-sticky:not([hidden])){padding-bottom:calc(64px + env(safe-area-inset-bottom))}
.pilot-banner{width:100%;aspect-ratio:1440 / 320;min-height:120px;display:grid;align-items:center;padding:clamp(14px,3vw,40px);background:linear-gradient(105deg,#e6eeed,#f9ede3);border-radius:14px}.pilot-banner h1,.pilot-banner p{margin:0 0 4px}.pilot-banner h1{font-size:clamp(24px,4vw,42px)}
.pilot-catalog-top,.pilot-filter-chips,.pilot-pagination{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:16px 0}
.pilot-catalog-top p{margin:0;margin-right:auto}.pilot-sort{display:flex;gap:6px;align-items:center}.pilot-sort select{font-size:14px}
.pilot-filter-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;background:#edf1f6;padding:4px 10px;border-radius:999px;text-decoration:none}
.pilot-catalog{display:grid;grid-template-columns:minmax(0,1fr);gap:24px}
.pilot-filters{border:1px solid var(--line);border-radius:14px;padding:16px;color:var(--ink);background:white}
.pilot-filters[open]:not(:modal){display:none}
.pilot-filters:modal{position:fixed;inset:auto 0 0;margin:0;width:100%;max-width:none;max-height:86dvh;border-radius:16px 16px 0 0;overflow:auto}
.pilot-filter-form{display:grid;gap:12px}.pilot-filter-form .pilot-check{display:flex;align-items:center;min-height:44px;gap:8px}.pilot-check input{width:17px;min-height:17px}
.pilot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.pilot-card{min-width:0;display:flex;flex-direction:column;gap:3px;background:white;border:1px solid var(--line);border-radius:12px;padding:8px;transition:transform 250ms ease,box-shadow 250ms ease}
.pilot-card-media{position:relative;display:block;aspect-ratio:1;width:100%;overflow:hidden;background:var(--wash);border-radius:8px}.pilot-alternate{display:none;position:absolute;inset:0;opacity:0;background:var(--wash);transition:opacity 250ms ease}
.pilot-brand{font-size:12px;text-transform:uppercase;color:var(--muted);font-weight:650;margin:5px 0 0}
.pilot-card h2{font-size:15px;line-height:1.25;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pilot-card h2 a{text-decoration:none}
.pilot-card-price{font-size:18px;font-weight:800;margin:2px 0}.pilot-card .pilot-stock{font-size:12px;margin:0 0 4px}
.pilot-card-actions{display:flex;gap:4px;margin-top:auto;align-items:stretch}.pilot-card-actions .pilot-button{flex:1;min-width:0;font-size:13px;padding:5px 6px}
.pilot-quick{height:44px;width:44px;flex:none;display:grid;place-items:center;border:1px solid #67788a;border-radius:10px;background:white;color:var(--ink);cursor:pointer}
.pilot-empty{border:1px solid var(--line);background:white;border-radius:12px;padding:18px}
.pilot .elv-header-cart{position:static;inset:auto;min-height:44px;font-size:13px;padding:5px 8px;white-space:nowrap;margin:0;box-shadow:none}
.pilot .elv-header-cart svg{width:18px;height:18px;vertical-align:middle}.pilot .elv-cart-dialog[open]{animation:pilot-cart-in 250ms ease-out}
@keyframes pilot-cart-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@media(hover:hover) and (pointer:fine){.pilot-card:hover{transform:translateY(-3px);box-shadow:0 9px 18px #17294115}.pilot-alternate{display:block}.pilot-card-media:hover .pilot-alternate{opacity:1}.pilot-slide img{transition:transform 250ms ease}.pilot-zoom-link:hover img{transform:scale(1.12)}}
@media(min-width:700px){.pilot-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(min-width:1024px){
 .pilot-product{display:grid;grid-template-columns:minmax(0,58fr) minmax(0,42fr);align-items:start;gap:24px}
 .pilot-gallery:has(.pilot-thumbs){grid-template-columns:72px minmax(0,640px)}.pilot-thumbs{display:grid;gap:8px}.pilot-thumbs button{width:72px;height:72px;border:1px solid #8c9ba9;border-radius:8px;background:var(--wash);padding:0;overflow:hidden}.pilot-thumbs img{display:block;width:100%;height:100%;object-fit:contain}
 .pilot-thumbs [aria-current=true]{border:2px solid var(--ink)}.pilot-dots{display:none}
 .pilot-buy{position:sticky;top:16px}.pilot-buy h1{font-size:26px}.pilot-primary .pilot-button:first-child{min-height:52px}.pilot-sticky{display:none!important}
 .pilot-sections{display:flex;position:sticky;top:0;z-index:5;background:var(--paper);gap:14px;margin-top:22px;overflow-x:auto;border-bottom:1px solid var(--line)}
 .pilot-sections a{display:flex;align-items:center;min-height:44px;white-space:nowrap;font-size:14px}.pilot-details{margin-top:0}
 .pilot-catalog{grid-template-columns:260px minmax(0,1fr);align-items:start}.pilot-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
 .pilot-filters[open]:not(:modal){display:block;position:static;width:100%;max-width:none;margin:0}.pilot-filter-trigger,.pilot-filter-close{display:none}
}
@media(max-width:699px){
 .pilot-header .pilot-nav{gap:3px 8px;min-height:52px}.pilot-nav a[href="/contact"]{display:none}.pilot-nav a,.pilot-link{font-size:12px}.pilot-wordmark img{width:25px;height:25px}.pilot-breadcrumb li[aria-current]{max-width:100%;overflow:hidden;display:block;white-space:nowrap;text-overflow:ellipsis;line-height:18px}
 .pilot-breadcrumb ol{margin:2px 0 7px}.pilot-gallery{gap:0;position:relative}.pilot-dots{position:absolute;bottom:2px;inset-inline:0;pointer-events:none}.pilot-dots button{pointer-events:auto}.pilot-dots span{box-shadow:0 0 0 3px #ffffffc9}.pilot-buy{padding:10px 12px}.pilot-buy h1{margin:0 0 4px}.pilot-brand-link{font-size:14px;min-height:32px}
 .pilot-price{margin-top:4px}.pilot-shipping{font-size:13px;margin-bottom:4px}.pilot-facts{margin-bottom:4px}
 .pilot-buy{display:flex;flex-direction:column}.pilot-primary{order:1}.pilot-trust,.pilot-seller{order:2}
}

.pilot-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.pilot-search{display:flex;flex:1 1 260px;min-width:0;max-width:460px;margin-left:auto}
.pilot-search input{min-width:0;flex:1 1 auto;border:1px solid #9baab3;border-radius:10px 0 0 10px;padding:0 12px;color:var(--ink);font:inherit}
.pilot-search button{border:0;border-radius:0 10px 10px 0;min-height:44px;background:var(--ink);color:white;font-weight:700;padding:0 13px}
.pilot-header .pilot-nav .elv-cart-launcher{background:#182842;color:#fff}
.pilot-back{display:inline-flex;align-items:center;gap:7px;min-height:44px;margin:0 0 6px;font-size:14px;font-weight:650}
.pilot-product-nav{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0 12px}.pilot-product-nav .pilot-back{margin:0}.pilot-product-nav .pilot-breadcrumb{min-width:0}.pilot-back span{transition:transform 250ms ease}.pilot-back:hover span{transform:translateX(-3px)}
.pilot-departments{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.pilot-departments a{display:inline-flex;align-items:center;min-height:44px;border:1px solid #c7d2d9;border-radius:100px;padding:0 13px;background:#fff;font-size:14px;font-weight:650}
.pilot-image-fallback{display:grid;height:100%;place-items:center;color:var(--muted);padding:12px;text-align:center;font-size:13px}.pilot-image-failed{display:none!important}.pilot-zoom-link:has(.pilot-image-fallback){cursor:default}.pilot-lightbox .pilot-image-fallback{clear:both;min-height:180px}.pilot-thumbs .pilot-image-fallback{padding:4px;font-size:11px}.pilot-alternate[data-photo-unavailable]{display:none!important}
.pilot-no-image,.pilot-gallery-empty{color:var(--muted);text-align:center}
.pilot-no-image{display:grid;place-items:center;height:100%;padding:8px;font-size:13px}
.pilot-gallery-empty{background:var(--wash);border-radius:12px;margin:0;padding:18px;border:1px solid var(--line)}
.pilot-card .pilot-button{line-height:1.15}
@media(prefers-reduced-motion:no-preference){
 .pilot .elv-cart-dialog[open]{animation:pilot-drawer-in 250ms ease-out}
 .pilot-dialog[open]:modal{animation:pilot-dialog-in 200ms ease-out}
 @keyframes pilot-drawer-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
 @keyframes pilot-dialog-in{from{opacity:.6;transform:translateY(8px)}to{opacity:1;transform:none}}
}
@media(max-width:699px){
 .pilot-search{order:5;flex-basis:100%;max-width:none;margin:0}
 .pilot-search input{font-size:16px}
 .pilot:has(.pilot-product) .pilot-header .pilot-search{display:none}
 .pilot:has(.pilot-product) .pilot-breadcrumb ol{margin-bottom:0}
 .pilot:has(.pilot-product) .pilot-breadcrumb li[aria-current]{display:none}
 .pilot-product-nav .pilot-breadcrumb,.pilot-product-nav .pilot-back{font-size:12px}
 .pilot-product-nav .pilot-breadcrumb ol{margin:0}.pilot-product-nav .pilot-back{order:-1;min-height:44px}
 .pilot-product-nav .pilot-breadcrumb li a{min-height:44px}.pilot-product-nav .pilot-breadcrumb li:first-child{display:none}.pilot-product-nav .pilot-breadcrumb li:nth-child(2)::before{display:none}
 .pilot-buy h1{line-height:1.15}
 .pilot-buy .pilot-facts{margin-bottom:3px}
 .pilot-buy .pilot-qty{margin-bottom:7px}
}


.pilot{--paper:#f3ede3;--wash:#edf1ec;background:var(--paper)}
.pilot-header{background:#e4ebe4}
.pilot-banner{background:linear-gradient(110deg,#dce8dc,#f0dfcd)}
.pilot-buy{background:#fffaf2;border-color:#d5cbb9}
.pilot-details>details{background:#fffaf2}
.pilot-card{background:#fffdf7;border-color:#d5cbb9}
.pilot-card-media,.pilot-track{background:#f4f6f2}
.pilot-card :is(h2,h3){font-size:15px;line-height:1.25;min-height:2.5em;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pilot-card :is(h2,h3) a{text-decoration:none}
.pilot-card .pilot-brand{min-height:1.25em;margin:3px 0 0}
.pilot-card .pilot-card-price{line-height:1.3;margin:1px 0}
.pilot-card .pilot-card-actions{min-height:44px}
.pilot .pilot-button[data-elv-cart-add]:not([data-elv-buy-now]):not(:disabled){background:#a33f2a;color:#fff;border-color:#a33f2a}
.pilot .pilot-button[data-elv-cart-add]:not([data-elv-buy-now]):not(:disabled):hover{background:#873221;border-color:#873221}
body[data-elv-refresh="home"]{
 --ink:#172941;--muted:#4e6075;--paper:#f3ede3;--coral:#f0a483;--line:#d5cbb9;--wash:#edf1ec;
 background:var(--paper)
}
[data-elv-refresh="home"] .featured-kitchen-brands,[data-elv-refresh="home"] .department-block{
 border-color:#c9d6cb
}
[data-elv-refresh="home"] main :is(div,section):has(>article.elv-home-card){
 display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:stretch;
 width:min(100%,1176px,calc(100vw - 52px));margin-inline:auto;
}
[data-elv-refresh="home"] main .elv-home-card.product-card{
 display:flex;flex-direction:column;min-width:0;width:100%;max-width:none;margin:0;padding:10px;gap:4px;
 border:1px solid #d5cbb9;border-radius:12px;background:#fffdf7;color:var(--ink);box-shadow:0 3px 12px #2735330d;
}
[data-elv-refresh="home"] main .elv-home-card.product-card .pilot-card-media{height:auto;aspect-ratio:1;width:100%;background:#f4f6f2}
[data-elv-refresh="home"] main .elv-home-card.product-card a.pilot-card-media>img{display:block;width:100%;height:100%;aspect-ratio:1;max-height:none;object-fit:contain}
[data-elv-refresh="home"] main .elv-home-card.product-card h3{font-size:15px;line-height:1.25;min-height:2.5em;margin:0}
[data-elv-refresh="home"] main .elv-home-card.product-card .pilot-card-price{font-size:18px;color:var(--ink)}
[data-elv-refresh="home"] main .elv-home-card.product-card .pilot-card-actions{margin-top:auto;display:flex}
[data-elv-refresh="home"] main .elv-home-card.product-card .pilot-button{width:auto;min-height:44px}
@media(max-width:1023px){
 [data-elv-refresh="home"] main :is(div,section):has(>article.elv-home-card){grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(max-width:699px){
 [data-elv-refresh="home"] main :is(div,section):has(>article.elv-home-card){grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
 [data-elv-refresh="home"] main .elv-home-card.product-card{padding:8px}
}


@media(prefers-reduced-motion:no-preference){
  [data-elv-refresh="home"] header:has(> .header-retail){
    transform-origin:50% 0;
    transition:transform 330ms cubic-bezier(.22,.72,.24,1),opacity 240ms ease;
  }
  [data-elv-refresh="home"] header[data-scroll-away]:not(:has(:focus-visible)){
    transform:perspective(850px) translate3d(0,calc(-100% - 12px),0) rotateX(-13deg);
    opacity:0;
    pointer-events:none;
  }
  [data-elv-refresh="home"] .department-hero-card img{
    transform:perspective(850px) translate3d(0,var(--hero-travel,0px),0) rotateX(var(--hero-tilt,0deg));
  }
}


[data-elv-refresh="home"] .hero{position:relative;isolation:isolate;overflow:clip}
[data-elv-refresh="home"] .hero::after{
  content:'';position:absolute;z-index:-1;pointer-events:none;
  inset:-14% -7%;
  background:radial-gradient(ellipse at 85% 25%,#e9ab8b65,transparent 52%),
    radial-gradient(ellipse at 52% 84%,#a0bda877,transparent 54%);
}
@media(prefers-reduced-motion:no-preference){
  [data-elv-refresh="home"] .hero::after{
    transform:translate3d(0,var(--hero-light,0px),0);
  }
  [data-elv-refresh="home"] .hero-copy h1{
    transform:translate3d(0,var(--hero-title,0px),0);
    animation:elv-hero-intro 520ms cubic-bezier(.22,.72,.24,1) both;
  }
  [data-elv-refresh="home"] .elv-hero-links{
    transform:translate3d(0,var(--hero-actions,0px),0);
    animation:elv-hero-intro 520ms 75ms cubic-bezier(.22,.72,.24,1) both;
  }
  [data-elv-refresh="home"] .department-hero-grid{
    animation:elv-hero-cards-in 650ms 105ms cubic-bezier(.22,.72,.24,1) both;
  }
  @keyframes elv-hero-intro{
    from{translate:0 12px;opacity:.55}
    to{translate:none;opacity:1}
  }
  @keyframes elv-hero-cards-in{
    from{transform:perspective(950px) translate3d(0,18px,-24px) rotateX(7deg);opacity:.64}
    to{transform:none;opacity:1}
  }
}
@media(prefers-reduced-motion:no-preference) and (hover:hover) and (pointer:fine){
  [data-elv-refresh="home"] .department-hero-card{
    transition:transform 230ms ease,box-shadow 230ms ease;
  }
  [data-elv-refresh="home"] .department-hero-card:hover{
    transform:perspective(900px) translateY(-5px) rotateX(3deg);
    box-shadow:0 12px 24px #172c3830;
  }
}


[data-elv-refresh="home"] .hero:has(.showroom-stage){
  background:linear-gradient(115deg,#eef2e9 0%,#faf1e4 50%,#e2ede6 100%);
}
[data-elv-refresh="home"] .hero:has(.showroom-stage) .hero-copy h1{
  color:#172740;font-size:clamp(2.6rem,4.8vw,4.9rem);line-height:1.02;letter-spacing:-.058em;
}
[data-elv-refresh="home"] .hero:has(.showroom-stage) .hero-copy h1 em{color:#39665d}
[data-elv-refresh="home"] .hero:has(.showroom-stage) .elv-hero-links .btn-primary{background:#a33f2a;border-color:#a33f2a;color:#fff}
[data-elv-refresh="home"] .hero:has(.showroom-stage) .elv-hero-links .btn-primary:hover{background:#873221;border-color:#873221}
[data-elv-refresh="home"] .showroom-stage{
  position:relative;display:block;isolation:isolate;min-width:0;height:clamp(310px,32vw,470px);
}
[data-elv-refresh="home"] .showroom-stage::before{
  content:'';position:absolute;inset:12% 5%;border:1px solid #8eafa4;border-radius:50%;transform:rotate(-16deg);pointer-events:none;
}
[data-elv-refresh="home"] .showroom-stage .department-hero-card{
  position:absolute;width:37%;padding:clamp(6px,1vw,12px);min-width:0;gap:4px;
  background:#fffdf5;border:1px solid #c4d1c8;box-shadow:0 13px 30px #163c3c2b;
  rotate:var(--turn,0deg);
}
[data-elv-refresh="home"] .showroom-stage .department-hero-card:nth-of-type(1){left:2%;top:24%;--turn:-8deg}
[data-elv-refresh="home"] .showroom-stage .department-hero-card:nth-of-type(2){right:2%;top:24%;--turn:8deg}
[data-elv-refresh="home"] .showroom-stage .showroom-toy{top:5%;left:31%;width:38%;z-index:2;--turn:-1deg}
[data-elv-refresh="home"] .showroom-stage .department-hero-card img{
  width:100%;height:auto;aspect-ratio:1;object-fit:contain;display:block;
}
[data-elv-refresh="home"] .showroom-stage .showroom-toy img{background:#fff}
[data-elv-refresh="home"] .showroom-stage .department-hero-card strong{line-height:1.15;font-size:clamp(.72rem,1.3vw,1rem);overflow-wrap:anywhere}
[data-elv-refresh="home"] .showroom-stage .department-hero-card span:not(.elv-card-direction){line-height:1.2}
[data-elv-refresh="home"] .showroom-stage .department-hero-card:focus-visible{z-index:4}
.showroom-pets{padding-block:clamp(1.25rem,3vw,2.3rem);margin-block:1.2rem;background:#edf3ed;border:1px solid #d4e0d8;border-radius:18px}
[data-elv-refresh="home"] .showroom-pets .featured-pet-grid{margin-top:1rem}
@media(max-width:900px){
  [data-elv-refresh="home"] .showroom-stage{height:clamp(265px,47vw,385px)}
}
@media(max-width:699px){
  [data-elv-refresh="home"] .showroom-stage{height:clamp(205px,55vw,290px)}
  [data-elv-refresh="home"] .showroom-stage .department-hero-card span:not(.elv-card-direction){display:none}
  .showroom-pets{border-inline:0;border-radius:0}
}

@media(prefers-reduced-motion:reduce){.pilot *, .pilot *::before,.pilot *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;

export const pilotClient = String.raw`(() => {
  const query = selector => document.querySelector(selector);

  const back = query('[data-catalog-back]');
  if (back && document.referrer) {
    const previous = new URL(document.referrer);
    if (previous.origin===location.origin && (previous.pathname==='/'||previous.pathname==='/shop'||previous.pathname.startsWith('/collections/'))) {
      back.href=previous.href;
      back.addEventListener('click',event=>{
        if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||history.length<2||window.opener)return;
        event.preventDefault();
        history.back();
      });
    }
  }

  const cart = query('.elv-cart-launcher');
  const nav = query('.pilot-nav');
  if (cart && nav) nav.append(cart);
  const desktop = matchMedia('(min-width:1024px)');
  const quiet = matchMedia('(prefers-reduced-motion: reduce)');

  const home = document.body.dataset.elvRefresh==='home';
  const homeHeader = home && query('header:has(> .header-retail)');
  const hero = home && query('main .hero');
  if(homeHeader){
    let lastY=Math.max(0,scrollY), settle, frame;
    const showHeader=()=>{clearTimeout(settle);homeHeader.removeAttribute('data-scroll-away');};
    const keepHeader=()=>homeHeader.matches(':has(:focus-visible),:has(input:focus)') ||
      homeHeader.querySelector('#navtoggle[aria-expanded="true"]') || query('dialog[open]');
    const updateMotion=()=>{
      frame=undefined;
      if(!hero)return;
      const bounds=hero.getBoundingClientRect();
      if(quiet.matches||bounds.bottom<=0||bounds.top>=innerHeight)return;
      const progress=Math.min(1,Math.max(0,-bounds.top/bounds.height));
      const strength=matchMedia('(max-width:699px)').matches ? .55 : 1;
      hero.style.setProperty('--hero-travel',progress*14*strength+'px');
      hero.style.setProperty('--hero-tilt',progress*5*strength+'deg');
      hero.style.setProperty('--hero-light',progress*-48*strength+'px');
      hero.style.setProperty('--hero-title',progress*-14*strength+'px');
      hero.style.setProperty('--hero-actions',progress*-6*strength+'px');
    };
    window.addEventListener('scroll',()=>{
      const y=Math.max(0,scrollY);
      if(y===lastY)return;
      lastY=y;
      if(quiet.matches||y<=Math.max(44,homeHeader.offsetHeight/2)||keepHeader())showHeader();
      else{
        homeHeader.setAttribute('data-scroll-away','');
        clearTimeout(settle);
        settle=setTimeout(showHeader,210);
      }
      if(frame===undefined)frame=requestAnimationFrame(updateMotion);
    },{passive:true});
    homeHeader.addEventListener('focusin',showHeader);
    quiet.addEventListener('change',()=>{
      showHeader();
      for(const name of ['travel','tilt','light','title','actions'])hero?.style.removeProperty('--hero-'+name);
    });
  }

  const filters = query('#pilot-filters');
  const details = [...document.querySelectorAll('.pilot-details>details')];

  function adapt() {
    if (filters?.open) filters.close();
    if (filters && desktop.matches) filters.setAttribute('open','');
    details.forEach(section=> { section.open=desktop.matches; });
  }
  adapt();
  desktop.addEventListener('change',adapt);


  const photos = document.querySelectorAll('.pilot-slide img,.pilot-thumbs img,.pilot-card-media img,.pilot-lightbox img');
  function unavailable(img) {
    const parent=img.parentElement;
    img.classList.add('pilot-image-failed');
    if(parent.classList.contains('pilot-alternate')) {
      parent.dataset.photoUnavailable='';
      return;
    }
    if(parent.querySelector('.pilot-image-fallback'))return;
    const message=document.createElement('span');
    message.className='pilot-image-fallback';
    message.textContent='Photo unavailable';
    if(parent.matches('button'))message.setAttribute('aria-hidden','true');
    img.after(message);
  }
  for(const img of photos){
    img.addEventListener('error',()=>unavailable(img));
    if(img.getAttribute('src')&&img.complete&&img.naturalWidth===0)unavailable(img);
  }

  const gallery = query('[data-gallery]');
  if (gallery?.querySelector('.pilot-track')) {
    const track = gallery.querySelector('.pilot-track');
    const controls = [...gallery.querySelectorAll('[data-slide]')];
    let frame;
    track.addEventListener('scroll',()=> {
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const current=Math.round(track.scrollLeft/Math.max(track.firstElementChild.clientWidth,1));
        controls.forEach(control=>control.setAttribute('aria-current',String(Number(control.dataset.slide)===current)));
      });
    },{passive:true});
    controls.forEach(control=>control.addEventListener('click',()=>{
      const slide=track.children[Number(control.dataset.slide)];
      track.scrollTo({left:slide.offsetLeft-track.firstElementChild.offsetLeft,behavior:quiet.matches?'instant':'smooth'});
    }));
    const zoom=query('#pilot-zoom');
    let touchOrigin=0;
    track.addEventListener('touchstart',()=>{touchOrigin=track.scrollLeft;},{passive:true});
    track.addEventListener('click',event=>{
      const link=event.target.closest('.pilot-zoom-link');
      if(!link || Math.abs(track.scrollLeft-touchOrigin)>8 && event.pointerType==='touch')return;
      event.preventDefault();
      if(link.querySelector('.pilot-image-failed'))return;
      zoom.querySelector('.pilot-image-fallback')?.remove();
      zoom.querySelector('img').classList.remove('pilot-image-failed');
      zoom.querySelector('img').src=link.href;
      zoom.showModal();
    });

  }
  {
    const sticky=query('[data-sticky-buy]');
    const primary=query('.pilot-primary');
    if (sticky && primary && 'IntersectionObserver' in window) {
      const update=()=>{sticky.hidden=desktop.matches||primary.getBoundingClientRect().bottom>0;};
      new IntersectionObserver(update).observe(primary);
      desktop.addEventListener('change',update);
    }
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-open-dialog],[data-quick],[data-item-request]');
    if (button) {
      const id=button.dataset.openDialog || (button.dataset.quick?'pilot-quick-'+button.dataset.quick:'pilot-inquiry');
      const dialog=document.getElementById(id);
      if(dialog && !dialog.open) {
        event.preventDefault();
        button.closest('dialog')?.close();
        if(button.hasAttribute('data-item-request')) {
          const qty=query('#buy-quantity')?.value||'1';
          dialog.querySelector('[name="message"]').value='I would like to request this item. Quantity: '+qty+'.';
        }
        dialog.showModal();
      }
    }
    if (event.target.closest('[data-elv-cart-add]')) {
      event.target.closest('dialog[id^="pilot-quick-"]')?.close();
    }
    if (event.target.closest('.pilot-sections a')) {
      const section=document.getElementById(event.target.closest('a').hash.slice(1));
      if(section) section.open=true;
    }
  },true);

  if (!quiet.matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{
      if (!entry.isIntersecting) return;
      reveal.unobserve(entry.target);
      if (!quiet.matches) entry.target.animate(home
        ? [{opacity:.68,transform:'perspective(900px) translate3d(0,24px,-14px) rotateX(8deg)'},{opacity:1,transform:'perspective(900px) translate3d(0,0,0) rotateX(0)'}]
        : [{opacity:.8,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:250,easing:'ease-out'});
    }),{threshold:.12});
    const targets=home?'.department-hero-card,.elv-home-card':'.pilot-card,.pilot-details>details';
    document.querySelectorAll(targets).forEach(el=>{
      if (el.getBoundingClientRect().top>innerHeight) reveal.observe(el);
    });
  }

  const inquiry=query('[data-inquiry]');
  inquiry?.addEventListener('submit',async event=>{
    event.preventDefault();
    const submit=inquiry.querySelector('button[type="submit"]'),status=inquiry.querySelector('[role="status"]');
    submit.disabled=true;
    status.textContent='Sending…';
    try {
      const fields=Object.fromEntries(new FormData(inquiry));
      const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...fields,topic:'product',sku:inquiry.dataset.sku})});
      const result=await response.json();
      if (!response.ok) throw Error(result.message||'We could not send your question.');
      inquiry.reset();
      status.textContent='Your question was received.';
    } catch(error) {
      status.textContent=error.message+' You can also use the contact form or email sales@elvarins.com.';
    } finally { submit.disabled=false; }
  });
})();`;
