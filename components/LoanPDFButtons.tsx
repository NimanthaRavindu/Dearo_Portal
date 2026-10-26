"use client";
import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

type LoanData = {
  id: number;
  contract_no: string;
  loan_type: string;
  amount: any;
  duration: any;
  branch_name?: string;
}

export default function LoanPDFButtons({ loan }: { loan: LoanData }) {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // @ts-ignore - pure jspdf only - 100% working on Vercel
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210;

      const branchName = loan.branch_name || "Branch";
      const contractNo = loan.contract_no || "MHLN/26/PD/0001";
      const loanType = loan.loan_type || "PD";
      const amount = Number(loan.amount || 50000);
      const duration = loan.duration || "3";
      const dateStr = new Date().toLocaleDateString("en-US");

      // Background white
      doc.setFillColor(255,255,255);
      doc.rect(0,0,pageW,297,"F");

      // ====== HEADER TITLE ======
      let y = 28;
      doc.setFillColor(5, 17, 57); // #051139
      doc.roundedRect(14, y, 9, 9, 2, 2, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold");
      doc.setFontSize(12);
      doc.text("S", 17.5, y+6.5);

      doc.setTextColor(5, 17, 57);
      doc.setFontSize(16);
      doc.setFont("helvetica","bold");
      doc.text("OFFICIAL LOAN RECORD", 27, y+6.5);

      // Right side branch + ref
      doc.setFontSize(10);
      doc.setFont("helvetica","bold");
      doc.text(branchName, pageW-14, y+2, { align: "right" });
      doc.setFontSize(7);
      doc.setTextColor(140,140,150);
      doc.text(`REF: ${contractNo}/DOC-${loan.id}`, pageW-14, y+7, { align: "right" });

      y += 14;
      doc.setTextColor(140,150,170);
      doc.setFontSize(6.5);
      doc.setFont("helvetica","bold");
      doc.text("DEARO INVESTMENT LIMITED - LOAN MANAGEMENT SYSTEM", 14, y);
      
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.setLineWidth(0.5);
      doc.line(14, y, pageW-14, y);

      // ====== 01 BASIC INFORMATION ======
      y += 14;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7.5);
      doc.setFont("helvetica","bold");
      doc.text("01. BASIC INFORMATION", 14, y);
      y += 3;
      doc.setDrawColor(235, 245, 255);
      doc.line(14, y, pageW-14, y);
      y += 10;

      doc.setTextColor(140,140,140);
      doc.setFontSize(6);
      doc.setFont("helvetica","bold");
      doc.text("CONTRACT NUMBER", 14, y);
      doc.text("LOAN TYPE", 110, y);
      y += 6;
      doc.setTextColor(15,23,42);
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.text(contractNo, 14, y);

      // Loan type badge
      doc.setFillColor(240,242,245);
      doc.roundedRect(110, y-5, 14, 7, 1.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setTextColor(60,60,60);
      doc.text(loanType, 113, y-0.5);

      y += 18;

      // ====== 02 FINANCIAL STATEMENT BOX ======
      doc.setFillColor(248,249,252);
      doc.setDrawColor(230,235,245);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, pageW-28, 42, 4, 4, "FD");
      y += 9;
      doc.setTextColor(100,110,130);
      doc.setFontSize(7);
      doc.setFont("helvetica","bold");
      doc.text("02. FINANCIAL STATEMENT", 20, y);
      y += 3;
      doc.setDrawColor(220,225,235);
      doc.line(20, y, pageW-20, y);
      y += 10;

      // Principal Amount
      doc.setFillColor(255,255,255);
      doc.setDrawColor(220,235,220);
      doc.roundedRect(22, y-4, 9, 9, 2, 2, "FD");
      doc.setTextColor(34,197,94);
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.text("$", 24.8, y+1.8);

      doc.setTextColor(130,130,130);
      doc.setFontSize(5.5);
      doc.text("PRINCIPAL AMOUNT", 35, y-1);
      doc.setTextColor(15,23,42);
      doc.setFontSize(12);
      doc.text(`Rs. ${amount.toLocaleString()}.00`, 35, y+5);

      // Duration
      const rx = 110;
      doc.setFillColor(255,255,255);
      doc.setDrawColor(200,215,245);
      doc.roundedRect(rx, y-4, 9, 9, 2, 2, "FD");
      doc.setTextColor(37,99,235);
      doc.setFontSize(11);
      doc.text("C", rx+2.5, y+1.8);

      doc.setTextColor(130,130,130);
      doc.setFontSize(5.5);
      doc.text("DURATION", rx+13, y-1);
      doc.setTextColor(15,23,42);
      doc.setFontSize(12);
      doc.text(`${duration} Months`, rx+13, y+5);

      y += 40;

      // ====== SIGNATURES ======
      y = 250;
      doc.setDrawColor(180,180,180);
      doc.setLineWidth(0.3);
      doc.line(20, y, 85, y);
      doc.line(125, y, 190, y);
      y += 6;
      doc.setFontSize(6);
      doc.setTextColor(150,150,150);
      doc.setFont("helvetica","bold");
      doc.text("AUTHORIZED SIGNATURE", 32, y);
      doc.text("CUSTOMER ACKNOWLEDGMENT", 132, y);

      // ====== FOOTER ======
      y = 285;
      doc.setDrawColor(230,235,245);
      doc.line(14, y, pageW-14, y);
      y += 6;
      doc.setFontSize(5.5);
      doc.setTextColor(140,140,150);
      doc.setFont("helvetica","bold");
      doc.text("GENERATED BY DEARO SYSTEM", 14, y);
      doc.text(`DATE: ${dateStr}`, pageW-14, y, { align: "right" });

      doc.save(`OFFICIAL-LOAN-${contractNo}-DOC-${loan.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handlePrint}
        className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        title="Print"
      >
        <Printer size={18} className="text-slate-700"/>
      </button>

      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="h-11 px-6 bg-[#051139] hover:bg-black text-white rounded-xl flex items-center gap-2 font-bold text-[12px] shadow-lg disabled:opacity-50 transition-all active:scale-95"
      >
        {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
        {downloading ? "Downloading..." : "Download PDF"}
      </button>
    </div>
  );
}