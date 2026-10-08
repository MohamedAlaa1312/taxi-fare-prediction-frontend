/**
 * In-memory geocode cache to prevent redundant Nominatim API queries.
 */
const geocodeCache = new Map();

/**
 * Reverse geocode a latitude/longitude pair using Nominatim API (OpenStreetMap).
 * Formats into a clean neighborhood / street string (e.g., "Manhattan, 5th Ave").
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return null;

  const numLat = Number(lat);
  const numLng = Number(lng);
  const cacheKey = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Geocoding HTTP status ${res.status}`);
    const data = await res.json();

    if (data && data.address) {
      const addr = data.address;
      const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path;
      const houseNumber = addr.house_number ? `${addr.house_number} ` : "";
      const landmark = addr.amenity || addr.building || addr.tourism || addr.historic || addr.leisure || addr.shop;
      const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district;
      const borough = addr.borough || addr.suburb || addr.county || addr.city;

      const primary = landmark || (road ? `${houseNumber}${road}` : "");
      const secondary = neighborhood || borough || "New York";

      let formatted = "";
      if (primary && secondary && primary.toLowerCase() !== secondary.toLowerCase()) {
        formatted = `${primary}, ${secondary}`;
      } else if (primary) {
        formatted = primary;
      } else if (secondary) {
        formatted = secondary;
      } else if (data.display_name) {
        formatted = data.display_name.split(",").slice(0, 2).join(",").trim();
      }

      if (formatted) {
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (err) {
    console.warn("Reverse geocoding error:", err);
  }

  // Graceful fallback with formatted truncated 4-decimal coordinates
  const fallback = formatCoordinates(numLat, numLng, 4);
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Search locations and addresses using Nominatim OpenStreetMap API.
 * Returns an array of formatted suggestions { lat, lng, displayName, title, subtitle }.
 */
export async function searchLocations(query) {
  if (!query || typeof query !== "string" || query.trim().length < 2) return [];

  const cleanQuery = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${cleanQuery}&limit=5&addressdetails=1&countrycodes=us&viewbox=-74.25909,40.917577,-73.700272,40.477399`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`Search error ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const addr = item.address || {};
      const road = addr.road || addr.pedestrian || addr.street;
      const houseNumber = addr.house_number ? `${addr.house_number} ` : "";
      const landmark = addr.amenity || addr.building || addr.tourism || addr.historic || addr.shop;
      const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district;
      const borough = addr.borough || addr.suburb || addr.county || addr.city;

      const title = landmark || (road ? `${houseNumber}${road}` : item.name || item.display_name?.split(",")[0] || "Location");
      const subtitle = neighborhood || borough || item.display_name?.split(",").slice(1, 3).join(",").trim() || "";

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: `${title}${subtitle ? `, ${subtitle}` : ""}`,
        title,
        subtitle,
      };
    });
  } catch (err) {
    console.warn("Location search error:", err);
    return [];
  }
}

/**
 * Format coordinates to a clean truncated 4-decimal string (e.g. "40.7589° N, 73.9851° W").
 */
export function formatCoordinates(lat, lng, decimals = 4) {
  if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return "—";
  const numLat = Number(lat);
  const numLng = Number(lng);
  const latStr = `${Math.abs(numLat).toFixed(decimals)}° ${numLat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(numLng).toFixed(decimals)}° ${numLng >= 0 ? "E" : "W"}`;
  return `${latStr}, ${lngStr}`;
}

/**
 * Haversine distance between two lat/lng points, returned in miles.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;
  const R = 3958.8; // Earth radius in miles
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch actual driving route from OSRM public routing machine API.
 * 1. Extracts real road distance directly from response data.routes[0].distance (in meters).
 * 2. Converts distance from meters to miles (meters / 1609.344).
 * 3. Returns road network coordinates [lat, lng] for Leaflet polyline.
 */
export async function fetchDrivingRoute(pickup, dropoff) {
  if (!pickup || !dropoff || pickup.lat == null || pickup.lng == null || dropoff.lat == null || dropoff.lng == null) {
    return { distance: 0, coordinates: [], rawDistanceMeters: 0, osrmDurationMinutes: null };
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP status ${res.status}`);
    const data = await res.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const rawDistanceMeters = route.distance; // OSRM distance in meters
      const distanceInMiles = rawDistanceMeters / 1609.344; // Exact meters to miles conversion
      // GeoJSON is [lng, lat], convert to Leaflet's [lat, lng]
      const coordinates = route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];
      return {
        distance: distanceInMiles,
        rawDistanceMeters,
        coordinates,
        osrmDurationMinutes: route.duration ? route.duration / 60 : null,
      };
    }
  } catch (err) {
    console.warn("OSRM routing API error, falling back to straight-line:", err);
  }

  // Fallback to straight line if network/service fails
  const fallbackDist = haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  return {
    distance: fallbackDist,
    rawDistanceMeters: null,
    coordinates: [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ],
    osrmDurationMinutes: null,
  };
}

/**
 * Format user-facing timestamp down to the exact minute using JavaScript's native Date object.
 * e.g., "Monday, August 31, 2026 — 01:37 AM"
 */
export function formatTripDate() {
  const now = new Date();
  const dayName = now.toLocaleString("en-US", { weekday: "long" });
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const day = now.getDate();
  const year = now.getFullYear();

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dayName}, ${monthName} ${day}, ${year} — ${timeStr}`;
}
