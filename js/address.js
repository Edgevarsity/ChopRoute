(function (global) {
  'use strict';

  const ChopRoute = (global.ChopRoute = global.ChopRoute || {});

  const STORAGE_KEY = 'choproute_address_v1';
  const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
  const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
  const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
  const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

  const MIN_QUERY_LENGTH = 3;
  const DEBOUNCE_MS = 300;
  const MAX_RESULTS = 5;

  function uniqueParts(parts) {
    const seen = new Set();
    const out = [];
    for (const raw of parts) {
      const val = typeof raw === 'string' ? raw.trim() : '';
      if (!val) continue;
      const key = val.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(val);
      }
    }
    return out;
  }

  function formatPhotonFeature(feature) {
    if (!feature || !feature.properties || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) {
      return null;
    }

    const p = feature.properties;
    const lon = Number(feature.geometry.coordinates[0]);
    const lat = Number(feature.geometry.coordinates[1]);

    const streetLine = [p.housenumber, p.street].filter(Boolean).join(' ').trim();
    const primary = streetLine || p.name || p.district || p.city || p.state || p.country;
    if (!primary) return null;

    const secondaryParts = uniqueParts([
      p.name && p.name !== primary ? p.name : null,
      p.district,
      p.locality,
      p.city || p.county,
      p.state,
      p.country,
    ]).filter((part) => part.toLowerCase() !== primary.toLowerCase());

    const secondary = secondaryParts.join(', ');
    const label = secondary ? primary + ', ' + secondary : primary;
    const shortParts = uniqueParts([primary, p.district || p.city || p.state]);
    const shortLabel = shortParts.slice(0, 2).join(', ');

    return {
      primary,
      secondary,
      label,
      shortLabel,
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      source: 'OpenStreetMap',
    };
  }

  function formatNominatimPlace(place) {
    if (!place) return null;

    const addr = place.address || {};
    const lat = Number(place.lat);
    const lon = Number(place.lon);

    const streetLine = [addr.house_number, addr.road || addr.pedestrian || addr.residential]
      .filter(Boolean)
      .join(' ')
      .trim();

    const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.village;
    const city = addr.city || addr.town || addr.municipality || addr.county;
    const primary =
      streetLine ||
      place.name ||
      locality ||
      city ||
      (place.display_name ? place.display_name.split(',')[0].trim() : '');

    if (!primary) return null;

    const secondaryParts = uniqueParts([
      locality,
      city,
      addr.state,
      addr.country,
    ]).filter((part) => part.toLowerCase() !== primary.toLowerCase());

    const secondary = secondaryParts.join(', ');
    const label = secondary ? primary + ', ' + secondary : (place.display_name || primary);
    const shortParts = uniqueParts([primary, locality || city || addr.state]);
    const shortLabel = shortParts.slice(0, 2).join(', ');

    return {
      primary,
      secondary,
      label,
      shortLabel,
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      source: 'OpenStreetMap',
    };
  }

  function dedupeAddresses(list) {
    const seen = new Set();
    return list.filter((item) => {
      if (!item || !item.label) return false;
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function searchAddresses(query, signal) {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return [];

    // Primary: Photon (OpenStreetMap-powered live autocomplete engine)
    try {
      const photonUrl =
        PHOTON_SEARCH_URL +
        '?q=' +
        encodeURIComponent(trimmed) +
        '&limit=' +
        MAX_RESULTS +
        '&lang=en';

      const res = await fetch(photonUrl, {
        signal,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const parsed = Array.isArray(data.features)
          ? data.features.map(formatPhotonFeature).filter(Boolean)
          : [];
        if (parsed.length > 0) {
          return dedupeAddresses(parsed).slice(0, MAX_RESULTS);
        }
      }
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      // Fall through to Nominatim fallback below
    }

    // Fallback: OpenStreetMap Nominatim search
    const nomUrl =
      NOMINATIM_SEARCH_URL +
      '?format=jsonv2&addressdetails=1&limit=' +
      MAX_RESULTS +
      '&accept-language=en&q=' +
      encodeURIComponent(trimmed);

    const nomRes = await fetch(nomUrl, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!nomRes.ok) {
      throw new Error('Address service returned status ' + nomRes.status);
    }

    const nomData = await nomRes.json();
    const parsed = Array.isArray(nomData)
      ? nomData.map(formatNominatimPlace).filter(Boolean)
      : [];
    return dedupeAddresses(parsed).slice(0, MAX_RESULTS);
  }

  async function reverseGeocode(lat, lon) {
    // Primary: OpenStreetMap Nominatim reverse lookup
    try {
      const nomUrl =
        NOMINATIM_REVERSE_URL +
        '?format=jsonv2&addressdetails=1&accept-language=en&lat=' +
        encodeURIComponent(lat) +
        '&lon=' +
        encodeURIComponent(lon);

      const res = await fetch(nomUrl, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const formatted = formatNominatimPlace(data);
        if (formatted) return formatted;
      }
    } catch (_) {
      // Fall through to Photon reverse
    }

    // Fallback: Photon reverse lookup
    const photonUrl =
      PHOTON_REVERSE_URL +
      '?lat=' +
      encodeURIComponent(lat) +
      '&lon=' +
      encodeURIComponent(lon);

    const pRes = await fetch(photonUrl, { headers: { Accept: 'application/json' } });
    if (!pRes.ok) {
      throw new Error('Could not resolve coordinates to an address');
    }

    const pData = await pRes.json();
    const first = Array.isArray(pData.features) ? pData.features[0] : null;
    const formatted = formatPhotonFeature(first);
    if (!formatted) {
      throw new Error('No street address found for your location');
    }
    return formatted;
  }

  function loadSavedAddress() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.label === 'string' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function saveAddress(address) {
    try {
      if (address) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
      } else {
        global.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {
      // Storage unavailable (e.g., private browsing quota)
    }
  }

  function createAddressController(options) {
    const onChange = typeof options.onChange === 'function' ? options.onChange : function () {};
    const onAnnounce = typeof options.onAnnounce === 'function' ? options.onAnnounce : function () {};

    const widget = document.getElementById('address-widget');
    const input = document.getElementById('address-input');
    const clearBtn = document.getElementById('address-clear');
    const locateBtn = document.getElementById('locate-btn');
    const listEl = document.getElementById('address-suggestions');
    const statusEl = document.getElementById('address-status');

    let selectedAddress = loadSavedAddress();
    let suggestions = [];
    let activeIndex = -1;
    let debounceTimer = null;
    let abortController = null;
    let isLocating = false;

    function updateClearVisibility() {
      clearBtn.hidden = input.value.trim().length === 0 && !selectedAddress;
    }

    function closeSuggestions() {
      listEl.hidden = true;
      listEl.textContent = '';
      suggestions = [];
      activeIndex = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function showStatus(kind, heading, detail) {
      statusEl.textContent = '';
      statusEl.className = 'address-status address-status--' + kind;
      statusEl.hidden = false;

      const textWrap = document.createElement('div');
      textWrap.className = 'address-status-copy';

      const strong = document.createElement('strong');
      strong.textContent = heading;
      textWrap.appendChild(strong);

      if (detail) {
        const span = document.createElement('span');
        span.textContent = detail;
        textWrap.appendChild(span);
      }

      statusEl.appendChild(textWrap);
    }

    function hideStatus() {
      statusEl.hidden = true;
      statusEl.textContent = '';
    }

    function renderConfirmedAddress(address) {
      if (!address) {
        hideStatus();
        return;
      }

      const estimate = ChopRoute.getDeliveryEstimate(address);
      const metaParts = ['Est. ' + estimate.etaText, ChopRoute.formatPrice(estimate.fee) + ' delivery'];
      if (estimate.distanceText) {
        metaParts.push(estimate.distanceText);
      }

      showStatus('confirmed', 'Delivering to ' + address.shortLabel, metaParts.join(' · '));
    }

    function renderSuggestions(items, message) {
      listEl.textContent = '';
      suggestions = items;
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');

      if (message) {
        const li = document.createElement('li');
        li.className = 'suggestion-message';
        li.setAttribute('role', 'status');
        li.textContent = message;
        listEl.appendChild(li);
        listEl.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        return;
      }

      if (!items.length) {
        closeSuggestions();
        return;
      }

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.id = 'address-option-' + index;
        li.className = 'suggestion-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');

        const primaryEl = document.createElement('span');
        primaryEl.className = 'suggestion-primary';
        primaryEl.textContent = item.primary;
        li.appendChild(primaryEl);

        if (item.secondary) {
          const secondaryEl = document.createElement('span');
          secondaryEl.className = 'suggestion-secondary';
          secondaryEl.textContent = item.secondary;
          li.appendChild(secondaryEl);
        }

        li.addEventListener('pointerdown', (e) => {
          // Prevent input blur before selection completes
          e.preventDefault();
          selectAddress(item);
        });

        listEl.appendChild(li);
      });

      listEl.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function setActiveOption(nextIndex) {
      if (!suggestions.length) return;
      const clamped = (nextIndex + suggestions.length) % suggestions.length;
      activeIndex = clamped;

      const options = listEl.querySelectorAll('[role="option"]');
      options.forEach((opt, i) => {
        const isSelected = i === activeIndex;
        opt.setAttribute('aria-selected', String(isSelected));
        opt.classList.toggle('is-active', isSelected);
      });

      const activeEl = options[activeIndex];
      if (activeEl) {
        input.setAttribute('aria-activedescendant', activeEl.id);
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    function selectAddress(address) {
      selectedAddress = address;
      input.value = address.label;
      saveAddress(address);
      closeSuggestions();
      renderConfirmedAddress(address);
      updateClearVisibility();
      onChange(address);
      onAnnounce('Delivery address set to ' + address.shortLabel);
    }

    function clearAddress() {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      clearTimeout(debounceTimer);
      selectedAddress = null;
      input.value = '';
      saveAddress(null);
      closeSuggestions();
      hideStatus();
      updateClearVisibility();
      onChange(null);
      input.focus();
      onAnnounce('Delivery address cleared');
    }

    async function performLookup(query) {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();
      const currentController = abortController;

      renderSuggestions([], 'Searching OpenStreetMap...');

      try {
        const results = await searchAddresses(query, currentController.signal);
        if (currentController.signal.aborted) return;

        if (results.length === 0) {
          renderSuggestions([], 'No matching addresses found. Try adding your street or city.');
          onAnnounce('No matching addresses found');
        } else {
          renderSuggestions(results);
          onAnnounce(results.length + ' address suggestions available');
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        renderSuggestions([], 'Could not reach OpenStreetMap right now. Check your connection and try again.');
      }
    }

    async function handleLocateClick() {
      if (isLocating) return;

      if (!navigator.geolocation) {
        showStatus('error', 'Location not supported', 'Type your street or city above to search OpenStreetMap.');
        return;
      }

      if (global.isSecureContext === false) {
        showStatus(
          'error',
          'Location requires a local server or HTTPS',
          'Open via localhost/HTTPS for GPS, or type your street directly above.'
        );
        return;
      }

      isLocating = true;
      locateBtn.disabled = true;
      locateBtn.classList.add('is-loading');
      closeSuggestions();
      showStatus('info', 'Finding your location...', 'Fetching your coordinates and matching a street address.');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const addr = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            selectAddress(addr);
          } catch (_) {
            showStatus(
              'error',
              'Could not match your exact street',
              'Please type your address in the search box above.'
            );
          } finally {
            isLocating = false;
            locateBtn.disabled = false;
            locateBtn.classList.remove('is-loading');
          }
        },
        (geoError) => {
          isLocating = false;
          locateBtn.disabled = false;
          locateBtn.classList.remove('is-loading');

          const msg =
            geoError && geoError.code === geoError.PERMISSION_DENIED
              ? 'Location permission was declined. You can type your address above instead.'
              : 'Unable to detect your position right now. Try typing your street above.';
          showStatus('error', 'Location unavailable', msg);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }

    input.addEventListener('input', () => {
      const value = input.value;
      updateClearVisibility();
      clearTimeout(debounceTimer);

      if (value.trim().length < MIN_QUERY_LENGTH) {
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
        closeSuggestions();
        return;
      }

      debounceTimer = setTimeout(() => {
        performLookup(value);
      }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        if (suggestions.length > 0) {
          e.preventDefault();
          setActiveOption(activeIndex + 1);
        }
      } else if (e.key === 'ArrowUp') {
        if (suggestions.length > 0) {
          e.preventDefault();
          setActiveOption(activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1);
        }
      } else if (e.key === 'Enter') {
        if (!listEl.hidden && suggestions.length > 0) {
          e.preventDefault();
          const chosen = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
          selectAddress(chosen);
        } else if (input.value.trim().length >= MIN_QUERY_LENGTH) {
          e.preventDefault();
          clearTimeout(debounceTimer);
          performLookup(input.value);
        }
      } else if (e.key === 'Escape') {
        if (!listEl.hidden) {
          e.preventDefault();
          closeSuggestions();
        }
      }
    });

    clearBtn.addEventListener('click', clearAddress);
    locateBtn.addEventListener('click', handleLocateClick);

    document.addEventListener('pointerdown', (e) => {
      if (!widget.contains(e.target)) {
        closeSuggestions();
      }
    });

    // Hydrate saved address on load
    if (selectedAddress) {
      input.value = selectedAddress.label;
      renderConfirmedAddress(selectedAddress);
    }
    updateClearVisibility();

    return {
      getAddress: () => selectedAddress,
      focusInput: () => {
        widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        input.select();
      },
      clear: clearAddress,
    };
  }

  ChopRoute.createAddressController = createAddressController;
})(window);
