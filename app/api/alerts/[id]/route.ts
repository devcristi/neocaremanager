import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "DOCTOR", "ASSISTANT");

    const { id } = await params;
    const body = await request.json();
    const { resolved } = body;

    if (typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "resolved (boolean) is required." },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: { resolved },
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        message: alert.message,
        type: alert.type,
        priority: alert.priority,
        resolved: alert.resolved,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Update alert error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}