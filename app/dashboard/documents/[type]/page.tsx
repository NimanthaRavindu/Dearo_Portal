'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useTransition } from "react";
import { ArrowLeft, AlertCircle, Check, X, FileText, Loader2, Info, Tag, Calendar, Activity, Clock, CheckCircle2, Eye, Building2, User, Hash } from "lucide-react";

interface DocumentItem {
  id: number;
  docNumber?: string;
  documentType: string;
  status: string;
  senderId?: number;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ type: string }>;
  initialData?: DocumentItem[];
  typeTitle?: string;
}

export default function DocumentTypePage({ params, initialData = [], typeTitle }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const type = resolvedParams.type;

  const [dataList, setDataList] = useState<DocumentItem[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // VIEW MODAL STATES
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showView, setShowView] = useState(false);

  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!type) return;
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/document-request?type=${type}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        const data = await response.json();
        setDataList(data);
      } catch (err: any) {
        console.error("Fetch Error:", err.message);
        setError(err.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [type]);

  const openView = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setShowView(true);
  };

  const updateStatusAction = async (docNumber: string, action: "SUBMIT" | "DECLINE", docType: string, senderId?: number) => {
    const response = await fetch("/api/document-request", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docNumber: docNumber || "", action: action, documentType: docType, senderId: senderId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.details || data.error || "requesthistory හි status වෙනස් කිරීමට අපොහොසත් විය.");
    }
    return data;
  };

  const deleteAction = async (documentId: number, rawDocNumber: string | undefined, action: "SUBMIT" | "DECLINE", docType: string, senderId?: number) => {
    if (isPending) return;
    const isValidDocNo = Boolean(rawDocNumber && rawDocNumber !== "" && rawDocNumber !== "undefined" && rawDocNumber !== "null" && rawDocNumber !== "N/A");
    const docText = isValidDocNo ? `${rawDocNumber} අංකය සහිත ` : "";
    const isConfirmed = window.confirm(action === "SUBMIT" ? `මෙම ${docText}ලේඛනය ඉදිරිපත් කිරීමට ඔබට සහතිකද?` : `මෙම ${docText}ලේඛනය ප්‍රතික්ෂේප කිරීමට ඔබට සහතිකද?`);
    if (!isConfirmed) return;
    const previousData = [...dataList];
    setDataList((prev) => prev.filter((item) => item.id !== documentId));
    setShowView(false);
    startTransition(async () => {
      try {
        setActionLoading(documentId);
        await updateStatusAction(rawDocNumber || "", action, docType || type, senderId);
        const response = await fetch("/api/documents/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(documentId) }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          alert(action === "SUBMIT" ? `ලේඛනය සාර්ථකව ඉදිරිපත් කරන ලදී.` : `ලේඛනය ප්‍රතික්ෂේප කරන ලදී.`);
          router.refresh();
          return;
        }
        setDataList(previousData);
        alert(result.error || "ලේඛනය ඉවත් කිරීමට අපොහොසත් විය.");
      } catch (error: any) {
        setDataList(previousData);
        alert("දෝෂයක් සිදු විය: " + (error.message || "නැවත උත්සාහ කරන්න."));
      } finally {
        setActionLoading(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-bold text-slate-400 uppercase italic">
        <Loader2 className="animate-spin text-blue-600 mr-2" /> Loading Records...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl">
            <FileText size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
              {typeTitle || `${type} REQUESTS`}
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">Document Management System</p>
          </div>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-black uppercase italic text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-100 border border-rose-300 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-bold">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] italic">
              <th className="px-10 py-6"><Info size={14} className="inline mr-2" />Document Details</th>
              <th className="px-10 py-6"><Tag size={14} className="inline mr-2" />Type</th>
              <th className="px-10 py-6"><Calendar size={14} className="inline mr-2" />Submitted Date</th>
              <th className="px-10 py-6"><Activity size={14} className="inline mr-2" />Status</th>
              <th className="px-10 py-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic">
            {dataList.length > 0 ? (
              dataList.map((doc) => {
                const isValidDocNo = Boolean(doc.docNumber && doc.docNumber !== "" && doc.docNumber !== "undefined" && doc.docNumber !== "null" && doc.docNumber !== "N/A");
                return (
                  <tr key={doc.id} onClick={() => openView(doc)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-700 text-sm group-hover:text-blue-600">{isValidDocNo ? `#${doc.docNumber}` : `#DOC-${doc.id}`}</span>
                        <Eye size={14} className="opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-10 py-7"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-200">{doc.documentType || type}</span></td>
                    <td className="px-10 py-7 text-slate-400 text-xs font-bold uppercase">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</td>
                    <td className="px-10 py-7">
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${doc.status === 'APPROVED' || doc.status === 'SUBMITTED' ? 'text-emerald-600' : doc.status === 'DECLINED' ? 'text-rose-600' : 'text-amber-500 animate-pulse'}`}>
                        {doc.status === 'APPROVED' || doc.status === 'SUBMITTED' ? <CheckCircle2 size={12} /> : doc.status === 'DECLINED' ? <AlertCircle size={12} /> : <Clock size={12} />}{doc.status}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openView(doc)} className="w-9 h-9 rounded-xl bg-slate-900 text-white hover:bg-black flex items-center justify-center transition-all" title="View Record"><Eye size={16} /></button>
                        <button onClick={() => deleteAction(doc.id, doc.docNumber, 'SUBMIT', doc.documentType || type, doc.senderId)} disabled={isPending || actionLoading === doc.id} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all disabled:opacity-50">
                          {actionLoading === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Submit
                        </button>
                        <button onClick={() => deleteAction(doc.id, doc.docNumber, 'DECLINE', doc.documentType || type, doc.senderId)} disabled={isPending || actionLoading === doc.id} className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all disabled:opacity-50">
                          {actionLoading === doc.id ? <Loader2 size={12} className="animate-spin" /> : <X size={14} />} Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5} className="px-10 py-28 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">No records found in database</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {showView && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setShowView(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[28px] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in">
            <div className="bg-slate-900 text-white p-7 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><FileText /></div>
                <div>
                  <h2 className="font-black text-lg uppercase italic tracking-tight">#{selectedDoc.docNumber || `DOC-${selectedDoc.id}`}</h2>
                  <p className="text-[10px] text-slate-400 tracking-[0.2em] font-bold uppercase mt-1">Document Full Preview • {selectedDoc.documentType || type}</p>
                  <span className={`inline-flex mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedDoc.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}><Clock size={10} className="mr-1" /> {selectedDoc.status}</span>
                </div>
              </div>
              <button onClick={() => setShowView(false)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><X size={18} /></button>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[10px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1"><Hash size={12}/> Document ID</div><div className="font-black text-slate-900 mt-1.5 text-sm">{selectedDoc.docNumber || `DOC-${selectedDoc.id}`}</div></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[10px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1"><Tag size={12}/> Type</div><div className="font-black text-slate-900 mt-1.5 text-sm uppercase">{selectedDoc.documentType || type}</div></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[10px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1"><Calendar size={12}/> Submitted</div><div className="font-bold text-slate-900 mt-1.5 text-sm">{selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleString('en-GB') : '-'}</div></div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><div className="text-[10px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-1"><User size={12}/> Sender ID</div><div className="font-bold text-slate-900 mt-1.5 text-sm">{selectedDoc.senderId || 'N/A'}</div></div>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-500 mb-3"><Info size={14}/> System Record Details</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Internal ID:</span><span className="font-bold text-slate-700">{selectedDoc.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Doc Number:</span><span className="font-bold text-slate-700">{selectedDoc.docNumber || 'Not Assigned'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Current Status:</span><span className="font-bold text-amber-600">{selectedDoc.status}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Request Type:</span><span className="font-bold text-blue-600">{selectedDoc.documentType || type}</span></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => selectedDoc && deleteAction(selectedDoc.id, selectedDoc.docNumber, 'SUBMIT', selectedDoc.documentType || type, selectedDoc.senderId)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"><Check size={16}/> Approve & Submit</button>
                <button onClick={() => selectedDoc && deleteAction(selectedDoc.id, selectedDoc.docNumber, 'DECLINE', selectedDoc.documentType || type, selectedDoc.senderId)} className="flex-1 bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"><X size={16}/> Decline</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}