import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  useMap,
  Marker,
  Polyline,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Custom SVG markers ────────────────────────────────────────────────────────
const makeIcon = (color, label) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 4px 14px rgba(0,0,0,0.9));
        cursor:grab;
      ">
        <div style="
          width:36px;height:36px;border-radius:50% 50% 50% 4px;
          transform:rotate(-45deg);
          background:${color};
          border:3px solid #fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 24px ${color}aa;
        ">
          <span style="transform:rotate(45deg);font-size:16px;font-weight:800;color:#000;">${label}</span>
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    tooltipAnchor: [0, -48],
  });

const pickupIcon = makeIcon("#f5c518", "A");
const dropoffIcon = makeIcon("#00d4ff", "B");

// ── Click handler component ───────────────────────────────────────────────────
function ClickHandler({ onMapClick, mode }) {
  const map = useMapEvents({
    click(e) {
      if ((mode === "picking_pickup" || mode === "picking_dropoff") && onMapClick && e?.latlng) {
        onMapClick(e.latlng);
      }
    },
  });

  // Change cursor class based on mode
  useEffect(() => {
    try {
      const container = map.getContainer();
      if (container) {
        container.classList.remove("picking-pickup", "picking-dropoff");
        if (mode === "picking_pickup") container.classList.add("picking-pickup");
        if (mode === "picking_dropoff") container.classList.add("picking-dropoff");
      }
    } catch (err) {
      console.warn("Cursor update error:", err);
    }
  }, [mode, map]);

  return null;
}

// ── Fly-to animator component ──────────────────────────────────────────────────
function MapFlyTo({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget && flyTarget.lat != null && flyTarget.lng != null && !isNaN(flyTarget.lat) && !isNaN(flyTarget.lng)) {
      try {
        map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 14, {
          animate: true,
          duration: 1.2,
        });
      } catch (err) {
        console.warn("MapFlyTo safe catch:", err);
      }
    }
  }, [flyTarget, map]);
  return null;
}

// ── Auto-fit map bounds to the route ───────────────────────────────────────────
function MapBoundsUpdater({ routeCoords, pickup, dropoff }) {
  const map = useMap();

  useEffect(() => {
    try {
      if (routeCoords && Array.isArray(routeCoords) && routeCoords.length > 1) {
        const bounds = L.latLngBounds(routeCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
        }
      } else if (
        pickup &&
        dropoff &&
        pickup.lat != null &&
        pickup.lng != null &&
        dropoff.lat != null &&
        dropoff.lng != null
      ) {
        const bounds = L.latLngBounds([
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ]);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
        }
      }
    } catch (err) {
      console.warn("MapBoundsUpdater safe catch:", err);
    }
  }, [routeCoords, pickup, dropoff, map]);

  return null;
}

// ── Polyline styles ───────────────────────────────────────────────────────────
const routeGlowStyle = {
  color: "#f5c518",
  weight: 8,
  opacity: 0.35,
  lineCap: "round",
  lineJoin: "round",
};

const routeSolidStyle = {
  color: "#f5c518",
  weight: 4.5,
  opacity: 0.98,
  lineCap: "round",
  lineJoin: "round",
};

// ── MapView ───────────────────────────────────────────────────────────────────
export default function MapView({
  pickup,
  dropoff,
  pickupAddress,
  dropoffAddress,
  routeCoords,
  mode,
  flyTarget,
  onMapClick,
  onMarkerDrag,
}) {
  // NYC default center coordinates
  const center = [40.7128, -74.006];

  const hasValidPickup = pickup && pickup.lat != null && pickup.lng != null && !isNaN(pickup.lat) && !isNaN(pickup.lng);
  const hasValidDropoff = dropoff && dropoff.lat != null && dropoff.lng != null && !isNaN(dropoff.lat) && !isNaN(dropoff.lng);

  const polylinePositions =
    routeCoords && Array.isArray(routeCoords) && routeCoords.length > 1
      ? routeCoords
      : hasValidPickup && hasValidDropoff
      ? [
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ]
      : null;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark map tiles — Stadia Maps Alidade Smooth Dark */}
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          maxZoom={20}
        />

        <ClickHandler onMapClick={onMapClick} mode={mode} />
        <MapFlyTo flyTarget={flyTarget} />
        <MapBoundsUpdater routeCoords={routeCoords} pickup={pickup} dropoff={dropoff} />

        {/* Pickup marker (Draggable) */}
        {hasValidPickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const latlng = e?.target?.getLatLng?.();
                if (latlng && onMarkerDrag) onMarkerDrag("pickup", latlng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#f5c518" }}>
                📍 Pickup: {pickupAddress || "Selected"}
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Dropoff marker (Draggable) */}
        {hasValidDropoff && (
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={dropoffIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const latlng = e?.target?.getLatLng?.();
                if (latlng && onMarkerDrag) onMarkerDrag("dropoff", latlng);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#00d4ff" }}>
                🏁 Dropoff: {dropoffAddress || "Selected"}
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Real Driving Route — layered solid + glow along street network */}
        {polylinePositions && polylinePositions.length > 0 && (
          <>
            <Polyline positions={polylinePositions} pathOptions={routeGlowStyle} />
            <Polyline positions={polylinePositions} pathOptions={routeSolidStyle} />
          </>
        )}
      </MapContainer>

      {/* Mode overlay hint */}
      {(mode === "picking_pickup" || mode === "picking_dropoff") && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          <div
            style={{
              background: "rgba(8,10,18,0.85)",
              border: "1px solid rgba(245,197,24,0.3)",
              borderRadius: "12px",
              padding: "10px 20px",
              backdropFilter: "blur(12px)",
              color: "#f5c518",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              boxShadow: "0 0 30px rgba(245,197,24,0.1)",
            }}
          >
            {mode === "picking_pickup" ? "📍 Click to set Pickup" : "🏁 Click to set Dropoff"}
          </div>
        </div>
      )}
    </div>
  );
}
