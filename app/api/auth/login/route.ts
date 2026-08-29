import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Prisma client eka import karaganna

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {

        const body = await request.json();
        const { nic, password } = body; 

        if (!nic || !password) {
            return NextResponse.json(
                { error: "NIC and password are required." },
                { status: 400 }
            );
        }

        // 💡 mysql2 wenuwata Prisma use karala database eken user wa hoyaganna
        // (Oyaage Prisma schema eke model eke nama 'user' nathnam 'User' wennath puluwan, poddak check karanna)
        const user = await prisma.user.findFirst({
            where: {
                nic: nic,
                password: password
            }
        });

        if (user) {
            return NextResponse.json(
                { 
                    success: true, 
                    user: user 
                },
                { 
                    status: 200, 
                }
            );
        } else {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "NIC හෝ මුරපදය වැරදියි!" 
                },
                { 
                    status: 401,  
                }
            );
        }

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error. Please try again later." },
            { status: 500 }
        );
    }
}