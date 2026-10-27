"use client";
import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

type InvestmentData = {
  id: number;
  contract_no?: string | null;
  amount: any;
  branch_name?: string;
  statement_date?: string | null;
}

export default function InvestmentPDFButtons({ investment }: { investment: InvestmentData }) {
  const [downloading, setDownloading] = useState(false);
  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // @ts-ignore
      const jspdfModule: any = await import("jspdf/dist/jspdf.es.min.js");
      // @ts-ignore
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF;
      const doc = new jsPDF("p", "mm", "a4");
      const pageW = 210;

      const hasContractNo = !!(investment.contract_no && investment.contract_no.trim() !== "");
      const contractNo = investment.contract_no || "";
      const branchName = investment.branch_name || "Thissamaharama";
      const amount = Number(investment.amount || 0);
      const statementDate = investment.statement_date || "2026-09-01";

      let y = 12;
      doc.setFillColor(5, 17, 57);
      doc.rect(0, y, pageW, 2, "F");
      y = 28;
      doc.setFillColor(5, 17, 57);
      doc.roundedRect(14, y, 9, 9, 2, 2, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold");
      doc.setFontSize(12);
      doc.text("I", 17.5, y+6.5);
      doc.setTextColor(5, 17, 57);
      doc.setFontSize(14);
      doc.text("INVESTMENT CERTIFICATE", 27, y+6.5);
      doc.setFontSize(8);
      doc.setFont("helvetica","normal");
      doc.setTextColor(100,116,139);
      doc.text(branchName, pageW-14, y+2, { align: "right" });
      if(hasContractNo) {
        doc.setFontSize(6);
        doc.text(`REF: ${contractNo}`, pageW-14, y+6, { align: "right" });
      }
      y += 12;
      doc.setTextColor(148,163,184);
      doc.setFontSize(6);
      doc.text("DEARO INVESTMENT LIMITED - ASSET MANAGEMENT", 14, y);
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);
      y += 12;

      // 01 - NO RED ERROR ANYMORE
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7);
      doc.setFont("helvetica","bold");
      doc.text("01. INVESTMENT IDENTIFICATION", 14, y);
      y += 4;
      doc.setDrawColor(241,245,249);
      doc.line(14, y, pageW-14, y);
      y += 10;
      
      if(hasContractNo){
        doc.setTextColor(140,140,140);
        doc.setFontSize(5.5);
        doc.setFont("helvetica","bold");
        doc.text("CONTRACT NO", 22, y);
        y += 5;
        doc.setFontSize(10);
        doc.setFont("helvetica","bold");
        doc.setTextColor(15,23,42);
        doc.text(contractNo, 22, y);
        y += 14;
      }

      // 02 - FINANCIAL ALLOCATION - screenshot eke widiyata
      doc.setFillColor(248,250,252);
      doc.setDrawColor(241,245,249);
      doc.roundedRect(14, y, pageW-28, 32, 4, 4, "FD");
      y += 8;
      doc.setTextColor(100,116,139);
      doc.setFontSize(6);
      doc.setFont("helvetica","bold");
      doc.text("02. FINANCIAL ALLOCATION", 20, y);
      y += 4;
      doc.setDrawColor(226,232,240);
      doc.line(20, y, pageW-20, y);
      y += 8;

      doc.setTextColor(100,116,139);
      doc.setFontSize(5);
      doc.setFont("helvetica","bold");
      doc.text("INVESTMENT AMOUNT", 22, y);
      doc.text("STATEMENT DATE", 110, y);
      y += 5;
      doc.setTextColor(15,23,42);
      doc.setFontSize(10);
      doc.setFont("helvetica","bold");
      doc.text(`Rs. ${amount.toLocaleString()}.00`, 22, y);
      doc.setFontSize(8);
      doc.text(statementDate, 110, y);

      // Footer
      y = 240;
      doc.setDrawColor(203,213,225);
      doc.line(14, y, 85, y);
      doc.line(115, y, pageW-14, y);
      y += 4;
      doc.setTextColor(148,163,184);
      doc.setFontSize(5);
      doc.setFont("helvetica","bold");
      doc.text("AUTHORIZED SIGNATORY", 14, y);
      doc.text("INVESTOR SIGNATURE", 115, y);

      y = 275;
      doc.setDrawColor(241,245,249);
      doc.line(14, y, pageW-14, y);
      y += 5;
      doc.setFontSize(5);
      doc.setTextColor(148,163,184);
      doc.text("DEARO SYSTEM GENERATED RECORD", 14, y);
      doc.text(`PRINTED ON: ${new Date().toLocaleString()}`, pageW-14, y, { align: "right" });

      doc.save(`INVESTMENT-${hasContractNo ? contractNo : investment.id}-${investment.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button onClick={handlePrint} className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm"><Printer size={18} className="text-slate-700"/></button>
      <button onClick={handleDownloadPDF} disabled={downloading} className="h-11 px-6 bg-[#051139] hover:bg-black text-white rounded-xl flex items-center gap-2 font-bold text-[12px] shadow-lg disabled:opacity-50">
        {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}Download PDF
      </button>
    </div>
  );
}