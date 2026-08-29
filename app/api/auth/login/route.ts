import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// 💡 Connection dropped error එකක් ආවොත් automatically reconnect කරලා query එක retry කරන helper එකක්
async function executeWithRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (error?.message?.includes('closed') || error?.code === 'P1001' || error?.code === 'P1002')) {
            console.warn(`Database connection dropped. Retrying... (${retries} attempts left)`);
            // සම්බන්ධතාවය අලුත් කර ගැනීමට කෙටි διάστημαක් රැඳී සිටීම
            await new Promise(res => setTimeout(res, 1000));
            return executeWithRetry(operation, retries - 1);
        }
        throw error;
    }
}

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

        // 💡 Retry logic එක හරහා user ව query කිරීම
        const user = await executeWithRetry(() => 
            prisma.user.findFirst({
                where: {
                    nic: nic,
                    password: password
                }
            })
        );

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

    } catch (error: any) {
        console.error("Login API Error:", error);
        return NextResponse.json(
            { success: false, message: "Server connection error. Please try again.", error: error.message },
            { status: 500 }
        );
    }
}