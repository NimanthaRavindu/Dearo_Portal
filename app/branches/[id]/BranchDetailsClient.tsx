"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Banknote, TrendingUp, Building2, Users } from 'lucide-react';

interface BranchProps {
  id: string | number;
  name?: string;
  code?: string;
  account?: any[];
  loan?: any[];
  investment?: any[];
}

interface BranchDetailsClientProps {
  branch: BranchProps;
  allRequests?: any[];
}

const BranchDetailsClient = ({ branch, allRequests }: BranchDetailsClientProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<string | number | null>(null);

  // Local States for Lists
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  // Update local states when `branch` prop updates
  useEffect(() => {
    if (branch) {
      setAccounts(branch.account || []);
      setLoans(branch.loan || []);
      setInvestments(branch.investment || []);
    }
  }, [branch]);

  const handleRequest = async (item: any, type: "ACCOUNT" | "LOAN" | "INVESTMENT") => {
    // Document Number එක නැත්නම් Item ID එක භාවිත කරයි
    const docNo = item.account_number || item.acc_no || item.accountNo || item.contract_no || item.loan_no || item.inv_no || item.contractNo || "";
    const submitId = item.id || docNo;

    const confirmText = docNo ? `${docNo} අංකය සහිත ලේඛනය` : "මෙම ලේඛනය";
    if (!confirm(`${confirmText} ඉදිරිපත් කිරීමට ඔබට සහතිකද?`)) return;

    setIsSubmitting(submitId);
    try {
      const response = await fetch('/api/document-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNumber: String(docNo || submitId),
          documentType: type,
          branchId: branch.id,
        }),
      });

      if (response.ok) {
        // UI එකෙන් Item එක ඉවත් කිරීම
        if (type === "ACCOUNT") {
          setAccounts((prev) => prev.filter((acc) => (acc.id || acc.account_number || acc.acc_no) !== submitId));
        } else if (type === "LOAN") {
          setLoans((prev) => prev.filter((loan) => (loan.id || loan.contract_no || loan.loan_no) !== submitId));
        } else if (type === "INVESTMENT") {
          setInvestments((prev) => prev.filter((inv) => (inv.id || inv.contract_no || inv.inv_no) !== submitId));
        }

        alert("ලේඛනය සාර්ථකව ඉදිරිපත් කරන ලදී.");
        router.refresh();
      } else {
        alert("දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      }
    } catch (error) {
      alert("Database සම්බන්ධතාවයේ ගැටලුවකි.");
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      {/* Header Section */}
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-3 bg-slate-100 rounded-2xl text-slate-800">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">{branch?.name || ''}</h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{branch?.code || ''}</p>
        </div>
      </div>

      {/* Pending Sections */}
      <div className="grid md:grid-cols-2 gap-10">

        {/* ACCOUNTS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-blue-600 pb-2">
            <Users className="text-blue-600" size={20} />
            <h2 className="text-sm font-black text-slate-800 uppercase italic">Pending Accounts</h2>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xl">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {accounts && accounts.length > 0 ? (
                  accounts.map((acc: any, index: number) => {
                    const docNo = acc.account_number || acc.acc_no || acc.accountNo || "";
                    const submitId = acc.id || docNo || index;
                    return (
                      <tr key={acc.id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-700">{docNo}</td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleRequest(acc, "ACCOUNT")}
                            disabled={isSubmitting === submitId}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 disabled:opacity-50"
                          >
                            {isSubmitting === submitId ? <Loader2 size={12} className="animate-spin" /> : "Submit"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-4 text-center text-slate-400 text-xs">No pending accounts</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOANS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-emerald-600 pb-2">
            <Banknote className="text-emerald-600" size={20} />
            <h2 className="text-sm font-black text-slate-800 uppercase italic">Pending Loans</h2>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xl">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {loans && loans.length > 0 ? (
                  loans.map((loan: any, index: number) => {
                    const docNo = loan.contract_no || loan.loan_no || loan.contractNo || "";
                    const submitId = loan.id || docNo || index;
                    return (
                      <tr key={loan.id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-700">{docNo}</td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleRequest(loan, "LOAN")}
                            disabled={isSubmitting === submitId}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200 disabled:opacity-50"
                          >
                            {isSubmitting === submitId ? <Loader2 size={12} className="animate-spin" /> : "Submit"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-4 text-center text-slate-400 text-xs">No pending loans</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INVESTMENTS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-purple-600 pb-2">
            <TrendingUp className="text-purple-600" size={20} />
            <h2 className="text-sm font-black text-slate-800 uppercase italic">Pending Investments</h2>
          </div>
          <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xl">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {investments && investments.length > 0 ? (
                  investments.map((inv: any, index: number) => {
                    const docNo = inv.contract_no || inv.inv_no || inv.contractNo || "";
                    const submitId = inv.id || docNo || index;
                    return (
                      <tr key={inv.id || index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 font-bold text-slate-700">{docNo}</td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleRequest(inv, "INVESTMENT")}
                            disabled={isSubmitting === submitId}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 disabled:opacity-50"
                          >
                            {isSubmitting === submitId ? <Loader2 size={12} className="animate-spin" /> : "Submit"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-4 text-center text-slate-400 text-xs">No pending investments</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BranchDetailsClient;