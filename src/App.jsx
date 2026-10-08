import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import MapView from "./components/MapView";
import ControlPanel from "./components/ControlPanel";
import TripTicket from "./components/TripTicket";
import Toast from "./components/Toast";
import { predictFare } from "./api/predict";
import { fetchDrivingRoute, reverseGeocode } from "./utils/geo";

/**
 * App — Root Orchestrator
 * Integrates Leaflet map with OSRM street-following routing, Nominatim location search,
 * left control panel, and floating right-side trip summary ticket.
 */
export default function App() {
  const [pickup, setPickup]                 = useState(null); // { lat, lng }
  const [dropoff, setDropoff]               = useState(null); // { lat, lng }
  const [pickupAddress, setPickupAddress]   = useState(null); // human-readable address
  const [dropoffAddress, setDropoffAddress] = useState(null); // human-readable address
  const [routeCoords, setRouteCoords]       = useState(null); // array of [lat, lng]
  const [flyTarget, setFlyTarget]           = useState(null); // { lat, lng, zoom }
  const [mode, setMode]                     = useState("idle"); // idle | picking_pickup | picking_dropoff
  const [loading, setLoading]               = useState(false);
  const [result, setResult]                 = useState(null);  // API response
  const [distance, setDistance]             = useState(null); // driving miles
  const [toast, setToast]                   = useState(null);  // { message, type }
  const [confirmed, setConfirmed]           = useState(false);

  // ── Show a toast notification ─────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Execute full trip calculation (OSRM + FastAPI) ───────────────
  const calculateTrip = useCallback(
    async (p, d) => {
      if (!p || !d || p.lat == null || p.lng == null || d.lat == null || d.lng == null) return;
      setLoading(true);
      try {
        // 1. Fetch real road driving distance & coordinates directly from OSRM
        const routeData = await fetchDrivingRoute(p, d);
        const drivingDistance = routeData?.distance || 0;

        // Update state with actual road distance and route geometry
        setDistance(drivingDistance);
        setRouteCoords(routeData?.coordinates || []);

        // Verification log: Exact OSRM road distance in miles
        console.log("OSRM Actual Driving Distance (miles):", drivingDistance);

        // 2. Query FastAPI backend using the exact OSRM driving distance
        const data = await predictFare({
          trip_distance: drivingDistance,
          pickup_latitude: p.lat,
          pickup_longitude: p.lng,
          dropoff_latitude: d.lat,
          dropoff_longitude: d.lng,
        });
        setResult(data);
      } catch (err) {
        showToast(err.message || "Prediction failed. Please check your API.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  // ── Handle Address Selection via Search Autocomplete ──────────────
  const handleSelectAddress = useCallback(
    async (type, location) => {
      if (!location || location.lat == null || location.lng == null) return;
      setConfirmed(false);
      const coords = { lat: location.lat, lng: location.lng };
      setFlyTarget({ lat: location.lat, lng: location.lng, zoom: 15 });

      if (type === "pickup") {
        setPickup(coords);
        setPickupAddress(location.title || location.displayName || "Pickup Point");
        if (dropoff && dropoff.lat != null && dropoff.lng != null) {
          await calculateTrip(coords, dropoff);
        } else {
          showToast("📍 Pickup set! Now select or search your dropoff location.", "info");
        }
      } else if (type === "dropoff") {
        setDropoff(coords);
        setDropoffAddress(location.title || location.displayName || "Dropoff Point");
        if (pickup && pickup.lat != null && pickup.lng != null) {
          await calculateTrip(pickup, coords);
        } else {
          showToast("🏁 Dropoff set! Now select or search your pickup location.", "info");
        }
      }
    },
    [pickup, dropoff, calculateTrip, showToast]
  );

  // ── Handle Map Clicks for Point Selection ────────────────────────
  const handleMapClick = useCallback(
    async (latlng) => {
      if (!latlng || latlng.lat == null || latlng.lng == null) return;

      if (mode === "picking_pickup") {
        const newPickup = { lat: latlng.lat, lng: latlng.lng };
        setPickup(newPickup);
        setPickupAddress("Locating address…");
        setDropoff(null);
        setDropoffAddress(null);
        setRouteCoords(null);
        setResult(null);
        setDistance(null);
        setConfirmed(false);
        setMode("picking_dropoff");

        // Geocode pickup address in background
        reverseGeocode(latlng.lat, latlng.lng).then((addr) => setPickupAddress(addr));
      } else if (mode === "picking_dropoff") {
        const newDropoff = { lat: latlng.lat, lng: latlng.lng };
        setDropoff(newDropoff);
        setDropoffAddress("Locating address…");
        setMode("idle");

        // Geocode dropoff address in background
        reverseGeocode(latlng.lat, latlng.lng).then((addr) => setDropoffAddress(addr));

        if (pickup && pickup.lat != null && pickup.lng != null) {
          await calculateTrip(pickup, newDropoff);
        }
      }
    },
    [mode, pickup, calculateTrip]
  );

  // ── Handle Marker Drag Repositioning ──────────────────────────────
  const handleMarkerDrag = useCallback(
    async (type, latlng) => {
      if (!latlng || latlng.lat == null || latlng.lng == null) return;
      setConfirmed(false);
      if (type === "pickup") {
        const updatedPickup = { lat: latlng.lat, lng: latlng.lng };
        setPickup(updatedPickup);
        setPickupAddress("Locating address…");
        reverseGeocode(latlng.lat, latlng.lng).then((addr) => setPickupAddress(addr));

        if (dropoff && dropoff.lat != null && dropoff.lng != null) {
          await calculateTrip(updatedPickup, dropoff);
        }
      } else if (type === "dropoff") {
        const updatedDropoff = { lat: latlng.lat, lng: latlng.lng };
        setDropoff(updatedDropoff);
        setDropoffAddress("Locating address…");
        reverseGeocode(latlng.lat, latlng.lng).then((addr) => setDropoffAddress(addr));

        if (pickup && pickup.lat != null && pickup.lng != null) {
          await calculateTrip(pickup, updatedDropoff);
        }
      }
    },
    [pickup, dropoff, calculateTrip]
  );

  // ── UI Actions ────────────────────────────────────────────────────
  const startPickup = () => {
    reset();
    setMode("picking_pickup");
  };

  const reset = useCallback(() => {
    setPickup(null);
    setDropoff(null);
    setPickupAddress(null);
    setDropoffAddress(null);
    setRouteCoords(null);
    setResult(null);
    setDistance(null);
    setConfirmed(false);
    setMode("idle");
    setFlyTarget(null);
  }, []);

  const confirmRide = () => {
    setConfirmed(true);
    showToast("🚕 Driver has been dispatched to your pickup location!", "success");
  };

  // Safe cancel / reset handler
  const handleCancelTrip = useCallback(() => {
    reset();
    showToast("Trip cancelled. Map markers and route cleared.", "info");
  }, [reset, showToast]);

  const rePredict = async () => {
    if (pickup && dropoff) {
      await calculateTrip(pickup, dropoff);
      showToast("Trip estimate refreshed.", "info");
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Full-screen Leaflet map with real road routing and draggable markers */}
      <MapView
        pickup={pickup}
        dropoff={dropoff}
        pickupAddress={pickupAddress}
        dropoffAddress={dropoffAddress}
        routeCoords={routeCoords}
        mode={mode}
        flyTarget={flyTarget}
        onMapClick={handleMapClick}
        onMarkerDrag={handleMarkerDrag}
      />

      {/* Floating control panel — Left side */}
      <ControlPanel
        pickup={pickup}
        dropoff={dropoff}
        pickupAddress={pickupAddress}
        dropoffAddress={dropoffAddress}
        mode={mode}
        distance={distance}
        loading={loading}
        result={result}
        onStart={startPickup}
        onReset={handleCancelTrip}
        onRePredict={rePredict}
        onSelectAddress={handleSelectAddress}
      />

      {/* Floating Trip Summary Ticket — Right side (No backdrop, map remains fully visible) */}
      <AnimatePresence>
        {(result || loading || (pickup && dropoff)) && (
          <TripTicket
            result={result}
            distance={distance}
            pickup={pickup}
            dropoff={dropoff}
            pickupAddress={pickupAddress}
            dropoffAddress={dropoffAddress}
            loading={loading}
            onConfirm={confirmRide}
            onCancel={handleCancelTrip}
            confirmed={confirmed}
          />
        )}
      </AnimatePresence>

      {/* Floating toast notifications */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
