import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryTerm = searchParams.get('q');

    if (!queryTerm) return NextResponse.json([]);

    // 💡 Prisma use karala LIKE query eka liyana widiha
    const branches = await prisma.branch.findMany({
      where: {
        OR: [
          {
            branch_name: {
              contains: queryTerm,
            },
          },
          {
            branch_code: {
              contains: queryTerm,
            },
          },
        ],
      },
      select: {
        branchId: true,
        branch_name: true,
        branch_code: true,
      },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error("Branch Search Error:", error);
    return NextResponse.json([]);
  }
}