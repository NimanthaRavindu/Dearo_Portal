'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useTransition, useMemo } from "react";
import { ArrowLeft, AlertCircle, Check, X, FileText, Loader2, Info, Tag, Calendar, Activity, Clock, CheckCircle2, Eye, Hash, CalendarDays, FilterX } from "lucide-react";

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

  // SINGLE DATE ONLY - From To ayin kala
  const [filterDate, setFilterDate] = useState<string>("");

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!type) return;
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/document-request?type=${type}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Server error ${response.status}`);
        const data = await response.json();
        setDataList(data);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };
    fetchDocuments();
  }, [type]);

  // DATE FILTER - ONE DATE ONLY
  const filteredData = useMemo(() => {
    if (!filterDate) return dataList;
    return dataList.filter(doc => {
      const docDateStr = new Date(doc.createdAt).toISOString().split('T')[0];
      return docDateStr === filterDate;
    });
  }, [dataList, filterDate]);

  const clearFilter = () => setFilterDate("");
  const setToday = () => setFilterDate(new Date().toISOString().split('T')[0]);

  const openView = (doc: DocumentItem) => { setSelectedDoc(doc); setShowView(true); };

  const updateStatusAction = async (docNumber: string, action: "SUBMIT" | "DECLINE", docType: string, senderId?: number) => {
    const res = await fetch("/api/document-request", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ docNumber, action, documentType: docType, senderId }) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
  };

  const deleteAction = async (id: number, docNo: any, action: "SUBMIT" | "DECLINE", docType: string, senderId?: number) => {
    if (isPending) return;
    if (!window.confirm(action === "SUBMIT" ? "Submit karanna sure da?" : "Decline karanna sure da?")) return;
    const prev = [...dataList];
    setDataList(p => p.filter(i => i.id !== id));
    setShowView(false);
    startTransition(async () => {
      try {
        setActionLoading(id);
        await updateStatusAction(docNo || "", action, docType, senderId);
        const res = await fetch("/api/documents/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        const result = await res.json();
        if (!result.success) { setDataList(prev); alert(result.error); }
        else router.refresh();
      } catch (e: any) { setDataList(prev); alert(e.message); } finally { setActionLoading(null); }
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-400"><Loader2 className="animate-spin mr-2" /> Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between border-b-4 border-slate-900 pb-5">
        <div className="flex items-center gap-4"><div className="p-3 bg-slate-900 rounded-2xl text-white"><FileText size={30} /></div><div><h1 className="text-2xl font-black uppercase italic">{typeTitle || `${type} REQUESTS`}</h1><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{filteredData.length} Records {filterDate && `- Filtered: ${filterDate}`}</p></div></div>
        <Link href="/dashboard" className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 hover:text-slate-900"><ArrowLeft size={16}/> Back</Link>
      </div>

      {/* SINGLE DATE FILTER ONLY */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest"><CalendarDays size={16}/> Date Filter</div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none" />
        </div>
        <button onClick={setToday} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Today</button>
        {filterDate && <button onClick={clearFilter} className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><FilterX size={12}/> Clear ({filteredData.length})</button>}
      </div>

      {error && <div className="p-4 bg-rose-100 border border-rose-300 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-bold"><AlertCircle size={18} /> {error}</div>}

      <div className="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic"><th className="px-10 py-6">Document</th><th className="px-10 py-6">Type</th><th className="px-10 py-6">Submitted Date</th><th className="px-10 py-6">Status</th><th className="px-10 py-6 text-center">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map(doc => (
              <tr key={doc.id} onClick={()=>openView(doc)} className="hover:bg-blue-50/50 cursor-pointer group">
                <td className="px-10 py-7 font-black text-sm group-hover:text-blue-600 flex items-center gap-2">#{doc.docNumber || doc.id} <Eye size={12} className="opacity-0 group-hover:opacity-100"/></td>
                <td className="px-10 py-7"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border">{doc.documentType}</span></td>
                <td className="px-10 py-7 text-xs font-bold text-slate-500">{new Date(doc.createdAt).toLocaleDateString('en-GB')}</td>
                <td className="px-10 py-7 text-[10px] font-black uppercase flex items-center gap-1">{doc.status === 'PENDING' ? <Clock size={12} className="text-amber-500"/> : <CheckCircle2 size={12} className="text-emerald-500"/>}{doc.status}</td>
                <td className="px-10 py-7"><div className="flex justify-center gap-2" onClick={e=>e.stopPropagation()}><button onClick={()=>openView(doc)} className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Eye size={14}/></button><button onClick={()=>deleteAction(doc.id, doc.docNumber, 'SUBMIT', doc.documentType, doc.senderId)} disabled={actionLoading===doc.id} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><Check size={12}/> Submit</button><button onClick={()=>deleteAction(doc.id, doc.docNumber, 'DECLINE', doc.documentType, doc.senderId)} disabled={actionLoading===doc.id} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1"><X size={12}/> Decline</button></div></td>
              </tr>
            ))}
            {filteredData.length===0 && <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No records for {filterDate || 'selected date'} <br/><button onClick={clearFilter} className="mt-3 text-slate-900 underline">Clear Filter</button></td></tr>}
          </tbody>
        </table>
      </div>

      {showView && selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={()=>setShowView(false)} /><div className="relative bg-white w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl"><div className="bg-slate-900 text-white p-6 flex justify-between items-center"><h2 className="font-black uppercase">#{selectedDoc.docNumber}</h2><button onClick={()=>setShowView(false)} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><X size={16}/></button></div><div className="p-6 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-400">Date:</span><b>{new Date(selectedDoc.createdAt).toLocaleString('en-GB')}</b></div><div className="flex justify-between"><span className="text-slate-400">Status:</span><b>{selectedDoc.status}</b></div><div className="flex justify-between"><span className="text-slate-400">Type:</span><b>{selectedDoc.documentType}</b></div></div></div></div>
      )}
    </div>
  );
}