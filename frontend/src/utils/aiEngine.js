// ─── FairTrace AI Engine ───
// Local AI that reads product/tracking/transaction data and responds in natural language.
// No external API calls — all intelligence is rule-based with NLP-like pattern matching.

import { getAllProducts, getTracking, getAllTransactions, getDeliveries, getDeliveryByProduct, getUserByEmail, STAGE_EMOJIS } from "./store";

// ─── AI TRACKING ASSISTANT ───

const INTENT_PATTERNS = [
  { intent: "location", patterns: [/where\s*(is|are)/, /location/, /current\s*(position|place)/, /find\s*(my|the|this)\s*product/, /track/] },
  { intent: "handler", patterns: [/who\s*(has|handled|is\s*handling|owns|received)/, /current\s*(owner|handler|holder)/, /possession/, /held\s*by/] },
  { intent: "stage", patterns: [/what\s*(is|stage|status|state)/, /current\s*(stage|status|state|step)/, /progress/, /how\s*far/] },
  { intent: "journey", patterns: [/journey/, /history/, /timeline/, /full\s*(track|path|route)/, /all\s*(steps|stages)/, /how\s*did\s*it\s*get/] },
  { intent: "delivery", patterns: [/deliver/, /shipping/, /when\s*(will|does)/, /estimated/, /eta/, /arrival/, /dispatch/] },
  { intent: "price", patterns: [/price/, /cost/, /value/, /worth/, /how\s*much/] },
  { intent: "count", patterns: [/how\s*many/, /total\s*(products|items)/, /count/] },
  { intent: "summary", patterns: [/summar/, /overview/, /tell\s*me\s*about/, /describe/, /explain/, /details/] },
  { intent: "delay", patterns: [/delay/, /slow/, /late/, /bottleneck/, /stuck/, /taking\s*long/] },
  { intent: "receipt", patterns: [/receipt/, /invoice/, /bill/, /payment/] },
];

function detectIntent(query) {
  const lower = query.toLowerCase().trim();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) return intent;
    }
  }
  return "general";
}

