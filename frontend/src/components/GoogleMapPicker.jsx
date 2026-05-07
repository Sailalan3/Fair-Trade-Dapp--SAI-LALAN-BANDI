import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { MapPin, Check, Loader2 } from "lucide-react";
import { formatAddress } from "./AddressForm";

const mapContainerStyle = { width: "100%", height: "300px", borderRadius: "12px" };

export default function GoogleMapPicker({ address, location, onConfirm, onBack }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [markerPos, setMarkerPos] = useState(location?.lat ? { lat: location.lat, lng: location.lng } : null);
  const [geocoding, setGeocoding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    id: "fairtrace-map",
  });

  // Geocode using Nominatim (free, no API key)
  const geocodeAddress = useCallback(async (addr) => {
    const query = typeof addr === "string" ? addr : formatAddress(addr);
    if (!query) return null;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const results = await res.json();
      if (results.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
    } catch {}
    return null;
  }, []);

  const handleGeocode = async () => {
    setGeocoding(true);
    const result = await geocodeAddress(address);
    if (result) {
      setMarkerPos(result);
    } else {
      alert("Could not find location. Please try a more specific address.");
    }
    setGeocoding(false);
  };

  // Auto-geocode on mount if no location provided
  React.useEffect(() => {
    if (!markerPos && address) {
      handleGeocode();
    }
  }, []);

  const handleMapClick = useCallback((e) => {
    setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setConfirmed(false);
  }, []);

  const handleMarkerDrag = useCallback((e) => {
    setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setConfirmed(false);
  }, []);

  const handleConfirm = () => {
    if (markerPos) {
      setConfirmed(true);
      onConfirm({ lat: markerPos.lat, lng: markerPos.lng });
    }
  };

  // Fallback: Google Maps embed if API key not set or not loaded
  if (!apiKey || !isLoaded) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-gray-700">Verify location on map:</p>
        {markerPos ? (
          <>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <iframe
                width="100%" height="300" style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${markerPos.lat},${markerPos.lng}&t=k&z=15&output=embed`}
                title="Google Maps Satellite"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-sm font-medium text-gray-900">{formatAddress(address)}</p>
              <p className="text-xs text-gray-500">Lat: {markerPos.lat.toFixed(6)} / Lng: {markerPos.lng.toFixed(6)}</p>
            </div>
            <div className="flex gap-3">
              {onBack && <button onClick={onBack} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">Back</button>}
              <button onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition">
                <Check className="w-4 h-4" /> Confirm Location
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            {geocoding ? (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> Finding location...
              </div>
            ) : (
              <>
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">Could not auto-detect location</p>
                <button onClick={handleGeocode} className="px-4 py-2 bg-[#2a7c7c] text-white text-sm rounded-xl hover:bg-[#1d5c5c]">
                  Try Again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">Verify & adjust location on map:</p>
      <p className="text-xs text-gray-500">Click on the map or drag the marker to adjust the pin</p>

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPos || { lat: 20, lng: 0 }}
          zoom={markerPos ? 15 : 2}
          mapTypeId="satellite"
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
        >
          {markerPos && (
            <Marker position={markerPos} draggable onDragEnd={handleMarkerDrag} />
          )}
        </GoogleMap>
      </div>

      {markerPos && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
          <p className="text-sm font-medium text-gray-900">{formatAddress(address)}</p>
          <p className="text-xs text-gray-500">Lat: {markerPos.lat.toFixed(6)} / Lng: {markerPos.lng.toFixed(6)}</p>
        </div>
      )}

      {!markerPos && !geocoding && (
        <button onClick={handleGeocode}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2a7c7c] text-white text-sm rounded-xl hover:bg-[#1d5c5c]">
          <MapPin className="w-4 h-4" /> Find Location
        </button>
      )}

      {geocoding && (
        <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
          <Loader2 className="w-5 h-5 animate-spin" /> Finding location...
        </div>
      )}

      <div className="flex gap-3">
        {onBack && <button onClick={onBack} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">Back</button>}
        <button onClick={handleConfirm} disabled={!markerPos}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition ${
            confirmed ? "bg-green-600" : "bg-green-600 hover:bg-green-700"
          } disabled:opacity-50`}>
          <Check className="w-4 h-4" /> {confirmed ? "Location Confirmed" : "Confirm Location"}
        </button>
      </div>
    </div>
  );
}
