// ─── User Profile & Reputation System ───

import { getAllProducts, getAllTransactions, getReceipts } from "./store";

const RATINGS_KEY = "fairtrace_ratings";

export function getUserReputation(userEmail) {
  if (!userEmail) return null;

  const products = getAllProducts();
  const transactions = getAllTransactions();
  const receipts = JSON.parse(localStorage.getItem("fairtrace_receipts") || "[]");
  const ratings = getRatings(userEmail);
  const deliveries = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");

  // Products handled
  const ownedProducts = products.filter(p => p.ownerEmail === userEmail);
  const previousProducts = products.filter(p => p.previousOwner === userEmail);
  const soldProducts = products.filter(p =>
    transactions.some(t => String(t.productId) === String(p.blockchainId) && t.seller === userEmail && t.flowType === "sell")
  );

  // Transactions
  const userTx = transactions.filter(t => t.seller === userEmail || t.buyer === userEmail);
  const transfers = userTx.filter(t => t.flowType === "transfer");
  const sales = userTx.filter(t => t.flowType === "sell");

  // Revenue
  const totalRevenue = sales.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

  // Delivery stats
  const userDeliveries = deliveries.filter(d => d.transporterEmail === userEmail);
  const completedDeliveries = userDeliveries.filter(d => d.completedAt);
  const deliverySuccessRate = userDeliveries.length > 0
    ? Math.round((completedDeliveries.length / userDeliveries.length) * 100) : 100;

  // Average rating
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : 0;

  // Trust score (0-100)
  let trustScore = 50; // baseline
  trustScore += Math.min(userTx.length * 2, 20); // up to 20 for transactions
  trustScore += Math.min(ownedProducts.length + previousProducts.length, 10); // up to 10 for products
  trustScore += avgRating > 0 ? (avgRating / 5) * 15 : 0; // up to 15 for rating
  trustScore += (deliverySuccessRate / 100) * 5; // up to 5 for delivery success
  trustScore = Math.min(100, Math.round(trustScore));

  // Level
  let level = "New Member";
  if (trustScore >= 90) level = "Platinum Trader";
  else if (trustScore >= 75) level = "Gold Trader";
  else if (trustScore >= 60) level = "Silver Trader";
  else if (trustScore >= 40) level = "Bronze Trader";

  // Member since
  const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
  const userRecord = users.find(u => u.email === userEmail);
  const memberSince = userRecord?.createdAt || new Date().toISOString();

  return {
    totalProducts: ownedProducts.length + previousProducts.length,
    activeProducts: ownedProducts.length,
    totalTransactions: userTx.length,
    transfers: transfers.length,
    sales: sales.length,
    totalRevenue,
    deliveries: userDeliveries.length,
    completedDeliveries: completedDeliveries.length,
    deliverySuccessRate,
    avgRating,
    ratingCount: ratings.length,
    trustScore,
    level,
    memberSince,
  };
}

// ─── Ratings ───

export function getRatings(userEmail) {
  const all = JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
  return all.filter(r => r.ratedUserEmail === userEmail);
}

export function addRating(fromEmail, toEmail, rating, comment = "", productId = "") {
  const all = JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");

  // Check for duplicate rating on same product
  const existing = all.findIndex(r =>
    r.raterEmail === fromEmail && r.ratedUserEmail === toEmail && r.productId === productId
  );
  if (existing !== -1) {
    all[existing] = { ...all[existing], rating, comment, updatedAt: new Date().toISOString() };
  } else {
    all.push({
      id: `RATE-${Date.now()}`,
      raterEmail: fromEmail,
      ratedUserEmail: toEmail,
      productId,
      rating: Math.min(5, Math.max(1, rating)),
      comment,
      timestamp: new Date().toISOString(),
    });
  }
  localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
}

// ─── Star display helper ───

export function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}
