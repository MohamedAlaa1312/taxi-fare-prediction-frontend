const RAW_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/predict";
const API_URL = RAW_API_URL.endsWith("/predict") ? RAW_API_URL : `${RAW_API_URL.replace(/\/+$/, '')}/predict`;
const API_KEY = import.meta.env.VITE_API_KEY || "mohamed_alaa_secret_key_2026";

/**
 * POST to the FastAPI prediction endpoint.
 * @param {Object} payload - { trip_distance, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude }
 * @returns {Promise<Object>} API response body
 */
export async function predictFare(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(`API Error: ${detail}`);
  }

  return response.json();
}
