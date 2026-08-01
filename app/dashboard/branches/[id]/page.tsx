import { prisma } from "@/lib/db";
import { CheckCircle2, Eye, Banknote, Users, TrendingUp, FileText, Clock, ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import BranchDetailsClient from "@/app/branches/[id]/BranchDetailsClient";

export default async function BranchDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>; // ✅ Next.js 15 Params Type Fix
}) {
  const resolvedParams = await params;
  const branchId = Number(resolvedParams.id);

  if (isNaN(branchId)) {
    return notFound();
  }

  // Branch එකට අදාළ All Records Fetch කරගැනීම
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      account: {
        orderBy: { id: 'desc' }
      },
      loan: {
        orderBy: { id: 'desc' }
      },
      investment: {
        orderBy: { id: 'desc' }
      },
      documentrequest: {
        orderBy: { requestedAt: 'desc' }
      }
    }
  }) as any;

  // Request History Fetch කිරීම
  const historyItems = await prisma.requesthistory.findMany({
    where: { branchId: branchId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (!branch) {
    return (
      <div className="p-10 text-center bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-800">Branch not found.</h2>
        <p className="text-slate-500 mt-2 text-sm">The requested branch ID does not exist in the database.</p>
        <Link href="/dashboard" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const pendingRequests = branch?.documentrequest?.filter((req: any) => req.status === "PENDING") || [];

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen space-y-8">
      {/* Top Back Navigation */}
      <div className="flex flex-col space-y-4">
        <Link 
          href="/dashboard" 
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors w-fit text-xs font-bold uppercase tracking-wider bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to Dashboard
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#051139] uppercase tracking-tight">
              {branch.branch_name}
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Branch Code: <span className="text-blue-600 font-bold">{branch.branch_code}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Accounts Card */}
        <Link 
          href={`/dashboard/branches/${branchId}/accounts`} 
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={22} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-blue-600 transition-colors" size={18} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Accounts</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{branch?.account?.length || 0}</h3>
        </Link>

        {/* Loans Card */}
        <Link 
          href={`/dashboard/branches/${branchId}/loans`} 
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Banknote size={22} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" size={18} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Loans</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{branch?.loan?.length || 0}</h3>
        </Link>

        {/* Investments Card */}
        <Link 
          href={`/dashboard/branches/${branchId}/investments`} 
          className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={22} /></div>
            <ArrowRight className="text-slate-300 group-hover:text-purple-600 transition-colors" size={18} />
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Investments</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{branch?.investment?.length || 0}</h3>
        </Link>

      </div>

      {/* Documents Client Section */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm p-6">
        {/* @ts-ignore */}
        <BranchDetailsClient branch={branch} params={params} />

        {/* Check if no pending requests exist */}
        {pendingRequests.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mt-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold text-xs">All Set!</p>
              <p className="text-slate-400 text-[11px]">No pending document requests to submit for this branch.</p>
            </div>
          </div>
        )}
      </div>

      {/* Request History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-purple-600" size={18} />
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Request History</h2>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {historyItems && historyItems.length > 0 ? (
            historyItems.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-700">
                      {item.documentType || "Document"} Action
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">REF: {item.referenceNo || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Status</p>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">
                      {item.status || "COMPLETED"}
                    </span>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic">Date</p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <Link
                    href={item.link || `/dashboard/branches/${branchId}`}
                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Clock className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No History Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}