import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { Camera, X, QrCode, Search, ArrowRight } from "lucide-react";

export default function QRScanner({ onClose }) {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    setError("");
    setScanning(true);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {}
      );
    } catch (err) {
      setError("Camera access denied or not available. Try entering the product ID manually.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    setScanning(false);
  };

  const handleScanResult = (text) => {
    // Extract product ID from QR content
    // QR could be a URL like /track/1001 or just the ID
    let productId = text;
    const urlMatch = text.match(/\/track\/(\d+)/);
    if (urlMatch) productId = urlMatch[1];
    const idMatch = text.match(/BLK-?(\d+)/i);
    if (idMatch) productId = idMatch[1];

    setResult(productId);
  };

  const handleManualSearch = () => {
    if (!manualId.trim()) return;
    let id = manualId.trim();
    const match = id.match(/(\d+)/);
    if (match) id = match[1];
    setResult(id);
  };

  const goToTracking = () => {
    if (result) {
      navigate(`/track/${result}`);
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#2a7c7c] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Scan QR Code</h3>
              <p className="text-white/60 text-[10px]">Track any product instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* QR Scanner Area */}
          {!result && (
            <>
              <div id="qr-reader" className={`w-full rounded-xl overflow-hidden ${scanning ? "min-h-[280px]" : "hidden"}`} />

              {!scanning && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-[#e6f3f3] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-10 h-10 text-[#2a7c7c]" />
                  </div>
                  <p className="text-gray-600 text-sm mb-1">Scan a product QR code</p>
                  <p className="text-gray-400 text-xs">Or enter the product ID below</p>
                </div>
              )}

              <div className="flex gap-2">
                {!scanning ? (
                  <button onClick={startScanner}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-xl transition text-sm">
                    <Camera className="w-4 h-4" /> Open Camera
                  </button>
                ) : (
                  <button onClick={stopScanner}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#e8604c] hover:bg-[#d14e3a] text-white font-semibold rounded-xl transition text-sm">
                    <X className="w-4 h-4" /> Stop Scanner
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-xs font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Manual ID Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                  placeholder="Enter Product ID (e.g. 1001)"
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]"
                />
                <button onClick={handleManualSearch}
                  className="px-4 py-2.5 bg-[#e6f3f3] text-[#2a7c7c] rounded-xl hover:bg-[#d1eaea] transition">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold text-[#2c3e50] text-lg mb-1">Product Found</h4>
              <p className="text-gray-500 text-sm mb-4">Product ID: <span className="font-mono font-semibold">BLK-{result}</span></p>

              <button onClick={goToTracking}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-xl transition text-sm">
                View Full Tracking <ArrowRight className="w-4 h-4" />
              </button>

              <button onClick={() => { setResult(null); setManualId(""); }}
                className="mt-2 text-gray-400 hover:text-gray-600 text-xs font-medium transition">
                Scan Another
              </button>
            </div>
          )}

          {error && (
            <p className="text-[#e8604c] text-xs text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
