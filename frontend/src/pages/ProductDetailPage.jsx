import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, getProductHistory, getProductQR } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  Package,
  MapPin,
  Calendar,
  Award,
  ArrowRight,
  QrCode,
  ExternalLink,
  ArrowLeftRight,
  Loader2,
} from "lucide-react";

const STAGE_CONFIG = {
  Registered: { color: "bg-[#2a7c7c]", text: "text-[#1d5c5c]", bg: "bg-[#e6f3f3]", label: "Farmer" },
  Processed: { color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "Processor" },
  Exported: { color: "bg-[#2a7c7c]", text: "text-[#1d5c5c]", bg: "bg-[#e6f3f3]", label: "Exporter" },
  Retailed: { color: "bg-[#2a7c7c]", text: "text-[#1d5c5c]", bg: "bg-[#e6f3f3]", label: "Retailer" },
  Sold: { color: "bg-[#2a7c7c]", text: "text-[#1d5c5c]", bg: "bg-[#e6f3f3]", label: "Sold" },
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [prodRes, histRes, qrRes] = await Promise.all([
          getProduct(id),
          getProductHistory(id),
          getProductQR(id),
        ]);
        setProduct(prodRes.data.product);
        setHistory(histRes.data.transactions || []);
        setQrCode(qrRes.data.qrCode);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  const stageConf = STAGE_CONFIG[product.currentStage] || STAGE_CONFIG.Registered;
  const isOwner = user?.walletAddress?.toLowerCase() === product.currentOwner?.toLowerCase();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {product.productName}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${stageConf.text} ${stageConf.bg}`}
            >
              {product.currentStage}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Batch: {product.batchId} &middot; ID: #{product.blockchainId}
          </p>
        </div>
        {isOwner && product.currentStage !== "Sold" && (
          <Link
            to={`/transfer/${product.blockchainId}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer Ownership
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Package, label: "Product Type", value: product.productType },
                { icon: MapPin, label: "Farm Location", value: product.farmLocation },
                { icon: Calendar, label: "Harvest Date", value: new Date(product.harvestDate).toLocaleDateString() },
                { icon: Award, label: "Certification", value: product.certification },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Farmer</p>
                <p className="text-sm font-medium text-gray-900">{product.farmerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Quantity</p>
                <p className="text-sm font-medium text-gray-900">
                  {product.quantity} {product.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Initial Price</p>
                <p className="text-sm font-medium text-gray-900">${product.initialPrice}</p>
              </div>
            </div>
          </div>

          {/* Supply Chain Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Supply Chain Journey</h2>

            {/* Registration entry */}
            <div className="relative pl-8 pb-6">
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#2a7c7c] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              {history.length > 0 && (
                <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-gray-200" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">Product Registered</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  By {product.farmerName} &middot; ${product.initialPrice}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Transaction entries */}
            {history.map((tx, i) => {
              const conf = STAGE_CONFIG[tx.toStage] || STAGE_CONFIG.Registered;
              const isLast = i === history.length - 1;
              return (
                <div key={tx._id} className="relative pl-8 pb-6">
                  <div
                    className={`absolute left-0 top-1 w-6 h-6 rounded-full ${conf.color} flex items-center justify-center`}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {!isLast && (
                    <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {tx.fromStage} → {tx.toStage}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${conf.text} ${conf.bg}`}>
                        {conf.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.sellerName || tx.seller?.slice(0, 10) + "..."} →{" "}
                      {tx.buyerName || tx.buyer?.slice(0, 10) + "..."} &middot; ${tx.price}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(tx.timestamp || tx.createdAt).toLocaleString()}
                      </span>
                      {tx.txHash && (
                        <span className="text-xs text-primary-600 font-mono">
                          {tx.txHash.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {history.length === 0 && (
              <p className="text-sm text-gray-400 ml-8">
                No transfers yet. Product is still with the farmer.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar - QR Code */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
            <QrCode className="w-6 h-6 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-3">Tracking QR Code</h3>
            {qrCode && (
              <img
                src={qrCode}
                alt="Product QR Code"
                className="w-48 h-48 mx-auto rounded-lg border border-gray-100"
              />
            )}
            <p className="text-xs text-gray-400 mt-3">
              Scan to view public tracking page
            </p>
            <a
              href={`/track/${product.blockchainId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700"
            >
              Open tracking page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Current Owner */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Current Owner</h3>
            <p className="text-sm font-mono text-gray-600 break-all">
              {product.currentOwner}
            </p>
            {product.registrationTxHash && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Registration Tx</p>
                <p className="text-xs font-mono text-gray-600 break-all mt-1">
                  {product.registrationTxHash}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
