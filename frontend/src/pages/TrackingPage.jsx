import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getProducts, getTracking, STAGE_EMOJIS, STAGE_COLORS, CATEGORIES, TRACKING_MARKER_COLORS } from "../utils/store";
import { formatAddress } from "../components/AddressForm";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { Leaf, Shield, Loader2, Map, ExternalLink, Navigation } from "lucide-react";
import VideoHero from "../components/VideoHero";

const STAGE_GRADIENT = {
  Registered: "from-[#2a7c7c] to-[#1d5c5c]",
  Processed: "from-amber-500 to-orange-600",
  Roasted: "from-orange-500 to-red-500",
  Manufactured: "from-slate-500 to-gray-600",
  Warehoused: "from-cyan-500 to-teal-500",
  Stored: "from-cyan-500 to-teal-500",
  Reprocessed: "from-teal-500 to-teal-600",
  Exported: "from-[#2a7c7c] to-[#1d5c5c]",
  Transferred: "from-[#2a7c7c] to-[#1d5c5c]",
  Retailed: "from-purple-500 to-violet-600",
  Sold: "from-emerald-500 to-green-600",
  Dispatched: "from-purple-500 to-purple-600",
  Delivered: "from-green-500 to-emerald-600",
};

const STAGE_BG = {
  Registered: "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  Processed: "bg-amber-50 border-amber-100 text-amber-900",
  Roasted: "bg-orange-50 border-orange-100 text-orange-900",
  Manufactured: "bg-slate-50 border-slate-100 text-slate-900",
  Warehoused: "bg-cyan-50 border-cyan-100 text-cyan-900",
  Stored: "bg-cyan-50 border-cyan-100 text-cyan-900",
  Reprocessed: "bg-teal-50 border-teal-100 text-teal-900",
  Exported: "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  Transferred: "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  Retailed: "bg-purple-50 border-purple-100 text-purple-900",
  Sold: "bg-green-50 border-emerald-100 text-green-900",
};

const ALL_STAGES = ["Registered", "Processed", "Roasted", "Manufactured", "Warehoused", "Stored", "Reprocessed", "Exported", "Retailed", "Sold"];

const MARKER_HEX = {
  green: "#16a34a",
  blue: "#2563eb",
  orange: "#ea580c",
  purple: "#7c3aed",
  red: "#dc2626",
  cyan: "#0891b2",
  amber: "#d97706",
};

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/** Build a Google Maps link from lat/lng or address string */
function getGoogleMapsLink(location) {
  if (!location) return null;
  if (location.lat && location.lng) {
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  }
  const addr = location.address || location;
  if (typeof addr === "string" && addr && addr !== "N/A") {
    return `https://www.google.com/maps/search/${encodeURIComponent(addr)}`;
  }
  if (typeof addr === "object") {
    const formatted = formatAddress(addr);
    if (formatted && formatted !== "N/A") {
      return `https://www.google.com/maps/search/${encodeURIComponent(formatted)}`;
    }
  }
  return null;
}

/** Build a Google Maps directions link from start to end */
function getDirectionsLink(start, end) {
  if (!start || !end) return null;
  const origin = start.lat && start.lng ? `${start.lat},${start.lng}` : encodeURIComponent(formatAddress(start.address || start));
  const dest = end.lat && end.lng ? `${end.lat},${end.lng}` : encodeURIComponent(formatAddress(end.address || end));
  return `https://www.google.com/maps/dir/${origin}/${dest}`;
}

