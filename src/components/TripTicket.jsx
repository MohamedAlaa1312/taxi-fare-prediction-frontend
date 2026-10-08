import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTripDate, formatCoordinates } from "../utils/geo";

/**
 * Collapsible Right-Side Sliding Drawer for Trip Summary.
 * Features:
 * - Fixed full-height side panel (`fixed top-0 right-0 h-full w-[380px] z-50`)
 * - Floating edge toggle tab (‹ / ›) on the left border to collapse/expand anytime
 * - Smooth Framer Motion sliding transition (`x: "100%"` <-> `x: 0`)
 * - No dark backdrop overlay (map remains 100% unobstructed and interactive)
 * - Complete summary metrics, OSRM driving distance, and Confirm/Cancel action buttons
 */
export default function TripTicket({
  result,
  distance,
  pickup,
  dropoff,
  pickupAddress,
  dropoffAddress,
  loading = false,
  onConfirm,
  onCancel,
  confirmed = false,
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Automatically open the drawer when a new trip prediction is calculated
  useEffect(() => {
    if (result || loading) {
      setIsOpen(true);
    }
  }, [result, loading]);

  const predictedFare = result?.predicted_fare_dollars;
  const predictedDuration = result?.predicted_duration_minutes;
  const tripDate = formatTripDate();
  const durationMin =
    predictedDuration != null && !isNaN(Number(predictedDuration))
      ? Math.round(Number(predictedDuration))
      : null;
  const fareStr =
    predictedFare != null && !isNaN(Number(predictedFare))
      ? Number(predictedFare).toFixed(2)
      : null;

  return (
    <motion.div
      key="trip-drawer-container"
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "390px",
        maxWidth: "92vw",
        zIndex: 50,
        pointerEvents: "auto",
        display: "flex",
      }}
    >
      {/* ── Floating Edge Toggle Tab ──────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.06, background: "rgba(12, 16, 32, 0.98)" }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "absolute",
          top: "50%",
          left: "-42px",
          transform: "translateY(-50%)",
          width: "42px",
          height: "90px",
          borderTopLeftRadius: "16px",
          borderBottomLeftRadius: "16px",
          borderTop: "1px solid rgba(245,197,24,0.35)",
          borderLeft: "1px solid rgba(245,197,24,0.35)",
          borderBottom: "1px solid rgba(245,197,24,0.35)",
          borderRight: "none",
          background: "rgba(8, 10, 22, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          color: "#f5c518",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          boxShadow: "-8px 0 25px rgba(0,0,0,0.6), 0 0 15px rgba(245,197,24,0.15)",
          zIndex: 60,
        }}
        title={isOpen ? "Collapse Trip Summary" : "Expand Trip Summary"}
      >
        <span style={{ fontSize: "16px", fontWeight: 800 }}>
          {isOpen ? "›" : "‹"}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: "rgba(226,232,240,0.85)",
            fontFamily: "Space Grotesk, sans-serif",
          }}
        >
          {isOpen ? "HIDE" : "SUMMARY"}
        </span>
      </motion.button>

      {/* ── Main Drawer Panel ─────────────────────────────────────── */}
      <div
        className="panel-noise"
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(8, 10, 22, 0.96)",
          borderLeft: "1px solid rgba(245,197,24,0.28)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.75), 0 0 80px rgba(245,197,24,0.06)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* ── Header Strip ─────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,197,24,0.16), rgba(245,197,24,0.02))",
            borderBottom: "1px solid rgba(245,197,24,0.15)",
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f5c518, #c99b00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 0 20px rgba(245,197,24,0.4)",
              }}
              animate={confirmed ? {} : { rotate: [0, -6, 6, 0] }}
              transition={{ repeat: confirmed ? 0 : Infinity, duration: 2.2, ease: "easeInOut" }}
            >
              🚕
            </motion.div>
            <div>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: "17px",
                  color: "#fff",
                }}
              >
                {confirmed ? "Ride Confirmed!" : "Trip Summary"}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(245,197,24,0.7)", marginTop: 2 }}>
                {confirmed ? "Driver dispatched 🎉" : "AI Fare & Duration Prediction"}
              </div>
            </div>
          </div>

          {/* Quick Collapse Button */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,197,24,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            title="Collapse drawer"
          >
            ›
          </button>
        </div>

        {/* ── Scrollable Body Content ───────────────────────────────── */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            flex: 1,
          }}
        >
          {/* Exact Minute Timestamp Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: "16px" }}>📅</span>
            <div>
              <div
                style={{
                  fontSize: "9.5px",
                  color: "rgba(160,170,200,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Estimated Pickup Time (Exact)
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "rgba(226,232,240,0.95)",
                  marginTop: 2,
                }}
              >
                {tripDate}
              </div>
            </div>
          </div>

          {/* Fare & Duration Metrics with Shimmer Skeleton Loaders */}
          <div style={{ display: "flex", gap: "10px" }}>
            <MetricCard
              icon="💵"
              label="Estimated Fare"
              value={fareStr ? `$${fareStr}` : null}
              accent="#f5c518"
              glow="rgba(245,197,24,0.15)"
              loading={loading || !fareStr}
            />
            <MetricCard
              icon="⏱"
              label="Estimated Duration"
              value={durationMin != null ? `${durationMin} min` : null}
              accent="#00d4ff"
              glow="rgba(0,212,255,0.15)"
              loading={loading || durationMin == null}
            />
          </div>

          {/* Route & Geocoded Address Details */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Pickup Stop */}
            <RouteStop
              color="#f5c518"
              label="A"
              title="Pickup Location"
              address={pickupAddress || "Locating street…"}
              coords={pickup}
            />

            {/* Connecting visual track */}
            <div style={{ display: "flex", paddingLeft: "13px", margin: "4px 0" }}>
              <div
                style={{
                  width: "2px",
                  height: "22px",
                  background:
                    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)",
                }}
              />
            </div>

            {/* Dropoff Stop */}
            <RouteStop
              color="#00d4ff"
              label="B"
              title="Dropoff Location"
              address={dropoffAddress || "Locating street…"}
              coords={dropoff}
            />

            {/* Emphasized OSRM Driving Distance */}
            <div
              style={{
                marginTop: "14px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "rgba(245,197,24,0.85)",
                  }}
                >
                  OSRM Driving Distance
                </span>
                <div style={{ fontSize: "10px", color: "rgba(160,170,200,0.5)" }}>
                  Actual road network route
                </div>
              </div>

              {loading && distance == null ? (
                <div
                  className="skeleton-shimmer"
                  style={{ width: 68, height: 22, borderRadius: 6 }}
                />
              ) : (
                <span
                  className="gradient-text-yellow"
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 800,
                    fontSize: "18px",
                    letterSpacing: "-0.01em",
                    textShadow: "0 0 14px rgba(245,197,24,0.4)",
                  }}
                >
                  {distance != null && !isNaN(Number(distance))
                    ? `${Number(distance).toFixed(2)} mi`
                    : "—"}
                </span>
              )}
            </div>
          </div>

          {/* Ticket Dashes Divider */}
          <div
            style={{
              height: "1px",
              background:
                "repeating-linear-gradient(to right, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 6px, transparent 6px, transparent 12px)",
              margin: "2px 0",
            }}
          />

          {/* ── Button Group: Primary "Confirm Ride" & Secondary "Cancel" ─ */}
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            {!confirmed ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Primary Button ("Confirm Ride") */}
                <motion.button
                  whileHover={
                    !loading
                      ? {
                          scale: 1.02,
                          boxShadow: "0 0 35px rgba(245,197,24,0.55), 0 8px 25px rgba(0,0,0,0.6)",
                        }
                      : {}
                  }
                  whileTap={!loading ? { scale: 0.97 } : {}}
                  onClick={onConfirm}
                  disabled={loading}
                  style={{
                    flex: "1 1 auto",
                    padding: "15px 20px",
                    borderRadius: "14px",
                    border: "none",
                    background: loading
                      ? "rgba(245,197,24,0.25)"
                      : "linear-gradient(135deg, #f5c518 0%, #e0aa00 50%, #c99b00 100%)",
                    color: loading ? "rgba(255,255,255,0.4)" : "#000",
                    fontWeight: 800,
                    fontSize: "14.5px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "Space Grotesk, sans-serif",
                    letterSpacing: "0.03em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 20px rgba(245,197,24,0.3)",
                  }}
                >
                  <span>🚕</span> Confirm Ride
                </motion.button>

                {/* Secondary Outline / Ghost Button ("Cancel") */}
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    background: "rgba(239,68,68,0.15)",
                    borderColor: "rgba(239,68,68,0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  style={{
                    flex: "0 0 auto",
                    padding: "15px 18px",
                    borderRadius: "14px",
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "rgba(239,68,68,0.06)",
                    color: "rgba(239,68,68,0.9)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "Space Grotesk, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  <span>✕</span> Cancel
                </motion.button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                {/* Confirmed State Banner */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <motion.span
                    style={{ fontSize: "28px" }}
                    animate={{ rotate: [0, 12, -12, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                  >
                    🚕
                  </motion.span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#10b981" }}>
                      Ride Confirmed! Driver is on the way.
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(160,200,180,0.7)", marginTop: 2 }}>
                      Estimated Arrival: {durationMin || "—"} minutes
                    </div>
                  </div>
                </div>

                {/* Reset / Start New Trip Button */}
                <motion.button
                  whileHover={{ scale: 1.01, background: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "rgba(160,170,200,0.6)",
                    fontWeight: 500,
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Cancel / Reset Trip
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function MetricCard({ icon, label, value, accent, glow, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: "16px",
        background: glow,
        border: `1px solid ${accent}33`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minHeight: "84px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "17px" }}>{icon}</span>
        <div
          style={{
            fontSize: "9.5px",
            color: "rgba(160,170,200,0.55)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: "4px" }}>
          <div
            className="skeleton-shimmer"
            style={{
              height: "24px",
              width: "70%",
              borderRadius: "6px",
              border: `1px solid ${accent}22`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 800,
            fontSize: "22px",
            color: accent,
            lineHeight: 1,
            textShadow: `0 0 20px ${accent}88`,
          }}
        >
          {value}
        </div>
      )}
    </motion.div>
  );
}

function RouteStop({ color, label, title, address, coords }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: `${color}22`,
          border: `2px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 800,
          color: color,
          flexShrink: 0,
          boxShadow: `0 0 12px ${color}44`,
          marginTop: 2,
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "9.5px",
            color: "rgba(160,170,200,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#f8fafc",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
          title={address}
        >
          {address}
        </div>
        {coords && coords.lat != null && coords.lng != null && (
          <div
            style={{
              fontSize: "10.5px",
              color: "rgba(160,170,200,0.45)",
              marginTop: 1,
              fontFamily: "Space Grotesk, monospace",
            }}
          >
            {formatCoordinates(coords.lat, coords.lng, 4)}
          </div>
        )}
      </div>
    </div>
  );
}
