(() => {
  const siteHeader = document.getElementById('siteHeader');
  const heroAddressForm = document.getElementById('heroAddressForm');
  const stickyAddressForm = document.getElementById('stickyAddressForm');
  const heroAddressInput = document.getElementById('heroAddressInput');
  const stickyAddressInput = document.getElementById('stickyAddressInput');
  const heroSuggestions = document.getElementById('heroAddressSuggestions');
  const stickySuggestions = document.getElementById('stickyAddressSuggestions');
  const useLocationBtn = document.getElementById('useLocationBtn');
  const exploreStoresBtn = document.getElementById('exploreStoresBtn');

  const loginModal = document.getElementById('loginModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const loginForm = document.getElementById('loginForm');
  const loginName = document.getElementById('loginName');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const signupNameGroup = document.getElementById('signupNameGroup');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  const appModal = document.getElementById('appModal');
  const appModalCard = document.getElementById('appModalCard');
  const appModalTitle = document.getElementById('appModalTitle');
  const appModalSubtitle = document.getElementById('appModalSubtitle');
  const appModalBody = document.getElementById('appModalBody');
  const closeAppModal = document.getElementById('closeAppModal');

  const languageSelector = document.getElementById('languageSelector');
  const languageBtn = document.getElementById('languageBtn');
  const selectedLanguage = document.getElementById('selectedLanguage');
  const toast = document.getElementById('toast');

  let toastTimer = null;
  let authMode = 'login';
  let currentUser = null;

  const SAMPLE_ADDRESSES = [
    'Carrer de Pallars, 190, Barcelona',
    'Gran Vía, 28, Madrid',
    'Via Torino, 45, Milano',
    'Avenida da Liberdade, 110, Lisbon',
    'ul. Marszałkowska, 84, Warsaw',
    'Boulevard d\'Anfa, 32, Casablanca',
  ];

  const STORES_DATA = [
    { name: "McDonald's", category: 'Restaurants', eta: '15–25 min', fee: '€1.99', rating: '4.6' },
    { name: 'KFC', category: 'Restaurants', eta: '20–30 min', fee: '€2.49', rating: '4.5' },
    { name: 'Carrefour Express', category: 'Groceries', eta: '25–35 min', fee: '€1.49', rating: '4.7' },
    { name: 'Farmacia Central 24h', category: 'Pharmacy', eta: '15–20 min', fee: '€2.99', rating: '4.8' },
    { name: 'PizzaHut', category: 'Restaurants', eta: '25–35 min', fee: 'Free', rating: '4.4' },
    { name: 'Bloom & Co. Florist', category: 'Shops', eta: '30–40 min', fee: '€3.49', rating: '4.9' },
  ];

  const PARTNER_MENUS = {
    "McDonald's": [
      { item: 'Big Mac Menu (Large)', price: 9.9 },
      { item: 'McCrispy Chicken Box', price: 8.5 },
      { item: 'McFlurry Oreo', price: 3.4 },
    ],
    KFC: [
      { item: 'Original Recipe Bucket (6 pcs)', price: 14.5 },
      { item: 'Zinger Burger Meal', price: 9.2 },
      { item: 'Hot Wings (6 pcs)', price: 5.8 },
    ],
    BurgerKing: [
      { item: 'Whopper Meal', price: 9.8 },
      { item: 'Crispy Chicken Royale', price: 8.4 },
      { item: 'Onion Rings (8 pcs)', price: 3.6 },
    ],
    Carrefour: [
      { item: 'Fresh Produce Bundle', price: 12.0 },
      { item: 'Artisan Bakery & Milk Pack', price: 6.4 },
      { item: 'Everyday Pantry Essentials', price: 15.5 },
    ],
    PizzaHut: [
      { item: 'Medium Pepperoni Lovers', price: 13.5 },
      { item: 'Cheesy Garlic Bread', price: 4.9 },
      { item: 'Chocolate Cookie Dough', price: 5.5 },
    ],
    "Papa John's": [
      { item: 'Large Margherita Classic', price: 14.0 },
      { item: 'Garlic Parmesan Breadsticks', price: 4.5 },
      { item: 'Special Garlic Dipping Sauce', price: 1.2 },
    ],
    Subway: [
      { item: 'Footlong Italian B.M.T.', price: 8.9 },
      { item: 'Chicken Teriyaki 6-inch Meal', price: 7.5 },
      { item: 'Chocolate Chip Cookie (3 pcs)', price: 2.8 },
    ],
    TacoBell: [
      { item: 'Crunchy Taco Supreme Box', price: 9.4 },
      { item: 'Grilled Cheese Burrito', price: 6.9 },
      { item: 'Cinnamon Twists', price: 2.5 },
    ],
  };

  const COUNTRY_CITIES = {
    Spain: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'],
    Italy: ['Milan', 'Rome', 'Turin', 'Florence', 'Naples'],
    Ukraine: ['Kyiv', 'Lviv', 'Odesa', 'Dnipro'],
    Romania: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași'],
    Georgia: ['Tbilisi', 'Batumi', 'Kutaisi'],
    Portugal: ['Lisbon', 'Porto', 'Braga', 'Coimbra'],
    Poland: ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk'],
    Morocco: ['Casablanca', 'Rabat', 'Marrakesh', 'Tangier'],
    Kazakhstan: ['Almaty', 'Astana', 'Shymkent'],
    Croatia: ['Zagreb', 'Split', 'Rijeka'],
    Kenya: ['Nairobi', 'Mombasa', 'Kisumu'],
    "Côte D'Ivoire": ['Abidjan', 'Bouaké'],
    Serbia: ['Belgrade', 'Novi Sad', 'Niš'],
    Moldova: ['Chișinău', 'Bălți'],
    Uganda: ['Kampala', 'Entebbe'],
    Kyrgyzstan: ['Bishkek', 'Osh'],
    Bulgaria: ['Sofia', 'Plovdiv', 'Varna'],
    Montenegro: ['Podgorica', 'Budva'],
    Nigeria: ['Lagos', 'Abuja', 'Ibadan'],
    Armenia: ['Yerevan', 'Gyumri'],
    Tunisia: ['Tunis', 'Sfax', 'Sousse'],
  };

  const INFO_CONTENT = {
    'About us': {
      subtitle: 'Delivering anything in your city, in minutes.',
      html: `<div class="info-body">
        <p>Founded in Barcelona, Glovo is a pioneering multi-category delivery app connecting users with restaurants, supermarkets, pharmacies, and local shops across 21 countries.</p>
        <p>Our mission is to give everyone easy access to anything in their city while creating flexible earning opportunities for couriers and digital growth for local businesses.</p>
      </div>`,
    },
    FAQ: {
      subtitle: 'Answers to the most common questions about ordering with Glovo.',
      isFaq: true,
      items: [
        { q: 'How fast does Glovo deliver?', a: 'Most restaurant and grocery orders arrive within 20–35 minutes depending on distance and preparation time.' },
        { q: 'How do I set or change my delivery address?', a: 'Enter your street address in the hero or sticky header bar, or click "Use current location" to detect your area automatically.' },
        { q: 'Can I order from pharmacies and supermarkets?', a: 'Yes! Beyond restaurants, Glovo delivers groceries, pharmacy items, flowers, electronics, and gifts.' },
        { q: 'How do I become a courier or partner store?', a: 'Use the "Register here" buttons in the "Let\'s do it together" section to submit your application in under two minutes.' },
      ],
    },
    Blog: {
      subtitle: 'Stories, product updates, and local commerce insights.',
      html: `<div class="info-body">
        <p><strong>Latest from the Glovo Blog:</strong></p>
        <ul>
          <li><strong>Supporting Local Neighborhood Shops:</strong> How independent retailers reach thousands of new customers online.</li>
          <li><strong>Smarter Route Dispatching:</strong> Reducing delivery times and emissions across dense European cities.</li>
          <li><strong>Glovo Impact Report:</strong> Our commitment to sustainable packaging and courier safety.</li>
        </ul>
      </div>`,
    },
    Security: {
      subtitle: 'Keeping your account, payments, and personal data safe.',
      html: `<div class="info-body">
        <p>All payments are encrypted using industry-standard TLS and processed by PCI-DSS compliant providers. We never store raw card details on our servers.</p>
        <p>If you spot suspicious activity on your account, please reach out immediately via <strong>Contact us</strong>.</p>
      </div>`,
    },
    'Terms & Conditions': {
      subtitle: 'User terms governing access to the Glovo platform.',
      html: `<div class="info-body"><p>By using Glovo, you agree to provide accurate delivery details, comply with local age-restricted item regulations, and respect couriers and partner staff. Orders may be modified or cancelled prior to store preparation.</p></div>`,
    },
    'Privacy Policy': {
      subtitle: 'How we collect, use, and protect your personal information.',
      html: `<div class="info-body"><p>We process your address, contact details, and order history solely to fulfill deliveries, improve service reliability, and provide customer support. You may request access or deletion of your data at any time.</p></div>`,
    },
    'Cookies Policy': {
      subtitle: 'Information on cookies and similar technologies used on this site.',
      html: `<div class="info-body"><p>Essential cookies keep the site functioning reliably. Optional analytics and personalization cookies help us remember your preferences. You can adjust these anytime via <strong>Configure the cookies</strong>.</p></div>`,
    },
    Compliance: {
      subtitle: 'Ethics, transparency, and regulatory compliance.',
      html: `<div class="info-body"><p>Glovo maintains strict anti-bribery, food safety, and fair-competition standards across all operating markets, supported by an independent ethics channel.</p></div>`,
    },
    'Digital Services Act': {
      subtitle: 'EU Digital Services Act (DSA) transparency notice.',
      html: `<div class="info-body"><p>In accordance with Regulation (EU) 2022/2065, users and authorities can report illegal content or partner listing concerns through our dedicated compliance contact point.</p></div>`,
    },
    'European Accessibility Act': {
      subtitle: 'Our commitment to an accessible experience for everyone.',
      html: `<div class="info-body"><p>We continuously work toward WCAG 2.1 AA compliance across our web and mobile experiences, including keyboard navigation, clear contrast, and screen-reader labels.</p></div>`,
    },
  };

  const LOCALE_STRINGS = {
    English: {
      code: 'en',
      heroTitle: 'Food delivery and more',
      heroSubtitle: 'Groceries, shops, pharmacies, anything!',
      useLocation: 'Use current location',
      exploreBtn: 'Explore stores around you',
      login: 'Login',
    },
    Español: {
      code: 'es',
      heroTitle: 'Comida a domicilio y más',
      heroSubtitle: '¡Supermercados, tiendas, farmacias, lo que sea!',
      useLocation: 'Usar ubicación actual',
      exploreBtn: 'Explorar tiendas cerca de ti',
      login: 'Iniciar sesión',
    },
    Français: {
      code: 'fr',
      heroTitle: 'Livraison de repas et plus',
      heroSubtitle: 'Courses, boutiques, pharmacies, tout ce que vous voulez !',
      useLocation: 'Utiliser ma position',
      exploreBtn: 'Explorer les magasins autour de vous',
      login: 'Connexion',
    },
    Italiano: {
      code: 'it',
      heroTitle: 'Consegna di cibo e molto altro',
      heroSubtitle: 'Spesa, negozi, farmacie, qualsiasi cosa!',
      useLocation: 'Usa posizione attuale',
      exploreBtn: 'Esplora i negozi vicino a te',
      login: 'Accedi',
    },
    Português: {
      code: 'pt',
      heroTitle: 'Entrega de comida e muito mais',
      heroSubtitle: 'Supermercados, lojas, farmácias, o que quiser!',
      useLocation: 'Usar localização atual',
      exploreBtn: 'Explorar lojas perto de si',
      login: 'Iniciar sessão',
    },
  };

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function setAddressValue(val) {
    if (heroAddressInput) heroAddressInput.value = val;
    if (stickyAddressInput) stickyAddressInput.value = val;
  }

  function closeAllModals() {
    loginModal?.classList.remove('is-open');
    appModal?.classList.remove('is-open');
  }

  function openAppModal(title, subtitle, bodyHtml, wide = false) {
    closeAllModals();
    appModalCard?.classList.toggle('modal-card--wide', wide);
    if (appModalTitle) appModalTitle.textContent = title;
    if (appModalSubtitle) appModalSubtitle.textContent = subtitle;
    if (appModalBody) appModalBody.innerHTML = bodyHtml;
    appModal?.classList.add('is-open');
  }

  function renderSuccess(title, message) {
    if (!appModalBody) return;
    appModalBody.innerHTML = `
      <div class="form-success">
        <div class="form-success-icon">&#10003;</div>
        <h3>${title}</h3>
        <p>${message}</p>
        <button type="button" class="btn-primary-green" id="modalDoneBtn">Done</button>
      </div>
    `;
    document.getElementById('modalDoneBtn')?.addEventListener('click', closeAllModals);
  }

  // Sticky Header via IntersectionObserver
  if (heroAddressForm && siteHeader) {
    const observer = new IntersectionObserver(
      ([entry]) => siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting),
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
    );
    observer.observe(heroAddressForm);
  }

  // Address Autocomplete & Sync
  function setupAddressAutocomplete(inputEl, listEl) {
    if (!inputEl || !listEl) return;

    function renderSuggestions(query) {
      const q = query.trim().toLowerCase();
      const matches = SAMPLE_ADDRESSES.filter((a) => !q || a.toLowerCase().includes(q)).slice(0, 4);
      if (!matches.length) {
        listEl.classList.remove('is-open');
        return;
      }
      listEl.innerHTML = matches
        .map(
          (addr) =>
            `<li><button type="button" class="suggestion-item" data-addr="${addr}">&#128205; <span>${addr}</span></button></li>`
        )
        .join('');
      listEl.classList.add('is-open');

      listEl.querySelectorAll('.suggestion-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          setAddressValue(btn.dataset.addr);
          listEl.classList.remove('is-open');
          openExploreStoresModal(btn.dataset.addr);
        });
      });
    }

    inputEl.addEventListener('focus', () => renderSuggestions(inputEl.value));
    inputEl.addEventListener('input', () => {
      const other = inputEl === heroAddressInput ? stickyAddressInput : heroAddressInput;
      if (other) other.value = inputEl.value;
      renderSuggestions(inputEl.value);
    });
  }

  setupAddressAutocomplete(heroAddressInput, heroSuggestions);
  setupAddressAutocomplete(stickyAddressInput, stickySuggestions);

  document.addEventListener('click', (e) => {
    if (!heroAddressForm?.contains(e.target)) heroSuggestions?.classList.remove('is-open');
    if (!stickyAddressForm?.contains(e.target)) stickySuggestions?.classList.remove('is-open');
    if (languageSelector && !languageSelector.contains(e.target)) {
      languageSelector.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  // Explore Stores Modal
  function openExploreStoresModal(address) {
    const activeAddr = address || heroAddressInput?.value.trim() || 'your area';
    const categories = ['All', 'Restaurants', 'Groceries', 'Pharmacy', 'Shops'];

    function renderStores(filterCat = 'All') {
      const filtered = filterCat === 'All' ? STORES_DATA : STORES_DATA.filter((s) => s.category === filterCat);
      return `
        <div class="category-pills">
          ${categories
            .map(
              (cat) =>
                `<button type="button" class="category-pill ${cat === filterCat ? 'is-active' : ''}" data-cat="${cat}">${cat}</button>`
            )
            .join('')}
        </div>
        <div class="store-list">
          ${filtered
            .map(
              (s) => `
            <div class="store-item">
              <div class="store-item-info">
                <h4>${s.name}</h4>
                <p class="store-item-meta">${s.category} &bull; &#9733; ${s.rating} &bull; ${s.eta} &bull; Delivery: ${s.fee}</p>
              </div>
              <button type="button" class="btn-primary-green store-order-btn" data-open-store="${s.name}">View</button>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    openAppModal('Stores delivering near you', `Delivering to: ${activeAddr}`, renderStores('All'), true);

    function bindStoreEvents() {
      appModalBody.querySelectorAll('.category-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          appModalBody.innerHTML = renderStores(btn.dataset.cat);
          bindStoreEvents();
        });
      });
      appModalBody.querySelectorAll('[data-open-store]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const storeName = btn.dataset.openStore;
          if (PARTNER_MENUS[storeName]) {
            openPartnerModal(storeName);
          } else {
            renderSuccess('Order started!', `Browsing ${storeName} for delivery to ${activeAddr}.`);
          }
        });
      });
    }
    bindStoreEvents();
  }

  function handleAddressSubmit(e, inputEl) {
    e.preventDefault();
    heroSuggestions?.classList.remove('is-open');
    stickySuggestions?.classList.remove('is-open');
    const val = inputEl ? inputEl.value.trim() : '';
    if (!val) {
      showToast('Please enter your delivery address.');
      inputEl?.focus();
      return;
    }
    openExploreStoresModal(val);
  }

  heroAddressForm?.addEventListener('submit', (e) => handleAddressSubmit(e, heroAddressInput));
  stickyAddressForm?.addEventListener('submit', (e) => handleAddressSubmit(e, stickyAddressInput));

  // Use current location
  useLocationBtn?.addEventListener('click', () => {
    const defaultLabel = LOCALE_STRINGS[selectedLanguage?.textContent]?.useLocation || 'Use current location';
    if (!navigator.geolocation) {
      const fallback = SAMPLE_ADDRESSES[0];
      setAddressValue(fallback);
      openExploreStoresModal(fallback);
      return;
    }
    useLocationBtn.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(
      () => {
        const detected = 'Current Location (Detected)';
        setAddressValue(detected);
        useLocationBtn.textContent = defaultLabel;
        openExploreStoresModal(detected);
      },
      () => {
        const fallback = SAMPLE_ADDRESSES[0];
        setAddressValue(fallback);
        useLocationBtn.textContent = defaultLabel;
        showToast(`Using sample address: ${fallback}`);
        openExploreStoresModal(fallback);
      },
      { timeout: 5000 }
    );
  });

  exploreStoresBtn?.addEventListener('click', () => {
    const val = heroAddressInput?.value.trim();
    if (!val) {
      setAddressValue(SAMPLE_ADDRESSES[0]);
      openExploreStoresModal(SAMPLE_ADDRESSES[0]);
    } else {
      openExploreStoresModal(val);
    }
  });

  // Partner Quick-Order Modal
  function openPartnerModal(partnerName) {
    const menu = PARTNER_MENUS[partnerName] || [];
    const counts = new Array(menu.length).fill(0);
    const address = heroAddressInput?.value.trim() || SAMPLE_ADDRESSES[0];

    const bodyHtml = `
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" for="partnerAddressInput">Delivery address</label>
        <input type="text" id="partnerAddressInput" class="modal-input" value="${address}" />
      </div>
      <div class="menu-list">
        ${menu
          .map(
            (m, i) => `
          <div class="menu-item">
            <div class="menu-item-info">
              <h4>${m.item}</h4>
              <p class="menu-item-meta">&euro;${m.price.toFixed(2)}</p>
            </div>
            <div class="qty-control">
              <button type="button" class="qty-btn" data-qty-delta="-1" data-idx="${i}" aria-label="Remove one">-</button>
              <span id="qty-${i}">0</span>
              <button type="button" class="qty-btn" data-qty-delta="1" data-idx="${i}" aria-label="Add one">+</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
      <div class="cart-bar">
        <strong id="partnerTotal">Total: &euro;0.00</strong>
        <button type="button" class="btn-primary-green" id="placePartnerOrder">Order now</button>
      </div>
    `;

    openAppModal(partnerName, 'Estimated delivery: 20–30 min • Free first delivery', bodyHtml, true);

    function updateTotal() {
      const total = menu.reduce((sum, m, i) => sum + m.price * counts[i], 0);
      const totalEl = document.getElementById('partnerTotal');
      if (totalEl) totalEl.innerHTML = `Total: &euro;${total.toFixed(2)}`;
    }

    appModalBody.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        const delta = Number(btn.dataset.qtyDelta);
        counts[idx] = Math.max(0, counts[idx] + delta);
        const qtyEl = document.getElementById(`qty-${idx}`);
        if (qtyEl) qtyEl.textContent = String(counts[idx]);
        updateTotal();
      });
    });

    document.getElementById('placePartnerOrder')?.addEventListener('click', () => {
      const totalItems = counts.reduce((a, b) => a + b, 0);
      if (totalItems === 0) {
        showToast('Add at least one item to your order.');
        return;
      }
      const chosenAddr = document.getElementById('partnerAddressInput')?.value.trim() || address;
      setAddressValue(chosenAddr);
      renderSuccess(
        'Order confirmed!',
        `Your ${partnerName} order (${totalItems} item${totalItems > 1 ? 's' : ''}) is being prepared for ${chosenAddr}.`
      );
    });
  }

  document.querySelectorAll('.restaurant-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      openPartnerModal(card.dataset.partner);
    });
  });

  // Country -> City Modal
  document.querySelectorAll('.country-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const country = pill.textContent.trim();
      const cities = COUNTRY_CITIES[country] || ['Capital City'];
      const html = `
        <div class="city-grid">
          ${cities.map((city) => `<button type="button" class="city-btn" data-city="${city}, ${country}">${city}</button>`).join('')}
        </div>
      `;
      openAppModal(`Glovo in ${country}`, 'Select a city to view available stores:', html, false);
      appModalBody.querySelectorAll('.city-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          setAddressValue(btn.dataset.city);
          openExploreStoresModal(btn.dataset.city);
        });
      });
    });
  });

  // Registration Forms (Rider, Business, Careers)
  function openRegistrationModal(type) {
    let subtitle = 'Complete the form below and our team will reach out.';
    let fieldsHtml = '';

    if (type === 'Become a rider') {
      subtitle = 'Deliver with flexibility and earn competitive payouts.';
      fieldsHtml = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regName">Full name</label>
            <input type="text" id="regName" class="modal-input" placeholder="Alex Rivera" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regPhone">Phone number</label>
            <input type="tel" id="regPhone" class="modal-input" placeholder="+34 600 000 000" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="regEmail">Email address</label>
          <input type="email" id="regEmail" class="modal-input" placeholder="alex@example.com" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regCity">City</label>
            <input type="text" id="regCity" class="modal-input" placeholder="Barcelona" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regVehicle">Vehicle</label>
            <select id="regVehicle" class="form-select" required>
              <option value="Bicycle">Bicycle</option>
              <option value="E-Bike / Scooter">E-Bike / Scooter</option>
              <option value="Car">Car</option>
            </select>
          </div>
        </div>
      `;
    } else if (type === 'Register your business') {
      subtitle = 'Grow your sales by partnering with Glovo.';
      fieldsHtml = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regBizName">Business name</label>
            <input type="text" id="regBizName" class="modal-input" placeholder="La Trattoria" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regCategory">Category</label>
            <select id="regCategory" class="form-select" required>
              <option value="Restaurant">Restaurant</option>
              <option value="Grocery / Supermarket">Grocery / Supermarket</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Retail / Shops">Retail / Shops</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regName">Contact name</label>
            <input type="text" id="regName" class="modal-input" placeholder="Maria Lopez" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regPhone">Phone number</label>
            <input type="tel" id="regPhone" class="modal-input" placeholder="+34 600 000 000" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regEmail">Business email</label>
            <input type="email" id="regEmail" class="modal-input" placeholder="owner@business.com" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regCity">City</label>
            <input type="text" id="regCity" class="modal-input" placeholder="Madrid" required />
          </div>
        </div>
      `;
    } else {
      subtitle = 'Join our team and build the future of local delivery.';
      fieldsHtml = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regName">Full name</label>
            <input type="text" id="regName" class="modal-input" placeholder="Samira Patel" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="regEmail">Email address</label>
            <input type="email" id="regEmail" class="modal-input" placeholder="samira@example.com" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="regDept">Department</label>
            <select id="regDept" class="form-select" required>
              <option value="Engineering">Engineering</option>
              <option value="Product & Design">Product &amp; Design</option>
              <option value="Operations">Operations</option>
              <option value="Marketing & Sales">Marketing &amp; Sales</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="regPortfolio">LinkedIn / Portfolio URL</label>
            <input type="url" id="regPortfolio" class="modal-input" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="regNote">Why Glovo?</label>
          <textarea id="regNote" class="form-textarea" placeholder="Tell us briefly about your experience..." required></textarea>
        </div>
      `;
    }

    const formHtml = `
      <form class="modal-form" id="dynamicRegForm">
        ${fieldsHtml}
        <button type="submit" class="btn-primary-green modal-submit">Submit application</button>
      </form>
    `;

    openAppModal(type, subtitle, formHtml, true);
    document.getElementById('dynamicRegForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('regEmail')?.value.trim();
      renderSuccess(
        'Application received!',
        `Thank you for applying to "${type}". We've sent a confirmation to ${email}.`
      );
    });
  }

  document.querySelectorAll('[data-register]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRegistrationModal(btn.dataset.register);
    });
  });

  // Contact Us Modal
  document.querySelectorAll('[data-contact]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const html = `
        <form class="modal-form" id="contactForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="contactName">Your name</label>
              <input type="text" id="contactName" class="modal-input" placeholder="Alex Rivera" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="contactEmail">Email address</label>
              <input type="email" id="contactEmail" class="modal-input" placeholder="alex@example.com" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="contactTopic">Topic</label>
            <select id="contactTopic" class="form-select" required>
              <option value="Order support">Order support</option>
              <option value="Partner inquiry">Partner inquiry</option>
              <option value="Courier support">Courier support</option>
              <option value="General feedback">General feedback</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="contactMessage">Message</label>
            <textarea id="contactMessage" class="form-textarea" placeholder="How can we help?" required></textarea>
          </div>
          <button type="submit" class="btn-primary-green modal-submit">Send message</button>
        </form>
      `;
      openAppModal('Contact us', 'Our support team usually responds within a few hours.', html, true);
      document.getElementById('contactForm')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('contactEmail')?.value.trim();
        renderSuccess('Message sent!', `We've received your inquiry and will reply to ${email} shortly.`);
      });
    });
  });

  // App Download Modal
  document.querySelectorAll('[data-app-download]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const platform = el.dataset.appDownload === 'ios' ? 'App Store (iOS)' : 'Google Play (Android)';
      const html = `
        <form class="modal-form" id="appLinkForm">
          <div class="form-group">
            <label class="form-label" for="appLinkContact">Send download link via email or SMS</label>
            <input type="text" id="appLinkContact" class="modal-input" placeholder="you@example.com or +34 600 000 000" required />
          </div>
          <button type="submit" class="btn-primary-green modal-submit">Send me the app link</button>
        </form>
        <div class="app-store-links-row">
          <a href="https://apps.apple.com/app/glovo-food-delivery-and-more/id951812684" target="_blank" rel="noopener noreferrer" class="city-btn">Open App Store &rarr;</a>
          <a href="https://play.google.com/store/apps/details?id=com.glovo" target="_blank" rel="noopener noreferrer" class="city-btn">Open Google Play &rarr;</a>
        </div>
      `;
      openAppModal('Get the Glovo App', `Selected platform: ${platform}`, html, false);
      document.getElementById('appLinkForm')?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const dest = document.getElementById('appLinkContact')?.value.trim();
        renderSuccess('Link sent!', `We've sent the Glovo app download link to ${dest}.`);
      });
    });
  });

  // Cookie Preferences Modal
  document.querySelectorAll('[data-cookies]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const saved = JSON.parse(localStorage.getItem('glovo_cookies') || '{"analytics":true,"personalization":true,"marketing":false}');
      const html = `
        <div class="cookie-list">
          <div class="cookie-item">
            <div><h4>Strictly Necessary</h4><p>Required for core site navigation and security.</p></div>
            <label class="switch"><input type="checkbox" checked disabled /><span class="switch-slider"></span></label>
          </div>
          <div class="cookie-item">
            <div><h4>Analytics</h4><p>Helps us measure traffic and improve delivery estimates.</p></div>
            <label class="switch"><input type="checkbox" id="cookieAnalytics" ${saved.analytics ? 'checked' : ''} /><span class="switch-slider"></span></label>
          </div>
          <div class="cookie-item">
            <div><h4>Personalization</h4><p>Remembers your preferred language and recent addresses.</p></div>
            <label class="switch"><input type="checkbox" id="cookiePersonalization" ${saved.personalization ? 'checked' : ''} /><span class="switch-slider"></span></label>
          </div>
          <div class="cookie-item">
            <div><h4>Marketing</h4><p>Allows relevant promotions and partner offers.</p></div>
            <label class="switch"><input type="checkbox" id="cookieMarketing" ${saved.marketing ? 'checked' : ''} /><span class="switch-slider"></span></label>
          </div>
        </div>
        <button type="button" class="btn-primary-green modal-submit" id="saveCookiesBtn">Save preferences</button>
      `;
      openAppModal('Configure the cookies', 'Manage your privacy preferences below.', html, true);
      document.getElementById('saveCookiesBtn')?.addEventListener('click', () => {
        const prefs = {
          analytics: Boolean(document.getElementById('cookieAnalytics')?.checked),
          personalization: Boolean(document.getElementById('cookiePersonalization')?.checked),
          marketing: Boolean(document.getElementById('cookieMarketing')?.checked),
        };
        localStorage.setItem('glovo_cookies', JSON.stringify(prefs));
        closeAllModals();
        showToast('Cookie preferences saved.');
      });
    });
  });

  // Info & FAQ Modals
  document.querySelectorAll('[data-info]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const key = el.dataset.info;
      const entry = INFO_CONTENT[key];
      if (!entry) return;

      if (entry.isFaq) {
        const faqHtml = `
          <div class="faq-list">
            ${entry.items
              .map(
                (item, idx) => `
              <div class="faq-item ${idx === 0 ? 'is-open' : ''}">
                <button type="button" class="faq-question">
                  <span>${item.q}</span>
                  <span>+</span>
                </button>
                <div class="faq-answer">${item.a}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `;
        openAppModal(key, entry.subtitle, faqHtml, true);
        appModalBody.querySelectorAll('.faq-question').forEach((qBtn) => {
          qBtn.addEventListener('click', () => {
            qBtn.closest('.faq-item')?.classList.toggle('is-open');
          });
        });
      } else {
        openAppModal(key, entry.subtitle, entry.html, true);
      }
    });
  });

  // Login / Sign Up Modal
  function updateAuthUI() {
    document.querySelectorAll('[data-open-login]').forEach((btn) => {
      const span = btn.querySelector('span');
      if (span) {
        span.textContent = currentUser ? currentUser : LOCALE_STRINGS[selectedLanguage?.textContent]?.login || 'Login';
      }
    });
  }

  document.querySelectorAll('[data-open-login]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentUser) {
        openAppModal(
          `Signed in as ${currentUser}`,
          'Manage your Glovo account session.',
          `<button type="button" class="btn-primary-green modal-submit" id="signOutBtn">Log out</button>`,
          false
        );
        document.getElementById('signOutBtn')?.addEventListener('click', () => {
          currentUser = null;
          updateAuthUI();
          closeAllModals();
          showToast('You have been logged out.');
        });
        return;
      }
      closeAllModals();
      loginModal?.classList.add('is-open');
      setTimeout(() => loginEmail?.focus(), 50);
    });
  });

  document.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      authMode = tab.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      signupNameGroup?.classList.toggle('is-hidden', authMode !== 'signup');
      if (loginName) loginName.required = authMode === 'signup';
      if (loginSubmitBtn) loginSubmitBtn.textContent = authMode === 'signup' ? 'Create account' : 'Log in';
    });
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const identifier = loginEmail?.value.trim();
    const name = loginName?.value.trim();
    if (!identifier) return;
    currentUser = authMode === 'signup' && name ? name.split(' ')[0] : identifier.split('@')[0];
    updateAuthUI();
    closeAllModals();
    loginForm.reset();
    showToast(authMode === 'signup' ? `Welcome to Glovo, ${currentUser}!` : `Signed in as ${currentUser}`);
  });

  closeLoginModal?.addEventListener('click', closeAllModals);
  closeAppModal?.addEventListener('click', closeAllModals);
  loginModal?.addEventListener('click', (e) => {
    if (e.target === loginModal) closeAllModals();
  });
  appModal?.addEventListener('click', (e) => {
    if (e.target === appModal) closeAllModals();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      languageSelector?.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  // Language Selector
  languageBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = languageSelector.classList.toggle('is-open');
    languageBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.language-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      const strings = LOCALE_STRINGS[lang];
      if (selectedLanguage && lang) selectedLanguage.textContent = lang;
      if (strings) {
        document.documentElement.lang = strings.code;
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroTitle) heroTitle.textContent = strings.heroTitle;
        if (heroSubtitle) heroSubtitle.textContent = strings.heroSubtitle;
        if (useLocationBtn) useLocationBtn.textContent = strings.useLocation;
        if (exploreStoresBtn) exploreStoresBtn.textContent = strings.exploreBtn;
        updateAuthUI();
      }
      document.querySelectorAll('.language-option').forEach((o) => o.classList.remove('is-active'));
      opt.classList.add('is-active');
      languageSelector?.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
      showToast(`Language switched to ${lang}`);
    });
  });
})();
