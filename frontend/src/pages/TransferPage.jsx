import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProduct, transferProduct } from "../utils/api";
import { transferOwnershipOnChain, STAGE_NAMES } from "../utils/contract";
import { ArrowLeftRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function TransferPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    buyerAddress: "",
    buyerName: "",
    price: "",
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProduct(id);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.buyerAddress || !form.price) return;

    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      // Step 1: Transfer on blockchain
      const { txHash, blockNumber } = await transferOwnershipOnChain(
        parseInt(id),
        form.buyerAddress,
        parseInt(form.price)
      );

      // Step 2: Record in database
      const currentIdx = STAGE_NAMES.indexOf(product.currentStage);
      const nextStage = STAGE_NAMES[currentIdx + 1] || "Sold";

      await transferProduct(id, {
        buyer: form.buyerAddress,
        buyerName: form.buyerName,
        price: parseInt(form.price),
        txHash,
        blockNumber,
        toStage: nextStage,
      });

      setStatus({
        type: "success",
        message: `Ownership transferred! Tx: ${txHash.slice(0, 20)}...`,
      });

      setTimeout(() => navigate(`/products/${id}`), 2000);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Transfer failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!product) return <p className="text-gray-500">Product not found</p>;

  const currentIdx = STAGE_NAMES.indexOf(product.currentStage);
  const nextStage = STAGE_NAMES[currentIdx + 1] || "Sold";

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
        Transfer Ownership
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {product.productName} ({product.batchId})
      </p>

      {/* Stage transition */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-center gap-3">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {product.currentStage}
          </span>
          <ArrowLeftRight className="w-5 h-5 text-gray-400" />
          <span className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
            {nextStage}
          </span>
        </div>
      </div>

      {status.message && (
        <div
          className={`flex items-center gap-2 p-4 mb-6 rounded-xl text-sm ${
            status.type === "success"
              ? "bg-[#e6f3f3] text-[#1d5c5c]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Buyer Wallet Address *
          </label>
          <input
            type="text"
            value={form.buyerAddress}
            onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
            placeholder="0x..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Buyer Name
          </label>
          <input
            type="text"
            value={form.buyerName}
            onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
            placeholder="Name of buyer"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Sale Price (USD) *
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g. 150"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.buyerAddress || !form.price}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowLeftRight className="w-5 h-5" />
          )}
          {submitting ? "Processing on Blockchain..." : "Transfer Ownership"}
        </button>
      </div>
    </div>
  );
}
