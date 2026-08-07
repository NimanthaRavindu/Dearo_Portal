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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("DATABASE GET ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, documentType, branchId } = body;

    if (!documentType) {
      return NextResponse.json(
        { error: "Missing required field: documentType" },
        { status: 400 }
      );
    }

    const safeDocNumber =
      docNumber &&
      docNumber !== "undefined" &&
      docNumber !== "null"
        ? String(docNumber).trim()
        : "";

    const newRequest = await prisma.documentrequest.create({
      data: {
        docNumber: safeDocNumber,
        documentType: documentType,
        senderId: Number(branchId) || 1,
        status: "PENDING",
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error("DATABASE POST ERROR:", error);
    return NextResponse.json(
      {
        error: "Data insertion failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, action, documentType, senderId, branchId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 }
      );
    }

    const newStatus = action === "SUBMIT" ? "APPROVED" : "DECLINED";

    const safeDocNumber =
      docNumber &&
      docNumber !== "undefined" &&
      docNumber !== "null" &&
      docNumber !== "N/A"
        ? String(docNumber).trim()
        : "";

    const parsedBranchId = Number(senderId || branchId);
    const validBranchId = !isNaN(parsedBranchId) && parsedBranchId > 0 ? parsedBranchId : undefined;

    const docTypeVariants = documentType
      ? [
          documentType,
          documentType.toUpperCase(),
          documentType.toLowerCase(),
          documentType.charAt(0).toUpperCase() + documentType.slice(1).toLowerCase(),
        ]
      : [];

    let targetRecord = null;

    
    if (safeDocNumber !== "") {
      targetRecord = await prisma.requesthistory.findFirst({
        where: {
          referenceNo: safeDocNumber,
          ...(validBranchId && { branchId: validBranchId }),
          status: {
            notIn: ["APPROVED", "DECLINED"],
          },
        },
        orderBy: {
          id: "asc",
        },
      });
    }

    if (!targetRecord) {
      const whereClause: any = {
        OR: [
          { referenceNo: "" },
          { referenceNo: " " },
        ],
        status: {
          notIn: ["APPROVED", "DECLINED"],
        },
      };

      if (validBranchId) {
        whereClause.branchId = validBranchId;
      }

      if (docTypeVariants.length > 0) {
        whereClause.documentType = {
          in: docTypeVariants,
        };
      }

      targetRecord = await prisma.requesthistory.findFirst({
        where: whereClause,
        orderBy: {
          id: "asc",
        },
      });
    }

    if (!targetRecord && validBranchId) {
      targetRecord = await prisma.requesthistory.findFirst({
        where: {
          branchId: validBranchId,
          ...(docTypeVariants.length > 0 && {
            documentType: {
              in: docTypeVariants,
            },
          }),
          status: {
            notIn: ["APPROVED", "DECLINED"],
          },
        },
        orderBy: {
          id: "asc",
        },
      });
    }

    if (targetRecord) {
      await prisma.requesthistory.update({
        where: {
          id: targetRecord.id,
        },
        data: {
          status: newStatus,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Status updated to ${newStatus} for history ID ${targetRecord.id}`,
        updatedCount: 1,
      });
    }

    return NextResponse.json({
      success: true,
      message: "No matching pending record found in requesthistory",
      updatedCount: 0,
    });
  } catch (error: any) {
    console.error("DATABASE PATCH ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update status in requesthistory",
        details: error.message,
      },
      { status: 500 }
    );
  }
}