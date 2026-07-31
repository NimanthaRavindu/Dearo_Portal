"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitDocument(docId: number) {
  try {
    console.log("Submitting Document ID:", docId);

    const numericId = Number(docId);

    // 1. numericId එකම භාවිතා කරන්න
    // 2. documentRequest වෙනුවට schema එකේ තියෙන නිවැරදි model name එක යොදන්න
    const doc = await prisma.documentRequest.findUnique({
      where: { id: numericId } // docId වෙනුවට numericId යොදන්න
    });

    if (!doc) {
      return { error: `Document ID ${docId} not found in database.` };
    }

    await prisma.documentRequest.update({
      where: { id: numericId },
      data: { status: "SUBMITTED" }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update Error Details:", error);
    return { error: "Failed to update status. Please check terminal for details." };
  }
}