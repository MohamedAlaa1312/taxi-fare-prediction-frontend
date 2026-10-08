import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCoordinates, searchLocations } from "../utils/geo";

/**
 * Left floating glass panel — includes:
 * - Search Pickup & Search Dropoff Address inputs with live Nominatim geocoding autocomplete
 * - Step status rows with human-readable addresses
 * - Visually emphasized actual driving distance chip
 * - Action buttons
 */
export default function ControlPanel({
  pickup,
  dropoff,
  pickupAddress,
  dropoffAddress,
  mode,
  distance,
  loading,
  result,
  onStart,
  onReset,
  onRePredict,
  onSelectAddress,
}) {
  const hasPickup = Boolean(pickup);
  const hasDropoff = Boolean(dropoff);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "24px",
        transform: "translateY(-50%)",
        zIndex: 30,
        width: "360px",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        pointerEvents: "none",
      }}
    >
      {/* ── Header card ─────────────────────────────────────────── */}
      <motion.div
        className="glass-panel panel-noise"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          padding: "22px 24px",
          pointerEvents: "auto",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f5c518, #c99b00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
              boxShadow: "0 0 24px rgba(245,197,24,0.45)",
            }}
          >
            🚕
          </div>
          <div>
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                color: "#fff",
                lineHeight: 1.1,
              }}
            >
              NYC Taxi AI
            </div>
            <div style={{ fontSize: "11px", color: "rgba(160,170,200,0.6)", marginTop: 3 }}>
              Fare & Duration Predictor
            </div>
          </div>
        </div>

        {/* ── Location Search Inputs (Nominatim Autocomplete) ─────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <SearchAddressInput
            type="pickup"
            placeholder="Search Pickup Address…"
            accentColor="#f5c518"
            icon="📍"
            onSelect={(location) => onSelectAddress("pickup", location)}
          />
          <SearchAddressInput
            type="dropoff"
            placeholder="Search Dropoff Address…"
            accentColor="#00d4ff"
            icon="🏁"
            onSelect={(location) => onSelectAddress("dropoff", location)}
          />
        </div>

        {/* Step indicators with Human-Readable Addresses */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "14px",
            padding: "12px 14px",
          }}
        >
          <StepRow
            dot={hasPickup ? "green" : mode === "picking_pickup" ? "yellow" : "empty"}
            label="Pickup Location"
            title={
              hasPickup
                ? pickupAddress || "Locating street…"
                : mode === "picking_pickup"
                ? "Click on map or search above…"
                : "Not set"
            }
            subtitle={hasPickup ? formatCoordinates(pickup.lat, pickup.lng, 4) : null}
            active={mode === "picking_pickup"}
          />

          {/* Connected route indicator */}
          <div style={{ display: "flex", alignItems: "stretch", paddingLeft: "4px" }}>
            <div
              style={{
                width: "2px",
                height: "14px",
                marginLeft: "4px",
                background:
                  "repeating-linear-gradient(to bottom, rgba(245,197,24,0.4) 0, rgba(245,197,24,0.4) 4px, transparent 4px, transparent 8px)",
              }}
            />
          </div>

          <StepRow
            dot={hasDropoff ? "cyan" : mode === "picking_dropoff" ? "yellow" : "empty"}
            label="Dropoff Location"
            title={
              hasDropoff
                ? dropoffAddress || "Locating street…"
                : mode === "picking_dropoff"
                ? "Click on map or search above…"
                : "Not set"
            }
            subtitle={hasDropoff ? formatCoordinates(dropoff.lat, dropoff.lng, 4) : null}
            active={mode === "picking_dropoff"}
          />
        </div>

        {/* Visually Emphasized Trip Distance Chip */}
        <AnimatePresence>
          {distance != null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 6 }}
              transition={{ duration: 0.35 }}
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(245,197,24,0.12), rgba(245,197,24,0.03))",
                border: "1px solid rgba(245,197,24,0.35)",
                boxShadow: "0 0 20px rgba(245,197,24,0.1) inset, 0 8px 24px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🛣️</span>
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "rgba(245,197,24,0.8)",
                      fontWeight: 600,
                    }}
                  >
                    OSRM Road Distance
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(160,170,200,0.6)" }}>
                    Actual street driving
                  </div>
                </div>
              </div>
              <div
                className="gradient-text-yellow"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 800,
                  fontSize: "18px",
                  letterSpacing: "-0.02em",
                  textShadow: "0 0 16px rgba(245,197,24,0.4)",
                }}
              >
                {Number(distance).toFixed(2)} mi
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Actions ─────────────────────────────────────────── */}
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Start / Reset */}
          {!hasPickup && !hasDropoff && (
            <PrimaryBtn onClick={onStart} disabled={loading || mode !== "idle"}>
              {mode === "picking_pickup" ? "Selecting Pickup…" : "🗺 Click Map to Pick Points"}
            </PrimaryBtn>
          )}

          {(hasPickup || hasDropoff) && (
            <>
              {hasPickup && !hasDropoff && mode !== "picking_dropoff" && (
                <SecondaryBtn>✓ Pickup set. Click map or search dropoff.</SecondaryBtn>
              )}
              <GhostBtn onClick={onReset}>↩ Reset & Start Over</GhostBtn>
            </>
          )}

          {/* Re-predict button */}
          {hasPickup && hasDropoff && !loading && result && (
            <motion.button
              whileHover={{ scale: 1.02, background: "rgba(245,197,24,0.12)", borderColor: "rgba(245,197,24,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onRePredict}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "12px",
                border: "1px solid rgba(245,197,24,0.25)",
                background: "rgba(245,197,24,0.06)",
                color: "#f5c518",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "Space Grotesk, sans-serif",
                letterSpacing: "0.02em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span>🔄</span> Re-predict Fare & Duration
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Loading indicator card ───────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="glass-panel"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: "16px 20px",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div className="spinner" style={{ width: 26, height: 26 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "#fff" }}>
                Calculating route & fare…
              </div>
              <div style={{ fontSize: "11px", color: "rgba(160,170,200,0.5)", marginTop: 2 }}>
                Querying OSRM & ML models
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Search Address Component with Autocomplete Dropdown ────────────── */

function SearchAddressInput({ placeholder, accentColor, icon, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const suggestions = await searchLocations(query);
      setResults(suggestions);
      setIsOpen(suggestions.length > 0);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.title);
    setIsOpen(false);
    onSelect(item);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(15, 20, 35, 0.75)",
          border: `1px solid ${isOpen ? accentColor : "rgba(255,255,255,0.12)"}`,
          borderRadius: "12px",
          padding: "8px 12px",
          gap: "8px",
          transition: "all 0.2s",
          boxShadow: isOpen ? `0 0 16px ${accentColor}33` : "none",
        }}
      >
        <span style={{ fontSize: "14px", opacity: 0.9 }}>{icon}</span>
        <span style={{ fontSize: "13px", color: "rgba(160,170,200,0.5)" }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f8fafc",
            fontSize: "12.5px",
            fontFamily: "Inter, sans-serif",
          }}
        />
        {isSearching && (
          <div
            style={{
              width: 14,
              height: 14,
              border: `2px solid ${accentColor}44`,
              borderTopColor: accentColor,
              borderRadius: "50%",
              animation: "spin-glow 0.8s linear infinite",
            }}
          />
        )}
        {query && !isSearching && (
          <button
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(160,170,200,0.6)",
              cursor: "pointer",
              fontSize: "12px",
              padding: "2px 4px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Menu */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "rgba(10, 14, 26, 0.96)",
              border: "1px solid rgba(245,197,24,0.3)",
              borderRadius: "14px",
              padding: "6px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {results.map((item, idx) => (
              <motion.div
                key={idx}
                whileHover={{ background: "rgba(245,197,24,0.12)" }}
                onClick={() => handleSelect(item)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#f8fafc" }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ fontSize: "10.5px", color: "rgba(160,170,200,0.6)" }}>
                    {item.subtitle}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Step Row ───────────────────────────────────────────────────────── */

function StepRow({ dot, label, title, subtitle, active }) {
  const dotColors = {
    green:  { bg: "#10b981", shadow: "#10b981" },
    cyan:   { bg: "#00d4ff", shadow: "#00d4ff" },
    yellow: { bg: "#f5c518", shadow: "#f5c518" },
    empty:  { bg: "transparent", shadow: "none", border: "2px dashed rgba(255,255,255,0.2)" },
  };
  const d = dotColors[dot] || dotColors.empty;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <motion.div
        style={{
          width: 12,
          height: 12,
          marginTop: 3,
          borderRadius: "50%",
          background: d.bg,
          border: d.border,
          flexShrink: 0,
          boxShadow: `0 0 10px ${d.shadow}`,
        }}
        animate={active ? { scale: [1, 1.3, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "10px",
            color: "rgba(160,170,200,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: active ? "#f5c518" : "#f1f5f9",
            fontWeight: active ? 700 : 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
          title={title}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: "10.5px",
              color: "rgba(160,170,200,0.45)",
              marginTop: 1,
              fontFamily: "Space Grotesk, monospace",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({ onClick, children, disabled }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, boxShadow: "0 0 30px rgba(245,197,24,0.4)" } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "12px",
        border: "none",
        background: disabled
          ? "rgba(245,197,24,0.2)"
          : "linear-gradient(135deg, #f5c518, #c99b00)",
        color: disabled ? "rgba(255,255,255,0.3)" : "#000",
        fontWeight: 700,
        fontSize: "13px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.02em",
        transition: "background 0.2s",
      }}
    >
      {children}
    </motion.button>
  );
}

function SecondaryBtn({ children }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        background: "rgba(0,212,255,0.06)",
        border: "1px solid rgba(0,212,255,0.2)",
        color: "rgba(0,212,255,0.85)",
        fontSize: "12px",
        fontWeight: 500,
        textAlign: "center",
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, background: "rgba(255,255,255,0.06)" }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "transparent",
        color: "rgba(160,170,200,0.7)",
        fontWeight: 500,
        fontSize: "12px",
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </motion.button>
  );
}
