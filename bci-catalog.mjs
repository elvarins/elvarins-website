import first from './catalog/bci-inventory-1.mjs';
import second from './catalog/bci-inventory-2.mjs';
import third from './catalog/bci-inventory-3.mjs';

const catalog = {...first, ...second, ...third};
const categories = Object.keys(catalog).sort();
const entries = categories.flatMap(category => catalog[category].map(row => ({category, row})));
const byUpc = new Map(entries.map(entry => [entry.row[0], entry]));
const directory = '/collections/bci';
const pageSize = 36;
const money = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productUrl = upc => '/products/bci-' + upc;
const display = value => value.toLowerCase().replace(/\b[a-z]/g, x => x.toUpperCase());
const retail = cents => money.format(cents / 100);

function listing({category, row}) {
  const [upc, title, brand, variant, price, detail, sku] = row;
  const categoryUrl = directory + '?category=' + encodeURIComponent(category);
  return [title, detail || [brand, variant].filter(Boolean).join(' · ') || display(category),
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
  const source = category ? catalog[category].map(row => ({category, row})) : entries;
  const matches = terms.length ? source.filter(({row}) => {
    const label = row.slice(0, 4).join(' ').toLowerCase();
    return terms.every(term => label.includes(term));
  }) : source;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const current = Math.min(Math.max(1, Number.parseInt(params.get('page'), 10) || 1), pageCount);
  const start = (current - 1) * pageSize;
  const url = page => directory + '?' + new URLSearchParams({...(category ? {category} : {}), ...(query ? {q: query} : {}), page: String(page)});
  const options = categories.map(name => '<option value="' + escape(name) + '"' +
    (name === category ? ' selected' : '') + '>' + escape(display(name)) + ' (' + catalog[name].length + ')</option>').join('');
  const cards = matches.slice(start, start + pageSize).map(({category: group, row: [upc, title, brand, variant, price]}) =>
    '<article class="help-tile"><p>' + escape(brand) + ' · ' + escape(display(group)) + '</p><h3><a href="' + productUrl(upc) + '">' + escape(title) +
    '</a></h3>' + (variant ? '<p>' + escape(variant) + '</p>' : '') + '<p><strong>' + escape(retail(price)) + ' USD</strong></p><p>Availability to be confirmed</p></article>').join('');
  const pager = pageCount > 1 ? '<nav aria-label="Catalog pages">' +
    (current > 1 ? '<a class="btn" rel="prev" href="' + escape(url(current - 1)) + '">Previous</a> ' : '') +
    '<span>Page ' + current + ' of ' + pageCount + '</span>' +
    (current < pageCount ? ' <a class="btn" rel="next" href="' + escape(url(current + 1)) + '">Next</a>' : '') + '</nav>' : '';
  return [category ? display(category) : 'BCI Catalog', 'Browse pet, garden, farm and household products.',
    '<section class="retail-standards"><form action="' + directory + '" method="get" class="shipping-form"><label for="bci-search">Find products</label>' +
    '<input id="bci-search" type="search" name="q" value="' + escape(query) + '" placeholder="Product, brand or UPC">' +
    '<label for="bci-category">Category</label><select id="bci-category" name="category"><option value="">All categories</option>' +
    options + '</select><button class="btn btn-primary" type="submit">Search catalog</button></form>' +
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
