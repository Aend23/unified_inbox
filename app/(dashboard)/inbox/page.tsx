"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAblyInbox } from "@/hooks/useAblyInbox";
import { ContactDrawer } from "@/components/ContactDrawer";

export default function InboxPage() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "scheduled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  type MessageListItem = {
    id: string;
    body: string;
    channel: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string | Date;
    contact: { id: string; name?: string | null; phone?: string | null; email?: string | null };
  };

  const { data: messages } = useQuery<MessageListItem[]>({
    queryKey: ["messages"],
    queryFn: () => fetch("/api/messages").then((r) => r.json()),
  });

  useAblyInbox();

  const channelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      SMS: "bg-blue-100 text-blue-800",
      WHATSAPP: "bg-green-100 text-green-800",
      EMAIL: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[channel] || "bg-gray-100"}`}>
        {channel}
      </span>
    );
  };

  const filteredMessages = messages?.filter((m) => {
    if (filter === "unread") {
      // For now, show all as we don't have read status yet
      return true;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.contact.name?.toLowerCase().includes(query) ||
        m.contact.phone?.toLowerCase().includes(query) ||
        m.body.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Unified Inbox</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search contacts or messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredMessages && filteredMessages.length > 0 ? (
          filteredMessages.map((m) => (
            <div
              key={m.id}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedContact(m.contact.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <b className="text-base">{m.contact.name || m.contact.phone || m.contact.email}</b>
                  {channelBadge(m.channel)}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{m.body}</p>
              <p className="text-xs text-gray-500">
                {m.direction.toLowerCase()} • {m.channel}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? "No messages match your search" : "No messages yet"}
          </div>
        )}
      </div>

      {selectedContact && (
        <ContactDrawer
          contactId={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}
