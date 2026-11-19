(function (global) {
  'use strict';

  const ChopRoute = global.ChopRoute;
  if (!ChopRoute) return;

  const siteHeader = document.getElementById('site-header');
  const announcerEl = document.getElementById('sr-announcer');
  const headerAddressBtn = document.getElementById('header-address-btn');
  const headerAddressText = document.getElementById('header-address-text');
  const menuGrid = document.getElementById('menu-grid');
  const menuEmpty = document.getElementById('menu-empty');
  const resultsCountEl = document.getElementById('results-count');
  const searchInput = document.getElementById('menu-search');
  const resetFiltersBtn = document.getElementById('reset-filters');
  const browseSection = document.getElementById('browse');
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const heroFilterButtons = Array.from(document.querySelectorAll('[data-hero-filter]'));
  const footerFilterButtons = Array.from(document.querySelectorAll('[data-footer-filter]'));

  const ctaSetAddress = document.getElementById('cta-set-address');
  const ctaOpenBag = document.getElementById('cta-open-bag');
  const footerSetAddress = document.getElementById('footer-set-address');
  const footerOpenBag = document.getElementById('footer-open-bag');

  let activeCategory = 'all';
  let searchQuery = '';

  const CATEGORY_ICONS = {
    meals:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 18h22a11 11 0 0 1-22 0Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M11 12c0-1.5 1-2 1-3.5M16 11c0-1.5 1-2 1-3.5M21 12c0-1.5 1-2 1-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    snacks:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 24 24 8M11 16l5 5M15 12l5 5M8 24l-2 2M24 8l2-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    groceries:
      '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13h18l-2 12H9L7 13Z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 13v-2.5a4 4 0 0 1 8 0V13M13 19h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  };

  function announce(message) {
    if (!announcerEl) return;
    announcerEl.textContent = '';
    requestAnimationFrame(() => {
      announcerEl.textContent = message;
    });
  }

  function updateHeaderAddress(address) {
    if (address) {
      headerAddressText.textContent = address.shortLabel;
      headerAddressBtn.classList.add('has-address');
      headerAddressBtn.setAttribute('aria-label', 'Delivering to ' + address.shortLabel + '. Click to change address.');
    } else {
      headerAddressText.textContent = 'Set delivery address';
      headerAddressBtn.classList.remove('has-address');
      headerAddressBtn.setAttribute('aria-label', 'Set delivery address');
    }
  }

  let cartController = null;

  const addressController = ChopRoute.createAddressController({
    onChange: (address) => {
      updateHeaderAddress(address);
      if (cartController) cartController.refresh();
    },
    onAnnounce: announce,
  });

  cartController = ChopRoute.createCartController({
    getAddress: () => addressController.getAddress(),
    onRequestAddress: () => addressController.focusInput(),
    onChange: () => renderMenu(),
    onAnnounce: announce,
  });

  function setCategory(category, shouldScroll) {
    activeCategory = category;
    for (const btn of filterButtons) {
      btn.setAttribute('aria-pressed', String(btn.dataset.filter === category));
    }
    for (const bubble of heroFilterButtons) {
      bubble.classList.toggle('is-selected', bubble.dataset.heroFilter === category);
    }
    renderMenu();
    announce('Showing ' + resultsCountEl.textContent);
    if (shouldScroll && browseSection) {
      browseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function getFilteredItems() {
    const q = searchQuery.trim().toLowerCase();
    return ChopRoute.MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = [item.name, item.description, item.vendor, item.categoryLabel, item.tag || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  function buildCard(item) {
    const qty = cartController.getQuantity(item.id);
    const article = document.createElement('article');
    article.className = 'card card--' + item.category;
    article.dataset.category = item.category;

    const banner = document.createElement('div');
    banner.className = 'card-banner';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'card-emblem';
    iconWrap.innerHTML = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.meals;
    banner.appendChild(iconWrap);

    const bannerMeta = document.createElement('div');
    bannerMeta.className = 'card-banner-meta';

    const cat = document.createElement('span');
    cat.className = 'category';
    cat.textContent = item.categoryLabel;
    bannerMeta.appendChild(cat);

    const badges = document.createElement('div');
    badges.className = 'card-badges';

    if (item.tag) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = item.tag;
      badges.appendChild(tag);
    }

    const prep = document.createElement('span');
    prep.className = 'prep-time';
    prep.textContent = item.prepMin + ' min';
    badges.appendChild(prep);

    bannerMeta.appendChild(badges);
    banner.appendChild(bannerMeta);
    article.appendChild(banner);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.textContent = item.name;
    body.appendChild(title);

    const vendor = document.createElement('p');
    vendor.className = 'card-vendor';
    vendor.textContent = item.vendor;
    body.appendChild(vendor);

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = item.description;
    body.appendChild(desc);

    const foot = document.createElement('div');
    foot.className = 'card-footer';

    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = ChopRoute.formatPrice(item.price);
    foot.appendChild(price);

    if (qty > 0) {
      const stepper = document.createElement('div');
      stepper.className = 'stepper';

      const decBtn = document.createElement('button');
      decBtn.type = 'button';
      decBtn.textContent = '−';
      decBtn.setAttribute('aria-label', 'Remove one ' + item.name);
      decBtn.addEventListener('click', () => cartController.decrement(item.id));

      const qtySpan = document.createElement('span');
      qtySpan.className = 'stepper-qty';
      qtySpan.textContent = String(qty);

      const incBtn = document.createElement('button');
      incBtn.type = 'button';
      incBtn.textContent = '+';
      incBtn.setAttribute('aria-label', 'Add one more ' + item.name);
      incBtn.addEventListener('click', () => cartController.increment(item.id));

      stepper.appendChild(decBtn);
      stepper.appendChild(qtySpan);
      stepper.appendChild(incBtn);
      foot.appendChild(stepper);
    } else {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'add-btn';
      addBtn.textContent = 'Add to bag';
      addBtn.setAttribute('aria-label', 'Add ' + item.name + ' to bag');
      addBtn.addEventListener('click', () => cartController.add(item.id));
      foot.appendChild(addBtn);
    }

    body.appendChild(foot);
    article.appendChild(body);
    return article;
  }

  function renderMenu() {
    const items = getFilteredItems();
    menuGrid.textContent = '';

    for (const item of items) {
      menuGrid.appendChild(buildCard(item));
    }

    const label = items.length === 1 ? '1 item' : items.length + ' items';
    resultsCountEl.textContent = label;
    menuEmpty.hidden = items.length > 0;
  }

  // Filter & navigation wiring
  for (const button of filterButtons) {
    button.addEventListener('click', () => setCategory(button.dataset.filter, false));
  }

  for (const bubble of heroFilterButtons) {
    bubble.addEventListener('click', () => setCategory(bubble.dataset.heroFilter, true));
  }

  for (const btn of footerFilterButtons) {
    btn.addEventListener('click', () => setCategory(btn.dataset.footerFilter, true));
  }

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderMenu();
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchQuery = '';
    searchInput.value = '';
    setCategory('all', false);
    searchInput.focus();
  });

  headerAddressBtn.addEventListener('click', () => addressController.focusInput());
  if (ctaSetAddress) ctaSetAddress.addEventListener('click', () => addressController.focusInput());
  if (footerSetAddress) footerSetAddress.addEventListener('click', () => addressController.focusInput());
  if (ctaOpenBag) ctaOpenBag.addEventListener('click', () => cartController.open());
  if (footerOpenBag) footerOpenBag.addEventListener('click', () => cartController.open());

  // Header scroll state
  function updateScrollState() {
    if (!siteHeader) return;
    siteHeader.classList.toggle('is-scrolled', global.scrollY > 24);
  }
  global.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

  // Initial sync
  updateHeaderAddress(addressController.getAddress());
  renderMenu();
})(window);
