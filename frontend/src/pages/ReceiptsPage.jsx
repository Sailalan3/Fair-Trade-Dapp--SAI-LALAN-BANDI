import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getReceipts } from "../utils/store";
import { downloadReceipt, printReceipt, CURRENCIES, TAX_RATES, formatCurrency, convertCurrency } from "../utils/receiptGenerator";
import VideoHero from "../components/VideoHero";
import { FileText, Download, Printer, Search, DollarSign, Receipt, ChevronDown } from "lucide-react";

export default function ReceiptsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [taxType, setTaxType] = useState("VAT_UK");

  const allReceipts = getReceipts(user?.email);
  const filtered = allReceipts
    .filter((r) => filter === "all" || r.action === filter)
    .filter((r) => !search || r.productName?.toLowerCase().includes(search.toLowerCase()) || r.receiptId?.toLowerCase().includes(search.toLowerCase()));

  const filterOptions = [
    { id: "all", label: "All" },
    { id: "transfer", label: "Transfers" },
    { id: "sell", label: "Sales" },
    { id: "export", label: "Exports" },
  ];

  const displayPrice = (price) => {
    const converted = convertCurrency(parseFloat(price) || 0, "GBP", currency);
    return formatCurrency(converted, currency);
  };

  const handleDownload = (r) => downloadReceipt({ ...r, currency, taxType });
  const handlePrint = (r) => printReceipt({ ...r, currency, taxType });

  // Summary stats
  const totalValue = filtered.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const salesCount = allReceipts.filter(r => r.action === "sell").length;
  const transferCount = allReceipts.filter(r => r.action === "transfer").length;

  return (
    <div className="w-full space-y-6 pb-12">
      <VideoHero
        page="receipts"
        innerPage
        height="h-48 md:h-56"
        title={<>{"\u{1F9FE}"} Receipts & Invoices</>}
        subtitle={`${allReceipts.length} receipt${allReceipts.length !== 1 ? "s" : ""} found`}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Receipts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{allReceipts.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-bold text-[#2a7c7c] mt-1">{displayPrice(totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Sales</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{salesCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Transfers</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{transferCount}</p>
        </div>
      </div>

      {/* Currency & Tax Selectors */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Currency</label>
            <div className="flex gap-2">
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <button key={code} onClick={() => setCurrency(code)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition border ${
                    currency === code
                      ? "bg-[#2a7c7c] text-white border-[#2a7c7c]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2a7c7c]/40 hover:bg-[#f5f3ee]"
                  }`}>
                  <span className="text-sm">{c.symbol}</span> {code}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5 block">Tax Region</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAX_RATES).map(([key, t]) => (
                <button key={key} onClick={() => setTaxType(key)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition border ${
                    taxType === key
                      ? "bg-[#e8604c] text-white border-[#e8604c]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#e8604c]/40 hover:bg-red-50/50"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {filterOptions.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === f.id ? "bg-[#2a7c7c] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or receipt ID..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2a7c7c] focus:border-transparent" />
        </div>
      </div>

      {/* Receipt List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No receipts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{r.productName || "Product"}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      r.action === "sell" ? "bg-green-100 text-green-700" :
                      r.action === "transfer" ? "bg-[#d1eaea] text-[#2a7c7c]" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {r.action === "sell" ? "Sale" : r.action === "transfer" ? "Transfer" : r.action}
                    </span>
                    {r.paymentStatus && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" :
                        r.paymentStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.paymentStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-mono">{r.receiptId}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {r.from && <span>From: {r.from.name || r.from.email}</span>}
                    {r.to && <span>To: {r.to.name || r.to.email}</span>}
                    {r.price && <span className="font-semibold text-[#2a7c7c]">{displayPrice(r.price)}</span>}
                    <span>{new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-4">
                  <button onClick={() => handleDownload(r)}
                    className="p-2 bg-[#e6f3f3] text-[#2a7c7c] rounded-lg hover:bg-[#d1eaea] transition" title={`Download PDF (${currency})`}>
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handlePrint(r)}
                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition" title="Print">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
