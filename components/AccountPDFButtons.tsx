"use client";
import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

type AccountData = {
  id: number;
  customer_name?: string | null;
  account_number: string;
  bill_type?: string | null;
  amount: any;
  billPhoto?: string | null;
  branch_name?: string;
  statement_date?: string | null;
  createdAt?: any;
  created_at?: any;
}

export default function AccountPDFButtons({ account }: { account: AccountData }) {
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
        } catch(e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      const sep = url.includes('?') ? '&' : '?';
      img.src = url + sep + 't=' + Date.now();
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

      const hasAccNo = !!(account.account_number && account.account_number.trim() !== "");
      const branchName = account.branch_name || "Batticalo";
      const customerName = account.customer_name || "N/A";
      const accNo = account.account_number || "";
      const billType = account.bill_type || "Petty Cash";
      const amount = Number(account.amount || 0);
      
      const rawDate = account.statement_date || account.created_at || account.createdAt || "2026-09-01";
      let statementDate = "2026-09-01";
      try {
        const d = new Date(rawDate);
        if(!isNaN(d.getTime())) statementDate = d.toISOString().split('T')[0];
        else if(typeof rawDate === 'string') statementDate = rawDate.split('T')[0];
      } catch {}

      doc.setFillColor(255,255,255);
      doc.rect(0,0,pageW,297,"F");
      let y = 12;
      doc.setFillColor(15, 23, 120);
      doc.rect(0, y, pageW, 2, "F");
      y = 28;
      doc.setFillColor(15, 23, 120);
      doc.roundedRect(14, y, 9, 9, 2, 2, "F");
      doc.setTextColor(255,255,255);
      doc.setFont("helvetica","bold");
      doc.setFontSize(12);
      doc.text("A", 17.5, y+6.5);
      doc.setTextColor(15, 23, 120);
      doc.setFontSize(14);
      doc.text("ACCOUNT INFORMATION STATEMENT", 27, y+6.5);
      doc.setFontSize(9);
      doc.setFont("helvetica","normal");
      doc.text(branchName, pageW-14, y+2, { align: "right" });
      y += 14;
      doc.setTextColor(140,150,170);
      doc.setFontSize(6);
      doc.text("DEARO INVESTMENT LIMITED - OFFICIAL RECORD", 14, y);
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);
      
      // Rathu error eka ain kala - directly content
      y += 12;

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7);
      doc.setFont("helvetica","bold");
      doc.text("01. ACCOUNT HOLDER INFORMATION", 14, y);
      y += 4;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);
      y += 8;
      doc.setTextColor(140,140,140);
      doc.setFontSize(5.5);
      doc.setFont("helvetica","normal");
      doc.text("CUSTOMER NAME", 14, y);
      if (hasAccNo) doc.text("ACCOUNT NUMBER", 110, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica","bold");
      doc.setTextColor(15,23,42);
      doc.text(customerName, 14, y);
      if (hasAccNo) doc.text(accNo, 110, y);

      y += 14;
      doc.setFillColor(248,249,252);
      doc.setDrawColor(230,235,245);
      doc.roundedRect(14, y, pageW-28, 28, 3, 3, "FD");
      y += 7;
      doc.setTextColor(100,110,130);
      doc.setFontSize(6);
      doc.setFont("helvetica","bold");
      doc.text("02. ACCOUNT SUMMARY", 20, y);
      y += 6;
      doc.setDrawColor(230,235,245);
      doc.line(20, y, pageW-34, y);
      y += 5;
      doc.setTextColor(130,130,130);
      doc.setFontSize(5);
      doc.setFont("helvetica","normal");
      doc.text("ACCOUNT TYPE", 22, y);
      doc.text("AMOUNT", 110, y);
      y += 5;
      doc.setFillColor(219,234,254);
      doc.roundedRect(22, y-3, 20, 5, 1, 1, "F");
      doc.setTextColor(30,64,175);
      doc.setFontSize(6);
      doc.setFont("helvetica","bold");
      doc.text(billType, 23.5, y);
      doc.setTextColor(15,23,42);
      doc.setFontSize(11);
      doc.text(`Rs. ${amount.toLocaleString()}.00`, 110, y);

      y += 16;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(6);
      doc.setFont("helvetica","bold");
      doc.text("03. UPLOADED BILL ATTACHMENT", 14, y);
      y += 2;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);
      y += 6;

      if (account.billPhoto) {
        const base64 = await getCloudinaryBase64(account.billPhoto);
        if (base64) {
          try {
            doc.setDrawColor(220,220,220);
            doc.setFillColor(250,250,252);
            doc.roundedRect(14, y, 65, 70, 2, 2, "FD");
            const imgType = base64.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(base64, imgType, 15, y+1, 63, 68, undefined, 'FAST');
            y += 75;
          } catch {}
        }
      }

      y += 8;
      doc.setDrawColor(240,240,240);
      doc.line(14, y, pageW-14, y);
      y += 6;
      doc.setTextColor(150,150,150);
      doc.setFontSize(5);
      doc.setFont("helvetica","normal");
      doc.text("STATEMENT DATE", 14, y);
      y += 4;
      doc.setTextColor(15,23,42);
      doc.setFontSize(8);
      doc.setFont("helvetica","bold");
      doc.text(statementDate, 14, y);

      let footerY = 272;
      doc.setDrawColor(180,180,180);
      doc.line(14, footerY, 85, footerY);
      doc.line(115, footerY, pageW-14, footerY);
      footerY += 4;
      doc.setTextColor(120,120,120);
      doc.setFontSize(5);
      doc.setFont("helvetica","normal");
      doc.text("AUTHORIZED OFFICER", 14, footerY);
      doc.text("DEARO CORE BANKING SYSTEM", 14, footerY+3);
      doc.text("ACCOUNT HOLDER SIGNATURE", 115, footerY);
      doc.text(`PRINTED: ${new Date().toLocaleDateString()}`, pageW-14, footerY+3, { align: "right" });

      doc.save(`ACCOUNT-${hasAccNo ? accNo : account.id}-${account.id}.pdf`);
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