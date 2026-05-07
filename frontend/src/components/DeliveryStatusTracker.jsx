import React from "react";
import { DELIVERY_STATUSES, STAGE_EMOJIS } from "../utils/store";
import { Check, Circle } from "lucide-react";

export default function DeliveryStatusTracker({ currentStatus, statusHistory, isOwner, onUpdateStatus }) {
  const currentIdx = DELIVERY_STATUSES.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900">Delivery Progress</h4>

      <div className="relative">
        {DELIVERY_STATUSES.map((status, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const isNext = idx === currentIdx + 1;
          const historyEntry = statusHistory?.find((h) => h.status === status);

          return (
            <div key={status} className="flex items-start gap-3 relative">
              {/* Line */}
              {idx < DELIVERY_STATUSES.length - 1 && (
                <div className={`absolute left-[13px] top-7 w-0.5 h-8 ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} />
              )}

              {/* Circle */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-6 ${isCurrent ? "" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                    {STAGE_EMOJIS[status] || ""} {status}
                  </span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-[#e6f3f3] text-[#2a7c7c] text-[10px] font-medium rounded-full">Current</span>
                  )}
                </div>

                {historyEntry && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(historyEntry.timestamp).toLocaleString()}
                    {historyEntry.location?.address?.city && ` - ${historyEntry.location.address.city}`}
                  </p>
                )}

                {/* Update button for next status */}
                {isNext && isOwner && onUpdateStatus && (
                  <button onClick={() => onUpdateStatus(status)}
                    className="mt-2 px-3 py-1.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white text-xs font-medium rounded-lg transition">
                    Mark as {status}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
