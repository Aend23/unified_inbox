import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    const where: Prisma.ContactWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (phone) {
      where.phone = phone;
    }
    if (email) {
      where.email = email;
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: true,
            notes: true,
          },
        },
      },
      orderBy: {
        messages: {
          _count: "desc",
        },
      },
    });

    return NextResponse.json(contacts);
  } catch (error: unknown) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = contactCreateSchema.parse(body);

    const contact = await prisma.contact.create({
      data: validated,
      include: {
        messages: true,
        notes: true,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating contact:", error);
    if (typeof error === "object" && error && (error as { name?: string }).name === "ZodError") {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create contact" }, { status: 500 });
  }
}

