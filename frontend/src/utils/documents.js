// ─── Document Management System ───
// Stores document metadata. Actual files are stored as base64 data URLs in localStorage.

const DOCS_KEY = "fairtrace_documents";

export const DOC_TYPES = [
  { id: "certificate", label: "Certificate", icon: "📜", description: "Fair trade or quality certificates" },
  { id: "export_doc", label: "Export Document", icon: "🚢", description: "Customs, export licenses, bills of lading" },
  { id: "invoice", label: "Invoice", icon: "🧾", description: "Invoices and payment records" },
  { id: "inspection", label: "Inspection Report", icon: "🔍", description: "Quality inspection and audit reports" },
  { id: "contract", label: "Contract", icon: "📄", description: "Purchase orders and agreements" },
  { id: "other", label: "Other", icon: "📎", description: "Other supporting documents" },
];

export function getDocuments(userEmail, productId = null) {
  const all = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
  let filtered = userEmail ? all.filter(d => d.uploaderEmail === userEmail) : all;
  if (productId) filtered = filtered.filter(d => d.productId === productId);
  return filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export function getDocumentById(docId) {
  const all = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
  return all.find(d => d.id === docId);
}

export function uploadDocument({ uploaderEmail, productId, type, name, description, fileData, fileName, fileSize, fileType }) {
  const all = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
  const doc = {
    id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    uploaderEmail,
    productId: productId || "",
    type: type || "other",
    name: name || fileName,
    description: description || "",
    fileName,
    fileSize,
    fileType,
    fileData, // base64 data URL
    uploadedAt: new Date().toISOString(),
    status: "active",
  };
  all.push(doc);
  localStorage.setItem(DOCS_KEY, JSON.stringify(all));
  return doc;
}

export function deleteDocument(docId) {
  const all = JSON.parse(localStorage.getItem(DOCS_KEY) || "[]");
  const idx = all.findIndex(d => d.id === docId);
  if (idx !== -1) {
    all.splice(idx, 1);
    localStorage.setItem(DOCS_KEY, JSON.stringify(all));
    return true;
  }
  return false;
}

export function getDocumentStats(userEmail) {
  const docs = getDocuments(userEmail);
  const totalSize = docs.reduce((sum, d) => sum + (d.fileSize || 0), 0);
  const byType = {};
  docs.forEach(d => { byType[d.type] = (byType[d.type] || 0) + 1; });
  return { total: docs.length, totalSize, byType };
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
