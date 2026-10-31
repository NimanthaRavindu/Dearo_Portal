import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const requests = await prisma.documentrequest.findMany({
      where: {
        ...(type && { documentType: type.toUpperCase() as any }),
      },
      orderBy: { createdAt: "desc" },
    });

    // requesthistory eken link + reference ganna
    const enhanced = await Promise.all(
      requests.map(async (doc: any) => {
        const branchId = doc.senderId;
        
        // docNumber eka anuwa history eke link eka hoyanawa
        const history = await prisma.requesthistory.findFirst({
          where: { referenceNo: doc.docNumber },
          orderBy: { createdAt: "desc" },
        });

        // Link eka thiyenawa nam eka thamai real page eka
        // ex: /dashboard/branches/26/loans/15
        let link = history?.link || null;
        let realId = doc.id;

        // Link eken loan/account id extract karanna
        if (link) {
          const match = link.match(/\/(loans|accounts|investments)\/(\d+)/);
          if (match) realId = Number(match[2]);
        }

        return {
          ...doc,
          branchId,
          branch_id: branchId,
          referenceId: realId,
          loanId: doc.documentType === "LOAN" ? realId : undefined,
          accountId: doc.documentType === "ACCOUNT" ? realId : undefined,
          investmentId: doc.documentType === "INVESTMENT" ? realId : undefined,
          link: link, // real navigation link
          referenceNo: history?.referenceNo || doc.docNumber,
        };
      })
    );

    return NextResponse.json(enhanced);
  } catch (error: any) {
    console.error("DATABASE GET ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, documentType, branchId, link, referenceNo } = body;
    if (!documentType) return NextResponse.json({ error: "Missing documentType" }, { status: 400 });

    const safeDocNumber = docNumber && docNumber !== "undefined" && docNumber !== "null" ? String(docNumber).trim() : "";

    const newRequest = await prisma.documentrequest.create({
      data: {
        docNumber: safeDocNumber,
        documentType: documentType,
        senderId: Number(branchId) || 1,
        status: "PENDING",
      },
    });

    // history eke link ekath save karanawa - eye click walata lesi
    if (link) {
      await prisma.requesthistory.create({
        data: {
          branchId: Number(branchId) || 1,
          documentType: documentType,
          referenceNo: referenceNo || safeDocNumber,
          link: link,
          status: "Viewed",
        },
      });
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error("DATABASE POST ERROR:", error);
    return NextResponse.json({ error: "Data insertion failed", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, action, documentType, senderId, branchId } = body;
    if (!action) return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });

    const newStatus = action === "SUBMIT" ? "APPROVED" : "DECLINED";
    const safeDocNumber = docNumber && docNumber !== "undefined" && docNumber !== "null" && docNumber !== "N/A" ? String(docNumber).trim() : "";
    const parsedBranchId = Number(senderId || branchId);
    const validBranchId = !isNaN(parsedBranchId) && parsedBranchId > 0 ? parsedBranchId : undefined;
    const docTypeVariants = documentType ? [documentType, documentType.toUpperCase(), documentType.toLowerCase()] : [];
    let targetRecord = null;

    if (safeDocNumber !== "") {
      targetRecord = await prisma.requesthistory.findFirst({ where: { referenceNo: safeDocNumber, ...(validBranchId && { branchId: validBranchId }) }, orderBy: { id: "desc" } });
    }
    if (!targetRecord && validBranchId) {
      targetRecord = await prisma.requesthistory.findFirst({ where: { branchId: validBranchId, ...(docTypeVariants.length > 0 && { documentType: { in: docTypeVariants } }) }, orderBy: { id: "desc" } });
    }
    if (!targetRecord && docTypeVariants.length > 0) {
      targetRecord = await prisma.requesthistory.findFirst({ where: { documentType: { in: docTypeVariants } }, orderBy: { id: "desc" } });
    }

    if (targetRecord) {
      const updated = await prisma.requesthistory.update({ where: { id: targetRecord.id }, data: { status: newStatus } });
      return NextResponse.json({ success: true, updatedRecord: updated });
    }
    return NextResponse.json({ success: false, error: "No matching record found" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}