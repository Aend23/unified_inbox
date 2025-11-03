import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          include: { sender: { select: { id: true, name: true, email: true } } },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error: unknown) {
    console.error("Error fetching contact:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch contact" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, email, phone, social } = body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(social !== undefined && { social }),
      },
      include: {
        messages: true,
        notes: true,
      },
    });

    return NextResponse.json(contact);
  } catch (error: unknown) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update contact" }, { status: 500 });
  }
}

