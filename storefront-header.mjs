export const headerStyles = String.raw `
header:has(> .nav.header-retail),.pilot-header{
  --header-light:#fff5e9;
  --header-muted:#d1ddea;
  --header-peach:#ffbd98;
  color:var(--header-light);
  background:radial-gradient(ellipse at 13% -65%,#3b716e 0%,transparent 56%),
    linear-gradient(116deg,#101e34 5%,#17354a 58%,#222741 100%);
  border-bottom:1px solid #557a84;
  box-shadow:0 8px 22px #07192b30;
}
header:has(> .header-retail) > .nav,.pilot-header > .pilot-nav{
  padding-block:10px;
}
header:has(> .header-retail) .logo,.pilot-header .pilot-wordmark{
  color:var(--header-light);
  white-space:nowrap;
}
header:has(> .header-retail) .logo b{color:var(--header-peach)}
header:has(> .header-retail) .logo img,.pilot-header .pilot-wordmark img{
  outline:1px solid #fbbe95a8;
  outline-offset:2px;
  border-radius:9px;
}
header:has(> .header-retail) .business-links{
  color:var(--header-muted);
  border-top:1px solid #e8f3ff21;
  padding-block:6px;
}
header:has(> .header-retail) .business-links a,
header:has(> .header-retail) .navlinks a,.pilot-header .pilot-nav>a:not(.pilot-wordmark){
  color:var(--header-muted);
  text-underline-offset:4px;
}
header:has(> .header-retail) .business-links a:hover,
header:has(> .header-retail) .navlinks a:hover,.pilot-header .pilot-nav>a:hover{
  color:var(--header-peach);
}
header:has(> .header-retail) .header-search,.pilot-header .pilot-search{
  border:1px solid #a6b9c4;
  border-radius:12px;
  background:#fff7ef;
  overflow:hidden;
  box-shadow:0 3px 12px #08192b33;
}
header:has(> .header-retail) .header-search:focus-within,.pilot-header .pilot-search:focus-within{
  border-color:var(--header-peach);
  box-shadow:0 0 0 3px #ffbd9860;
}
header:has(> .header-retail) .header-search input,.pilot-header .pilot-search input{
  color:#172b40;
  background:#fff7ef;
  border:0;
  outline:none;
}
header:has(> .header-retail) .header-search input::placeholder,.pilot-header .pilot-search input::placeholder{
  color:#516273;
  opacity:1;
}
header:has(> .header-retail) .header-search button,.pilot-header .pilot-search button{
  background:#ffc29e;
  color:#182a3d;
  border-radius:0;
  min-height:44px;
}
header:has(> .header-retail) .header-search button svg{stroke:currentColor}
header:has(> .header-retail) :is(.account-trigger,.menu-button),.pilot-header .pilot-link{
  color:var(--header-light);
  background:#223b53;
  border:1px solid #7893a6;
  border-radius:10px;
  min-height:44px;
}
.pilot-header .pilot-link{padding-inline:10px}
header:has(> .header-retail) .elv-cart-launcher,.pilot-header .pilot-nav .elv-cart-launcher{
  background:#295151;
  border:1px solid #83aeaa;
  color:#fff;
}
header:has(> .header-retail) .elv-cart-launcher #elv-cart-count,
.pilot-header .elv-cart-launcher #elv-cart-count{background:#ffc29e;color:#182a3d}
header:has(> .header-retail) :is(a,button):focus-visible,.pilot-header :is(a,button):focus-visible{
  outline:2px solid var(--header-peach);
  outline-offset:2px;
}
header:has(> .header-retail) .header-search button:focus-visible,
.pilot-header .pilot-search button:focus-visible{
  outline:2px solid #182a3d;outline-offset:-4px;
}
header:has(> .header-retail) #mobilemenu:not([hidden]){
  background:#172f45;
  border-color:#7394a3;
  color:var(--header-light);
}
header:has(> .header-retail) #mobilemenu :is(a,button){color:var(--header-light)}
@media(hover:hover){
  header:has(> .header-retail) :is(.account-trigger,.menu-button,.elv-cart-launcher):hover,
  .pilot-header :is(.pilot-link,.elv-cart-launcher):hover{
    background:#355b6e;
    border-color:#ffbd98;
  }
  header:has(> .header-retail) .header-search button:hover,.pilot-header .pilot-search button:hover{
    background:#ffd5ba;
  }
}
@media(prefers-reduced-motion:no-preference){
  header:has(> .header-retail) > .nav,.pilot-header > .pilot-nav{animation:elv-header-reveal .28s ease-out both}
  header:has(> .header-retail) :is(.account-trigger,.menu-button,.elv-cart-launcher,.header-search button),
  .pilot-header :is(.pilot-link,.elv-cart-launcher,.pilot-search button){
    transition:background-color .18s ease,border-color .18s ease,transform .18s ease;
  }
  header:has(> .header-retail) :is(.account-trigger,.menu-button,.elv-cart-launcher):active,
  .pilot-header :is(.pilot-link,.elv-cart-launcher):active{transform:scale(.97)}
  @keyframes elv-header-reveal{from{opacity:.75;transform:translateY(-3px)}to{opacity:1;transform:none}}
}
@media(max-width:699px){
  .pilot-header > .pilot-nav{padding-block:7px}
  .pilot-header .pilot-link{padding-inline:6px}
  header:has(> .header-retail) .business-links{padding-block:5px}
}
`;
