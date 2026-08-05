'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useTransition } from "react";
import { ArrowLeft, AlertCircle, Check, X, FileText, Loader2, Info, Tag, Calendar, Activity, Clock, CheckCircle2 } from "lucide-react";

interface DocumentItem {
  id: number;
  docNumber?: string;
  documentType: string;
  status: string;
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

  // 1. Fetch Initial Data
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!type) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/document-request?type=${type}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

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

  // 2. Function: requesthistory වගුවේ status එක වෙනස් කිරීම (PATCH Request)
  const updateStatusAction = async (docNumber: string, action: "SUBMIT" | "DECLINE") => {
    const response = await fetch("/api/document-request", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        docNumber: docNumber,
        action: action,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "requesthistory හි status වෙනස් කිරීමට අපොහොසත් විය.");
    }

    return data;
  };

  // 3. Main Action Function: Status වෙනස් කර documentRequest table එකෙන් delete කිරීම
  const deleteAction = async (documentId: number, rawDocNumber: string | undefined, action: "SUBMIT" | "DECLINE") => {
    if (isPending) return;

    // docNumber එක Valid ද යන්න පරීක්ෂාව
    const isValidDocNo = rawDocNumber && rawDocNumber !== "undefined" && rawDocNumber !== "N/A";
    const docText = isValidDocNo ? `${rawDocNumber} අංකය සහිත ` : "";

    const isConfirmed = window.confirm(
      action === "SUBMIT"
        ? `මෙම ${docText}ලේඛනය ඉදිරිපත් කිරීමට ඔබට සහතිකද?`
        : `මෙම ${docText}ලේඛනය ප්‍රතික්ෂේප කිරීමට ඔබට සහතිකද?`
    );

    if (!isConfirmed) return;

    const previousData = [...dataList];

    // UI එකෙන් ක්ෂණිකව ඉවත් කිරීම (Optimistic Update)
    setDataList((prev) => prev.filter((item) => item.id !== documentId));

    startTransition(async () => {
      try {
        setActionLoading(documentId);

        // Valid Doc Number එකක් තියෙනවා නම් විතරක් PATCH request එක යැවීම
        if (isValidDocNo) {
          await updateStatusAction(rawDocNumber, action);
        }

        // පියවර 2: documentRequest table එකෙන් record එක delete කිරීම
        const response = await fetch("/api/documents/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: Number(documentId),
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert(
            action === "SUBMIT"
              ? `ලේඛනය සාර්ථකව ඉදිරිපත් කරන ලදී.`
              : `ලේඛනය ප්‍රතික්ෂේප කරන ලදී.`
          );
          router.refresh();
          return;
        }

        // Response සාර්ථක නොවූයේ නම් UI Rollback කිරීම
        setDataList(previousData);
        alert(result.error || "ලේඛනය ඉවත් කිරීමට අපොහොසත් විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      } catch (error: any) {
        // Exception එකක් ආවොත් UI Rollback කිරීම සහ Error Alert එක පෙන්වීම
        setDataList(previousData);
        alert("දෝෂයක් සිදු විය: " + (error.message || "කරුණාකර නැවත උත්සාහ කරන්න."));
      } finally {
        setActionLoading(null);
      }
    });
  };

  // Loading Screen
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
            <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">
              Document Management System
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-xs font-black uppercase italic text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      {/* Error Alert */}
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
                // docNumber එක valid ද නැද්ද යන්න පරීක්ෂා කිරීම
                const isValidDocNo = doc.docNumber && doc.docNumber !== "undefined" && doc.docNumber !== "N/A";

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Details */}
                    <td className="px-10 py-7">
                      <div className="flex flex-col">
                        {isValidDocNo ? (
                          <span className="font-black text-slate-700 text-sm">#{doc.docNumber}</span>
                        ) : (
                          /* Account number නැති විට #undefined වෙනුවට හිස්ව පෙන්වීම සඳහා Dash (-) එකක් පමණක් දමා ඇත */
                          <span className="font-bold text-slate-300 text-sm">-</span>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase">ID: {doc.id}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-10 py-7">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-200">
                        {doc.documentType || type}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-10 py-7 text-slate-400 text-xs font-bold uppercase">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                    </td>

                    {/* Status */}
                    <td className="px-10 py-7">
                      <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${
                        doc.status === 'APPROVED' || doc.status === 'SUBMITTED' 
                          ? 'text-emerald-600' 
                          : doc.status === 'DECLINED' 
                          ? 'text-rose-600' 
                          : 'text-amber-500 animate-pulse'
                      }`}>
                        {doc.status === 'APPROVED' || doc.status === 'SUBMITTED' ? (
                          <CheckCircle2 size={12} />
                        ) : doc.status === 'DECLINED' ? (
                          <AlertCircle size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {doc.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-10 py-7">
                      <div className="flex items-center justify-center gap-4">
                        {/* Submit Button */}
                        <button
                          onClick={() => deleteAction(doc.id, doc.docNumber, 'SUBMIT')}
                          disabled={isPending || actionLoading === doc.id}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          {actionLoading === doc.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Submit
                        </button>

                        {/* Decline Button */}
                        <button
                          onClick={() => deleteAction(doc.id, doc.docNumber, 'DECLINE')}
                          disabled={isPending || actionLoading === doc.id}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                          {actionLoading === doc.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <X size={14} />
                          )}
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-10 py-28 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">
                  No records found in database
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}