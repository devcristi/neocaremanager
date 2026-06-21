import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN", "DOCTOR", "ASSISTANT");

    const totalAdmissions = await prisma.admission.count();

    return NextResponse.json({ totalAdmissions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Admissions stats error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}