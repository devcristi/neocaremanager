import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decryptPatient } from "@/lib/encryption";

export async function GET() {
  try {
    const user = await getSession();
    console.log("[mother/patients] Session user:", { id: user?.id, role: user?.role });

    if (!user || user.role !== "MOTHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the Mother record linked to this user
    let mother = await prisma.mother.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    console.log("[mother/patients] Mother record:", mother);

    // Auto-create Mother record if it doesn't exist (e.g., role was assigned before the fix)
    if (!mother) {
      console.log("[mother/patients] Mother record missing, auto-creating...");
      mother = await prisma.mother.create({
        data: { userId: user.id },
        select: { id: true },
      });
      console.log("[mother/patients] Created Mother record:", mother.id);
    }

    // Get all patients for this mother, with active admissions
    const patients = await prisma.patient.findMany({
      where: { motherId: mother.id },
      include: {
        admissions: {
          where: { dischargedAt: null },
          include: {
            incubator: {
              select: {
                code: true,
                ward: true,
                temperature: true,
                humidity: true,
                oxygenLevel: true,
              },
            },
          },
          orderBy: { admittedAt: "desc" },
          take: 1,
        },
        doctor: {
          select: {
            id: true,
            user: {
              select: { name: true },
            },
            specialty: true,
            assistants: {
              select: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { birthDate: "desc" },
    });

    console.log("[mother/patients] Found patients:", patients.length);

    const result = patients.map((p) => {
      let firstName = p.firstName;
      let lastName = p.lastName;
      try {
        const decrypted = decryptPatient(p);
        firstName = decrypted.firstName;
        lastName = decrypted.lastName;
      } catch (_e) {
        // keep raw values
      }
      return {
        id: p.id,
        firstName,
        lastName,
        birthDate: p.birthDate,
        gender: p.gender,
        bloodType: p.bloodType,
        birthWeight: p.birthWeight,
        doctor: p.doctor
          ? {
              id: p.doctor.id,
              name: p.doctor.user.name,
              specialty: p.doctor.specialty,
              assistants: p.doctor.assistants.map((a: { user: { name: string; email: string } }) => ({
                name: a.user.name,
                email: a.user.email,
              })),
            }
          : null,
        admission: p.admissions[0]
          ? {
              admittedAt: p.admissions[0].admittedAt,
              notes: p.admissions[0].notes,
              incubator: p.admissions[0].incubator,
            }
          : null,
      };
    });

    return NextResponse.json({ patients: result });
  } catch (error) {
    console.error("[mother/patients] Error:", error);
    return NextResponse.json(
      { error: "Internal server error.", details: String(error) },
      { status: 500 }
    );
  }
}