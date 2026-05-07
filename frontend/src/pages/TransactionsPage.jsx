import React, { useState, useEffect } from "react";
import VideoHero from "../components/VideoHero";
import { History, ArrowRight, Search } from "lucide-react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const txs = JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]");
    setTransactions(txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, []);

  const filtered = transactions.filter((tx) =>
    !search ||
    tx.productName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.batchId?.toLowerCase().includes(search.toLowerCase()) ||
    tx.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-5">
      <VideoHero
        page="transactions"
        innerPage
        height="h-48 md:h-56"
        title={<>{"\u{1F4CB}"} Transactions</>}
        subtitle={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} recorded on-chain`}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 focus:border-[#2a7c7c]" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-gray-400 text-sm mt-1">Register a product to see transactions here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-5 py-3 text-left font-medium">Type</th>
                  <th className="px-5 py-3 text-left font-medium">Stage</th>
                  <th className="px-5 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-left font-medium">Tx Hash</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{tx.productName || `#${tx.productId}`}</p>
                      <p className="text-xs text-gray-400">{tx.batchId}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 bg-[#e6f3f3] text-[#2a7c7c] rounded-lg text-xs font-medium">
                        {tx.type || "Transfer"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {tx.fromStage} <ArrowRight className="w-3 h-3 text-gray-300" /> {tx.toStage}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">${tx.price}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-[#2a7c7c]">{tx.txHash?.slice(0, 14)}...</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}<br />
                      <span className="text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
