// Update and delete notes
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { push } from "@/lib/pusher.server";
import { getCurrentUser } from "@/lib/auth";

// Update a note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { body: noteBody, visibility } = body;

    // Fetch the note to check permissions
    const note = await prisma.note.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions: EDITOR and ADMIN can edit any note
    const canEdit = user.role === "ADMIN" || user.role === "EDITOR";

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit notes" },
        { status: 403 }
      );
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        body: noteBody,
        visibility: visibility || note.visibility,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Publish to Pusher channels
    try {
      const channelName = `contact-${note.contactId}`;
      await push(channelName, "note-updated", updatedNote);
      await push("inbox", "note-updated", { contactId: note.contactId, noteId: note.id });
    } catch (pusherError) {
      console.error("Failed to publish to Pusher:", pusherError);
    }

    return NextResponse.json(updatedNote);
  } catch (error: unknown) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update note" },
      { status: 500 }
    );
  }
}

// Delete a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the note to check permissions
    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permissions: only note creator or ADMIN can delete
    const canDelete = user.role === "ADMIN" || note.userId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this note" },
        { status: 403 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: { id },
    });

    // Publish to Pusher channels
    try {
      const channelName = `contact-${note.contactId}`;
      await push(channelName, "note-deleted", { noteId: id });
      await push("inbox", "note-deleted", { contactId: note.contactId, noteId: id });
    } catch (pusherError) {
      console.error("Failed to publish to Pusher:", pusherError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete note" },
      { status: 500 }
    );
  }
}
