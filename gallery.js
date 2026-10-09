'use strict';
(() => {
  function mount(root, product) {
    const images = [...new Set([product.image, ...(product.images || [])])].filter(src => typeof src === 'string' && /^https:\/\//.test(src));
    const image = root.querySelector('[data-gallery-image]');
    const zoom = root.querySelector('[data-gallery-zoom]');
    const thumbs = root.querySelector('[data-gallery-thumbs]');
    const status = root.querySelector('[data-gallery-status]');
    if (!image || !zoom || !thumbs || !images.length) return;
    thumbs.replaceChildren();
    thumbs.hidden = images.length < 2;
    const buttons = [];
    function select(index) {
      image.src = images[index];
      image.alt = product.title + (images.length > 1 ? ' — photo ' + (index + 1) : '');
      zoom.href = images[index];
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      if (status) status.textContent = images.length > 1 ? 'Photo ' + (index + 1) + ' of ' + images.length : '';
    }
    images.forEach((src, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-thumb';
      button.setAttribute('aria-label', 'Show product photo ' + (index + 1));
      const thumbnail = document.createElement('img');
      thumbnail.src = src;
      thumbnail.alt = '';
      thumbnail.width = 72;
      thumbnail.height = 72;
      thumbnail.loading = 'lazy';
      thumbnail.decoding = 'async';
      thumbnail.referrerPolicy = 'no-referrer';
      button.appendChild(thumbnail);
      button.addEventListener('click', () => select(index));
      buttons.push(button);
      thumbs.appendChild(button);
    });
    select(0);
  }
  window.ElvarinsGallery = { mount };
  const data = document.getElementById('product-data');
  const root = document.querySelector('[data-product-gallery]');
  if (data && root) mount(root, JSON.parse(data.textContent));
})();
