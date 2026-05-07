import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { registerProductOnChain, isWalletReady, connectWallet, getCurrentAccount } from "../utils/contract";
import { CATEGORIES, CATEGORY_FIELDS, addTracking } from "../utils/store";
import { syncProduct, syncTransaction } from "../utils/backendSync";
import VideoHero from "../components/VideoHero";
import AddressForm, { formatAddress } from "../components/AddressForm";
import PhoneInput, { formatPhone } from "../components/PhoneInput";
import GoogleMapPicker from "../components/GoogleMapPicker";
import { Package, CheckCircle, AlertCircle, Loader2, QrCode, ExternalLink, Copy, Check, MapPin, Wallet, ShieldCheck } from "lucide-react";

const CERTIFICATIONS = ["None","Fair Trade","Organic","Rainforest Alliance","UTZ Certified","Direct Trade"];

function QRCodeDisplay({ value, size = 200 }) {
  return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=166534&margin=10`} alt="QR Code" width={size} height={size} className="rounded-xl border-4 border-[#d1eaea] shadow-lg" />;
}

export default function AddProductPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState("agriculture");
  const [form, setForm] = useState({ batchId: "", productName: "", certification: "None", quantity: "", unit: "kg", initialPrice: "", description: "" });
  const [catFields, setCatFields] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [registeredProduct, setRegisteredProduct] = useState(null);
  const [copied, setCopied] = useState(false);
  const [routingStep, setRoutingStep] = useState(false);
  const [regAddress, setRegAddress] = useState({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
  const [regPhone, setRegPhone] = useState({ countryCode: "+44", number: "" });
  const [regLocation, setRegLocation] = useState({ lat: null, lng: null });
  const [showMap, setShowMap] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);

  useEffect(() => {
    if (window.ethereum?.on) {
      const onAccountsChanged = (accs) => setWalletAddress(accs?.[0] || "");
      window.ethereum.on("accountsChanged", onAccountsChanged);
      return () => { window.ethereum.removeListener?.("accountsChanged", onAccountsChanged); };
    }
  }, []);

  const handleConnectWallet = async () => {
    setWalletConnecting(true); setStatus({ type: "", message: "" });
    try {
      const acct = await connectWallet();
      setWalletAddress(acct);
      setStatus({ type: "success", message: "Wallet connected: " + acct.slice(0, 6) + "..." + acct.slice(-4) });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to connect wallet" });
    } finally { setWalletConnecting(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCatChange = (e) => setCatFields({ ...catFields, [e.target.name]: e.target.value });
  const trackingUrl = registeredProduct ? `${window.location.origin}/track/${registeredProduct.productId}` : "";

  const fields = CATEGORY_FIELDS[category] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batchId || !form.productName || !form.quantity || !form.initialPrice) {
      setStatus({ type: "error", message: "Please fill in all required fields" }); return;
    }
    setLoading(true); setStatus({ type: "", message: "" });
    try {
      setStep(1);
      const farmerName = catFields.farmerName || catFields.producerName || catFields.manufacturerName || catFields.factoryName || user?.fullName;
      const farmLocation = regAddress.line1 ? formatAddress(regAddress) : (catFields.farmLocation || catFields.rawMaterialSource || "Not specified");

      const { productId, txHash } = await registerProductOnChain(
        form.batchId, form.productName, farmerName, farmLocation,
        catFields.harvestDate || catFields.expiryDate || new Date().toISOString().split("T")[0],
        form.certification, parseInt(form.quantity), parseInt(form.initialPrice)
      );
      setStep(2);
      const products = JSON.parse(localStorage.getItem("fairtrace_products") || "[]");
      const locationObj = regAddress.line1 ? { address: regAddress, lat: regLocation.lat, lng: regLocation.lng } : null;
      products.push({
        blockchainId: productId, batchId: form.batchId, productName: form.productName,
        category, ...catFields,
        farmerName, farmLocation,
        location: locationObj,
        phone: regPhone.number ? regPhone : null,
        certification: form.certification, quantity: parseInt(form.quantity), unit: form.unit,
        initialPrice: parseInt(form.initialPrice), currentPrice: parseInt(form.initialPrice),
        currentStage: "Registered", description: form.description,
        ownerEmail: user?.email, registrationTxHash: txHash, createdAt: new Date().toISOString(),
      });
      localStorage.setItem("fairtrace_products", JSON.stringify(products));

      // Add first tracking entry with location data
      addTracking({
        productId,
        action: "register",
        stage: "Registered",
        userEmail: user?.email,
        userRole: "Farmer",
        actor: user?.fullName,
        from: { name: user?.fullName, email: user?.email },
        to: { name: user?.fullName, email: user?.email },
        price: parseInt(form.initialPrice),
        location: locationObj,
        phone: regPhone.number ? regPhone : null,
        notes: form.description || "",
        txHash,
      });

      const txs = JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]");
      txs.push({
        productId, batchId: form.batchId, productName: form.productName, category,
        type: "Product Registered", seller: user?.fullName, buyer: "-",
        price: parseInt(form.initialPrice), fromStage: "-", toStage: "Registered",
        txHash, userEmail: user?.email, timestamp: new Date().toISOString(),
      });
      localStorage.setItem("fairtrace_transactions", JSON.stringify(txs));

      // ─── Mirror to backend (MongoDB) ───
      syncProduct({
        blockchainId: productId,
        batchId: form.batchId,
        productName: form.productName,
        productType: category,
        farmerName,
        farmLocation,
        harvestDate: catFields.harvestDate || catFields.expiryDate || new Date().toISOString().split("T")[0],
        certification: form.certification,
        quantity: parseInt(form.quantity),
        unit: form.unit,
        initialPrice: parseInt(form.initialPrice),
        currentPrice: parseInt(form.initialPrice),
        currentStage: "Registered",
        currentOwner: walletAddress,
        farmerAddress: walletAddress,
        description: form.description || "",
        registrationTxHash: txHash,
      });
      syncTransaction({
        productId,
        batchId: form.batchId,
        productName: form.productName,
        seller: walletAddress,
        sellerName: farmerName,
        buyer: walletAddress,
        buyerName: farmerName,
        price: parseInt(form.initialPrice),
        fromStage: "-",
        toStage: "Registered",
        txHash,
        timestamp: new Date(),
      });

      setStep(3);
      setRegisteredProduct({ productId, txHash });
      setRoutingStep(true);
      setStatus({ type: "success", message: `Product registered! ID: ${productId}` });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to register" }); setStep(0);
    } finally { setLoading(false); }
  };

  const handleRoutingSelection = (roleId) => {
    // update localStorage products
    const products = JSON.parse(localStorage.getItem("fairtrace_products") || "[]");
    const updated = products.map(p => {
      if (p.blockchainId === registeredProduct.productId) {
        return { ...p, currentStage: "Transferred", targetRole: roleId };
      }
      return p;
    });
    localStorage.setItem("fairtrace_products", JSON.stringify(updated));

    // add transaction
    const txs = JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]");
    txs.push({
      productId: registeredProduct.productId, batchId: form.batchId, productName: form.productName, category: category,
      type: "Initial Transfer", seller: user?.fullName, buyer: roleId,
      price: parseInt(form.initialPrice), fromStage: "Registered", toStage: "Transferred",
      txHash: registeredProduct.txHash, userEmail: user?.email, timestamp: new Date().toISOString(),
    });
    localStorage.setItem("fairtrace_transactions", JSON.stringify(txs));

    setRoutingStep(false);
  };

  if (registeredProduct && routingStep) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-[#d1eaea] text-[#2a7c7c] rounded-full flex items-center justify-center mx-auto mb-2 text-3xl">✈️</div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">Where do you want to send this product?</h2>
        <p className="text-sm text-gray-500">This step is mandatory. The product must move to the next participant in the supply chain to continue its journey.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
          {[
            { id: "processor", label: "Processor", icon: "🏭" },
            { id: "roaster", label: "Roaster", icon: "🔥" },
            { id: "manufacturer", label: "Manufacturer", icon: "⚙️" },
            { id: "exporter", label: "Exporter", icon: "🚢" },
            { id: "retailer", label: "Retailer", icon: "🏬" },
          ].map(role => (
             <button key={role.id} onClick={() => handleRoutingSelection(role.id)} className="p-4 border border-gray-200 rounded-xl hover:bg-[#e6f3f3] hover:border-[#2a7c7c] hover:shadow-sm transition flex flex-col items-center justify-center gap-2">
                <div className="text-3xl">{role.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{role.label}</div>
             </button>
          ))}
        </div>
      </div>
    );
  }

  if (registeredProduct && !routingStep) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#2a7c7c] to-[#2a7c7c] px-6 py-8 text-center">
            <div className="text-5xl mb-3">{"\u{1F4E6}"}</div>
            <h1 className="text-2xl font-bold text-white">Product Registered!</h1>
          </div>
          <div className="px-6 py-5 border-b border-gray-100 space-y-2 text-sm">
            {[["Product", form.productName], ["Category", category], ["Batch", form.batchId], ["ID", `#${registeredProduct.productId}`], ["Price", `$${form.initialPrice}`]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-semibold capitalize">{v}</span></div>
            ))}
          </div>
          <div className="px-6 py-8 text-center">
            <QRCodeDisplay value={trackingUrl} size={200} />
            <p className="text-sm text-gray-500 mt-4">{"\u{1F4F1}"} Scan to track</p>
            <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <input type="text" value={trackingUrl} readOnly className="flex-1 bg-transparent text-sm text-gray-600 font-mono outline-none truncate" />
              <button onClick={() => { navigator.clipboard.writeText(trackingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="px-3 py-1.5 bg-[#2a7c7c] text-white text-xs font-medium rounded-lg">{copied ? "Copied!" : "Copy"}</button>
            </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <Link to={`/track/${registeredProduct.productId}`} target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-[#2a7c7c] text-white font-semibold rounded-xl hover:bg-[#1d5c5c] transition">
              <ExternalLink className="w-4 h-4" /> Open Tracking
            </Link>
            <button onClick={() => { setRegisteredProduct(null); setStep(0); setStatus({}); setForm({ batchId: "", productName: "", certification: "None", quantity: "", unit: "kg", initialPrice: "", description: "" }); setCatFields({}); }}
              className="w-full text-sm text-[#2a7c7c] font-medium py-2">+ Register Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-0">
      <VideoHero
        page="addProduct"
        innerPage
        height="h-44 md:h-52"
        title={<>{"\u{1F4E6}"} Register New Product</>}
        subtitle="Add a new product to the blockchain supply chain"
      />
      <div className="max-w-2xl mx-auto">

      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-6">
            {[{ l: "Blockchain", s: 1 }, { l: "Saving", s: 2 }, { l: "Complete", s: 3 }].map((item) => (
              <div key={item.s} className="flex items-center gap-2">
                {step >= item.s ? <CheckCircle className="w-5 h-5 text-[#2a7c7c]" /> : step === item.s - 1 ? <Loader2 className="w-5 h-5 text-[#2a7c7c] animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                <span className={`text-sm font-medium ${step >= item.s ? "text-[#2a7c7c]" : "text-gray-400"}`}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status.message && !registeredProduct && (
        <div className={`flex items-center gap-2 p-4 mb-6 rounded-xl text-sm ${status.type === "success" ? "bg-[#e6f3f3] text-[#2a7c7c]" : "bg-red-50 text-red-700"}`}>
          {status.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{status.message}
        </div>
      )}

      {/* Wallet Verification Banner */}
      {!walletAddress ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Blockchain verification required</p>
            <p className="text-xs text-amber-800 mt-1">You must connect a MetaMask wallet before a product can be registered. Registration writes the batch to the smart contract on-chain.</p>
            <button onClick={handleConnectWallet} disabled={walletConnecting}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#e8604c] hover:bg-[#d14e3a] text-white text-xs font-semibold rounded-lg transition disabled:opacity-60 uppercase tracking-wider">
              {walletConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {walletConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-emerald-900">Wallet connected & verified</span>
            <span className="text-emerald-800 font-mono ml-2">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{"\u{1F4E6}"} Product Category *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} type="button" onClick={() => { setCategory(cat.id); setCatFields({}); }}
                className={`px-3 py-3 rounded-xl border text-center transition ${category === cat.id ? "border-[#2a7c7c] bg-[#e6f3f3] ring-1 ring-[#2a7c7c]" : "border-gray-200 hover:border-gray-300"}`}>
                <span className="text-2xl block mb-1">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Common fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">{"\u{1F3F7}\uFE0F"} Batch ID *</label><input name="batchId" value={form.batchId} onChange={handleChange} placeholder="FT-2025-001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">{"\u{1F4E6}"} Product Name *</label><input name="productName" value={form.productName} onChange={handleChange} placeholder="e.g. Arabica Coffee" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" /></div>
        </div>

        {/* Dynamic category-specific fields */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{CATEGORIES.find((c) => c.id === category)?.emoji} {category} Details</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}{field.required ? " *" : ""}</label>
                {field.type === "textarea" ? (
                  <textarea name={field.name} value={catFields[field.name] || ""} onChange={handleCatChange} rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 resize-none" />
                ) : (
                  <input type={field.type} name={field.name} value={catFields[field.name] || ""} onChange={handleCatChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Location Capture */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"><MapPin className="w-3 h-3 inline mr-1" /> Location & Contact</p>
          {!showMap ? (
            <div className="space-y-4">
              <AddressForm address={regAddress} onChange={setRegAddress} />
              <PhoneInput phone={regPhone} onChange={setRegPhone} />
              {regAddress.line1 && regAddress.country && regAddress.city && (
                <button type="button" onClick={() => setShowMap(true)}
                  className="w-full px-4 py-2.5 bg-[#e6f3f3] text-[#2a7c7c] text-sm font-medium rounded-xl hover:bg-[#d1eaea] transition flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Verify on Map
                </button>
              )}
              {locationConfirmed && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Location verified ({regLocation.lat?.toFixed(4)}, {regLocation.lng?.toFixed(4)})</span>
                </div>
              )}
            </div>
          ) : (
            <GoogleMapPicker address={regAddress} location={regLocation}
              onConfirm={(loc) => {
                setRegLocation(loc);
                setLocationConfirmed(true);
                setShowMap(false);
              }}
              onBack={() => setShowMap(false)}
            />
          )}
        </div>

        {/* Common fields continued */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">{"\u{1F331}"} Certification</label><select name="certification" value={form.certification} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm">{CERTIFICATIONS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">{"\u2696\uFE0F"} Quantity *</label><input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Unit</label><select name="unit" value={form.unit} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"><option>kg</option><option>lb</option><option>tons</option><option>bags</option><option>units</option></select></div>
          </div>
        </div>
        <div><label className="block text-xs font-medium text-gray-700 mb-1">{"\u{1F4B0}"} Initial Price (USD) *</label><input name="initialPrice" type="number" value={form.initialPrice} onChange={handleChange} placeholder="e.g. 120" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20" /></div>
        <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Additional details..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" /></div>

        <button onClick={handleSubmit} disabled={loading || !walletAddress}
          title={!walletAddress ? "Connect your MetaMask wallet first" : ""}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : !walletAddress ? <Wallet className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          {loading ? "Registering..." : !walletAddress ? "Connect Wallet to Continue" : "\u{1F4E6} Register Product"}
        </button>
      </div>
      </div>
    </div>
  );
}
