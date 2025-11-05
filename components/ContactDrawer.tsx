"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageComposer } from "@/components/MessageComposer";
import { X, Phone, Mail, MessageSquare, StickyNote, Lock, Loader2, Clock, User } from "lucide-react";

interface ContactDrawerProps {
  contactId: string;
  onClose: () => void;
}

export function ContactDrawer({ contactId, onClose }: ContactDrawerProps) {
  const queryClient = useQueryClient();
  type ContactResponse = {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    messages: Array<{
      id: string;
      body: string;
      channel: string;
      direction: "INBOUND" | "OUTBOUND";
      createdAt: string | Date;
      mediaUrl?: string | null;
      sender?: { name?: string | null } | null;
    }>;
    notes: Array<{
      id: string;
      body: string;
      createdAt: string | Date;
      visibility: "PUBLIC" | "PRIVATE";
      user?: { name?: string | null } | null;
    }>;
  };

  const { data: contact, isLoading } = useQuery<ContactResponse>({
    queryKey: ["contact", contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`).then((r) => r.json()),
    enabled: !!contactId,
  });

  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const addNoteMutation = useMutation({
    mutationFn: async (data: { contactId: string; body: string; visibility: "PUBLIC" | "PRIVATE" }) => {
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

  const getChannelBadge = (channel: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      SMS: { bg: "bg-blue-100", text: "text-blue-700" },
      WHATSAPP: { bg: "bg-green-100", text: "text-green-700" },
      EMAIL: { bg: "bg-purple-100", text: "text-purple-700" },
      TWITTER: { bg: "bg-sky-100", text: "text-sky-700" },
      MESSENGER: { bg: "bg-blue-100", text: "text-blue-700" },
    };
    const config = configs[channel] || { bg: "bg-gray-100", text: "text-gray-700" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>
        {channel}
      </span>
    );
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        data-testid="drawer-overlay"
      ></div>
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 w-full sm:w-[600px] h-full bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight" data-testid="contact-drawer">
        {isLoading ? (
          <div className="p-6 flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading contact...</p>
            </div>
          </div>
        ) : contact ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0 z-10 shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                    {(contact.name || contact.phone || contact.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {contact.name || contact.phone || contact.email}
                    </h2>
                    <p className="text-indigo-100 text-sm">Contact Details</p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-all"
                  data-testid="close-drawer-button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                {contact.phone && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{contact.phone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-white/90">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 bg-gray-50">
              {/* Message Composer */}
              <div>
                <MessageComposer
                  contactId={contactId}
                  contactPhone={contact.phone || undefined}
                  contactEmail={contact.email || undefined}
                  onSent={() => queryClient.invalidateQueries({ queryKey: ["contact", contactId] })}
                />
              </div>

              {/* Message History */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900 text-lg">Message History</h3>
                  <span className="text-sm text-gray-500">({contact.messages?.length || 0})</span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-4 max-h-96 overflow-y-auto space-y-3 shadow-sm">
                  {contact.messages?.length > 0 ? (
                    contact.messages.map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl transition-all ${
                          m.direction === "INBOUND" 
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500" 
                            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getChannelBadge(m.channel)}
                            <span className={`text-xs font-semibold ${
                              m.direction === "INBOUND" ? "text-green-700" : "text-blue-700"
                            }`}>
                              {m.direction === "INBOUND" ? "Received" : "Sent"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(m.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{m.body}</p>
                        {m.mediaUrl && (
                          <a
                            href={m.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 text-xs mt-2 inline-flex items-center gap-1 font-medium"
                          >
                            View attachment →
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <StickyNote className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900 text-lg">Notes</h3>
                  <span className="text-sm text-gray-500">({contact.notes?.length || 0})</span>
                </div>
                
                {/* Existing Notes */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 max-h-64 overflow-y-auto mb-4 space-y-3 shadow-sm">
                  {contact.notes?.length > 0 ? (
                    contact.notes.map((n: any) => (
                      <div key={n.id} className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-yellow-700" />
                            </div>
                            <span className="font-semibold text-sm text-gray-800">
                              {n.user?.name || "User"}
                            </span>
                            {n.visibility === "PRIVATE" && (
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-yellow-200 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                Private
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(n.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{n.body}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </div>

                {/* Add Note Form */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none bg-white"
                    placeholder="Add a note about this contact..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    data-testid="note-input"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <select
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                      data-testid="note-visibility-select"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private 🔒</option>
                    </select>
                    <button
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      onClick={addNote}
                      disabled={!note.trim() || addNoteMutation.isPending}
                      data-testid="add-note-button"
                    >
                      {addNoteMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <StickyNote className="w-4 h-4" />
                          <span>Add Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}