// Places module: type-ahead restaurant search via OpenStreetMap's Photon API
// (free, no API key). On selection it hands back the name, formatted address,
// coordinates, and OSM category so the add form can autofill + store map data.
const PHOTON = 'https://photon.komoot.io/api/';
const FOOD_TAGS = ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'bakery'];

// Build a single-line address from Photon's address components.
function formatAddress(p) {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  return [street, p.city, p.state, p.postcode, p.country]
    .filter(Boolean)
    .join(', ');
}

async function search(query) {
  const tags = FOOD_TAGS.map((t) => `osm_tag=amenity:${t}`).join('&');
  const url = `${PHOTON}?q=${encodeURIComponent(query)}&limit=6&lang=en&${tags}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.features.map((feature) => {
    const p = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    return {
      name: p.name || p.street || 'Unnamed place',
      address: formatAddress(p),
      category: p.osm_value || '',
      lat,
      lon,
    };
  });
}

// Attach a type-ahead dropdown to an input. onSelect(place) fires on choose.
export function attachPlaceSearch(input, dropdown, onSelect) {
  let timer = null;
  let activeIndex = -1;
  let results = [];

  function close() {
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
    activeIndex = -1;
    results = [];
  }

  function render() {
    dropdown.innerHTML = '';
    results.forEach((place, i) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className =
        'place-option' + (i === activeIndex ? ' is-active' : '');

      const name = document.createElement('span');
      name.className = 'place-name';
      name.textContent = place.name;

      const address = document.createElement('span');
      address.className = 'place-address';
      address.textContent = place.address;

      option.append(name, address);
      // mousedown (not click) so selection happens before the input blurs.
      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        onSelect(place);
        close();
      });
      dropdown.appendChild(option);
    });
    dropdown.classList.toggle('hidden', results.length === 0);
  }

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearTimeout(timer);
    if (query.length < 3) {
      close();
      return;
    }
    timer = setTimeout(async () => {
      try {
        results = await search(query);
        activeIndex = -1;
        render();
      } catch {
        close();
      }
    }, 300);
  });

  input.addEventListener('keydown', (event) => {
    if (dropdown.classList.contains('hidden')) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
      render();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      render();
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      onSelect(results[activeIndex]);
      close();
    } else if (event.key === 'Escape') {
      close();
    }
  });

  // Close shortly after blur so a click on an option still registers.
  input.addEventListener('blur', () => setTimeout(close, 150));
}
