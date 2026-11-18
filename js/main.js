const filters = document.querySelectorAll('[data-filter]');
const menuItems = document.querySelectorAll('[data-category]');

for (const button of filters) {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    for (const filter of filters) {
      filter.setAttribute('aria-pressed', String(filter === button));
    }
    for (const item of menuItems) {
      item.hidden = category !== 'all' && item.dataset.category !== category;
    }
  });
}
