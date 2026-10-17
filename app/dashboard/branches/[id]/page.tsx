import { prisma } from "@/lib/db";
import { CheckCircle2, Eye, Banknote, Users, TrendingUp, FileText, Clock, ArrowRight, Building2, Filter, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BranchDetailsClient from "@/app/branches/[id]/BranchDetailsClient";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ date?: string; docType?: string }>;
};

export default async function BranchDetailsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const branchId = Number(resolvedParams.id);

  if (isNaN(branchId)) {
    return notFound();
  }

  // --- SINGLE DATE FILTER LOGIC ---
  const selectedDateStr = resolvedSearchParams?.date || "";
  const docTypeFilter = resolvedSearchParams?.docType || "ALL";

  let dateFilter: any = {};
  if (selectedDateStr) {
    const start = new Date(selectedDateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDateStr);
    end.setHours(23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  }

  const historyWhere: any = {
    branchId: branchId,
    ...(selectedDateStr ? { createdAt: dateFilter } : {}),
    ...(docTypeFilter !== "ALL" ? { documentType: docTypeFilter } : {}),
  };

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      account: true,
      loan: true,
      investment: true,
      documentrequest: {
        where: { status: "PENDING" },
        orderBy: { requestedAt: 'desc' }
      }
    }
  }) as any;

  const historyItems = await prisma.requesthistory.findMany({
    where: historyWhere,
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  if (!branch) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Branch not found.</h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col space-y-4">
        <Link href="/dashboard" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors w-fit text-sm font-medium">
          <ArrowRight className="w-4 h-4 mr-2" />Back to Dashboard
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-8 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#051139] uppercase">
              {branch.branch_name}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Branch Code: <span className="text-blue-600 font-bold">{branch.branch_code}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href={`/dashboard/branches/${branchId}/accounts`} className="bg-blue-50 border border-blue-100 p-6 rounded-2xl hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"><Users size={24} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-colors" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Accounts</p>
          <h3 className="text-3xl font-bold text-slate-800">{branch?.account?.length || 0}</h3>
        </Link>
        <Link href={`/dashboard/branches/${branchId}/loans`} className="bg-green-50 border border-green-100 p-6 rounded-2xl hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-green-600"><Banknote size={24} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-colors" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Loans</p>
          <h3 className="text-3xl font-bold text-slate-800">{branch?.loan?.length || 0}</h3>
        </Link>
        <Link href={`/dashboard/branches/${branchId}/investments`} className="bg-orange-50 border border-orange-100 p-6 rounded-2xl hover:shadow-lg transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600"><TrendingUp size={24} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-slate-600 transition-colors" size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Investments</p>
          <h3 className="text-3xl font-bold text-slate-800">{branch?.investment?.length || 0}</h3>
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {/*@ts-ignore */}
        <BranchDetailsClient branch={branch} params={resolvedParams} />
        {(!branch?.documentrequest || branch.documentrequest.length === 0) && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold text-sm">All set!</p>
              <p className="text-slate-400 text-xs">No pending documents to submit for this branch.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-purple-600" size={18} />
            <h2 className="text-sm font-bold text-slate-800">Request History</h2>
            <span className="ml-2 text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{historyItems.length} results</span>
          </div>
        </div>

        {/* SINGLE DATE FILTER */}
        <form method="GET" className="p-4 bg-white border-b flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
              <input type="date" name="date" defaultValue={selectedDateStr} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</label>
              <select name="docType" defaultValue={docTypeFilter} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ALL">All Documents</option>
                <option value="ACCOUNT">Account</option>
                <option value="LOAN">Loan</option>
                <option value="INVESTMENT">Investment</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button type="submit" className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
              <Filter size={14} /> Filter
            </button>
            {(selectedDateStr || docTypeFilter !== "ALL") && (
              <Link href={`/dashboard/branches/${branchId}`} className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold flex items-center gap-1">
                <X size={14} /> Clear
              </Link>
            )}
          </div>
        </form>

        <div className="divide-y">
          {historyItems && historyItems.length > 0 ? (
            historyItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-700">
                      {item.documentType} Viewed
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">REF: {item.referenceNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Status</p>
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Date</p>
                    <p className="text-[9px] font-bold text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={item.link} className="p-2 bg-slate-100 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Clock className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest">No History Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}