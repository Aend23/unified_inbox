"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageComposer } from "@/components/MessageComposer";

interface ContactDrawerProps {
  contactId: string;
  onClose: () => void;
}

export function ContactDrawer({ contactId, onClose }: ContactDrawerProps) {
  const queryClient = useQueryClient();
  const { data: contact } = useQuery({
    queryKey: ["contact", contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`).then((r) => r.json()),
    enabled: !!contactId,
  });

  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const addNoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      setNote("");
    },
  });

  async function addNote() {
    if (!note.trim() || !contact) return;

    addNoteMutation.mutate({
      contactId,
      body: note,
      visibility,
    });
  }

  if (!contact) return null;

  const channelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      SMS: "bg-blue-100 text-blue-800",
      WHATSAPP: "bg-green-100 text-green-800",
      EMAIL: "bg-purple-100 text-purple-800",
      TWITTER: "bg-sky-100 text-sky-800",
      MESSENGER: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${colors[channel] || "bg-gray-100 text-gray-800"}`}>
        {channel}
      </span>
    );
  };

  return (
    <div className="fixed top-0 right-0 w-[500px] h-full bg-white border-l shadow-lg p-4 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{contact.name || contact.phone || contact.email}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {contact.phone && <div>📞 {contact.phone}</div>}
        {contact.email && <div>✉️ {contact.email}</div>}
      </div>

      <div className="mb-6">
        <MessageComposer
          contactId={contactId}
          contactPhone={contact.phone || undefined}
          contactEmail={contact.email || undefined}
          onSent={() => queryClient.invalidateQueries({ queryKey: ["contact", contactId] })}
        />
      </div>

      <h3 className="font-medium mt-6 mb-2">Message History</h3>
      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto mb-4 space-y-2">
        {contact.messages?.length > 0 ? (
          contact.messages.map((m: any) => (
            <div
              key={m.id}
              className={`text-sm p-2 rounded ${
                m.direction === "INBOUND" ? "bg-gray-50" : "bg-blue-50"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                {channelBadge(m.channel)}
                <span className="text-xs text-gray-500">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="font-medium text-xs mb-1">
                {m.direction === "INBOUND" ? "← Inbound" : "→ Outbound"}
                {m.sender?.name && ` from ${m.sender.name}`}
              </div>
              <div>{m.body}</div>
              {m.mediaUrl && (
                <a
                  href={m.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs mt-1 block"
                >
                  View media
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400 text-center py-4">No messages yet</div>
        )}
      </div>

      <h3 className="font-medium mt-4 mb-2">Notes</h3>
      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto mb-3 space-y-2">
        {contact.notes?.length > 0 ? (
          contact.notes.map((n: any) => (
            <div key={n.id} className="text-sm p-2 bg-yellow-50 rounded">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-xs">
                  {n.user?.name || "User"} {n.visibility === "PRIVATE" && "🔒"}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <div>{n.body}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400 text-center py-4">No notes yet</div>
        )}
      </div>

      <div className="border-t pt-3">
        <textarea
          className="border rounded w-full p-2 text-sm mb-2"
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
        <div className="flex justify-between items-center">
          <select
            className="border rounded p-1.5 text-sm"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private 🔒</option>
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            onClick={addNote}
            disabled={!note.trim() || addNoteMutation.isPending}
          >
            {addNoteMutation.isPending ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
