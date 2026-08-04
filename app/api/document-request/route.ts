import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 1. GET REQUEST
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

// 2. POST REQUEST (Submit Request)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, documentType, branchId } = body;

    console.log("POST Received Data:", { docNumber, documentType, branchId });

    if (!documentType) {
      return NextResponse.json(
        { error: "Missing required field: documentType" },
        { status: 400 }
      );
    }

    const newRequest = await prisma.documentrequest.create({
      data: {
        docNumber: String(docNumber || "N/A"),
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

// 3. PATCH REQUEST (Update Status)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { docNumber, action } = body;

    console.log("PATCH Received Data:", { docNumber, action });

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 }
      );
    }

    const newStatus = action === "SUBMIT" ? "APPROVED" : "DECLINED";

    const updatedHistory = await prisma.requesthistory.updateMany({
      where: {
        referenceNo: String(docNumber),
      },
      data: {
        status: newStatus,
      },
    });

    console.log("Updated History Result:", updatedHistory);

    return NextResponse.json({
      success: true,
      message: `Status successfully updated to ${newStatus} in requesthistory`,
      updatedCount: updatedHistory.count,
    });
  } catch (error: any) {
    console.error("DATABASE PATCH ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update status in requesthistory",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// 4. DELETE REQUEST (Permanently Delete Record & History)
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, docNumber } = body;

    console.log("DELETE Received Data:", { id, docNumber });

    if (!id && !docNumber) {
      return NextResponse.json(
        { success: false, error: "Record ID or docNumber is required for deletion" },
        { status: 400 }
      );
    }

    if (docNumber && docNumber !== "N/A") {
      await prisma.requesthistory.deleteMany({
        where: { referenceNo: String(docNumber) },
      }).catch((e) => console.log("No history found to delete or error:", e.message));
    }

    if (id) {
      await prisma.documentrequest.delete({
        where: { id: Number(id) },
      }).catch((e) => console.log("DocumentRequest record not found by ID:", e.message));
    }

    return NextResponse.json({
      success: true,
      message: "Record and associated history deleted successfully",
    });
  } catch (error: any) {
    console.error("DATABASE DELETE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete record",
        details: error.message,
      },
      { status: 500 }
    );
  }
}