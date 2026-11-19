(function (global) {
  'use strict';

  const ChopRoute = (global.ChopRoute = global.ChopRoute || {});

  const STORAGE_KEY = 'choproute_bag_v1';

  function loadSavedBag() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};

      const clean = {};
      for (const [id, qty] of Object.entries(parsed)) {
        if (ChopRoute.getItemById(id) && Number.isInteger(qty) && qty > 0) {
          clean[id] = qty;
        }
      }
      return clean;
    } catch (_) {
      return {};
    }
  }

  function saveBag(bag) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
    } catch (_) {
      // Ignore storage failures
    }
  }

  function createCartController(options) {
    const getAddress = typeof options.getAddress === 'function' ? options.getAddress : () => null;
    const onRequestAddress = typeof options.onRequestAddress === 'function' ? options.onRequestAddress : () => {};
    const onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    const onAnnounce = typeof options.onAnnounce === 'function' ? options.onAnnounce : () => {};

    const overlay = document.getElementById('bag-overlay');
    const drawer = document.getElementById('bag-drawer');
    const toggleBtn = document.getElementById('bag-toggle');
    const closeBtn = document.getElementById('bag-close');
    const badgeEl = document.getElementById('bag-count');
    const drawerAddressEl = document.getElementById('drawer-address');
    const itemsEl = document.getElementById('bag-items');
    const confirmationEl = document.getElementById('order-confirmation');
    const footerEl = document.getElementById('bag-footer');
    const subtotalEl = document.getElementById('summary-subtotal');
    const deliveryEl = document.getElementById('summary-delivery');
    const totalEl = document.getElementById('summary-total');
    const warningEl = document.getElementById('checkout-warning');
    const placeOrderBtn = document.getElementById('place-order-btn');

    let bag = loadSavedBag();
    let isOpen = false;
    let activeOrder = null;
    let trackerTimers = [];

    function clearTrackerTimers() {
      trackerTimers.forEach((id) => clearTimeout(id));
      trackerTimers = [];
    }

    function getQuantity(id) {
      return bag[id] || 0;
    }

    function getCount() {
      return Object.values(bag).reduce((sum, n) => sum + n, 0);
    }

    function getSubtotal() {
      return Object.entries(bag).reduce((sum, [id, qty]) => {
        const item = ChopRoute.getItemById(id);
        return item ? sum + item.price * qty : sum;
      }, 0);
    }

    function updateBadge() {
      const count = getCount();
      badgeEl.textContent = String(count);
      badgeEl.classList.toggle('is-nonzero', count > 0);
      toggleBtn.setAttribute('aria-label', 'Open bag, ' + count + (count === 1 ? ' item' : ' items'));
    }

    function setItemQuantity(id, qty) {
      const item = ChopRoute.getItemById(id);
      if (!item) return;

      activeOrder = null;
      clearTrackerTimers();

      if (qty <= 0) {
        delete bag[id];
      } else {
        bag[id] = Math.min(99, qty);
      }

      saveBag(bag);
      updateBadge();
      if (isOpen) renderDrawer();
      onChange();
    }

    function add(id) {
      const item = ChopRoute.getItemById(id);
      if (!item) return;
      setItemQuantity(id, getQuantity(id) + 1);
      onAnnounce('Added ' + item.name + ' to your bag');
    }

    function increment(id) {
      setItemQuantity(id, getQuantity(id) + 1);
    }

    function decrement(id) {
      const item = ChopRoute.getItemById(id);
      const next = getQuantity(id) - 1;
      setItemQuantity(id, next);
      if (item && next <= 0) {
        onAnnounce('Removed ' + item.name + ' from your bag');
      }
    }

    function renderDrawerAddress() {
      drawerAddressEl.textContent = '';
      const addr = getAddress();
      const estimate = ChopRoute.getDeliveryEstimate(addr);

      const copy = document.createElement('div');
      copy.className = 'drawer-address-copy';

      const label = document.createElement('span');
      label.className = 'drawer-address-label';
      label.textContent = addr ? 'Delivering to' : 'Delivery address';
      copy.appendChild(label);

      const value = document.createElement('strong');
      value.textContent = addr ? addr.shortLabel : 'Not set yet';
      copy.appendChild(value);

      if (addr) {
        const meta = document.createElement('span');
        meta.className = 'drawer-address-meta';
        meta.textContent = 'Est. ' + estimate.etaText + ' · ' + ChopRoute.formatPrice(estimate.fee);
        copy.appendChild(meta);
      }

      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'link-btn';
      action.textContent = addr ? 'Change' : 'Set address';
      action.addEventListener('click', () => {
        close();
        onRequestAddress();
      });

      drawerAddressEl.appendChild(copy);
      drawerAddressEl.appendChild(action);
    }

    function renderConfirmation() {
      confirmationEl.textContent = '';
      if (!activeOrder) {
        confirmationEl.hidden = true;
        return;
      }

      confirmationEl.hidden = false;

      const badge = document.createElement('p');
      badge.className = 'order-badge';
      badge.textContent = 'Demo order ' + activeOrder.code;

      const title = document.createElement('h3');
      title.textContent = 'Your order is on the route';

      const summary = document.createElement('p');
      summary.className = 'order-meta';
      summary.textContent =
        activeOrder.itemCount +
        (activeOrder.itemCount === 1 ? ' item' : ' items') +
        ' · ' +
        ChopRoute.formatPrice(activeOrder.total) +
        ' · Est. ' +
        activeOrder.etaText;

      const dest = document.createElement('p');
      dest.className = 'order-dest';
      dest.textContent = 'Drop-off: ' + activeOrder.addressLabel;

      const stages = ['Order received', 'Kitchen preparing', 'Rider on the way'];
      const list = document.createElement('ol');
      list.className = 'tracker';

      stages.forEach((stageText, idx) => {
        const li = document.createElement('li');
        li.className = 'tracker-step';
        if (idx <= activeOrder.stage) li.classList.add('is-done');
        if (idx === activeOrder.stage) li.classList.add('is-current');
        li.textContent = stageText;
        list.appendChild(li);
      });

      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn-secondary btn-full';
      resetBtn.textContent = 'Start a new order';
      resetBtn.addEventListener('click', () => {
        activeOrder = null;
        clearTrackerTimers();
        renderDrawer();
      });

      confirmationEl.appendChild(badge);
      confirmationEl.appendChild(title);
      confirmationEl.appendChild(summary);
      confirmationEl.appendChild(dest);
      confirmationEl.appendChild(list);
      confirmationEl.appendChild(resetBtn);
    }

    function renderDrawer() {
      renderDrawerAddress();
      warningEl.hidden = true;
      warningEl.textContent = '';

      if (activeOrder) {
        itemsEl.hidden = true;
        footerEl.hidden = true;
        renderConfirmation();
        return;
      }

      confirmationEl.hidden = true;
      itemsEl.hidden = false;
      itemsEl.textContent = '';

      const entries = Object.entries(bag);
      if (entries.length === 0) {
        footerEl.hidden = true;
        const empty = document.createElement('div');
        empty.className = 'bag-empty';

        const p = document.createElement('p');
        p.textContent = 'Your bag is empty. Add a meal, snack, or grocery item from the menu to get started.';
        empty.appendChild(p);

        const browseBtn = document.createElement('button');
        browseBtn.type = 'button';
        browseBtn.className = 'btn-secondary';
        browseBtn.textContent = 'Explore menu';
        browseBtn.addEventListener('click', () => {
          close();
          const browse = document.getElementById('browse');
          if (browse) browse.scrollIntoView({ behavior: 'smooth' });
        });
        empty.appendChild(browseBtn);
        itemsEl.appendChild(empty);
        return;
      }

      for (const [id, qty] of entries) {
        const item = ChopRoute.getItemById(id);
        if (!item) continue;

        const row = document.createElement('div');
        row.className = 'bag-row';

        const info = document.createElement('div');
        info.className = 'bag-row-info';

        const name = document.createElement('strong');
        name.textContent = item.name;
        info.appendChild(name);

        const sub = document.createElement('span');
        sub.textContent = item.vendor + ' · ' + ChopRoute.formatPrice(item.price * qty);
        info.appendChild(sub);

        const stepper = document.createElement('div');
        stepper.className = 'stepper';

        const decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.textContent = '−';
        decBtn.setAttribute('aria-label', 'Decrease quantity of ' + item.name);
        decBtn.addEventListener('click', () => decrement(id));

        const qtySpan = document.createElement('span');
        qtySpan.className = 'stepper-qty';
        qtySpan.textContent = String(qty);

        const incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.textContent = '+';
        incBtn.setAttribute('aria-label', 'Increase quantity of ' + item.name);
        incBtn.addEventListener('click', () => increment(id));

        stepper.appendChild(decBtn);
        stepper.appendChild(qtySpan);
        stepper.appendChild(incBtn);

        row.appendChild(info);
        row.appendChild(stepper);
        itemsEl.appendChild(row);
      }

      const estimate = ChopRoute.getDeliveryEstimate(getAddress());
      const subtotal = getSubtotal();
      const total = subtotal + estimate.fee;

      subtotalEl.textContent = ChopRoute.formatPrice(subtotal);
      deliveryEl.textContent = ChopRoute.formatPrice(estimate.fee);
      totalEl.textContent = ChopRoute.formatPrice(total);
      footerEl.hidden = false;
    }

    function placeOrder() {
      const addr = getAddress();
      if (!addr) {
        warningEl.textContent = 'Add your delivery address above before placing your demo order.';
        warningEl.hidden = false;
        onAnnounce('Please set a delivery address before placing your order');
        return;
      }

      const count = getCount();
      if (count === 0) return;

      const estimate = ChopRoute.getDeliveryEstimate(addr);
      const total = getSubtotal() + estimate.fee;
      const code = '#CR-' + Math.floor(1000 + Math.random() * 9000);

      activeOrder = {
        code,
        itemCount: count,
        total,
        etaText: estimate.etaText,
        addressLabel: addr.label,
        stage: 0,
      };

      bag = {};
      saveBag(bag);
      updateBadge();
      onChange();
      renderDrawer();
      onAnnounce('Demo order ' + code + ' placed for ' + addr.shortLabel);

      clearTrackerTimers();
      trackerTimers.push(
        setTimeout(() => {
          if (!activeOrder) return;
          activeOrder.stage = 1;
          if (isOpen) renderConfirmation();
        }, 2500)
      );
      trackerTimers.push(
        setTimeout(() => {
          if (!activeOrder) return;
          activeOrder.stage = 2;
          if (isOpen) renderConfirmation();
        }, 6000)
      );
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      document.body.classList.add('drawer-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      renderDrawer();
      closeBtn.focus();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        if (!isOpen) overlay.hidden = true;
      }, 220);
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target && e.target.hasAttribute('data-close-drawer')) {
        close();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    });
    placeOrderBtn.addEventListener('click', placeOrder);

    updateBadge();

    return {
      add,
      increment,
      decrement,
      getQuantity,
      getCount,
      open,
      close,
      refresh: () => {
        if (isOpen) renderDrawer();
      },
    };
  }

  ChopRoute.createCartController = createCartController;
})(window);
