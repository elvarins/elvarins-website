import first from './catalog/bci-inventory-1.mjs';
import second from './catalog/bci-inventory-2.mjs';
import third from './catalog/bci-inventory-3.mjs';

const catalog = {...first, ...second, ...third};
const categories = Object.keys(catalog).sort();
const photographed = [["AQUATICS",["000116043601","Seachem Prime Aquarium Water Conditioner, 250 mL","Seachem","",984,"Water conditioner for freshwater and marine aquariums. Designed to treat tap water when setting up an aquarium or doing a water change. One 250 mL bottle.","75223","https://elvarins.com/images/seachem-prime-250ml.webp","/products/seachem-prime-water-conditioner-250-ml"]],["AQUATICS",["000116012607","Seachem Stability Aquarium Biofilter Supplement, 250 mL","Seachem","",899,"Biofilter supplement for freshwater and marine aquariums. Use when setting up a new aquarium or maintaining an existing biological filter. One 250 mL bottle.","75180","https://elvarins.com/images/seachem-stability-250ml.webp","/products/seachem-stability-biofilter-supplement-250-ml"]],["DOG",["018214848707","Nylabone Power Play Gripz Soccer Ball, Medium","Nylabone","",1442,"A soccer-ball-shaped fetch toy with a textured surface for play sessions.","","https://www.nylabone.com/-/media/project/oneweb/nylabone/images/our-products/all-products/nply010p/018214848707-nylabone-nyla-play-soccer-gripz-med-inpackagingfront.jpg","/products/nylabone-power-play-gripz-soccer-ball-medium-018214848707"]],["DOG",["018214850724","Nylabone Power Chew Pretzel, Small","Nylabone","",999,"A pretzel-shaped chew toy from Nylabone’s Power Chew range.","","https://www.nylabone.com/-/media/project/oneweb/nylabone/images/our-products/all-products/np102pr/018214850724-np102pr-front.jpg","/products/nylabone-power-chew-pretzel-small-018214850724"]],["DOG",["018214851431","Nylabone Power Chew Easy-Hold Bone, Bacon Flavor, Large","Nylabone","",1297,"A bacon-flavored nylon chew toy with paw grips.","","https://www.nylabone.com/-/media/project/oneweb/nylabone/images/our-products/all-products/nehb004pxr/018214851431-nehb004pxr-front.jpg","/products/nylabone-power-chew-easy-hold-bone-bacon-flavor-large-018214851431"]],["CAT",["079441004939","Giant High-Sided Cat Litter Pan, Pearl White","Van Ness","",1010,"Open-top litter pan with high sides and a lowered front entry. Model CP3HS.","","https://vannesspets.com/wp-content/uploads/2020/09/CP3HS_Pearl_Angled-1024x1024.jpg","/products/giant-high-sided-cat-litter-pan-pearl-white-079441004939"]],["AQUATICS",["015905060769","MiniBow Replacement Filter Cartridge, Small, 3-Pack","Aqueon","",995,"Three small replacement cartridges for compatible Aqueon MiniBow filters. Check your filter model before ordering.","","https://www.statelinetack.com/cdn/shop/files/T720253.jpg?height=700&pad_color=fff&v=1776030069&width=700","/products/minibow-replacement-filter-cartridge-small-3-pack-015905060769"]],["LAWN & GARDEN",["026978303011","Classic Watering Can, Hunter Green, 2 Gallon","Novelty","",839,"Two-gallon plastic watering can with a removable shower nozzle and a two-part handle. Model 30301.","","https://i.shgcdn.com/fc2679e8-95ab-4e59-bc05-679796abc92e/-/format/auto/-/preview/3000x3000/-/quality/lighter/","/products/classic-watering-can-hunter-green-2-gallon-026978303011"]],["WILD BIRD",["018222007301","E-Z Fill Hanging Suet Basket, Green","C&S","",513,"Green vinyl-coated wire feeder that holds one standard suet cake. Suet is sold separately.","","https://alsipnursery.com/cdn/shop/files/1045377-01.jpg?v=1735808939&width=1080","/products/e-z-fill-hanging-suet-basket-green-018222007301"]],["DOG",["018214823384","Nylabone Power Chew Textured Ring, Flavor Medley, XL","Nylabone","",999,"Textured nylon ring chew toy.","","https://elvarins.com/images/nylabone-ncf315pxxr-front-20261026.jpg","/products/nylabone-power-chew-textured-ring-flavor-medley-xl-bci-491174"]]].map(([category, row]) => ({category, row}));
const entries = [...photographed, ...categories.flatMap(category => catalog[category].map(row => ({category, row})))];
const byUpc = new Map(entries.map(entry => [entry.row[0], entry]));
const directory = '/collections/bci';
const pageSize = 36;
const money = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productUrl = upc => '/products/bci-' + upc;
const display = value => value.toLowerCase().replace(/\b[a-z]/g, x => x.toUpperCase());
const retail = cents => money.format(cents / 100);
const withVariant = (title, variant) => {
  if (!variant) return title;
  const additions = variant.split(' · ').filter(part => !title.toLowerCase().includes(part.toLowerCase()));
  return additions.length ? title + ' — ' + additions.join(' · ') : title;
};

