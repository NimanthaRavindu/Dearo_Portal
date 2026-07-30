import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const requests = await prisma.documentRequest.findMany({
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

    console.log("POST Received Data:", { docNumber, documentType, branchId });

    if (!documentType) {
      return NextResponse.json(
        { error: "Missing required fields (docNumber or documentType)" },
        { status: 400 }
      );
    }

    const newRequest = await prisma.documentRequest.create({
      data: {
        docNumber: String(docNumber),
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
    const { docNumber, action } = body;

    console.log("PATCH Received Data:", { docNumber, action });

    if (!action) {
      return NextResponse.json(
        { success: false, error: "docNumber and action are required" },
        { status: 400 }
      );
    }

    const newStatus = action === "SUBMIT" ? "APPROVED" : "DECLINED";

 
    const updatedHistory = await prisma.requestHistory.updateMany({
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