import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

const STORAGE_KEY = "fairtrace_notifications";

function loadNotifications() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveNotifications(notifications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export default function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]); // live toast popups

  // Load on mount / user change
  useEffect(() => {
    if (user?.email) {
      const all = loadNotifications().filter(n => n.userEmail === user.email);
      setNotifications(all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } else {
      setNotifications([]);
    }
  }, [user?.email]);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    const all = loadNotifications();
    all.push(newNotif);
    saveNotifications(all);

    if (user?.email && newNotif.userEmail === user.email) {
      setNotifications(prev => [newNotif, ...prev]);

      // Show toast
      setToasts(prev => [...prev, { ...newNotif, toastId: newNotif.id }]);

      // Auto-dismiss toast after 5s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.toastId !== newNotif.id));
      }, 5000);
    }

    return newNotif;
  }, [user?.email]);

  const markAsRead = useCallback((notifId) => {
    const all = loadNotifications();
    const idx = all.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      all[idx].read = true;
      saveNotifications(all);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!user?.email) return;
    const all = loadNotifications();
    all.forEach(n => { if (n.userEmail === user.email) n.read = true; });
    saveNotifications(all);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user?.email]);

  const clearAll = useCallback(() => {
    if (!user?.email) return;
    const all = loadNotifications().filter(n => n.userEmail !== user.email);
    saveNotifications(all);
    setNotifications([]);
  }, [user?.email]);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      toasts,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      dismissToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── NOTIFICATION TYPES ───

export const NOTIFICATION_TYPES = {
  PRODUCT_RECEIVED: "product_received",
  PRODUCT_TRANSFERRED: "product_transferred",
  PRODUCT_SOLD: "product_sold",
  DELIVERY_UPDATE: "delivery_update",
  DELIVERY_COMPLETE: "delivery_complete",
  LOW_STOCK: "low_stock",
  ORDER_REQUEST: "order_request",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_REJECTED: "order_rejected",
  SYSTEM: "system",
};

export const NOTIFICATION_ICONS = {
  product_received: "📦",
  product_transferred: "🔄",
  product_sold: "💰",
  delivery_update: "🚚",
  delivery_complete: "✅",
  low_stock: "⚠️",
  order_request: "📋",
  order_accepted: "✅",
  order_rejected: "❌",
  system: "🔔",
};

// Persist a notification directly to localStorage (callable from non-React code like store.js)
export function persistNotification(type, userEmail, data) {
  const notif = createNotification(type, userEmail, data);
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const saved = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notif,
  };
  all.push(saved);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return saved;
}

// Helper to create typed notifications
export function createNotification(type, userEmail, data) {
  const icons = NOTIFICATION_ICONS;
  const templates = {
    product_received: {
      title: "Product Received",
      message: `You received "${data.productName}" from ${data.fromName}`,
      icon: icons.product_received,
    },
    product_transferred: {
      title: "Product Transferred",
      message: `"${data.productName}" has been transferred to ${data.toName}`,
      icon: icons.product_transferred,
    },
    product_sold: {
      title: "Product Sold",
      message: `"${data.productName}" was sold for £${data.price}`,
      icon: icons.product_sold,
    },
    delivery_update: {
      title: "Delivery Update",
      message: `"${data.productName}" is now "${data.status}"`,
      icon: icons.delivery_update,
    },
    delivery_complete: {
      title: "Delivery Complete",
      message: `"${data.productName}" has been delivered`,
      icon: icons.delivery_complete,
    },
    low_stock: {
      title: "Low Stock Alert",
      message: `Only ${data.quantity} units remaining${data.location ? ` at ${data.location}` : ""}`,
      icon: icons.low_stock,
    },
    order_request: {
      title: "New Order Request",
      message: `${data.buyerName} requested "${data.productName}"`,
      icon: icons.order_request,
    },
    order_accepted: {
      title: "Order Accepted",
      message: `Your order for "${data.productName}" was accepted`,
      icon: icons.order_accepted,
    },
    order_rejected: {
      title: "Order Rejected",
      message: `Your order for "${data.productName}" was rejected`,
      icon: icons.order_rejected,
    },
    system: {
      title: data.title || "System Notification",
      message: data.message || "",
      icon: icons.system,
    },
  };

  const template = templates[type] || templates.system;
  return {
    userEmail,
    type,
    ...template,
    data,
  };
}
