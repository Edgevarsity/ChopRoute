(() => {
  const siteHeader = document.getElementById('siteHeader');
  const heroAddressForm = document.getElementById('heroAddressForm');
  const stickyAddressForm = document.getElementById('stickyAddressForm');
  const heroAddressInput = document.getElementById('heroAddressInput');
  const stickyAddressInput = document.getElementById('stickyAddressInput');
  const useLocationBtn = document.getElementById('useLocationBtn');
  const exploreStoresBtn = document.getElementById('exploreStoresBtn');

  const loginModal = document.getElementById('loginModal');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');

  const languageSelector = document.getElementById('languageSelector');
  const languageBtn = document.getElementById('languageBtn');
  const selectedLanguage = document.getElementById('selectedLanguage');
  const toast = document.getElementById('toast');

  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3200);
  }

  // Sticky Header via IntersectionObserver on hero address bar
  if (heroAddressForm && siteHeader) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
    );
    observer.observe(heroAddressForm);
  }

  // Sync address inputs
  function syncInputs(source, target) {
    if (!source || !target) return;
    source.addEventListener('input', () => {
      target.value = source.value;
    });
  }
  syncInputs(heroAddressInput, stickyAddressInput);
  syncInputs(stickyAddressInput, heroAddressInput);

  // Handle address submission
  function handleAddressSubmit(e, inputEl) {
    e.preventDefault();
    const val = inputEl ? inputEl.value.trim() : '';
    if (!val) {
      showToast('Please enter your delivery address.');
      inputEl?.focus();
      return;
    }
    showToast(`Showing stores delivering to "${val}"`);
  }

  heroAddressForm?.addEventListener('submit', (e) => handleAddressSubmit(e, heroAddressInput));
  stickyAddressForm?.addEventListener('submit', (e) => handleAddressSubmit(e, stickyAddressInput));

  // Use current location
  useLocationBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      const fallback = 'Carrer de Pallars, 190, Barcelona';
      heroAddressInput.value = fallback;
      stickyAddressInput.value = fallback;
      showToast(`Location set to ${fallback}`);
      return;
    }

    useLocationBtn.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(
      () => {
        const detected = 'Current Location (Detected)';
        heroAddressInput.value = detected;
        stickyAddressInput.value = detected;
        useLocationBtn.textContent = 'Use current location';
        showToast('Delivery location updated to your current position.');
      },
      () => {
        const fallback = 'Carrer de Pallars, 190, Barcelona';
        heroAddressInput.value = fallback;
        stickyAddressInput.value = fallback;
        useLocationBtn.textContent = 'Use current location';
        showToast(`Using sample address: ${fallback}`);
      },
      { timeout: 5000 }
    );
  });

  // Explore stores button scrolls to top address input if empty
  exploreStoresBtn?.addEventListener('click', () => {
    const val = heroAddressInput?.value.trim();
    if (!val) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => heroAddressInput?.focus(), 450);
      showToast('Enter your address to explore stores around you.');
    } else {
      showToast(`Exploring stores near "${val}"`);
    }
  });

  // Partner cards & country pills feedback
  document.querySelectorAll('.restaurant-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const name = card.dataset.partner || 'partner';
      showToast(`Selected ${name} — enter your address to order!`);
    });
  });

  document.querySelectorAll('.country-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Glovo delivers in ${pill.textContent.trim()}!`);
    });
  });

  document.querySelectorAll('[data-register]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Opening "${btn.dataset.register}" registration...`);
    });
  });

  // Login Modal
  function openModal() {
    loginModal?.classList.add('is-open');
    setTimeout(() => loginEmail?.focus(), 50);
  }

  function closeModal() {
    loginModal?.classList.remove('is-open');
  }

  document.querySelectorAll('[data-open-login]').forEach((btn) => {
    btn.addEventListener('click', openModal);
  });

  closeLoginModal?.addEventListener('click', closeModal);

  loginModal?.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      languageSelector?.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginEmail?.value.trim();
    if (!email) return;
    closeModal();
    loginForm.reset();
    showToast(`Verification link sent to ${email}`);
  });

  // Language Selector Dropdown
  languageBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = languageSelector.classList.toggle('is-open');
    languageBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.language-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const lang = opt.dataset.lang;
      if (selectedLanguage && lang) {
        selectedLanguage.textContent = lang;
      }
      document.querySelectorAll('.language-option').forEach((o) => o.classList.remove('is-active'));
      opt.classList.add('is-active');
      languageSelector?.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
      showToast(`Language switched to ${lang}`);
    });
  });

  document.addEventListener('click', (e) => {
    if (languageSelector && !languageSelector.contains(e.target)) {
      languageSelector.classList.remove('is-open');
      languageBtn?.setAttribute('aria-expanded', 'false');
    }
  });
})();

