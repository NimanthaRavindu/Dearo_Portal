"use client";
import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

type InvestmentData = {
  id: number;
  contract_no?: string | null;
  amount: any;
  billPhoto?: string | null;
  branch_name?: string;
}

export default function InvestmentPDFButtons({ investment }: { investment: InvestmentData }) {
  const [downloading, setDownloading] = useState(false);
  const handlePrint = () => window.print();

  const getCloudinaryBase64 = async (url: string): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if(!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

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
      const amount = Number(investment.amount || 0);

      let y = 12;
      doc.setFillColor(15, 23, 120);
      doc.rect(0, y, pageW, 2, "F");
      y = 28;
      doc.setFillColor(5, 17, 57);
      doc.roundedRect(14, y, 9, 9, 2, 2, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold");
      doc.setFontSize(12);
      doc.text("I", 17.5, y+6.5);
      doc.setTextColor(5, 17, 57);
      doc.setFontSize(16);
      doc.text("INVESTMENT CERTIFICATE", 27, y+6.5);
      y += 14;
      doc.setTextColor(140,150,170);
      doc.setFontSize(6.5);
      doc.text("DEARO INVESTMENT LIMITED - ASSET MANAGEMENT", 14, y);
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);

      if (!hasContractNo) {
        y += 10;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(14, y, pageW-28, 12, 2, 2, "FD");
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(9);
        doc.text("!! BORU / FAKE - VALID CONTRACT NUMBER EKAK NATHA !!", pageW/2, y+7.5, { align: "center" });
        y += 18;
      } else {
        y += 14;
      }

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7.5);
      doc.text("01. INVESTMENT IDENTIFICATION", 14, y);
      y += 8;
      if (hasContractNo) {
        doc.setTextColor(140,140,140);
        doc.setFontSize(6);
        doc.text("CONTRACT NO", 14, y);
        y += 7;
        doc.setFontSize(11);
        doc.setFont("helvetica","bold");
        doc.setTextColor(15,23,42);
        doc.text(contractNo, 14, y);
        y += 12;
      }

      y += 10;
      doc.setFillColor(248,249,252);
      doc.setDrawColor(230,235,245);
      doc.roundedRect(14, y, pageW-28, 30, 4, 4, "FD");
      y += 10;
      doc.setTextColor(130,130,130);
      doc.setFontSize(5.5);
      doc.text("INVESTMENT AMOUNT", 22, y);
      y += 6;
      doc.setTextColor(15,23,42);
      doc.setFontSize(14);
      doc.setFont("helvetica","bold");
      doc.text(`Rs. ${amount.toLocaleString()}.00`, 22, y);

      y += 20;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7);
      doc.setFont("helvetica","normal");
      doc.text("02. UPLOADED BILL ATTACHMENT", 14, y);
      y += 8;

      if (investment.billPhoto) {
        const base64 = await getCloudinaryBase64(investment.billPhoto);
        if (base64) {
          try {
            doc.setDrawColor(200,200,200);
            doc.setFillColor(250,250,252);
            doc.roundedRect(14, y, 90, 65, 3, 3, "FD");
            const imgType = base64.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(base64, imgType, 16, y+2, 86, 61, undefined, 'FAST');
          } catch {}
        }
      }

      doc.save(`INVESTMENT-${hasContractNo ? contractNo : 'INVALID'}-${investment.id}.pdf`);
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