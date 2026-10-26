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

  const getCloudinaryBase64 = async (url: string): Promise<string | null> => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;

    // Method 2 - Image + Canvas (Cloudinary wala CORS allow)
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
      // Cloudinary cache bust + force CORS
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
      const branchName = account.branch_name || "Branch";
      const customerName = account.customer_name || "N/A";
      const accNo = account.account_number || "";
      const billType = account.bill_type || "SAVINGS";
      const amount = Number(account.amount || 0);

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
      y += 14;
      doc.setTextColor(140,150,170);
      doc.setFontSize(6.5);
      doc.text("DEARO INVESTMENT LIMITED - OFFICIAL RECORD", 14, y);
      y += 6;
      doc.setDrawColor(235,238,245);
      doc.line(14, y, pageW-14, y);

      if (!hasAccNo) {
        y += 10;
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(14, y, pageW-28, 12, 2, 2, "FD");
        doc.setTextColor(185, 28, 28);
        doc.setFontSize(9);
        doc.text("!! BORU / FAKE - VALID ACCOUNT NUMBER EKAK NATHA !!", pageW/2, y+7.5, { align: "center" });
        y += 18;
      } else {
        y += 14;
      }

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7.5);
      doc.text("01. ACCOUNT HOLDER INFORMATION", 14, y);
      y += 8;
      doc.setTextColor(140,140,140);
      doc.setFontSize(6);
      doc.text("CUSTOMER NAME", 14, y);
      
      // Account number eke mokavath penwanna epa - hasAccNo nam witharak penwanawa
      if (hasAccNo) {
        doc.text("ACCOUNT NUMBER", 110, y);
      }
      y += 7;
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.setTextColor(15,23,42);
      doc.text(customerName, 14, y);
      if (hasAccNo) {
        doc.text(accNo, 110, y);
      }
      // else - mokavath penne na

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
        const base64 = await getCloudinaryBase64(account.billPhoto);
        if (base64) {
          try {
            doc.setDrawColor(200,200,200);
            doc.setFillColor(250,250,252);
            doc.roundedRect(14, y, 90, 65, 3, 3, "FD");
            const imgType = base64.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(base64, imgType, 16, y+2, 86, 61, undefined, 'FAST');
            y += 75;
          } catch (e) {
            doc.setTextColor(150,150,150);
            doc.text("Image render error", 14, y);
          }
        } else {
          doc.setTextColor(200,0,0);
          doc.setFontSize(7);
          doc.text("Could not load Cloudinary image - check CORS", 14, y);
        }
      }

      doc.save(`ACCOUNT-${hasAccNo ? accNo : 'INVALID'}-${account.id}.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-3">
      <button onClick={handlePrint} className="h-11 w-11 bg-white border rounded-xl flex items-center justify-center"><Printer size={18}/></button>
      <button onClick={handleDownloadPDF} disabled={downloading} className="h-11 px-6 bg-[#051139] text-white rounded-xl flex items-center gap-2 font-bold text-[12px]">
        {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}Download PDF
      </button>
    </div>
  );
}