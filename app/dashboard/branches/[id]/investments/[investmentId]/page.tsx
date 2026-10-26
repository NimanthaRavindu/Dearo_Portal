import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, Calendar, Hash, Banknote, Image as ImageIcon, AlertTriangle } from "lucide-react";
import InvestmentPDFButtons from "@/components/InvestmentPDFButtons";

export default async function InvestmentDocumentPage({ 
  params 
}: { 
  params: Promise<{ id: string; investmentId: string }> 
}) {
  const resolvedParams = await params;
  const investmentId = parseInt(resolvedParams.investmentId);
  const branchId = resolvedParams.id;

  if (isNaN(investmentId)) return notFound();

  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: { branch: true }
  });

  if (!investment) return notFound();

  const hasContractNo = !!((investment as any).contract_no && (investment as any).contract_no.trim() !== "");
  const billPhoto = (investment as any).billPhoto || (investment as any).bill_photo || (investment as any).attachment || null;

  const getImageSrc = (pathStr: string) => {
    if (pathStr.startsWith('data:image/') || pathStr.startsWith('http')) return pathStr;
    const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    return cleanPath.replace('/public', '');
  };

  return (
    <div className="p-0 md:p-10 bg-slate-100 min-h-screen print:bg-white">
      <Link 
        href={`/dashboard/branches/${branchId}/investments`}
        className="flex items-center gap-2 text-blue-600 font-bold hover:underline print:hidden mb-4 ml-4 md:ml-0">
          <ArrowLeft size={18}/>Back to Investments List
      </Link>
      
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden p-4">
        <InvestmentPDFButtons investment={{
          id: investment.id,
          contract_no: (investment as any).contract_no,
          amount: investment.amount,
          billPhoto: billPhoto,
          branch_name: investment.branch?.branch_name
        }} />
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-slate-200 min-h-[1050px] p-12 relative print:shadow-none print:border-none print:p-0">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#051139] print:hidden"></div>

        {!hasContractNo && (
          <div className="mb-8 bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-full"><AlertTriangle size={20}/></div>
            <div>
              <p className="text-sm font-black text-red-700 uppercase tracking-wide">⚠️ Boru / Fake Record Detected</p>
              <p className="text-xs font-bold text-red-600">Valid contract number ekak nathuwa me record eka hadala thiyenawa</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#051139] text-white rounded-lg">
                <TrendingUp size={24} />
              </div>
              <h1 className="text-2xl font-black text-[#051139] tracking-tighter uppercase">
                Investment Certificate
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Dearo Investment Limited - Asset Management
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">
              {investment.branch?.branch_name || "Trincomalee Branch"}
            </div>
            {hasContractNo && (
              <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                REF: {investment.contract_no}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 border-b border-blue-50 pb-2">
              01. Investment Identification
            </h2>
            <div className="grid grid-cols-2 gap-y-8">
              {hasContractNo ? (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Hash size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contract No</p>
                    <p className="text-lg font-bold text-slate-800">
                      {investment.contract_no}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 print:bg-white print:border-slate-200">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-slate-200 pb-2">
              02. Financial Allocation
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-green-600 border border-green-100">
                  <Banknote size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Investment Amount</p>
                  <p className="text-2xl font-black text-slate-900 font-sans">
                    Rs. {Number(investment.amount || 0).toLocaleString()}.00
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 border border-blue-100">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Statement Date</p>
                  <p className="text-lg font-bold text-slate-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={14}/>03. Uploaded Bill Attachment</h3>
            {billPhoto ? (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 max-w-md shadow-inner">
                <img src={getImageSrc(billPhoto)} alt="Uploaded Bill" className="w-full h-auto rounded-lg border border-slate-100 object-contain max-h-96" />
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-center text-xs text-slate-400 italic">No bill photo uploaded for this investment.</div>
            )}
          </div>

          <div className="pt-32 grid grid-cols-2 gap-20 text-center">
            <div>
              <div className="border-b border-slate-300 mb-2 h-10"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Signatory</p>
            </div>
            <div>
              <div className="border-b border-slate-300 mb-2 h-10"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Investor Signature</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-12 right-12 border-t border-slate-100 pt-6 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Dearo System Generated Record</span>
          <span>Printed on: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}