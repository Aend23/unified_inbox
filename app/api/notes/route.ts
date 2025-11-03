// src/app/api/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { push } from "@/lib/pusher.server";
import { noteCreateSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = noteCreateSchema.parse(body);
    const { contactId, body: noteBody, visibility } = validated;

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        contactId,
        body: noteBody,
        visibility: visibility || "PUBLIC",
        userId: user.id,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Publish to Pusher channels for this contact and inbox
    try {
      const channelName = `contact-${contactId}`;
      await push(channelName, "new-note", note);
      await push("inbox", "note-created", { contactId, noteId: note.id });
    } catch (ablyError) {
      console.error("Failed to publish to Pusher:", ablyError);
      // Don't fail the request if Ably fails
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error("Error creating note:", error);
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
