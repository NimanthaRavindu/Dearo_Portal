import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nic, email, password, branchId } = body;

  
    if (!name || !nic || !email || !password) {
      return NextResponse.json(
        { error: "සියලුම තොරතුරු ඇතුළත් කිරීම අනිවාර්යයි." },
        { status: 400 }
      );
    }

    // 💡 Prisma native create method 
    const newUser = await prisma.user.create({
      data: {
        name,
        nic,
        email,
        password, // (Note: Production එකේදී password එක Hashing (bcrypt) කර දීම ආරක්ෂිතයි)
        branchId: branchId ? Number(branchId) : 1, // Default branchId එක 1 ලෙස හෝ body එකෙන් එන අගය ලබා දීම
      },
    });

    return NextResponse.json(
      { message: "පරිශීලකයා සාර්ථකව ඇතුළත් කරන ලදී.", user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("SIGNUP_API_ERROR:", error);
    
   
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "ഈ NIC හෝ Email එක දැනටමත් භාවිතයේ ඇත." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}