function listing({category, row}) {
  const [upc, title, brand, variant, price, detail, sku] = row;
  const categoryUrl = directory + '?category=' + encodeURIComponent(category);
  return [withVariant(title, variant), detail || [brand, variant].filter(Boolean).join(' · ') || display(category),
    '<section class="company-story"><div class="company-story-copy"><a href="' + escape(categoryUrl) + '">' + escape(display(category)) + '</a>' +
    '<p><strong>' + escape(retail(price)) + ' USD</strong></p><dl><dt>Brand</dt><dd>' + escape(brand) + '</dd>' +
    (variant ? '<dt>Size / variant</dt><dd>' + escape(variant) + '</dd>' : '') +
    '<dt>UPC</dt><dd data-order-upc>' + escape(upc) + '</dd><dt>Item number</dt><dd>' + escape(sku) + '</dd></dl>' +
    '<div class="kitchen-purchase-actions" aria-describedby="bci-availability"><button type="button" class="btn btn-primary" data-kitchen-action="cart">Add to Cart</button> ' +
    '<button type="button" class="btn" data-kitchen-action="buy">Buy Now</button></div>' +
    '<p id="bci-availability">Availability to be confirmed</p></div></section>'];
}

function browse(params) {
  const requestedCategory = params.get('category') || '';
  const category = Object.hasOwn(catalog, requestedCategory) ? requestedCategory : '';
  const query = (params.get('q') || '').trim().slice(0, 120);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const withPhotos = params.get('photos') === '1';
  const source = entries.filter(entry => (!category || entry.category === category) && (!withPhotos || entry.row[7]));
  const matches = terms.length ? source.filter(({row}) => {
    const label = row.slice(0, 4).join(' ').toLowerCase();
    return terms.every(term => label.includes(term));
  }) : source;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const current = Math.min(Math.max(1, Number.parseInt(params.get('page'), 10) || 1), pageCount);
  const start = (current - 1) * pageSize;
  const url = page => directory + '?' + new URLSearchParams({...(category ? {category} : {}), ...(query ? {q: query} : {}), ...(withPhotos ? {photos: '1'} : {}), page: String(page)});
  const options = categories.map(name => '<option value="' + escape(name) + '"' +
    (name === category ? ' selected' : '') + '>' + escape(display(name)) + ' (' + catalog[name].length + ')</option>').join('');
  const cards = matches.slice(start, start + pageSize).map(({category: group, row: [upc, title, brand, variant, price, , , photo, url]}) =>
    '<article class="help-tile bci-product-card">' +
    (photo ? '<a href="' + escape(url) + '"><img src="' + escape(photo) + '" alt="' + escape(title) + '" width="320" height="320" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:#fff;border-radius:10px"></a>' : '') +
    '<p>' + escape(brand) + ' · ' + escape(display(group)) + '</p><h3><a href="' + escape(url || productUrl(upc)) + '">' + escape(withVariant(title, variant)) +
    '</a></h3>' + (variant ? '<p>' + escape(variant) + '</p>' : '') + '<p><strong>' + escape(retail(price)) + ' USD</strong></p><p>Availability to be confirmed</p></article>').join('');
  const pager = pageCount > 1 ? '<nav aria-label="Catalog pages">' +
    (current > 1 ? '<a class="btn" rel="prev" href="' + escape(url(current - 1)) + '">Previous</a> ' : '') +
    '<span>Page ' + current + ' of ' + pageCount + '</span>' +
    (current < pageCount ? ' <a class="btn" rel="next" href="' + escape(url(current + 1)) + '">Next</a>' : '') + '</nav>' : '';
  return [category ? display(category) : 'BCI Catalog', 'Browse pet, garden, farm and household products.',
    '<section class="retail-standards"><form action="' + directory + '" method="get" class="shipping-form"><label for="bci-search">Find products</label>' +
    '<input id="bci-search" type="search" name="q" value="' + escape(query) + '" placeholder="Product, brand or UPC">' +
    '<label for="bci-category">Category</label><select id="bci-category" name="category"><option value="">All categories</option>' +
    options + '</select><label for="bci-photos"><input id="bci-photos" type="checkbox" name="photos" value="1"' +
    (withPhotos ? ' checked' : '') + '> With product photos</label><button class="btn btn-primary" type="submit">Search catalog</button></form>' +
    '<p>' + matches.length.toLocaleString('en-US') + ' products</p>' +
    (cards ? '<div class="help-grid">' + cards + '</div>' : '<p>No products match your search.</p>') + pager +
    '<p><a href="/collections/pet-and-garden">Browse Pet &amp; Garden with photos</a></p></section>'];
}

export function findBciPage(path, params) {
  if (path === directory) return browse(params);
  const match = /^\/products\/bci-(\d{12})$/.exec(path);
  const entry = match && byUpc.get(match[1]);
  return entry ? listing(entry) : null;
}
