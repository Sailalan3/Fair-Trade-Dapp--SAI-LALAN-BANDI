import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications, NOTIFICATION_ICONS } from "../context/NotificationContext";

export function NotificationBell() {
  const { unreadCount, notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 text-[#2c3e50]/60 hover:text-[#2a7c7c] transition rounded-lg hover:bg-[#f5f3ee]">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#e8604c] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-h-[480px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#f5f3ee]">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#2c3e50] text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#e8604c] text-white text-[10px] font-bold rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] text-[#2a7c7c] hover:underline font-medium flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="ml-2 text-gray-400 hover:text-[#e8604c] transition" title="Clear all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition hover:bg-[#f5f3ee]/50 ${!n.read ? "bg-[#2a7c7c]/[0.03]" : ""}`}>
                  <div className="text-xl mt-0.5 flex-shrink-0">
                    {NOTIFICATION_ICONS[n.type] || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${!n.read ? "font-semibold text-[#2c3e50]" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      {!n.read && <div className="w-2 h-2 bg-[#2a7c7c] rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed top-16 right-4 z-[60] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.toastId}
          className="pointer-events-auto bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 flex items-start gap-3 max-w-[360px] animate-slide-in-right">
          <span className="text-xl flex-shrink-0">{NOTIFICATION_ICONS[toast.type] || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2c3e50]">{toast.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{toast.message}</p>
          </div>
          <button onClick={() => dismissToast(toast.toastId)} className="text-gray-300 hover:text-gray-500 transition flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