/** Reusable Google Maps link button */
function MapLinkButton({ location, label = "View on Map", small = false }) {
  const link = getGoogleMapsLink(location);
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-medium rounded-lg transition hover:shadow-sm ${
        small
          ? "px-2 py-1 text-[10px] bg-[#e6f3f3] text-[#2a7c7c] hover:bg-[#d1eaea]"
          : "px-3 py-1.5 text-xs bg-[#2a7c7c] text-white hover:bg-[#1d5c5c]"
      }`}>
      <Navigation className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {label}
      <ExternalLink className={small ? "w-2 h-2" : "w-2.5 h-2.5"} />
    </a>
  );
}

export default function TrackingPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "fairtrace-map",
  });

  useEffect(() => {
    const allProducts = getProducts();
    const found = allProducts.find((p) => String(p.blockchainId) === String(productId));
    const trackingData = getTracking(productId);
    if (found) {
      setProduct(found);
      setTracking(trackingData);
    }
    setLoading(false);
  }, [productId]);

  // Collect map points from tracking entries
  const mapPoints = tracking
    .filter((t) => t.location?.lat && t.location?.lng)
    .map((t, i) => ({
      lat: t.location.lat,
      lng: t.location.lng,
      stage: t.stage,
      actor: t.actor,
      address: t.location?.address,
      timestamp: t.timestamp,
      color: TRACKING_MARKER_COLORS?.[t.stage] || "blue",
      index: i,
    }));

  const hasMapData = mapPoints.length > 0 && apiKey && isLoaded;

  // Calculate map bounds to fit all points
  const mapCenter = mapPoints.length > 0
    ? { lat: mapPoints[Math.floor(mapPoints.length / 2)].lat, lng: mapPoints[Math.floor(mapPoints.length / 2)].lng }
    : { lat: 0, lng: 0 };

  // Start and end points for the overview
  const startPoint = mapPoints.length > 0 ? mapPoints[0] : null;
  const endPoint = mapPoints.length > 1 ? mapPoints[mapPoints.length - 1] : null;
  const directionsLink = startPoint && endPoint ? getDirectionsLink(startPoint, endPoint) : null;

  // Farm location for the registration entry
  const farmLocation = product?.farmLocation;
  const farmMapLink = farmLocation ? `https://www.google.com/maps/search/${encodeURIComponent(farmLocation)}` : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f7f7] to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2a7c7c] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f0f7f7] to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">{"\u{1F4E6}"}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500">Product #{productId} was not found in the system.</p>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORIES.find((c) => c.id === product.category);
  const currentStageIdx = ALL_STAGES.indexOf(product.currentStage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f3ee] via-white to-[#f5f3ee]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2a7c7c] rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-none">FairTrace</h1>
            <p className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">Product Verification</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#e6f3f3] text-[#2a7c7c] rounded-full text-xs font-semibold border border-[#c5dfdf]">
            <Shield className="w-3 h-3" /> Blockchain Verified
          </div>
        </div>
      </header>

      {/* Hero Banner with Video Background */}
      <VideoHero
        page="tracking"
        title={product.productName}
        subtitle={`Blockchain-verified supply chain tracking for Batch ${product.batchId}`}
        height="h-56 md:h-72"
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" style={{ marginTop: "-2rem" }}>
        {/* Product Details */}
        <div className="relative bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2a7c7c] to-[#1d5c5c] px-6 py-4 flex items-center justify-between">
            <p className="text-white/80 text-xs font-semibold tracking-wider uppercase">{"\u{1F4E6}"} Product Information</p>
            {catInfo && <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium">{catInfo.emoji} {catInfo.label}</span>}
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.productName}</h2>
            <p className="text-sm text-gray-400 mb-5">{"\u{1F3F7}\uFE0F"} Batch: {product.batchId}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["\u{1F468}\u200D\u{1F33E}", "Farmer", product.farmerName || "\u2014"],
                ["\u{1F4CD}", "Location", product.farmLocation || "\u2014"],
                ["\u{1F4C5}", "Harvest Date", product.harvestDate ? new Date(product.harvestDate).toLocaleDateString() : "\u2014"],
                ["\u{1F331}", "Certification", product.certification || "None"],
                ["\u2696\uFE0F", "Quantity", `${product.quantity} ${product.unit || "kg"}`],
                ["\u{1F4B0}", "Current Price", `$${product.currentPrice || product.initialPrice}`],
              ].map(([emoji, label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400 mb-0.5">{emoji} {label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                  {label === "Location" && farmMapLink && (
                    <a href={farmMapLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium bg-[#e6f3f3] text-[#2a7c7c] rounded hover:bg-[#d1eaea] transition">
                      <Navigation className="w-2.5 h-2.5" /> Open in Maps <ExternalLink className="w-2 h-2" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#2a7c7c] to-[#1d5c5c] px-6 py-4">
            <p className="text-white/80 text-xs font-semibold tracking-wider uppercase">{"\u{1F6A3}"} Supply Chain Progress</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <div className="flex items-center justify-between relative min-w-[400px]">
              <div className="absolute top-5 left-6 right-6 h-1 bg-gray-100 rounded-full" />
              {ALL_STAGES.filter((s) => {
                if (["Roasted", "Manufactured", "Warehoused", "Stored", "Reprocessed"].includes(s)) {
                  return tracking.some((t) => t.stage === s) || product.currentStage === s;
                }
                return true;
              }).map((stage, i) => {
                const completed = ALL_STAGES.indexOf(stage) <= currentStageIdx || tracking.some((t) => t.stage === stage);
                const emoji = STAGE_EMOJIS[stage] || "\u{1F4E6}";
                const gradient = STAGE_GRADIENT[stage] || "from-gray-400 to-gray-500";
                return (
                  <div key={stage} className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${
                      completed ? `bg-gradient-to-br ${gradient} text-white shadow-md` : "bg-white border-2 border-gray-200"
                    }`}>
                      {completed ? emoji : <span className="text-xs text-gray-400 font-bold">{i + 1}</span>}
                    </div>
                    <span className={`text-[10px] font-semibold ${completed ? "text-gray-900" : "text-gray-400"}`}>{stage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ START → END Journey Overview ═══ */}
        {(startPoint || endPoint || hasMapData) && (
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1d5c5c] to-[#2a7c7c] px-6 py-4 flex items-center justify-between">
              <p className="text-white/80 text-xs font-semibold tracking-wider uppercase">{"\u{1F5FA}\uFE0F"} Product Journey Map</p>
              {directionsLink && (
                <a href={directionsLink} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium hover:bg-white/30 transition flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Full Route <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            {/* Start → End summary strip */}
            {(startPoint || endPoint) && (
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-[#e6f3f3] border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Start */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">A</span>
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Origin</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {startPoint ? (startPoint.address ? formatAddress(startPoint.address) : `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`) : product.farmLocation || "Farm"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{startPoint?.stage || "Registered"} &middot; {startPoint?.actor || product.farmerName}</p>
                    {startPoint && <MapLinkButton location={startPoint} label="View" small />}
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1 px-2 flex-shrink-0">
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="w-8 h-8 rounded-full bg-[#2a7c7c] flex items-center justify-center">
                      <span className="text-white text-sm">{"\u2192"}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium">{mapPoints.length} stop{mapPoints.length !== 1 ? "s" : ""}</p>
                    <div className="w-px h-3 bg-gray-200" />
                  </div>

                  {/* End */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Current</p>
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">B</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {endPoint ? (endPoint.address ? formatAddress(endPoint.address) : `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}`) : "In transit"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{endPoint?.stage || product.currentStage} &middot; {endPoint?.actor || ""}</p>
                    {endPoint && (
                      <div className="flex justify-end mt-1">
                        <MapLinkButton location={endPoint} label="View" small />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Google Map */}
            {hasMapData && (
              <div className="h-[400px]">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={mapCenter}
                  zoom={mapPoints.length === 1 ? 10 : 3}
                  mapTypeId="satellite"
                  options={{ streetViewControl: false, mapTypeControl: false }}
                >
                  {mapPoints.map((pt, i) => {
                    const isStart = i === 0;
                    const isEnd = i === mapPoints.length - 1 && mapPoints.length > 1;
                    return (
                      <Marker
                        key={i}
                        position={{ lat: pt.lat, lng: pt.lng }}
                        onClick={() => setSelectedMarker(pt)}
                        label={isStart ? { text: "A", color: "#fff", fontSize: "11px", fontWeight: "bold" } : isEnd ? { text: "B", color: "#fff", fontSize: "11px", fontWeight: "bold" } : undefined}
                        icon={{
                          path: window.google?.maps?.SymbolPath?.CIRCLE,
                          scale: isStart || isEnd ? 14 : 10,
                          fillColor: isStart ? "#16a34a" : isEnd ? "#dc2626" : (MARKER_HEX[pt.color] || MARKER_HEX.blue),
                          fillOpacity: 1,
                          strokeColor: "#fff",
                          strokeWeight: isStart || isEnd ? 3 : 2,
                        }}
                      />
                    );
                  })}
                  {mapPoints.length > 1 && (
                    <Polyline
                      path={mapPoints.map((pt) => ({ lat: pt.lat, lng: pt.lng }))}
                      options={{ strokeColor: "#2a7c7c", strokeOpacity: 0.8, strokeWeight: 3, geodesic: true }}
                    />
                  )}
                  {selectedMarker && (
                    <InfoWindow
                      position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-1 max-w-[220px]">
                        <p className="font-bold text-sm">{selectedMarker.stage}</p>
                        {selectedMarker.actor && <p className="text-xs text-gray-600">{selectedMarker.actor}</p>}
                        {selectedMarker.address && <p className="text-xs text-gray-500">{formatAddress(selectedMarker.address)}</p>}
                        <p className="text-xs text-gray-400">{new Date(selectedMarker.timestamp).toLocaleString()}</p>
                        <a href={getGoogleMapsLink(selectedMarker)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-medium hover:underline">
                          Open in Google Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            )}

            {/* Map Legend */}
            <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-3">
              {[
                { color: "#16a34a", label: "Origin (A)" },
                { color: "#2563eb", label: "Processing" },
                { color: "#ea580c", label: "Export" },
                { color: "#7c3aed", label: "Transport" },
                { color: "#dc2626", label: "Current (B)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                </div>
              ))}
              {directionsLink && (
                <a href={directionsLink} target="_blank" rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10px] text-[#2a7c7c] font-semibold hover:underline">
                  <Navigation className="w-3 h-3" /> Get Directions A → B <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* ═══ Product Journey Timeline ═══ */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
            <p className="text-amber-50 text-xs font-semibold tracking-wider uppercase">{"\u{1F69A}"} Product Journey</p>
          </div>
          <div className="p-6">
            {/* Registration */}
            <div className="relative flex gap-3 pb-4">
              {tracking.length > 0 && <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-[#2a7c7c]/40 to-gray-200" />}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2a7c7c] to-[#1d5c5c] flex items-center justify-center text-base flex-shrink-0 shadow-md shadow-teal-200">
                {"\u{1F468}\u200D\u{1F33E}"}
              </div>
              <div className="flex-1 bg-[#e6f3f3] border border-[#c5dfdf] rounded-xl p-4">
                <p className="font-bold text-[#1a4a4a] text-sm">FARMER REGISTERED</p>
                <div className="mt-2 space-y-1 text-sm text-[#1d5c5c]">
                  <p>{"\u{1F464}"} {product.farmerName || "Farmer"}</p>
                  <p>{"\u{1F4CD}"} {product.farmLocation || "\u2014"}</p>
                  <p>{"\u{1F4C5}"} {new Date(product.createdAt).toLocaleDateString()}</p>
                  <p>{"\u{1F4B0}"} Price: ${product.initialPrice}</p>
                </div>
                {/* Google Maps link for farm */}
                {farmMapLink && (
                  <div className="mt-2 pt-2 border-t border-[#c5dfdf]">
                    <a href={farmMapLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#2a7c7c] text-white rounded-lg hover:bg-[#1d5c5c] transition shadow-sm">
                      <Navigation className="w-3 h-3" /> View Farm on Google Maps <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking entries */}
            {tracking.map((entry, i) => {
              const gradient = STAGE_GRADIENT[entry.stage] || STAGE_GRADIENT.Registered;
              const bg = STAGE_BG[entry.stage] || STAGE_BG.Registered;
              const emoji = STAGE_EMOJIS[entry.stage] || "\u{1F4E6}";
              const isLast = i === tracking.length - 1;
              const addr = entry.location?.address;
              const entryMapLink = getGoogleMapsLink(entry.location);

              return (
                <div key={i} className="relative flex gap-3 pb-4">
                  {!isLast && <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />}
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-base flex-shrink-0 shadow-md`}>
                    {emoji}
                  </div>
                  <div className={`flex-1 ${bg} border rounded-xl p-4`}>
                    <p className="font-bold text-sm uppercase">{entry.stage}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {entry.actor && <p>{"\u{1F464}"} {entry.actor}{entry.userRole ? ` (${entry.userRole})` : ""}</p>}
                      {entry.price && <p>{"\u{1F4B0}"} Price: ${entry.price}</p>}
                      {entry.notes && <p className="opacity-80">{entry.notes}</p>}
                      {addr && (addr.line1 || addr.city) && <p>{"\u{1F4CD}"} {formatAddress(addr)}</p>}
                      {!addr && entry.shippingCompany && <p>{"\u{1F69A}"} {entry.shippingCompany}</p>}
                      {!addr && entry.destination && <p>{"\u{1F30D}"} {entry.destination}</p>}
                      {entry.phone?.number && <p>{"\u{1F4DE}"} {entry.phone.countryCode} {entry.phone.number}</p>}
                      {entry.movementType && <p>{entry.movementType === "import" ? "\u{1F4E5}" : "\u{1F4E4}"} {entry.movementType} {entry.regionType ? `(${entry.regionType})` : ""}</p>}
                      {entry.location?.lat && entry.location?.lng && (
                        <p className="text-xs opacity-60">{"\u{1F4CD}"} {entry.location.lat.toFixed(6)}, {entry.location.lng.toFixed(6)}</p>
                      )}
                      {entry.receiptId && <p className="opacity-70">{"\u{1F9FE}"} Receipt: {entry.receiptId}</p>}
                      {entry.txHash && <p className="font-mono text-xs opacity-60">{"\u{1F517}"} Tx: {entry.txHash.slice(0, 18)}...</p>}
                      <p className="opacity-60 text-xs">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                    {/* Google Maps link for this entry */}
                    {entryMapLink && (
                      <div className="mt-2 pt-2 border-t border-current/10">
                        <a href={entryMapLink} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition border border-gray-200">
                          <Navigation className="w-3 h-3 text-[#2a7c7c]" />
                          View Location on Google Maps
                          <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {tracking.length === 0 && (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">{"\u{1F4E6}"}</p>
                <p className="text-sm text-gray-400">No transfers recorded yet. Product is still with the farmer.</p>
              </div>
            )}
          </div>
        </div>

        {/* Read-only notice */}
        <div className="bg-[#e6f3f3] border border-[#c5dfdf] rounded-2xl p-5 text-center">
          <p className="text-sm text-[#1d5c5c] font-medium">{"\u{1F512}"} This is a read-only verification page</p>
          <p className="text-xs text-[#2a7c7c] mt-1">All data is recorded on the blockchain. No login required.</p>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">{"\u{1F33F}"} Powered by <span className="font-bold text-[#2a7c7c]">FairTrace</span> &middot; Ethereum / Polygon</p>
        </div>
      </div>
    </div>
  );
}
