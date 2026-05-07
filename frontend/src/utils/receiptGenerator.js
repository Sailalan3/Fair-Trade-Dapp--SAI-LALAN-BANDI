import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── CURRENCY SUPPORT ───

export const CURRENCIES = {
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" },
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
};

// Approximate conversion rates (from GBP)
export const EXCHANGE_RATES = {
  GBP: 1,
  USD: 1.27,
  INR: 105.5,
  EUR: 1.17,
};

export function convertCurrency(amount, fromCurrency, toCurrency) {
  const inGBP = amount / (EXCHANGE_RATES[fromCurrency] || 1);
  return Math.round(inGBP * (EXCHANGE_RATES[toCurrency] || 1) * 100) / 100;
}

export function formatCurrency(amount, currency = "GBP") {
  const c = CURRENCIES[currency] || CURRENCIES.GBP;
  return `${c.symbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── TAX CALCULATION ───

export const TAX_RATES = {
  VAT_UK: { rate: 0.20, label: "VAT (20%)", region: "UK" },
  GST_IN: { rate: 0.18, label: "GST (18%)", region: "India" },
  VAT_EU: { rate: 0.21, label: "VAT (21%)", region: "EU" },
  SALES_US: { rate: 0.08, label: "Sales Tax (8%)", region: "US" },
  NONE: { rate: 0, label: "No Tax", region: "Global" },
};

export function calculateInvoice(subtotal, { taxType = "VAT_UK", discount = 0, discountType = "percent" } = {}) {
  const sub = parseFloat(subtotal) || 0;
  const tax = TAX_RATES[taxType] || TAX_RATES.NONE;

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = sub * (parseFloat(discount) || 0) / 100;
  } else {
    discountAmount = parseFloat(discount) || 0;
  }

  const afterDiscount = Math.max(0, sub - discountAmount);
  const taxAmount = afterDiscount * tax.rate;
  const total = afterDiscount + taxAmount;

  return {
    subtotal: Math.round(sub * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    discountPercent: discountType === "percent" ? discount : (sub > 0 ? Math.round((discountAmount / sub) * 10000) / 100 : 0),
    afterDiscount: Math.round(afterDiscount * 100) / 100,
    taxLabel: tax.label,
    taxRate: tax.rate,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ─── INVOICE NUMBER GENERATOR ───

export function generateInvoiceNumber() {
  const invoices = JSON.parse(localStorage.getItem("fairtrace_invoice_counter") || "0");
  const next = invoices + 1;
  localStorage.setItem("fairtrace_invoice_counter", JSON.stringify(next));
  const year = new Date().getFullYear();
  return `INV-${year}-${String(next).padStart(5, "0")}`;
}

// ─── HELPERS ───

function formatAddress(addr) {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
  return parts.join(", ") || "N/A";
}

function formatPhone(phone) {
  if (!phone) return "N/A";
  if (typeof phone === "string") return phone;
  return `${phone.countryCode || ""} ${phone.number || ""}`.trim() || "N/A";
}

// ─── HELPER: get finalY after autoTable ───
function getFinalY(doc, tableResult, fallbackY) {
  // Try every known property across jspdf-autotable versions
  return tableResult?.finalY
    ?? doc.lastAutoTable?.finalY
    ?? doc.previousAutoTable?.finalY
    ?? fallbackY;
}

function safeAutoTable(doc, opts) {
  let capturedY = opts.startY || 0;
  const origDidDrawCell = opts.didDrawCell;
  const result = autoTable(doc, {
    ...opts,
    didDrawCell: (hookData) => {
      // Track the lowest Y drawn
      const cellBottom = hookData.cell.y + hookData.cell.height;
      if (cellBottom > capturedY) capturedY = cellBottom;
      if (origDidDrawCell) origDidDrawCell(hookData);
    },
  });
  // Return the best finalY we can find
  const finalY = getFinalY(doc, result, capturedY);
  return finalY;
}

// ─── ENHANCED RECEIPT / INVOICE PDF GENERATION ───

export function generateReceipt(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = data.currency || "GBP";
  const curr = CURRENCIES[currency] || CURRENCIES.GBP;
  let y = 20;

  // ──── HEADER ────
  doc.setFillColor(42, 124, 124);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("FairTrace", 14, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Supply Chain Invoice / Receipt", 14, y + 8);

  // Invoice number and date
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const invoiceNo = data.invoiceNumber || data.receiptId || "N/A";
  doc.text(invoiceNo, pageWidth - 14, y, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(data.timestamp || Date.now()).toLocaleString(), pageWidth - 14, y + 7, { align: "right" });

  // Payment status badge
  const paymentStatus = data.paymentStatus || "Paid";
  const statusColor = paymentStatus === "Paid" ? [39, 174, 96] : paymentStatus === "Pending" ? [243, 156, 18] : [231, 76, 60];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 50, y + 12, 36, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(paymentStatus.toUpperCase(), pageWidth - 32, y + 19, { align: "center" });

  y = 55;
  doc.setTextColor(0, 0, 0);

  // ──── FROM / TO ────
  doc.setFillColor(245, 243, 238);
  doc.rect(14, y - 4, pageWidth - 28, 36, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("FROM:", 20, y + 2);
  doc.text("TO:", pageWidth / 2 + 5, y + 2);

  doc.setFontSize(10);
  doc.setTextColor(44, 62, 80);
  doc.setFont("helvetica", "bold");
  doc.text(data.from?.name || "N/A", 20, y + 10);
  doc.text(data.to?.name || "N/A", pageWidth / 2 + 5, y + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  if (data.from?.role) doc.text(data.from.role, 20, y + 16);
  if (data.to?.role) doc.text(data.to.role, pageWidth / 2 + 5, y + 16);
  doc.text(data.from?.email || "", 20, y + 22);
  doc.text(data.to?.email || "", pageWidth / 2 + 5, y + 22);

  y += 40;

  // ──── PRODUCT DETAILS ────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(42, 124, 124);
  doc.text("Product Details", 14, y);
  y += 6;

  y = safeAutoTable(doc, {
    startY: y,
    head: [["Field", "Value"]],
    body: [
      ["Product Name", data.productName || "N/A"],
      ["Product ID", `BLK-${data.blockchainId || data.productId || "N/A"}`],
      ["Category", data.category || "N/A"],
      ["Action", data.action || "N/A"],
    ],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [42, 124, 124], textColor: [255, 255, 255], fontSize: 8, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [80, 80, 80] },
    },
    margin: { left: 14, right: 14 },
  }) + 10;

  // ──── FINANCIAL BREAKDOWN ────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(42, 124, 124);
  doc.text("Financial Summary", 14, y);
  y += 6;

  const subtotal = parseFloat(data.price) || 0;
  const invoice = calculateInvoice(subtotal, {
    taxType: data.taxType || "VAT_UK",
    discount: data.discount || 0,
    discountType: data.discountType || "percent",
  });

  const finBody = [
    ["Subtotal", formatCurrency(invoice.subtotal, currency)],
  ];

  if (invoice.discount > 0) {
    finBody.push([`Discount (${invoice.discountPercent}%)`, `- ${formatCurrency(invoice.discount, currency)}`]);
    finBody.push(["After Discount", formatCurrency(invoice.afterDiscount, currency)]);
  }

  if (invoice.taxRate > 0) {
    finBody.push([invoice.taxLabel, formatCurrency(invoice.taxAmount, currency)]);
  }

  finBody.push(["TOTAL", formatCurrency(invoice.total, currency)]);

  y = safeAutoTable(doc, {
    startY: y,
    head: [],
    body: finBody,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 80, textColor: [80, 80, 80] },
      1: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: function(cellData) {
      // Make TOTAL row bold and teal
      if (cellData.row.index === finBody.length - 1) {
        cellData.cell.styles.fillColor = [230, 243, 243];
        cellData.cell.styles.textColor = [42, 124, 124];
        cellData.cell.styles.fontSize = 12;
        cellData.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 14, right: 14 },
  }) + 10;

  // ──── LOCATION & CONTACT ────
  const locationStr = formatAddress(data.location?.address || data.location);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(42, 124, 124);
  doc.text("Location & Contact", 14, y);
  y += 6;

  const locationBody = [["Address", locationStr || "Not specified"]];
  if (data.location?.lat != null && data.location?.lng != null) {
    locationBody.push(["Coordinates", `${Number(data.location.lat).toFixed(6)}, ${Number(data.location.lng).toFixed(6)}`]);
  }
  locationBody.push(["Phone", formatPhone(data.phone)]);

  y = safeAutoTable(doc, {
    startY: y,
    head: [],
    body: locationBody,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [100, 100, 100] },
    },
    margin: { left: 14, right: 14 },
  }) + 10;

  // ──── BLOCKCHAIN INFO ────
  if (data.txHash) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Blockchain Transaction:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(data.txHash, 14, y + 5);
    y += 14;
  }

  // ──── FOOTER ────
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text("This is a digitally generated invoice by FairTrace - Blockchain Supply Chain Platform", pageWidth / 2, y, { align: "center" });
  doc.text(`Currency: ${curr.name} (${curr.code}) | Generated: ${new Date().toISOString()}`, pageWidth / 2, y + 5, { align: "center" });

  return doc;
}

export function downloadReceipt(data) {
  try {
    const doc = generateReceipt(data);
    doc.save(`${data.invoiceNumber || data.receiptId || "invoice"}.pdf`);
  } catch (err) {
    console.error("Receipt download error:", err);
    alert("Failed to generate invoice PDF. Please try again.");
  }
}

export function printReceipt(data) {
  try {
    const doc = generateReceipt(data);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => { printWindow.print(); };
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.invoiceNumber || data.receiptId || "invoice"}.pdf`;
      a.click();
    }
  } catch (err) {
    console.error("Receipt print error:", err);
    alert("Failed to generate invoice for printing. Please try again.");
  }
}
