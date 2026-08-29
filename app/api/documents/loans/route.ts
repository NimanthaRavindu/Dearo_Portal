import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const rows = await (prisma.loan.groupBy as any)({
            by: ['type'],
            _count: {
                id: true,
            },
        });

        const formattedData = rows.map((item: any) => ({
            type: item.type,
            count: item._count.id || item._count._all || 0,
        }));

        return NextResponse.json({success:true, data: formattedData});
    } catch (error: any) {
        return NextResponse.json({success:false, error: error.message},{status:500});
    }
}