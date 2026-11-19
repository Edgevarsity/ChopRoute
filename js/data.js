(function (global) {
  'use strict';

  const ChopRoute = (global.ChopRoute = global.ChopRoute || {});

  const MENU_ITEMS = [
    {
      id: 'smoky-jollof',
      name: 'Smoky jollof bowl',
      category: 'meals',
      categoryLabel: 'Meals',
      vendor: 'Buka Kitchen',
      description: 'Firewood-style party jollof served with grilled chicken thigh and caramelized sweet plantain.',
      price: 4500,
      prepMin: 20,
      tag: 'Popular',
    },
    {
      id: 'grilled-tilapia',
      name: 'Grilled tilapia & yam',
      category: 'meals',
      categoryLabel: 'Meals',
      vendor: 'Harbour Grill',
      description: 'Whole herb-marinated tilapia over roasted yam wedges with pepper-onion sauce.',
      price: 6200,
      prepMin: 25,
      tag: 'Spicy',
    },
    {
      id: 'ofada-ayamase',
      name: 'Ofada rice & ayamase',
      category: 'meals',
      categoryLabel: 'Meals',
      vendor: 'Buka Kitchen',
      description: 'Aromatic local brown rice paired with slow-simmered green pepper stew and assorted beef.',
      price: 5400,
      prepMin: 22,
      tag: null,
    },
    {
      id: 'crunchy-suya',
      name: 'Crunchy suya bites',
      category: 'snacks',
      categoryLabel: 'Snacks',
      vendor: 'Mallam Spot',
      description: 'Char-grilled beef skewers coated in toasted yaji peanut spice with crisp red onions.',
      price: 2800,
      prepMin: 15,
      tag: 'Spicy',
    },
    {
      id: 'puff-puff-box',
      name: 'Warm puff-puff box',
      category: 'snacks',
      categoryLabel: 'Snacks',
      vendor: 'Corner Bakehouse',
      description: 'Ten golden, pillowy dough bites lightly dusted with nutmeg sugar, packed warm.',
      price: 1800,
      prepMin: 12,
      tag: 'Sweet',
    },
    {
      id: 'meat-pie-duo',
      name: 'Spiced meat pie duo',
      category: 'snacks',
      categoryLabel: 'Snacks',
      vendor: 'Corner Bakehouse',
      description: 'Two flaky shortcrust pastries filled with savory minced beef, diced potato, and carrots.',
      price: 2200,
      prepMin: 10,
      tag: null,
    },
    {
      id: 'fruit-basket',
      name: 'Market fruit basket',
      category: 'groceries',
      categoryLabel: 'Groceries',
      vendor: 'GreenCrate Market',
      description: 'Hand-picked ripe bananas, sweet oranges, and a whole sugarloaf pineapple.',
      price: 5500,
      prepMin: 15,
      tag: 'Fresh',
    },
    {
      id: 'greens-bundle',
      name: 'Fresh greens bundle',
      category: 'groceries',
      categoryLabel: 'Groceries',
      vendor: 'GreenCrate Market',
      description: 'Washed ugu leaves, scent leaf, red bell peppers, and ripe Roma tomatoes for home cooking.',
      price: 3200,
      prepMin: 15,
      tag: 'Fresh',
    },
    {
      id: 'pantry-spice-pack',
      name: 'Pantry spice & oil pack',
      category: 'groceries',
      categoryLabel: 'Groceries',
      vendor: 'GreenCrate Market',
      description: 'Cold-pressed palm oil (500ml), roasted crayfish powder, and dry pepper blend.',
      price: 4800,
      prepMin: 15,
      tag: null,
    },
  ];

  // Sample ChopRoute dispatch hubs used to compute real geodesic distance when nearby
  const DISPATCH_HUBS = [
    { name: 'Victoria Island Hub', lat: 6.4281, lon: 3.4219 },
    { name: 'Lekki Phase 1 Hub', lat: 6.4478, lon: 3.4723 },
    { name: 'Ikeja GRA Hub', lat: 6.5833, lon: 3.3500 },
    { name: 'Yaba Hub', lat: 6.5095, lon: 3.3711 },
    { name: 'Abuja Wuse Hub', lat: 9.0765, lon: 7.4760 },
  ];

  const DEFAULT_DELIVERY_FEE = 1200;

  function formatPrice(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
  }

  function toRadians(deg) {
    return (deg * Math.PI) / 180;
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  function getDeliveryEstimate(address) {
    if (!address || typeof address.lat !== 'number' || typeof address.lon !== 'number') {
      return {
        fee: DEFAULT_DELIVERY_FEE,
        etaText: '20–30 min',
        distanceText: null,
        hubName: null,
      };
    }

    let nearest = null;
    for (const hub of DISPATCH_HUBS) {
      const km = haversineKm(address.lat, address.lon, hub.lat, hub.lon);
      if (!nearest || km < nearest.km) {
        nearest = { hub, km };
      }
    }

    if (nearest && nearest.km <= 25) {
      const roundedKm = Math.max(0.5, Math.round(nearest.km * 10) / 10);
      const minEta = Math.round(14 + roundedKm * 2.2);
      const maxEta = minEta + 10;
      const fee = Math.min(2000, Math.max(800, Math.round((800 + roundedKm * 90) / 100) * 100));
      return {
        fee,
        etaText: minEta + '–' + maxEta + ' min',
        distanceText: roundedKm.toFixed(1) + ' km from ' + nearest.hub.name,
        hubName: nearest.hub.name,
      };
    }

    return {
      fee: DEFAULT_DELIVERY_FEE,
      etaText: '25–35 min',
      distanceText: 'Estimated via local partner kitchen',
      hubName: null,
    };
  }

  function getItemById(id) {
    return MENU_ITEMS.find((item) => item.id === id) || null;
  }

  ChopRoute.MENU_ITEMS = MENU_ITEMS;
  ChopRoute.DEFAULT_DELIVERY_FEE = DEFAULT_DELIVERY_FEE;
  ChopRoute.formatPrice = formatPrice;
  ChopRoute.getDeliveryEstimate = getDeliveryEstimate;
  ChopRoute.getItemById = getItemById;
})(window);