function extractProductRef(query) {
  // Try to find product ID like BLK-123, #123, or product name
  const idMatch = query.match(/(?:BLK-?|#|id\s*[:=]?\s*)(\d+)/i);
  if (idMatch) return { type: "id", value: idMatch[1] };

  // Try product name
  const products = getAllProducts();
  const lower = query.toLowerCase();
  for (const p of products) {
    if (lower.includes(p.productName?.toLowerCase())) {
      return { type: "name", value: p.productName, product: p };
    }
  }
  return null;
}

function findProduct(query) {
  const ref = extractProductRef(query);
  if (!ref) return null;

  const products = getAllProducts();
  if (ref.type === "id") {
    return products.find(p => String(p.blockchainId) === ref.value);
  }
  if (ref.product) return ref.product;
  return null;
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function formatLocation(loc) {
  if (!loc) return "unknown location";
  if (typeof loc === "string") return loc;
  const parts = [loc.address, loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : `(${loc.lat?.toFixed(4)}, ${loc.lng?.toFixed(4)})`;
}

// ─── RESPONSE GENERATORS ───

function respondLocation(product, tracking) {
  if (!product) return "I couldn't find that product. Could you provide a product name or ID (e.g., BLK-123)?";

  const last = tracking[tracking.length - 1];
  const owner = getUserByEmail(product.ownerEmail);
  const ownerName = owner?.fullName || product.ownerEmail;
  const loc = last?.location ? formatLocation(last.location) : "an unspecified location";
  const delivery = getDeliveryByProduct(product.blockchainId);

  let response = `${STAGE_EMOJIS[product.currentStage] || "📦"} **${product.productName}** is currently at the **${product.currentStage}** stage.\n\n`;
  response += `📍 **Location:** ${loc}\n`;
  response += `👤 **Current handler:** ${ownerName}\n`;

  if (delivery && delivery.status !== "Delivered") {
    response += `🚚 **Delivery status:** ${delivery.status}\n`;
  }

  if (last?.timestamp) {
    response += `🕐 **Last updated:** ${timeAgo(last.timestamp)}`;
  }

  return response;
}

function respondHandler(product, tracking) {
  if (!product) return "I couldn't find that product. Please provide a product name or ID.";

  const owner = getUserByEmail(product.ownerEmail);
  const ownerName = owner?.fullName || product.ownerEmail;
  const last = tracking[tracking.length - 1];
  const prevOwner = product.previousOwner ? getUserByEmail(product.previousOwner) : null;

  let response = `👤 **${product.productName}** is currently held by **${ownerName}**`;
  if (last?.userRole) response += ` (acting as ${last.userRole})`;
  response += ".\n\n";

  if (prevOwner) {
    response += `📋 **Previous handler:** ${prevOwner.fullName || product.previousOwner}\n`;
  }

  if (product.ownerHistory?.length > 0) {
    response += `\n📜 **Ownership chain** (${product.ownerHistory.length + 1} handlers total):\n`;
    product.ownerHistory.forEach((h, i) => {
      response += `${i + 1}. ${h.name} (${h.role})\n`;
    });
    response += `${product.ownerHistory.length + 1}. ${ownerName} ← **current**\n`;
  }

  return response;
}

function respondStage(product) {
  if (!product) return "I couldn't find that product. Please provide a product name or ID.";

  const emoji = STAGE_EMOJIS[product.currentStage] || "📦";
  let response = `${emoji} **${product.productName}** is currently at the **${product.currentStage}** stage.\n\n`;
  response += `📂 **Category:** ${product.category}\n`;
  response += `💰 **Current value:** £${product.currentPrice || "N/A"}\n`;
  response += `📊 **Status:** ${product.status === "closed" ? "Sold / Closed" : "Active"}\n`;

  return response;
}

function respondJourney(product, tracking) {
  if (!product) return "I couldn't find that product. Please provide a product name or ID.";

  let response = `📜 **Full journey of ${product.productName}** (${tracking.length} steps):\n\n`;

  if (tracking.length === 0) {
    response += "No tracking entries found yet. The product has just been registered.";
    return response;
  }

  tracking.forEach((t, i) => {
    const emoji = STAGE_EMOJIS[t.stage] || "📦";
    const loc = t.location ? formatLocation(t.location) : "";
    response += `**${i + 1}.** ${emoji} ${t.stage}`;
    if (t.actor) response += ` — by ${t.actor}`;
    if (t.userRole) response += ` (${t.userRole})`;
    response += `\n`;
    if (loc) response += `   📍 ${loc}\n`;
    if (t.timestamp) response += `   🕐 ${new Date(t.timestamp).toLocaleString()}\n`;
    response += "\n";
  });

  return response;
}

function respondDelivery(product) {
  if (!product) return "I couldn't find that product. Please provide a product name or ID.";

  const delivery = getDeliveryByProduct(product.blockchainId);
  if (!delivery) {
    return `📦 **${product.productName}** does not have an active delivery. It is currently at the **${product.currentStage}** stage.`;
  }

  let response = `🚚 **Delivery Status for ${product.productName}:**\n\n`;
  response += `📊 **Current status:** ${delivery.status}\n`;
  response += `🏷 **Delivery ID:** ${delivery.deliveryId}\n`;

  if (delivery.transporterName) response += `👤 **Transporter:** ${delivery.transporterName}\n`;
  if (delivery.receiverName) response += `📬 **Receiver:** ${delivery.receiverName}\n`;

  if (delivery.statusHistory?.length > 0) {
    response += "\n**Timeline:**\n";
    delivery.statusHistory.forEach(s => {
      response += `• ${s.status} — ${new Date(s.timestamp).toLocaleString()}\n`;
    });
  }

  // Estimate delivery time based on status
  const statuses = ["Dispatched", "Picked Up", "On the Way", "Out for Delivery", "Delivered"];
  const currentIdx = statuses.indexOf(delivery.status);
  const remaining = statuses.length - 1 - currentIdx;
  if (remaining > 0 && delivery.status !== "Delivered") {
    // Rough estimate: average 4-8 hours per step
    const estHours = remaining * 6;
    response += `\n⏱ **Estimated time remaining:** ~${estHours} hours (${remaining} step${remaining > 1 ? "s" : ""} left)`;
  } else if (delivery.status === "Delivered") {
    response += `\n✅ **Delivered** at ${new Date(delivery.completedAt).toLocaleString()}`;
  }

  return response;
}

function respondPrice(product) {
  if (!product) return "I couldn't find that product. Please provide a product name or ID.";
  return `💰 **${product.productName}** is currently valued at **£${product.currentPrice || "N/A"}**.\nStage: ${product.currentStage} | Category: ${product.category}`;
}

function respondCount(userEmail) {
  const all = getAllProducts();
  const mine = userEmail ? all.filter(p => p.ownerEmail === userEmail) : [];
  const txs = getAllTransactions();

  let response = `📊 **System Overview:**\n\n`;
  response += `📦 **Total products:** ${all.length}\n`;
  response += `✅ **Active:** ${all.filter(p => p.status !== "closed").length}\n`;
  response += `🔒 **Sold/Closed:** ${all.filter(p => p.status === "closed").length}\n`;
  response += `📝 **Total transactions:** ${txs.length}\n`;

  if (userEmail && mine.length > 0) {
    response += `\n👤 **Your products:** ${mine.length}`;
  }

  return response;
}

function respondSummary(product, tracking) {
  if (!product) return respondCount();

  const owner = getUserByEmail(product.ownerEmail);
  let response = `📋 **Product Summary: ${product.productName}**\n\n`;
  response += `🆔 **ID:** BLK-${product.blockchainId}\n`;
  response += `📂 **Category:** ${product.category}\n`;
  response += `${STAGE_EMOJIS[product.currentStage] || "📦"} **Stage:** ${product.currentStage}\n`;
  response += `💰 **Price:** £${product.currentPrice || "N/A"}\n`;
  response += `👤 **Owner:** ${owner?.fullName || product.ownerEmail}\n`;
  response += `📊 **Status:** ${product.status === "closed" ? "Sold / Closed" : "Active"}\n`;
  response += `📝 **Journey steps:** ${tracking.length}\n`;
  response += `📅 **Registered:** ${new Date(product.createdAt).toLocaleDateString()}\n`;

  if (product.categoryData) {
    response += `\n**Details:**\n`;
    Object.entries(product.categoryData).forEach(([key, val]) => {
      if (val) response += `• ${key}: ${val}\n`;
    });
  }

  return response;
}

function respondDelay(product, tracking) {
  if (!product) {
    // Global delay analysis
    const all = getAllProducts().filter(p => p.status !== "closed");
    const txs = getAllTransactions();
    let response = `⏱ **Supply Chain Delay Analysis:**\n\n`;

    if (all.length === 0) {
      return "No active products to analyze for delays.";
    }

    // Find products with long gaps between updates
    let delayed = [];
    for (const p of all) {
      const pTracking = getTracking(p.blockchainId);
      if (pTracking.length > 0) {
        const last = pTracking[pTracking.length - 1];
        const hoursSince = (Date.now() - new Date(last.timestamp)) / 3600000;
        if (hoursSince > 24) {
          delayed.push({ product: p, hours: Math.round(hoursSince), lastStage: last.stage });
        }
      }
    }

    if (delayed.length === 0) {
      response += "✅ No significant delays detected. All products are moving through the chain normally.";
    } else {
      response += `⚠️ **${delayed.length} product(s) with potential delays:**\n\n`;
      delayed.sort((a, b) => b.hours - a.hours).slice(0, 5).forEach(d => {
        response += `• **${d.product.productName}** — stuck at ${d.lastStage} for ${d.hours}h\n`;
      });
    }
    return response;
  }

  // Product-specific delay
  if (tracking.length < 2) return `📦 **${product.productName}** only has ${tracking.length} tracking entry. Not enough data to analyze delays.`;

  let response = `⏱ **Delay Analysis for ${product.productName}:**\n\n`;
  let totalHours = 0;
  let maxGap = { hours: 0, from: "", to: "" };

  for (let i = 1; i < tracking.length; i++) {
    const gap = (new Date(tracking[i].timestamp) - new Date(tracking[i - 1].timestamp)) / 3600000;
    totalHours += gap;
    if (gap > maxGap.hours) {
      maxGap = { hours: gap, from: tracking[i - 1].stage, to: tracking[i].stage };
    }
    response += `• ${tracking[i - 1].stage} → ${tracking[i].stage}: **${gap.toFixed(1)}h**\n`;
  }

  response += `\n📊 **Average time between stages:** ${(totalHours / (tracking.length - 1)).toFixed(1)}h\n`;

  if (maxGap.hours > 24) {
    response += `⚠️ **Bottleneck:** ${maxGap.from} → ${maxGap.to} took ${maxGap.hours.toFixed(1)} hours (longest gap)`;
  }

  return response;
}

function respondReceipt(product) {
  if (!product) return "Please specify a product to look up receipts for.";

  const receipts = JSON.parse(localStorage.getItem("fairtrace_receipts") || "[]");
  const productReceipts = receipts.filter(r => String(r.productId || r.blockchainId) === String(product.blockchainId));

  if (productReceipts.length === 0) return `No receipts found for **${product.productName}**.`;

  let response = `🧾 **Receipts for ${product.productName}** (${productReceipts.length}):\n\n`;
  productReceipts.forEach(r => {
    response += `• **${r.receiptId}** — ${r.action} | £${r.price || "N/A"} | ${new Date(r.timestamp).toLocaleDateString()}\n`;
    if (r.from?.name && r.to?.name) response += `  ${r.from.name} → ${r.to.name}\n`;
  });

  return response;
}

// ─── MAIN CHAT FUNCTION ───

export function askAI(query, userEmail = null) {
  const intent = detectIntent(query);
  const product = findProduct(query);
  const tracking = product ? getTracking(product.blockchainId) : [];

  switch (intent) {
    case "location": return respondLocation(product, tracking);
    case "handler": return respondHandler(product, tracking);
    case "stage": return respondStage(product);
    case "journey": return respondJourney(product, tracking);
    case "delivery": return respondDelivery(product);
    case "price": return respondPrice(product);
    case "count": return respondCount(userEmail);
    case "summary": return respondSummary(product, tracking);
    case "delay": return respondDelay(product, tracking);
    case "receipt": return respondReceipt(product);
    default:
      if (product) return respondSummary(product, tracking);
      return respondGeneral(query, userEmail);
  }
}

function respondGeneral(query, userEmail) {
  const all = getAllProducts();
  const txs = getAllTransactions();

  let response = "🤖 **FairTrace AI Assistant**\n\n";
  response += "I can help you with:\n\n";
  response += "• **\"Where is [product name]?\"** — Track product location\n";
  response += "• **\"Who has [product name]?\"** — Find current handler\n";
  response += "• **\"What is the status of [product name]?\"** — Check stage\n";
  response += "• **\"Show journey of [product name]\"** — Full timeline\n";
  response += "• **\"Delivery status of [product name]\"** — Shipping info\n";
  response += "• **\"How much is [product name]?\"** — Price check\n";
  response += "• **\"How many products?\"** — System stats\n";
  response += "• **\"Any delays?\"** — Delay analysis\n";
  response += "• **\"Receipts for [product name]\"** — Invoice lookup\n";

  if (all.length > 0) {
    response += `\n📊 **Quick stats:** ${all.length} products, ${txs.length} transactions`;
    if (userEmail) {
      const mine = all.filter(p => p.ownerEmail === userEmail);
      if (mine.length > 0) response += `, ${mine.length} owned by you`;
    }
  }

  return response;
}

// ─── AI INSIGHTS & ANALYTICS ───

export function getAIInsights(userEmail = null) {
  const products = getAllProducts();
  const transactions = getAllTransactions();
  const deliveries = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");

  const insights = [];

  // 1. Delivery performance
  const completedDeliveries = deliveries.filter(d => d.completedAt);
  if (completedDeliveries.length > 0) {
    const avgDeliveryTime = completedDeliveries.reduce((sum, d) => {
      return sum + (new Date(d.completedAt) - new Date(d.createdAt)) / 3600000;
    }, 0) / completedDeliveries.length;

    insights.push({
      type: "delivery_performance",
      icon: "🚚",
      title: "Delivery Performance",
      value: `${avgDeliveryTime.toFixed(1)}h avg`,
      description: `Average delivery time across ${completedDeliveries.length} completed deliveries`,
      trend: avgDeliveryTime < 48 ? "good" : avgDeliveryTime < 96 ? "warning" : "bad",
    });
  }

  // 2. Supply chain bottlenecks
  const activeProducts = products.filter(p => p.status !== "closed");
  let bottlenecks = {};
  for (const p of activeProducts) {
    const tracking = getTracking(p.blockchainId);
    if (tracking.length > 0) {
      const last = tracking[tracking.length - 1];
      const hoursSince = (Date.now() - new Date(last.timestamp)) / 3600000;
      if (hoursSince > 24) {
        const stage = last.stage || "Unknown";
        bottlenecks[stage] = (bottlenecks[stage] || 0) + 1;
      }
    }
  }

  if (Object.keys(bottlenecks).length > 0) {
    const worstStage = Object.entries(bottlenecks).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      type: "bottleneck",
      icon: "⚠️",
      title: "Supply Chain Bottleneck",
      value: `${worstStage[1]} product${worstStage[1] > 1 ? "s" : ""} stuck`,
      description: `Products delayed at the ${worstStage[0]} stage for over 24 hours`,
      trend: "warning",
      stage: worstStage[0],
    });
  }

  // 3. Revenue insights
  const soldProducts = products.filter(p => p.status === "closed");
  if (soldProducts.length > 0) {
    const totalRevenue = soldProducts.reduce((sum, p) => sum + (parseFloat(p.currentPrice) || 0), 0);
    insights.push({
      type: "revenue",
      icon: "💰",
      title: "Total Revenue",
      value: `£${totalRevenue.toLocaleString()}`,
      description: `From ${soldProducts.length} sold product${soldProducts.length > 1 ? "s" : ""}`,
      trend: "good",
    });
  }

  // 4. Activity trend
  const last24h = transactions.filter(t => (Date.now() - new Date(t.timestamp)) < 86400000);
  const last48h = transactions.filter(t => {
    const age = Date.now() - new Date(t.timestamp);
    return age >= 86400000 && age < 172800000;
  });

  insights.push({
    type: "activity",
    icon: "📈",
    title: "Activity (24h)",
    value: `${last24h.length} transactions`,
    description: last24h.length > last48h.length
      ? `Up from ${last48h.length} in the previous 24h`
      : last24h.length < last48h.length
        ? `Down from ${last48h.length} in the previous 24h`
        : "Same as previous 24h",
    trend: last24h.length >= last48h.length ? "good" : "warning",
  });

  // 5. Product stage distribution
  const stageCount = {};
  products.forEach(p => {
    stageCount[p.currentStage] = (stageCount[p.currentStage] || 0) + 1;
  });

  if (Object.keys(stageCount).length > 0) {
    insights.push({
      type: "distribution",
      icon: "📊",
      title: "Stage Distribution",
      value: `${Object.keys(stageCount).length} stages active`,
      description: Object.entries(stageCount).map(([k, v]) => `${k}: ${v}`).join(", "),
      trend: "neutral",
      data: stageCount,
    });
  }

  // 6. Delivery prediction for active deliveries
  const activeDeliveries = deliveries.filter(d => !d.completedAt);
  if (activeDeliveries.length > 0) {
    insights.push({
      type: "delivery_prediction",
      icon: "🔮",
      title: "Active Deliveries",
      value: `${activeDeliveries.length} in transit`,
      description: activeDeliveries.map(d => `${d.productName || d.productId}: ${d.status}`).slice(0, 3).join(", "),
      trend: "neutral",
    });
  }

  return insights;
}

// ─── DELIVERY TIME PREDICTION ───

export function predictDeliveryTime(productId) {
  const delivery = getDeliveryByProduct(productId);
  if (!delivery) return null;

  const statuses = ["Dispatched", "Picked Up", "On the Way", "Out for Delivery", "Delivered"];
  const currentIdx = statuses.indexOf(delivery.status);
  const stepsRemaining = statuses.length - 1 - currentIdx;

  if (stepsRemaining <= 0) return { estimated: "Delivered", confidence: "high" };

  // Calculate avg time between steps from history
  const history = delivery.statusHistory || [];
  let avgStepTime = 6; // default 6 hours per step

  if (history.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < history.length; i++) {
      totalGap += (new Date(history[i].timestamp) - new Date(history[i - 1].timestamp)) / 3600000;
    }
    avgStepTime = totalGap / (history.length - 1);
  }

  const estimatedHours = stepsRemaining * avgStepTime;

  return {
    currentStatus: delivery.status,
    stepsRemaining,
    estimatedHours: Math.round(estimatedHours),
    estimatedArrival: new Date(Date.now() + estimatedHours * 3600000).toISOString(),
    confidence: history.length >= 3 ? "high" : history.length >= 2 ? "medium" : "low",
    avgStepTime: Math.round(avgStepTime * 10) / 10,
  };
}

// ─── SMART LOCATION VALIDATION ───

export function validateLocation(product, newLocation) {
  const tracking = getTracking(product.blockchainId);
  const warnings = [];

  if (tracking.length === 0) return { valid: true, warnings: [] };

  const last = tracking[tracking.length - 1];
  if (!last.location || !newLocation) return { valid: true, warnings: [] };

  // Check for unrealistic movements
  if (last.location.lat && last.location.lng && newLocation.lat && newLocation.lng) {
    const distance = haversineDistance(
      last.location.lat, last.location.lng,
      newLocation.lat, newLocation.lng
    );

    const timeDiff = (Date.now() - new Date(last.timestamp)) / 3600000; // hours

    if (timeDiff > 0) {
      const speed = distance / timeDiff; // km/h

      if (speed > 900) {
        warnings.push({
          type: "unrealistic_speed",
          severity: "high",
          message: `Movement of ${Math.round(distance)}km in ${timeDiff.toFixed(1)}h implies ${Math.round(speed)}km/h — faster than commercial flights.`,
        });
      } else if (speed > 200 && timeDiff < 1) {
        warnings.push({
          type: "fast_movement",
          severity: "medium",
          message: `Product moved ${Math.round(distance)}km in under an hour. Please verify this is correct.`,
        });
      }
    }

    // Check if crossing continents in short time
    if (distance > 5000 && timeDiff < 12) {
      warnings.push({
        type: "intercontinental_speed",
        severity: "high",
        message: `Intercontinental movement (${Math.round(distance)}km) in ${timeDiff.toFixed(1)}h seems unrealistic.`,
      });
    }
  }

  // Check for same location repeated
  if (last.location.lat && newLocation.lat) {
    const dist = haversineDistance(last.location.lat, last.location.lng, newLocation.lat, newLocation.lng);
    if (dist < 0.1) {
      warnings.push({
        type: "same_location",
        severity: "low",
        message: "New location is the same as the previous one.",
      });
    }
  }

  return {
    valid: warnings.filter(w => w.severity === "high").length === 0,
    warnings,
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── AI RECEIPT EXPLAINER ───

export function explainReceipt(receipt) {
  if (!receipt) return "No receipt data to explain.";

  const from = receipt.from?.name || "Unknown sender";
  const to = receipt.to?.name || "Unknown receiver";
  const action = receipt.action || "Unknown action";
  const price = receipt.price ? `£${receipt.price}` : "an unspecified amount";

  let explanation = `📋 **Receipt Summary:**\n\n`;

  switch (action.toLowerCase()) {
    case "transferred":
      explanation += `This product (**${receipt.productName}**) was transferred from **${from}** to **${to}** for ${price}. `;
      explanation += `This is an ownership transfer — ${to} now controls this product in the supply chain.`;
      break;
    case "sold":
      explanation += `This product (**${receipt.productName}**) was sold by **${from}** to **${to}** for ${price}. `;
      explanation += `This is a final sale — the product has reached its end consumer.`;
      break;
    case "exported":
      explanation += `This product (**${receipt.productName}**) was exported by **${from}** to **${to}** for ${price}. `;
      explanation += `This represents an international or inter-region movement in the supply chain.`;
      break;
    case "delivered":
      explanation += `This product (**${receipt.productName}**) was delivered by **${from}** to **${to}**. `;
      explanation += `The delivery has been confirmed and ownership has been transferred.`;
      break;
    default:
      explanation += `This product (**${receipt.productName}**) underwent a **${action}** action from **${from}** to **${to}** for ${price}.`;
  }

  if (receipt.location) {
    explanation += `\n\n📍 **Location:** ${formatLocation(receipt.location)}`;
  }

  if (receipt.txHash) {
    explanation += `\n🔗 **Blockchain TX:** ${receipt.txHash.slice(0, 10)}...`;
  }

  return explanation;
}
