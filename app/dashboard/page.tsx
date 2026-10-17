import { prisma } from "@/lib/db";
import MainDashboardCharts from "@/components/MainDashboardCharts";
import DashboardStats from "@/components/DashboardStats";
import Link from "next/link";

type Props = {
  searchParams?: Promise<{ branchId?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const selectedBranchId = resolvedParams?.branchId ? parseInt(resolvedParams.branchId) : null;

  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: {
          documentrequest: true,
          account: true,
          loan: true,
          investment: true,
        },
      },
    },
    orderBy: { branch_name: 'asc' }
  });

  // FIXED: branch relation එකෙන් filter කරනවා, branchId නෙවෙයි
  const branchFilter = selectedBranchId ? { branch: { id: selectedBranchId } } : {};

  const totalAccounts = await prisma.documentrequest.count({
    where: { documentType: "ACCOUNT", ...branchFilter },
  });
  const totalLoans = await prisma.documentrequest.count({
    where: { documentType: "LOAN", ...branchFilter },
  });
  const totalInvestments = await prisma.documentrequest.count({
    where: { documentType: "INVESTMENT", ...branchFilter },
  });

  const totalSystemDocuments = totalAccounts + totalLoans + totalInvestments;

  const displayBranches = selectedBranchId ? branches.filter(b => b.id === selectedBranchId) : branches;
  const selectedBranch = selectedBranchId ? branches.find(b => b.id === selectedBranchId) : null;

  const stats = [
    { label: "Active Branches", value: selectedBranch ? 1 : branches.length, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Total Documents", value: totalSystemDocuments, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Total Accounts", value: totalAccounts, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30", href: "/dashboard/documents/ACCOUNT" },
    { label: "Total Loans", value: totalLoans, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", href: "/dashboard/documents/LOAN" },
    { label: "Total Investments", value: totalInvestments, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/30", href: "/dashboard/documents/INVESTMENT" },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">Branch Filter</h2>
          <p className="text-xs text-slate-500">{selectedBranch ? `Showing ${selectedBranch.branch_name} (${selectedBranch.branch_code})` : `All ${branches.length} branches`}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <select name="branchId" defaultValue={selectedBranchId ? String(selectedBranchId) : ""} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white min-w-[200px]">
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name} - {b.branch_code}</option>
            ))}
          </select>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Filter</button>
          {selectedBranchId && (
            <Link href="/dashboard" className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold">Clear</Link>
          )}
        </form>
      </div>

      <DashboardStats stats={stats} branches={displayBranches} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">File Distribution by Branch {selectedBranch && <span className="text-blue-600">- {selectedBranch.branch_name}</span>}</h3>
          <MainDashboardCharts branches={displayBranches} />
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Branch Directory ({displayBranches.length})</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {displayBranches.map((branch) => {
              const totalBranchFiles = branch._count.account + branch._count.loan + branch._count.investment;
              const isSelected = selectedBranchId === branch.id;
              return (
                <Link key={branch.id} href={`/dashboard?branchId=${branch.id}`} className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isSelected ? "bg-blue-600 text-white shadow-lg" : "bg-slate-50 hover:bg-slate-100"}`}>
                  <div>
                    <p className={`font-semibold ${isSelected ? "text-white" : "text-slate-800"}`}>{branch.branch_name}</p>
                    <p className={`text-xs ${isSelected ? "text-blue-100" : "text-slate-500"}`}>{branch.branch_code}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${isSelected ? "text-white" : "text-blue-600"}`}>{totalBranchFiles}</p>
                    <p className={`text-[10px] uppercase font-medium ${isSelected ? "text-blue-200" : "text-slate-400"}`}>Total Files</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}