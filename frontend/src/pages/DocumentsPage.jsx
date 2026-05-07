import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getDocuments, uploadDocument, deleteDocument, DOC_TYPES, formatFileSize, getDocumentStats } from "../utils/documents";
import VideoHero from "../components/VideoHero";
import { FileText, Upload, Trash2, Download, Eye, X, Filter, FolderOpen, Plus, AlertCircle } from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [previewDoc, setPreviewDoc] = useState(null);

  const documents = getDocuments(user?.email);
  const stats = getDocumentStats(user?.email);

  const filtered = typeFilter === "all" ? documents : documents.filter(d => d.type === typeFilter);

  const handleDelete = (docId) => {
    if (window.confirm("Delete this document?")) {
      deleteDocument(docId);
      setRefresh(r => r + 1);
    }
  };

  const handleDownload = (doc) => {
    const a = document.createElement("a");
    a.href = doc.fileData;
    a.download = doc.fileName;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      <VideoHero page="receipts" compact>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">Documents</h1>
        <div className="w-12 h-[3px] bg-[#e8604c] my-2" />
        <p className="text-white/60 text-sm">Upload and manage certificates, invoices, and export documents</p>
      </VideoHero>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
          <FolderOpen className="w-5 h-5 text-[#2a7c7c]" />
          <div>
            <p className="text-lg font-bold text-[#2c3e50]">{stats.total}</p>
            <p className="text-[10px] text-gray-400">Documents</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-500" />
          <div>
            <p className="text-lg font-bold text-[#2c3e50]">{formatFileSize(stats.totalSize)}</p>
            <p className="text-[10px] text-gray-400">Total Size</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${typeFilter === "all" ? "bg-[#2a7c7c] text-white" : "bg-gray-100 text-gray-600"}`}>
            All
          </button>
          {DOC_TYPES.map(t => (
            <button key={t.id} onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${typeFilter === t.id ? "bg-[#2a7c7c] text-white" : "bg-gray-100 text-gray-600"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#e8604c] hover:bg-[#d14e3a] text-white text-xs font-semibold rounded-lg transition">
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No documents found</p>
          <button onClick={() => setShowUpload(true)} className="mt-3 text-[#2a7c7c] text-sm font-semibold hover:underline">Upload your first document</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const docType = DOC_TYPES.find(t => t.id === doc.type) || DOC_TYPES[5];
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-[#e6f3f3] rounded-lg flex items-center justify-center text-lg">
                      {docType.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#2c3e50] truncate">{doc.name}</h4>
                      <p className="text-[10px] text-gray-400">{docType.label} · {formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                </div>
                {doc.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{doc.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {doc.fileType?.startsWith("image/") && (
                      <button onClick={() => setPreviewDoc(doc)} className="p-1.5 text-gray-400 hover:text-[#2a7c7c] rounded-lg hover:bg-[#e6f3f3]">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDownload(doc)} className="p-1.5 text-gray-400 hover:text-[#2a7c7c] rounded-lg hover:bg-[#e6f3f3]">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-gray-400 hover:text-[#e8604c] rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && <UploadModal user={user} onClose={() => setShowUpload(false)} onUploaded={() => { setRefresh(r => r + 1); setShowUpload(false); }} />}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="max-w-3xl max-h-[80vh] overflow-auto bg-white rounded-2xl shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <img src={previewDoc.fileData} alt={previewDoc.name} className="max-w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

function UploadModal({ user, onClose, onUploaded }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({ type: "certificate", name: "", description: "", productId: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5MB"); return; }
    setFile(f);
    if (!form.name) setForm({ ...form, name: f.name.replace(/\.[^.]+$/, "") });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!form.name.trim()) { setError("Please enter a document name"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      uploadDocument({
        uploaderEmail: user.email,
        productId: form.productId,
        type: form.type,
        name: form.name,
        description: form.description,
        fileData: reader.result,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      onUploaded();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#2a7c7c] px-5 py-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">Upload Document</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Drop Zone */}
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#2a7c7c] hover:bg-[#e6f3f3]/20 transition">
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
            {file ? (
              <div>
                <FileText className="w-8 h-8 text-[#2a7c7c] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#2c3e50]">{file.name}</p>
                <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to select a file</p>
                <p className="text-[10px] text-gray-400">PDF, Images, Docs · Max 5MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Document Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30">
              {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Document name" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Description (Optional)</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description..." rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 resize-none" />
          </div>
          {error && <p className="text-[#e8604c] text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}
          <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition text-sm">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </form>
      </div>
    </div>
  );
}
