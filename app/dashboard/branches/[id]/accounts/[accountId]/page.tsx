import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft, User, CreditCard, Image as ImageIcon, Calendar, Landmark } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export default async function AccountDocumentPage({ 
  params 
}: { 
  params: Promise<{ id: string; accountId: string }> | { id: string; accountId: string }
}) {
  // Next.js 14 සහ 15 දෙකටම ගැලපෙන සේ params resolve කිරීම
  const resolvedParams = await Promise.resolve(params);
  const branchId = parseInt(resolvedParams.id, 10);
  const accountId = parseInt(resolvedParams.accountId, 10);

  if (isNaN(accountId) || isNaN(branchId)) {
    return (
      <div className="p-6 text-red-500 font-bold text-center">
        Invalid Branch ID or Account ID
      </div>
    );
  }

  // Database එකෙන් Account එක Fetch කර ගැනීම
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { branch: true }
  });

  if (!account) return notFound();

  // TypeScript Property Errors වළක්වා ගැනීමට Any object එකක් ලෙස cast කිරීම
  const acc = account as any;

  // DB එකේ තිබිය හැකි Field names එකින් එක පරීක්ෂා කිරීම
  const photoData = acc.billPhoto || acc.bill_photo || acc.billPhotoPath || acc.photo || null;
  const customerName = acc.customer_name || acc.customerName || "N/A";
  const accountNumber = acc.account_number || acc.accountNumber || "N/A";
  const billType = acc.bill_type || acc.billType || "SAVINGS";
  const branchName = account.branch?.branch_name || (account.branch as any)?.branchName || "Branch N/A";

  // 🎯 Image Source Helper Function (Updated Fix)
  const getImageSrc = (pathStr?: string | null) => {
    if (!pathStr) return "/placeholder.png";

    const cleanStr = pathStr.trim();

    // 1. Base64 URL හෝ Remote Link (http / https) නම් direct return කරන්න
    if (cleanStr.startsWith('data:') || cleanStr.startsWith('http://') || cleanStr.startsWith('https://')) {
      return cleanStr;
    }

    // 2. Prefix එක නැති Raw Base64 string එකක් නම්
    if (cleanStr.length > 500 && !cleanStr.includes('/')) {
      return `data:image/jpeg;base64,${cleanStr}`;
    }

    // 3. File path එකක් නම් ('/uploads/...' හෝ 'uploads/...')
    // 'public/' කොටස තියේ නම් එය ඉවත් කර නිවැරදි URL structure එක සකසයි
    let formattedPath = cleanStr.replace(/^public[/\\]/, '');
    if (!formattedPath.startsWith('/')) {
      formattedPath = `/${formattedPath}`;
    }

    return formattedPath;
  };

  // Date Formatting Helper
  const formatDate = (dateValue: any) => {
    if (!dateValue) return new Date().toLocaleDateString();
    const d = new Date(dateValue);
    return isNaN(d.getTime()) 
      ? new Date().toLocaleDateString() 
      : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="p-0 md:p-10 bg-slate-100 min-h-screen print:bg-white">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto mb-4 print:hidden">
        <Link 
          href={`/dashboard/branches/${branchId}/accounts`}
          className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Account List
        </Link>
      </div>

      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Main Account Document Statement */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl border border-slate-200 min-h-[1050px] p-12 relative print:shadow-none print:border-none print:p-0">
        
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-900 print:hidden"></div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-900 text-white rounded-lg">
                <Landmark size={24} />
              </div>
              <h1 className="text-2xl font-black text-blue-900 tracking-tighter uppercase">
                Account Information Statement
              </h1>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Dearo Investment Limited - Official Record
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">
              {branchName}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              ACC ID: {account.id.toString().padStart(6, '0')}
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-12">
          
          {/* Section 01: Account Holder Details */}
          <div>
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-6 border-b border-blue-50 pb-2">
              01. Account Holder Information
            </h2>
            <div className="grid grid-cols-2 gap-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
                  <p className="text-lg font-bold text-slate-800">{customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Account Number</p>
                  <p className="text-lg font-bold text-slate-800 tracking-wider">{accountNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 02: Account Summary */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 print:bg-white print:border-slate-200">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-slate-200 pb-2">
              02. Account Summary
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Account Type</p>
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-black uppercase">
                  {billType}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</p>
                <p className="text-2xl font-black text-slate-900">
                  Rs. {Number(acc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Section 03: Uploaded Bill Attachment Display */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} /> 03. Uploaded Bill Attachment
            </h3>

            {photoData ? (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 max-w-md shadow-inner">
                <img 
                  src={getImageSrc(photoData)} 
                  alt="Uploaded Bill Attachment"
                  className="w-full h-auto rounded-lg border border-slate-100 object-contain max-h-96" 
                />
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-center text-xs text-slate-400 italic">
                No bill photo attachment uploaded for this account record.
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center gap-4">
              <Calendar size={20} className="text-slate-300" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Statement Date</p>
                <p className="text-sm font-bold text-slate-700">
                  {formatDate(acc.date || acc.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-24 grid grid-cols-2 gap-20 text-center">
            <div>
              <div className="border-b border-slate-300 mb-2 h-10"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Officer</p>
            </div>
            <div>
              <div className="border-b border-slate-300 mb-2 h-10"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Account Holder Signature</p>
            </div>
          </div>

        </div>

        {/* Document Footer */}
        <div className="absolute bottom-10 left-12 right-12 border-t border-slate-100 pt-6 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Dearo Core Banking System</span>
          <span>Printed Date: {formatDate(new Date())}</span>
        </div>
      </div>
    </div>
  );
}