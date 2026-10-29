'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useTransition, useMemo } from "react";
import { ArrowLeft, AlertCircle, Check, X, FileText, Loader2, Info, Tag, Calendar, Activity, Clock, CheckCircle2, Eye, User, Hash, CalendarDays, FilterX } from "lucide-react";

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

  // FILTER STATES
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // VIEW MODAL
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showView, setShowView] = useState(false);

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
        setError(err.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [type]);

  // DATE FILTER LOGIC
  const filteredData = useMemo(() => {
    if (!fromDate && !toDate) return dataList;
    return dataList.filter((doc) => {
      const docDate = new Date(doc.createdAt);
      docDate.setHours(0,0,0,0);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0,0,0,0);
        if (docDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23,59,59,999);
        if (docDate > to) return false;
      }
      return true;
    });
  }, [dataList, fromDate, toDate]);

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
  };

  const setThisWeek = () => {
    const today = new Date();
    const first = new Date(today);
    first.setDate(today.getDate() - today.getDay());
    const last = new Date(today);
    last.setDate(first.getDate() + 6);
    setFromDate(first.toISOString().split('T')[0]);
    setToDate(last.toISOString().split('T')[0]);
  };

  const clearFilter = () => {
    setFromDate("");
    setToDate("");
  };

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
    if (!response.ok || !data.success) throw new Error(data.details || data.error);
    return data;
  };

  const deleteAction = async (documentId: number, rawDocNumber: string | undefined, action: "SUBMIT" | "DECLINE", docType: string, senderId?: number) => {
    if (isPending) return;
    const isValidDocNo = Boolean(rawDocNumber && rawDocNumber !== "" && rawDocNumber !== "undefined" && rawDocNumber !== "null" && rawDocNumber !== "N/A");
    const docText = isValidDocNo ? `${rawDocNumber} අංකය සහිත ` : "";
    if (!window.confirm(action === "SUBMIT" ? `මෙම ${docText}ලේඛනය ඉදිරිපත් කිරීමට ඔබට සහතිකද?` : `මෙම ${docText}ලේඛනය ප්‍රතික්ෂේප කිරීමට ඔබට සහතිකද?`)) return;
    const previousData = [...dataList];
    setDataList((prev) => prev.filter((item) => item.id !== documentId));
    setShowView(false);
    startTransition(async () => {
      try {
        setActionLoading(documentId);
        await updateStatusAction(rawDocNumber || "", action, docType || type, senderId);
        const response = await fetch("/api/documents/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: Number(documentId) }) });
        const result = await response.json();
        if (response.ok && result.success) { alert(action === "SUBMIT" ? `ලේඛනය සාර්ථකව ඉදිරිපත් කරන ලදී.` : `ලේඛනය ප්‍රතික්ෂේප කරන ලදී.`); router.refresh(); return; }
        setDataList(previousData);
        alert(result.error || "Failed");
      } catch (error: any) { setDataList(previousData); alert("Error: " + error.message); } finally { setActionLoading(null); }
    });
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-bold text-slate-400 uppercase italic"><Loader2 className="animate-spin text-blue-600 mr-2" /> Loading Records...</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl"><FileText size={30} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{typeTitle || `${type} REQUESTS`}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">Document Management System • {filteredData.length} Records</p>
          </div>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-black uppercase italic text-slate-400 hover:text-slate-900"><ArrowLeft size={16} /> Back</Link>
      </div>

      {/* DATE FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex flex-wrap items-end gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-900"><CalendarDays size={16} /> Filter by Date</div>
        <div className="h-6 w-[1px] bg-slate-200" />
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From Date</label>
          <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Date</label>
          <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900" />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button onClick={setToday} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black">Today</button>
          <button onClick={setThisWeek} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">This Week</button>
          {(fromDate || toDate) && <button onClick={clearFilter} className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 flex items-center gap-1"><FilterX size={12}/> Clear</button>}
        </div>
        {(fromDate || toDate) && <div className="ml-auto text-[11px] font-bold text-slate-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">Showing {filteredData.length} of {dataList.length}</div>}
      </div>

      {error && <div className="p-4 bg-rose-100 border border-rose-300 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-bold"><AlertCircle size={18} /> {error}</div>}

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
            {filteredData.length > 0 ? filteredData.map((doc) => {
                const isValidDocNo = Boolean(doc.docNumber && doc.docNumber !== "" && doc.docNumber !== "undefined" && doc.docNumber !== "null" && doc.docNumber !== "N/A");
                return (
                  <tr key={doc.id} onClick={() => openView(doc)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                    <td className="px-10 py-7"><div className="flex items-center gap-3"><span className="font-black text-slate-700 text-sm group-hover:text-blue-600">{isValidDocNo ? `#${doc.docNumber}` : `#DOC-${doc.id}`}</span><Eye size={14} className="opacity-0 group-hover:opacity-100 text-slate-400" /></div></td>
                    <td className="px-10 py-7"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-200">{doc.documentType || type}</span></td>
                    <td className="px-10 py-7 text-slate-400 text-xs font-bold uppercase">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="px-10 py-7"><span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${doc.status === 'APPROVED' ? 'text-emerald-600' : doc.status === 'DECLINED' ? 'text-rose-600' : 'text-amber-500'}`}>{doc.status === 'APPROVED' ? <CheckCircle2 size={12}/> : doc.status === 'DECLINED' ? <AlertCircle size={12}/> : <Clock size={12}/>}{doc.status}</span></td>
                    <td className="px-10 py-7"><div className="flex items-center justify-center gap-2" onClick={(e)=>e.stopPropagation()}><button onClick={()=>openView(doc)} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Eye size={16}/></button><button onClick={()=>deleteAction(doc.id, doc.docNumber, 'SUBMIT', doc.documentType || type, doc.senderId)} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Check size={14}/> Submit</button><button onClick={()=>deleteAction(doc.id, doc.docNumber, 'DECLINE', doc.documentType || type, doc.senderId)} className="bg-rose-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><X size={14}/> Decline</button></div></td>
                  </tr>
                );
              }) : (
              <tr><td colSpan={5} className="px-10 py-28 text-center"><div className="text-slate-300 font-black uppercase text-xs tracking-[0.3em] mb-3">No records found for selected date range</div><button onClick={clearFilter} className="text-[11px] font-bold text-slate-900 underline">Clear Date Filter</button></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showView && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={()=>setShowView(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[28px] shadow-2xl overflow-hidden border">
            <div className="bg-slate-900 text-white p-7 flex justify-between">
              <div><h2 className="font-black text-lg uppercase italic">#{selectedDoc.docNumber || `DOC-${selectedDoc.id}`}</h2><p className="text-[10px] text-slate-400 tracking-[0.2em] font-bold uppercase mt-1">{selectedDoc.documentType} • {new Date(selectedDoc.createdAt).toLocaleString('en-GB')}</p></div>
              <button onClick={()=>setShowView(false)} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center"><X size={18}/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border"><div className="text-[10px] text-slate-400 font-black uppercase flex gap-1"><Hash size={12}/> Doc ID</div><div className="font-black mt-1.5 text-sm">{selectedDoc.docNumber}</div></div>
                <div className="bg-slate-50 p-4 rounded-2xl border"><div className="text-[10px] text-slate-400 font-black uppercase">Sender</div><div className="font-bold mt-1.5 text-sm">{selectedDoc.senderId}</div></div>
              </div>
              <div className="flex gap-3"><button onClick={()=>deleteAction(selectedDoc.id, selectedDoc.docNumber, 'SUBMIT', selectedDoc.documentType || type, selectedDoc.senderId)} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2"><Check size={16}/> Approve</button><button onClick={()=>deleteAction(selectedDoc.id, selectedDoc.docNumber, 'DECLINE', selectedDoc.documentType || type, selectedDoc.senderId)} className="flex-1 bg-white border-2 border-rose-100 text-rose-500 py-4 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2"><X size={16}/> Decline</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}