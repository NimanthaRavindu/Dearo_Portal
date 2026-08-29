import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { branchId, customerName, docType, category } = await req.json();

        await prisma.documentrequest.create({
            data: {
                branchId: Number(branchId),
                customerName,
                docType,
                docCategory: category,
            } as any,
        });

        return NextResponse.json({success:true, message:"Inserted Success!"});
    } catch (error: any) {
        return NextResponse.json({success:false, message:"Database Error", error: error.message},{status:500});
    }
}