import React, { useState } from "react";
import { X, ChevronRight, Check, ArrowRight, DollarSign, AlertTriangle, ShieldCheck } from "lucide-react";
import AddressForm, { formatAddress } from "./AddressForm";
import PhoneInput, { formatPhone } from "./PhoneInput";
import GoogleMapPicker from "./GoogleMapPicker";
import { SELF_ACTIONS, TRANSFER_TARGETS, getUserByEmail, RECEIVER_ROLE_TO_STAGE } from "../utils/store";
import { validateLocation } from "../utils/aiEngine";

const MOVEMENT_TYPES = [
  { id: "import", label: "Import", emoji: "\u{1F4E5}", desc: "Receiving from external source" },
  { id: "export", label: "Export", emoji: "\u{1F6A2}", desc: "Sending to external destination" },
];

const REGION_TYPES = [
  { id: "domestic", label: "Domestic", emoji: "\u{1F3E0}", desc: "Within the same country" },
  { id: "international", label: "International", emoji: "\u{1F30D}", desc: "Cross-border movement" },
];

export default function ActionModal({ product, user, onComplete, onClose, defaultFlow = null }) {
  // Flow: 0=choose flow, then self/transfer/sell sub-steps
  const [flowType, setFlowType] = useState(defaultFlow); // "self" | "transfer" | "sell"
  const [step, setStep] = useState(0);

  // Shared state
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverError, setReceiverError] = useState("");
  const [movementType, setMovementType] = useState("");
  const [regionType, setRegionType] = useState("");
  const [address, setAddress] = useState({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
  const [phone, setPhone] = useState({ countryCode: "+44", number: "" });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  // Location validation
  const [locationWarning, setLocationWarning] = useState(null);

  const handleMapConfirm = (loc, nextStep) => {
    setLocation(loc);
    // Validate the new location against product history
    const validation = validateLocation(product, {
      lat: loc.lat,
      lng: loc.lng,
      address: formatAddress(address),
    });
    if (validation && !validation.valid) {
      setLocationWarning(validation);
    } else {
      setLocationWarning(null);
    }
    setStep(nextStep);
  };

  // Sell-specific
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState({ countryCode: "+44", number: "" });
  const [customerEmail, setCustomerEmail] = useState("");

  const handleConfirm = () => {
    const txHash = "0x" + Math.random().toString(16).slice(2, 42);

    if (flowType === "self") {
      onComplete({
        flowType: "self",
        action: selectedAction.id,
        stage: selectedAction.stage,
        movementType: "",
        regionType: "",
        location: { address, lat: location.lat, lng: location.lng },
        phone,
        price: price ? parseFloat(price) : null,
        notes,
        actor: user?.fullName,
        userEmail: user?.email,
        txHash,
      });
    } else if (flowType === "transfer") {
      onComplete({
        flowType: "transfer",
        action: "transfer",
        stage: RECEIVER_ROLE_TO_STAGE[selectedTarget?.id] || "Transferred",
        receiverEmail,
        receiverRole: selectedTarget?.id || "",
        movementType,
        regionType,
        location: { address, lat: location.lat, lng: location.lng },
        phone,
        price: price ? parseFloat(price) : null,
        notes,
        actor: user?.fullName,
        userEmail: user?.email,
        txHash,
      });
    } else if (flowType === "sell") {
      onComplete({
        flowType: "sell",
        action: "sell",
        stage: "Sold",
        price: price ? parseFloat(price) : 0,
        customerName,
        customerPhone,
        customerEmail,
        notes,
        actor: user?.fullName,
        userEmail: user?.email,
        location: { address, lat: location.lat, lng: location.lng },
        phone,
        txHash,
      });
    }
  };

  const validateReceiver = () => {
    if (!receiverEmail) { setReceiverError("Please enter receiver email"); return false; }
    const receiver = getUserByEmail(receiverEmail);
    if (!receiver) { setReceiverError("No user found with this email. They must register first."); return false; }
    if (receiverEmail === user?.email) { setReceiverError("Cannot transfer to yourself"); return false; }
    setReceiverError("");
    return true;
  };

  const isAddressValid = address.line1 && address.country && address.city;

  // Step labels for progress indicator
  const getStepLabels = () => {
    if (flowType === "self") return ["Action", "Address", "Map", "Confirm"];
    if (flowType === "transfer") return ["Receiver", "Details", "Address", "Map", "Confirm"];
    if (flowType === "sell") return ["Sale Details", "Confirm"];
    return [];
  };

  const stepLabels = getStepLabels();
  const totalSteps = stepLabels.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#e6f3f3] to-[#dceeed]">
          <div>
            <h3 className="font-semibold text-gray-900">
              {!flowType && "What do you want to do?"}
              {flowType === "self" && "\u{1F504} Continue Myself"}
              {flowType === "transfer" && "\u{1F69A} Transfer Product"}
              {flowType === "sell" && "\u{1F6D2} Sell Product"}
            </h3>
            <p className="text-xs text-gray-500">{product.productName}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Step indicator (shown after flow selection) */}
        {flowType && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {stepLabels.map((label, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i ? "bg-green-500 text-white" : step === i ? "bg-[#2a7c7c] text-white" : "bg-gray-200 text-gray-500"
                  }`}>{step > i ? <Check className="w-3 h-3" /> : i + 1}</div>
                </React.Fragment>
              ))}
              <span className="text-xs text-gray-400 ml-2">{stepLabels[step] || ""}</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {/* ═══ STEP 0: Choose Flow ═══ */}
          {!flowType && (
            <div className="space-y-3">
              <button onClick={() => { setFlowType("self"); setStep(0); }}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-left group">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">{"\u{1F504}"}</div>
                <div>
                  <p className="font-semibold text-gray-900">Continue Myself</p>
                  <p className="text-xs text-gray-500">Process, roast, manufacture, export, or warehouse this product</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 ml-auto" />
              </button>

              <button onClick={() => { setFlowType("transfer"); setStep(0); }}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-[#2a7c7c] hover:bg-[#e6f3f3] transition text-left group">
                <div className="w-12 h-12 rounded-xl bg-[#d1eaea] flex items-center justify-center text-2xl group-hover:scale-110 transition">{"\u{1F69A}"}</div>
                <div>
                  <p className="font-semibold text-gray-900">Transfer to Another Participant</p>
                  <p className="text-xs text-gray-500">Send this product to a processor, exporter, retailer, etc.</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 ml-auto" />
              </button>

              <button onClick={() => { setFlowType("sell"); setStep(0); }}
                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 transition text-left group">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">{"\u{1F6D2}"}</div>
                <div>
                  <p className="font-semibold text-gray-900">Sell Product (Final)</p>
                  <p className="text-xs text-gray-500">Mark this product as sold - this ends its lifecycle</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 ml-auto" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ SELF FLOW ═══ */}
          {/* ═══════════════════════════════════════════════ */}

          {flowType === "self" && step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">Select action to perform:</p>
              {SELF_ACTIONS.map((a) => (
                <button key={a.id} onClick={() => { setSelectedAction(a); setStep(1); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition text-left">
                  <span className="text-2xl">{a.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-500">Stage: {a.stage}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => { setFlowType(null); setStep(0); }} className="text-sm text-gray-500 hover:text-gray-700">{"\u2190"} Back</button>
            </div>
          )}

          {flowType === "self" && step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Enter location details:</p>
              <AddressForm address={address} onChange={setAddress} />
              <PhoneInput phone={phone} onChange={setPhone} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price (optional)"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={() => setStep(2)} disabled={!isAddressValid}
                  className="flex-1 px-4 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white text-sm font-medium rounded-xl transition disabled:opacity-50">
                  Next: Verify Map
                </button>
              </div>
            </div>
          )}

          {flowType === "self" && step === 2 && (
            <GoogleMapPicker address={address} location={location}
              onConfirm={(loc) => handleMapConfirm(loc, 3)}
              onBack={() => setStep(1)}
            />
          )}

          {flowType === "self" && step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{"\u2705"} Confirm action details:</p>
              {locationWarning && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Location Warning</p>
                    <p className="text-xs text-amber-700 mt-0.5">{locationWarning.reason}</p>
                    {locationWarning.details && <p className="text-[10px] text-amber-600 mt-1">{locationWarning.details}</p>}
                  </div>
                </div>
              )}
              {!locationWarning && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Location validated successfully</span>
                </div>
              )}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Flow</span><span className="font-medium text-green-700">Continue Myself</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Action</span><span className="font-semibold">{selectedAction?.emoji} {selectedAction?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Product</span><span className="font-medium">{product.productName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Location</span><span className="font-medium text-right max-w-[200px] truncate">{formatAddress(address)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Phone</span><span className="font-medium">{formatPhone(phone)}</span></div>
                {price && <div className="flex justify-between"><span className="text-gray-600">Price</span><span className="font-semibold">${price}</span></div>}
                <div className="flex justify-between"><span className="text-gray-600">By</span><span className="font-medium">{user?.fullName}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-sm">
                  {"\u2705"} Confirm & Complete
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ TRANSFER FLOW ═══ */}
          {/* ═══════════════════════════════════════════════ */}

          {flowType === "transfer" && step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">Who do you want to transfer this product to?</p>
              {TRANSFER_TARGETS.map((t) => (
                <button key={t.id} onClick={() => { setSelectedTarget(t); setStep(1); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#2a7c7c] hover:bg-[#e6f3f3] transition text-left">
                  <span className="text-2xl">{t.emoji}</span>
                  <p className="font-medium text-gray-900">{t.label}</p>
                </button>
              ))}
              <button onClick={() => { setFlowType(null); setStep(0); }} className="text-sm text-gray-500 hover:text-gray-700">{"\u2190"} Back</button>
            </div>
          )}

          {flowType === "transfer" && step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Transfer details for {selectedTarget?.emoji} {selectedTarget?.label}:</p>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Email *</label>
                <input type="email" value={receiverEmail} onChange={(e) => { setReceiverEmail(e.target.value); setReceiverError(""); }}
                  placeholder="receiver@example.com"
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 ${receiverError ? "border-red-400" : "border-gray-200"}`} />
                {receiverError && <p className="text-xs text-red-500 mt-1">{receiverError}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Movement Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {MOVEMENT_TYPES.map((m) => (
                    <button key={m.id} onClick={() => setMovementType(m.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        movementType === m.id ? "border-[#2a7c7c] bg-[#e6f3f3]" : "border-gray-200 hover:border-[#2a7c7c]/50"
                      }`}>
                      <p className="text-sm font-medium">{m.emoji} {m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Region *</label>
                <div className="grid grid-cols-2 gap-3">
                  {REGION_TYPES.map((r) => (
                    <button key={r.id} onClick={() => setRegionType(r.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        regionType === r.id ? "border-[#2a7c7c] bg-[#e6f3f3]" : "border-gray-200 hover:border-[#2a7c7c]/50"
                      }`}>
                      <p className="text-sm font-medium">{r.emoji} {r.label}</p>
                      <p className="text-xs text-gray-500">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={() => { if (validateReceiver() && movementType && regionType) setStep(2); }}
                  disabled={!receiverEmail || !movementType || !regionType}
                  className="flex-1 px-4 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white text-sm font-medium rounded-xl transition disabled:opacity-50">
                  Next: Address
                </button>
              </div>
            </div>
          )}

          {flowType === "transfer" && step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Enter address & contact details:</p>
              <AddressForm address={address} onChange={setAddress} />
              <PhoneInput phone={phone} onChange={setPhone} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={() => setStep(3)} disabled={!isAddressValid}
                  className="flex-1 px-4 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white text-sm font-medium rounded-xl transition disabled:opacity-50">
                  Next: Verify Map
                </button>
              </div>
            </div>
          )}

          {flowType === "transfer" && step === 3 && (
            <GoogleMapPicker address={address} location={location}
              onConfirm={(loc) => handleMapConfirm(loc, 4)}
              onBack={() => setStep(2)}
            />
          )}

          {flowType === "transfer" && step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{"\u2705"} Confirm transfer details:</p>
              {locationWarning && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Location Warning</p>
                    <p className="text-xs text-amber-700 mt-0.5">{locationWarning.reason}</p>
                    {locationWarning.details && <p className="text-[10px] text-amber-600 mt-1">{locationWarning.details}</p>}
                  </div>
                </div>
              )}
              {!locationWarning && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Location validated successfully</span>
                </div>
              )}
              <div className="bg-[#e6f3f3] border border-[#c5dfdf] rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Flow</span><span className="font-medium text-[#2a7c7c]">Transfer</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Product</span><span className="font-medium">{product.productName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">To</span><span className="font-semibold">{selectedTarget?.emoji} {selectedTarget?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Receiver</span><span className="font-medium">{receiverEmail}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Movement</span><span className="font-medium capitalize">{movementType}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Region</span><span className="font-medium capitalize">{regionType}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Location</span><span className="font-medium text-right max-w-[200px] truncate">{formatAddress(address)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Phone</span><span className="font-medium">{formatPhone(phone)}</span></div>
                {price && <div className="flex justify-between"><span className="text-gray-600">Price</span><span className="font-semibold">${price}</span></div>}
                <div className="flex justify-between"><span className="text-gray-600">From</span><span className="font-medium">{user?.fullName}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-xl transition shadow-sm">
                  {"\u2705"} Confirm & Transfer
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ═══ SELL FLOW ═══ */}
          {/* ═══════════════════════════════════════════════ */}

          {flowType === "sell" && step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Enter sale details:</p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
                This will mark the product as <strong>Sold</strong>. No further actions can be performed after this.
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price ($) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter final selling price"
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Phone</label>
                <PhoneInput phone={customerPhone} onChange={setCustomerPhone} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer Email (Optional)</label>
                <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Sale notes..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setFlowType(null); setStep(0); }} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={() => setStep(1)} disabled={!price || !customerName}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50">
                  Next: Confirm Sale
                </button>
              </div>
            </div>
          )}

          {flowType === "sell" && step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{"\u2705"} Confirm sale:</p>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Action</span><span className="font-semibold text-red-700">SELL (Final)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Product</span><span className="font-medium">{product.productName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Seller</span><span className="font-medium">{user?.fullName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Customer</span><span className="font-medium">{customerName}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Price</span><span className="font-bold text-xl text-green-700">${price}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                <button onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition shadow-sm">
                  {"\u{1F6D2}"} Confirm & Sell
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
