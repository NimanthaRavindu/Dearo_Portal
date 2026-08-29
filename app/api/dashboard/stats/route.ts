import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const total = await prisma.documentrequest.count();
        const pending = await prisma.documentrequest.count({
            where: { status: "Pending" as any }
        });
        const approved = await prisma.documentrequest.count({
            where: { status: "Approved" as any }
        });
        
        return NextResponse.json({
           total,
           pending,
           approved,
        });
    } catch (error) {
        return NextResponse.json({error:"Failed to fetch stats"},{status:500});
    }
}