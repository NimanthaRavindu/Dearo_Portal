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

    console.log("POST Received Data:", { docNumber, documentType, branchId });

    if (!documentType) {
      return NextResponse.json(
        { error: "Missing required field: documentType" },
        { status: 400 }
      );
    }

    // docNumber එක "undefined", "null" හෝ හිස් නම් එය පිරිසිදු හිස් string ("") එකක් ලෙස සකස් කිරීම
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
    const { docNumber, action } = body;

    console.log("PATCH Received Data:", { docNumber, action });

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required" },
        { status: 400 }
      );
    }

    const newStatus = action === "SUBMIT" ? "APPROVED" : "DECLINED";

    // docNumber එක Valid ද යන්න පරීක්ෂාව
    const safeDocNumber =
      docNumber &&
      docNumber !== "undefined" &&
      docNumber !== "null"
        ? String(docNumber).trim()
        : "";

    let updatedCount = 0;

    // docNumber එකක් තිබේ නම් පමණක් requesthistory එක update කරයි
    if (safeDocNumber !== "") {
      const updatedHistory = await prisma.requesthistory.updateMany({
        where: {
          referenceNo: safeDocNumber,
        },
        data: {
          status: newStatus,
        },
      });
      updatedCount = updatedHistory.count;
    }

    console.log("Updated History Result Count:", updatedCount);

    return NextResponse.json({
      success: true,
      message: `Status successfully updated to ${newStatus} in requesthistory`,
      updatedCount: updatedCount,
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