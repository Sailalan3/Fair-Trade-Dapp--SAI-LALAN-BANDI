import React from "react";
import { getTracking, STAGE_EMOJIS, ACTION_TO_ROLE_MAP } from "../utils/store";
import { formatAddress } from "./AddressForm";
import { formatPhone } from "./PhoneInput";

const COLORS = {
  Registered: "from-[#2a7c7c] to-[#1d5c5c]",
  Processed: "from-amber-500 to-orange-600",
  Roasted: "from-orange-500 to-red-500",
  Manufactured: "from-slate-500 to-gray-600",
  Warehoused: "from-cyan-500 to-teal-500",
  Stored: "from-cyan-500 to-teal-500",
  Reprocessed: "from-teal-500 to-teal-600",
  Exported: "from-[#2a7c7c] to-[#1d5c5c]",
  Retailed: "from-purple-500 to-violet-600",
  Sold: "from-emerald-500 to-green-600",
  Dispatched: "from-purple-500 to-purple-600",
  "Picked Up": "from-purple-400 to-[#2a7c7c]",
  "On the Way": "from-[#2a7c7c] to-cyan-500",
  "Out for Delivery": "from-cyan-500 to-teal-500",
  Delivered: "from-green-500 to-emerald-600",
  "Received for Processing": "from-amber-400 to-amber-600",
  "Received for Roasting": "from-orange-400 to-orange-600",
  "Received for Manufacturing": "from-slate-400 to-slate-600",
  "Received for Export": "from-[#2a7c7c] to-[#1d5c5c]",
  "Received for Retail": "from-green-400 to-green-600",
  "Received at Warehouse": "from-cyan-400 to-cyan-600",
  "In Transit": "from-indigo-500 to-indigo-600",
  Accepted: "from-emerald-400 to-emerald-600",
  Rejected: "from-red-500 to-red-600",
};

const BG = {
  Registered: "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  Processed: "bg-amber-50 border-amber-100 text-amber-900",
  Roasted: "bg-orange-50 border-orange-100 text-orange-900",
  Manufactured: "bg-slate-50 border-slate-100 text-slate-900",
  Warehoused: "bg-cyan-50 border-cyan-100 text-cyan-900",
  Stored: "bg-cyan-50 border-cyan-100 text-cyan-900",
  Reprocessed: "bg-teal-50 border-teal-100 text-teal-900",
  Exported: "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  Retailed: "bg-purple-50 border-purple-100 text-purple-900",
  Sold: "bg-green-50 border-emerald-100 text-green-900",
  Dispatched: "bg-purple-50 border-purple-100 text-purple-900",
  "Picked Up": "bg-purple-50 border-purple-100 text-purple-900",
  "On the Way": "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  "Out for Delivery": "bg-cyan-50 border-cyan-100 text-cyan-900",
  Delivered: "bg-green-50 border-green-100 text-green-900",
  "Received for Processing": "bg-amber-50 border-amber-100 text-amber-900",
  "Received for Roasting": "bg-orange-50 border-orange-100 text-orange-900",
  "Received for Manufacturing": "bg-slate-50 border-slate-100 text-slate-900",
  "Received for Export": "bg-[#e6f3f3] border-[#c5dfdf] text-[#1a4a4a]",
  "Received for Retail": "bg-green-50 border-green-100 text-green-900",
  "Received at Warehouse": "bg-cyan-50 border-cyan-100 text-cyan-900",
  "In Transit": "bg-indigo-50 border-indigo-100 text-indigo-900",
  Accepted: "bg-emerald-50 border-emerald-100 text-emerald-900",
  Rejected: "bg-red-50 border-red-100 text-red-900",
};

export default function TrackingTimeline({ productId, product }) {
  const tracking = getTracking(productId);

  return (
    <div className="space-y-0">
      {product && (
        <div className="relative flex gap-3 pb-4">
          {tracking.length > 0 && <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2a7c7c] to-[#1d5c5c] flex items-center justify-center text-base flex-shrink-0 shadow">
            {"\u{1F468}\u200D\u{1F33E}"}
          </div>
          <div className="flex-1 bg-[#e6f3f3] border border-[#c5dfdf] rounded-xl p-3">
            <p className="font-bold text-[#1a4a4a] text-xs uppercase">Farmer Registered</p>
            <p className="text-xs text-[#1d5c5c] mt-1">{"\u{1F464}"} {product.farmerName}</p>
            <p className="text-xs text-[#1d5c5c]">{"\u{1F4CD}"} {product.farmLocation}</p>
            <p className="text-xs text-[#1d5c5c]">{"\u{1F4B0}"} ${product.initialPrice}</p>
            {product.category && <p className="text-xs text-[#2a7c7c]">{"\u{1F4E6}"} {product.category}</p>}
            <p className="text-xs text-[#2a7c7c] mt-1">{new Date(product.createdAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      {tracking.map((entry, i) => {
        const color = COLORS[entry.stage] || COLORS.Registered;
        const bg = BG[entry.stage] || BG.Registered;
        const emoji = STAGE_EMOJIS[entry.stage] || "\u{1F4E6}";
        const isLast = i === tracking.length - 1;
        const roleLabel = entry.userRole || (ACTION_TO_ROLE_MAP && ACTION_TO_ROLE_MAP[entry.stage]) || "";
        const addr = entry.location?.address;
        const phone = entry.phone;

        return (
          <div key={i} className="relative flex gap-3 pb-4">
            {!isLast && <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200" />}
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-base flex-shrink-0 shadow`}>
              {emoji}
            </div>
            <div className={`flex-1 ${bg} border rounded-xl p-3`}>
              <p className="font-bold text-xs uppercase">{entry.stage}</p>
              {entry.actor && (
                <p className="text-xs mt-1">
                  {"\u{1F464}"} {entry.actor}{roleLabel ? ` (${roleLabel})` : ""}
                </p>
              )}
              {entry.price && <p className="text-xs">{"\u{1F4B0}"} ${entry.price}</p>}
              {entry.notes && <p className="text-xs opacity-70">{entry.notes}</p>}

              {/* Structured address */}
              {addr && (addr.line1 || addr.city) && (
                <p className="text-xs mt-1">{"\u{1F4CD}"} {formatAddress(addr)}</p>
              )}
              {/* Legacy location fields */}
              {!addr && entry.shippingCompany && <p className="text-xs">{"\u{1F69A}"} {entry.shippingCompany}</p>}
              {!addr && entry.destination && <p className="text-xs">{"\u{1F30D}"} {entry.destination}</p>}

              {/* Phone */}
              {phone && phone.number && (
                <p className="text-xs">{"\u{1F4DE}"} {formatPhone(phone)}</p>
              )}

              {/* Movement type + region */}
              {entry.movementType && (
                <p className="text-xs">{entry.movementType === "import" ? "\u{1F4E5}" : "\u{1F4E4}"} {entry.movementType} {entry.regionType ? `(${entry.regionType})` : ""}</p>
              )}

              {/* Receipt link */}
              {entry.receiptId && (
                <p className="text-xs opacity-70">{"\u{1F9FE}"} Receipt: {entry.receiptId}</p>
              )}

              {entry.txHash && <p className="text-xs font-mono opacity-60">{"\u{1F517}"} {entry.txHash.slice(0, 16)}...</p>}
              <p className="text-xs opacity-60 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}

      {tracking.length === 0 && !product && (
        <p className="text-sm text-gray-400 text-center py-4">No tracking data yet</p>
      )}
    </div>
  );
}
