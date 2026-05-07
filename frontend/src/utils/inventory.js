// ─── Inventory / Warehouse Management ───

const INVENTORY_KEY = "fairtrace_inventory";

export const RACK_ZONES = ["A", "B", "C", "D", "E"];
export const RACK_LEVELS = [1, 2, 3, 4, 5];

export function generateRackLocation() {
  const zone = RACK_ZONES[Math.floor(Math.random() * RACK_ZONES.length)];
  const level = RACK_LEVELS[Math.floor(Math.random() * RACK_LEVELS.length)];
  const slot = Math.floor(Math.random() * 20) + 1;
  return `${zone}${level}-${String(slot).padStart(2, "0")}`;
}

export function getInventory(warehouseEmail = null) {
  const all = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "[]");
  if (!warehouseEmail) return all;
  return all.filter(i => i.warehouseEmail === warehouseEmail);
}

export function getInventoryItem(productId, warehouseEmail) {
  const all = getInventory();
  return all.find(i => String(i.productId) === String(productId) && i.warehouseEmail === warehouseEmail);
}

export function addToInventory({ warehouseEmail, productId, productName, category, quantity, rackLocation, notes }) {
  const all = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "[]");

  const existing = all.findIndex(i => String(i.productId) === String(productId) && i.warehouseEmail === warehouseEmail);

  if (existing !== -1) {
    all[existing].quantity = (all[existing].quantity || 0) + (parseInt(quantity) || 1);
    all[existing].updatedAt = new Date().toISOString();
    if (rackLocation) all[existing].rackLocation = rackLocation;
  } else {
    all.push({
      id: `INV-${Date.now()}`,
      warehouseEmail,
      productId,
      productName: productName || "",
      category: category || "",
      quantity: parseInt(quantity) || 1,
      rackLocation: rackLocation || generateRackLocation(),
      notes: notes || "",
      status: "in_stock",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(all));
  return getInventoryItem(productId, warehouseEmail);
}

export function updateInventoryQuantity(productId, warehouseEmail, newQuantity) {
  const all = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "[]");
  const idx = all.findIndex(i => String(i.productId) === String(productId) && i.warehouseEmail === warehouseEmail);
  if (idx === -1) return null;

  all[idx].quantity = Math.max(0, parseInt(newQuantity) || 0);
  all[idx].updatedAt = new Date().toISOString();
  all[idx].status = all[idx].quantity === 0 ? "out_of_stock" : all[idx].quantity <= 5 ? "low_stock" : "in_stock";

  localStorage.setItem(INVENTORY_KEY, JSON.stringify(all));
  return all[idx];
}

export function removeFromInventory(productId, warehouseEmail, quantity = 1) {
  const item = getInventoryItem(productId, warehouseEmail);
  if (!item) return null;
  return updateInventoryQuantity(productId, warehouseEmail, item.quantity - quantity);
}

export function getInventoryStats(warehouseEmail) {
  const inventory = getInventory(warehouseEmail);
  const totalItems = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= 5);
  const outOfStock = inventory.filter(i => i.quantity === 0);
  const inStock = inventory.filter(i => i.quantity > 5);

  // Rack utilization
  const usedRacks = new Set(inventory.filter(i => i.quantity > 0).map(i => i.rackLocation)).size;
  const totalRacks = RACK_ZONES.length * RACK_LEVELS.length * 20; // zones * levels * slots

  // Categories breakdown
  const categories = {};
  inventory.forEach(i => {
    if (i.quantity > 0) {
      categories[i.category || "other"] = (categories[i.category || "other"] || 0) + i.quantity;
    }
  });

  return {
    totalProducts: inventory.length,
    totalItems,
    inStock: inStock.length,
    lowStock: lowStock.length,
    outOfStock: outOfStock.length,
    lowStockItems: lowStock,
    rackUtilization: Math.round((usedRacks / totalRacks) * 100),
    categories,
  };
}

export function getLowStockAlerts(warehouseEmail) {
  const inventory = getInventory(warehouseEmail);
  return inventory
    .filter(i => i.quantity > 0 && i.quantity <= 5)
    .map(i => ({
      ...i,
      alertLevel: i.quantity <= 2 ? "critical" : "warning",
      message: `Only ${i.quantity} unit${i.quantity !== 1 ? "s" : ""} remaining for ${i.productName} at ${i.rackLocation}`,
    }));
}
