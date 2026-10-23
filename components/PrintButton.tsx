"use client";

import { useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

export default function PrintButton() {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadPDF = async () => {
    if (typeof window === "undefined") return;
    try {
      setDownloading(true);
      
      const element = document.querySelector(".max-w-4xl.mx-auto.bg-white.shadow-2xl") as HTMLElement;
      if (!element) {
        alert("Document not found!");
        return;
      }

      const html2canvasModule = await import("html2canvas");
      const jspdfModule = await import("jspdf");
      
      const html2canvas = html2canvasModule.default;
      const jsPDF = jspdfModule.jsPDF;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const contractNo = element.innerHTML.match(/MHLN\/[^<]+/)?.[0]?.trim() || "loan-record";
      pdf.save(`OFFICIAL-LOAN-RECORD-${contractNo}.pdf`);

    } catch (err) {
      console.error("PDF ERROR:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePrint}
        className="w-11 h-11 bg-[#0a1931] hover:bg-black text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
        title="Print"
      >
        <Printer size={18} />
      </button>

      <button
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg text-xs font-bold disabled:opacity-50"
        title="Download as PDF"
      >
        {downloading ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
        {downloading ? "Generating..." : "Download PDF"}
      </button>
    </div>
  );
}