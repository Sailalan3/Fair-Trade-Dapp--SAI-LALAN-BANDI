import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts, STAGE_COLORS } from "../utils/store";
import CategoryNav from "../components/CategoryNav";
import VideoHero from "../components/VideoHero";
import { Package, Search } from "lucide-react";

export default function ProductsPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  const all = getProducts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = all.filter((p) => {
    const matchCat = !category || p.category === category;
    const matchSearch = !search || p.productName?.toLowerCase().includes(search.toLowerCase()) || p.batchId?.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || p.currentStage === stageFilter;
    return matchCat && matchSearch && matchStage;
  });

  return (
    <div className="w-full space-y-5">
      <VideoHero
        page="products"
        innerPage
        height="h-48 md:h-56"
        title={<>{"\u{1F4E6}"} Product Registry</>}
        subtitle={`${all.length} product${all.length !== 1 ? "s" : ""} in the supply chain`}
      >
        {user?.role === "farmer" && (
          <Link to="/products/add" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-[#e8604c] text-white text-sm font-semibold rounded-full hover:bg-[#d14e3a] transition shadow-lg active:scale-[0.98] uppercase tracking-wider">
            + Register Product
          </Link>
        )}
      </VideoHero>

      <CategoryNav selected={category} onSelect={setCategory} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
          <option value="">All Stages</option>
          {["Registered","Processed","Roasted","Warehoused","Reprocessed","Exported","Retailed","Sold"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <Link key={i} to={`/track/${p.blockchainId}`} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-lg bg-[#e6f3f3] text-[#1d5c5c] flex items-center justify-center font-bold text-sm">{p.productName?.[0]?.toUpperCase()}</div>
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 capitalize">{p.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || ""}`}>{p.currentStage}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#1d5c5c] transition">{p.productName}</h3>
              <p className="text-xs text-gray-400 mt-0.5 mb-3">{p.batchId}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>📍 {p.farmLocation}</span>
                <span className="font-medium text-gray-900">${p.currentPrice || p.initialPrice}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
