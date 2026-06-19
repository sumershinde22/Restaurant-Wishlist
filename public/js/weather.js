// Weather module: current conditions at a restaurant's coordinates via the
// Open-Meteo API (free, no API key). All points are fetched in one batched
// request to keep it light.
const WMO = [
  { codes: [0], icon: '☀️', label: 'Clear' },
  { codes: [1, 2, 3], icon: '⛅', label: 'Partly cloudy' },
  { codes: [45, 48], icon: '🌫️', label: 'Fog' },
  { codes: [51, 53, 55, 56, 57], icon: '🌦️', label: 'Drizzle' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], icon: '🌧️', label: 'Rain' },
  { codes: [71, 73, 75, 77, 85, 86], icon: '🌨️', label: 'Snow' },
  { codes: [95, 96, 99], icon: '⛈️', label: 'Thunderstorm' },
];

// Fetch current weather for many points at once. Returns an array aligned with
// `points`, each item { tempF, code } or null when unavailable.
export async function getWeather(points) {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat).join(',');
  const lons = points.map((p) => p.lon).join(',');
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lats}&longitude=${lons}` +
    '&current=temperature_2m,weather_code&temperature_unit=fahrenheit';

  const res = await fetch(url);
  if (!res.ok) return points.map(() => null);
  const data = await res.json();
  // Open-Meteo returns an array for multiple locations, an object for one.
  const list = Array.isArray(data) ? data : [data];
  return list.map((d) =>
    d && d.current
      ? {
          tempF: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
        }
      : null
  );
}

// Human-friendly one-liner, e.g. "☀️ 72°F · Clear".
export function weatherText({ tempF, code }) {
  const match = WMO.find((w) => w.codes.includes(code)) || {
    icon: '🌡️',
    label: 'Weather',
  };
  return `${match.icon} ${tempF}°F · ${match.label}`;
}
