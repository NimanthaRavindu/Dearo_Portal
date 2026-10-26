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
}

export default function AccountPDFButtons({ account }: { account: AccountData }) {
  const [downloading, setDownloading] = useState(false);
  const handlePrint = () => window.print();

  const fetchAsBase64 = async (url: string): Promise<string | null> => {
    try {
      // data:image already
      if (url.startsWith('data:')) return url;
      
      let finalUrl = url.startsWith('/') ? url : `/${url}`;
      finalUrl = finalUrl.replace('/public', '');

      // fetch as blob - same origin always works
      const res = await fetch(finalUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.log("image fetch fail", e);
      return null;
    }
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
      const branchName = account.branch_name || "Branch";
      const customerName = account.customer_name || "N/A";
      const accNo = account.account_number || "";
      const billType = account.bill_type || "SAVINGS";
      const amount = Number(account.amount || 0);
      const dateStr = new Date().toLocaleDateString("en-US");

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
      doc.setFontSize(16);
      doc.text("ACCOUNT INFORMATION STATEMENT", 27, y+6.5);
      doc.setFontSize(10);
      doc.text(branchName, pageW-14, y+2, { align: "right" });
      doc.setFontSize(7);
      doc.setTextColor(140,140,150);
      doc.text(`ACC ID: ${account.id.toString().padStart(6,'0')}`, pageW-14, y+7, { align: "right" });
      y += 14;
      doc.setTextColor(140,150,170);
      doc.setFontSize(6.5);
      doc.text("DEARO INVESTMENT LIMITED - OFFICIAL RECORD", 14, y);
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.setLineWidth(0.5);
      doc.line(14, y, pageW-14, y);

      if (!hasAccNo) {
        y += 10;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(14, y, pageW-28, 12, 2, 2, "FD");
        doc.setTextColor(185, 28, 28);
        doc.setFont("helvetica","bold");
        doc.setFontSize(9);
        doc.text("!! BORU / FAKE - VALID ACCOUNT NUMBER EKAK NATHA !!", pageW/2, y+7.5, { align: "center" });
        y += 10;
      }

      y += 14;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7.5);
      doc.text("01. ACCOUNT HOLDER INFORMATION", 14, y);
      y += 8;
      doc.setTextColor(140,140,140);
      doc.setFontSize(6);
      doc.text("CUSTOMER NAME", 14, y);
      doc.text("ACCOUNT NUMBER", 110, y);
      y += 7;
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.setTextColor(15,23,42);
      doc.text(customerName, 14, y);
      if (hasAccNo) {
        doc.text(accNo, 110, y);
      } else {
        doc.setTextColor(220,38,38);
        doc.text("BORU / FAKE - NO NUMBER", 110, y);
      }

      y += 18;
      doc.setFillColor(248,249,252);
      doc.setDrawColor(230,235,245);
      doc.roundedRect(14, y, pageW-28, 38, 4, 4, "FD");
      y += 9;
      doc.setTextColor(100,110,130);
      doc.setFontSize(7);
      doc.text("02. ACCOUNT SUMMARY", 20, y);
      y += 10;
      doc.setTextColor(130,130,130);
      doc.setFontSize(5.5);
      doc.text("ACCOUNT TYPE", 22, y-1);
      doc.text("AMOUNT", 110, y-1);
      doc.setTextColor(15,23,42);
      doc.setFontSize(9);
      doc.text(billType, 22, y+5);
      doc.setFontSize(12);
      doc.text(`Rs. ${amount.toLocaleString()}.00`, 110, y+5);

      y += 22;
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7);
      doc.text("03. UPLOADED BILL ATTACHMENT", 14, y);
      y += 8;

      if (account.billPhoto) {
        const base64 = await fetchAsBase64(account.billPhoto);
        if (base64) {
          try {
            const imgType = base64.includes('png') ? 'PNG' : 'JPEG';
            // A4 walata fit wenna 90 width, auto height
            doc.setDrawColor(200,200,200);
            doc.setFillColor(250,250,252);
            doc.roundedRect(14, y, 90, 65, 3, 3, "FD");
            // add image with some padding
            doc.addImage(base64, imgType, 16, y+2, 86, 61, undefined, 'FAST');
            y += 75;
          } catch (err) {
            console.log(err);
            doc.setTextColor(150,150,150);
            doc.setFontSize(8);
            doc.text("Bill photo error - could not render", 14, y);
            y += 10;
          }
        } else {
          doc.setTextColor(180,0,0);
          doc.setFontSize(8);
          doc.text("Bill photo URL fetch failed: " + account.billPhoto, 14, y);
          y += 10;
        }
      } else {
        doc.setTextColor(150,150,150);
        doc.setFontSize(8);
        doc.text("No bill photo uploaded", 14, y);
        y += 10;
      }

      let sigY = Math.max(y + 20, 260);
      if(sigY > 270) { doc.addPage(); sigY = 20; }
      doc.setDrawColor(180,180,180);
      doc.line(20, sigY, 85, sigY);
      doc.line(125, sigY, 190, sigY);
      sigY += 6;
      doc.setFontSize(6);
      doc.setTextColor(150,150,150);
      doc.text("AUTHORIZED OFFICER", 32, sigY);
      doc.text("ACCOUNT HOLDER SIGNATURE", 132, sigY);

      doc.save(`ACCOUNT-${hasAccNo ? accNo : 'INVALID'}-DOC-${account.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF download failed: " + e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button onClick={handlePrint} className="h-11 w-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
        <Printer size={18} className="text-slate-700"/>
      </button>
      <button onClick={handleDownloadPDF} disabled={downloading} className="h-11 px-6 bg-[#051139] hover:bg-black text-white rounded-xl flex items-center gap-2 font-bold text-[12px] shadow-lg disabled:opacity-50">
        {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
        {downloading ? "Downloading..." : "Download PDF"}
      </button>
    </div>
  );
}