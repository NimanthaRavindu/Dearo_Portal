"use client";
import React, { useState, useMemo } from "react";
import { Search, Filter, X, ChevronDown, Building2 } from "lucide-react";
import MainDashboardCharts from "@/components/MainDashboardCharts";
import DashboardStats from "@/components/DashboardStats";

interface BranchPlain {
  id: string;
  branch_name: string;
  branch_code: string;
  account: number;
  loan: number;
  investment: number;
  documentrequest: number;
  totalFiles: number;
}

interface Props {
  branches: BranchPlain[];
  stats: any[];
  initialBranchId?: string;
}

export default function DashboardBranchFilter({ branches, stats, initialBranchId = "" }: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedBranch = useMemo(() => {
    return branches.find((b) => b.id === selectedBranchId);
  }, [branches, selectedBranchId]);

  const filteredBranches = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.branch_name.toLowerCase().includes(q) ||
        b.branch_code.toLowerCase().includes(q)
    );
  }, [branches, search]);

  const displayBranches = selectedBranch? [selectedBranch] : filteredBranches;

  const filteredStats = useMemo(() => {
    if (!selectedBranch) return stats;
    return [
      { label: "Active Branches", value: 1, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Total Documents", value: selectedBranch.totalFiles, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Total Accounts", value: selectedBranch.account, color: "text-purple-600", bg: "bg-purple-50" },
      { label: "Total Loans", value: selectedBranch.loan, color: "text-orange-600", bg: "bg-orange-50" },
      { label: "Total Investments", value: selectedBranch.investment, color: "text-cyan-600", bg: "bg-cyan-50" },
    ];
  }, [selectedBranch, stats]);

  const clear = () => {
    setSelectedBranchId("");
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Branch Filter</h2>
            <p className="text-xs text-slate-500">
              {selectedBranch? `Showing ${selectedBranch.branch_name}` : `All ${branches.length} branches`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branch..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition ${
                selectedBranchId
                 ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black"
              }`}
            >
              <Filter size={14} />
              {selectedBranch? selectedBranch.branch_code : "Select a Branch"}
              <ChevronDown size={14} className={`${isOpen? "rotate-180" : ""} transition-transform`} />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
                <div className="p-2 max-h-80 overflow-y-auto">
                  <button
                    onClick={clear}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 font-bold"
                  >
                    All Branches - Clear Filter
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex justify-between items-center ${
                        selectedBranchId === b.id
                         ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>
                        {b.branch_name} <span className="text-xs opacity-60">{b.branch_code}</span>
                      </span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{b.totalFiles}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedBranchId && (
            <button onClick={clear} className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {selectedBranch && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filtered:</span>
          <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-bold flex items-center gap-2">
            {selectedBranch.branch_name} ({selectedBranch.branch_code})
            <button onClick={clear} className="bg-white/20 rounded-full p-0.5 hover:bg-white/30">
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* STATS */}
      <DashboardStats stats={filteredStats} branches={displayBranches as any} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              File Distribution by Branch {selectedBranch && <span className="text-blue-600">- {selectedBranch.branch_name}</span>}
            </h3>
            {selectedBranch && (
              <button onClick={clear} className="text-xs text-blue-600 underline font-medium">
                Show All
              </button>
            )}
          </div>
          <MainDashboardCharts branches={displayBranches as any} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Branch Directory</h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {displayBranches.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {displayBranches.map((branch) => (
              <div
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedBranchId === branch.id
                   ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]"
                    : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-blue-200 hover:bg-blue-50/50"
                }`}
              >
                <div>
                  <p className={`font-semibold ${selectedBranchId === branch.id? "text-white" : "text-slate-800 dark:text-white"}`}>
                    {branch.branch_name}
                  </p>
                  <p className={`text-xs ${selectedBranchId === branch.id? "text-blue-100" : "text-slate-500"}`}>
                    {branch.branch_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${selectedBranchId === branch.id? "text-white" : "text-blue-600"}`}>
                    {branch.totalFiles}
                  </p>
                  <p className={`text-[10px] uppercase font-medium ${selectedBranchId === branch.id? "text-blue-200" : "text-slate-400"}`}>
                    Total Files
                  </p>
                </div>
              </div>
            ))}
            {displayBranches.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                No branches found
                <br />
                <button onClick={clear} className="text-blue-600 underline mt-2 font-medium">
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}