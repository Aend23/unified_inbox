"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageComposerEnhanced } from "@/components/MessageComposerEnhanced";
import { CollaborativeNoteEditor } from "@/components/CollaborativeNoteEditor";
import { X, Phone, Mail, MessageSquare, StickyNote, Lock, Loader2, Clock, User, Users, Edit, Trash2, Save, XCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { usePresence } from "@/hooks/usePresence";

interface ContactDrawerEnhancedProps {
  contactId: string;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

export function ContactDrawerEnhanced({ contactId, onClose }: ContactDrawerEnhancedProps) {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  
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

  // Mark messages as read when opening contact
  useEffect(() => {
    if (contact?.messages) {
      contact.messages.forEach(async (msg) => {
        if (msg.direction === "INBOUND") {
          try {
            await fetch(`/api/messages/${msg.id}/read`, { method: "POST" });
          } catch (error) {
            console.error("Failed to mark message as read:", error);
          }
        }
      });
      // Invalidate messages query to update the inbox
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
  }, [contact?.id, queryClient]);

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: () => fetch("/api/team/members").then((r) => r.json()),
  });

  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");
  const [editingNoteVisibility, setEditingNoteVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  // Real-time presence
  const currentUser = permissions.user
    ? { 
        id: permissions.user.id, 
        name: permissions.user.name || permissions.user.email, 
        email: permissions.user.email,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      }
    : null;
  const { activeUsers } = usePresence(contactId, currentUser);

  const addNoteMutation = useMutation({
    mutationFn: async (data: { contactId: string; body: string; visibility: "PUBLIC" | "PRIVATE" }) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      setNote("");
      setShowMentions(false);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: { id: string; body: string; visibility: "PUBLIC" | "PRIVATE" }) => {
      const response = await fetch(`/api/notes/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: data.body, visibility: data.visibility }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
      setEditingNoteId(null);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", contactId] });
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

  const handleNoteInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNote(value);
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, position);
    const match = textBeforeCursor.match(/@(\w*)$/);
    
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: TeamMember) => {
    const textBeforeCursor = note.substring(0, cursorPosition);
    const textAfterCursor = note.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const newNote =
      textBeforeCursor.substring(0, lastAtIndex) +
      `@${member.name || member.email} ` +
      textAfterCursor;
    
    setNote(newNote);
    setShowMentions(false);
  };

  const filteredMembers = teamMembers.filter((m) =>
    (m.name?.toLowerCase() || m.email.toLowerCase()).includes(mentionQuery.toLowerCase())
  );

  const renderNoteWithMentions = (body: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = body.split(mentionRegex);
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span key={i} className="bg-indigo-100 text-indigo-700 px-1 rounded font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

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
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      <div
        className="fixed top-0 right-0 w-full sm:w-[600px] h-full bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight"
        data-testid="contact-drawer"
      >
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
                    <h2 className="text-2xl font-bold">{contact.name || contact.phone || contact.email}</h2>
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

              {/* Real-time Presence */}
              {activeUsers.length > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {activeUsers.length === 1
                      ? `${activeUsers[0].name} is viewing`
                      : `${activeUsers.length} people viewing`}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 bg-gray-50">
              {/* Message Composer */}
              <div>
                <MessageComposerEnhanced
                  contactId={contactId}
                  contactPhone={contact.phone || undefined}
                  contactEmail={contact.email || undefined}
                  contactName={contact.name || undefined}
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
                            <span
                              className={`text-xs font-semibold ${
                                m.direction === "INBOUND" ? "text-green-700" : "text-blue-700"
                              }`}
                            >
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
                      <div
                        key={n.id}
                        className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-l-4 border-yellow-400"
                      >
                        {editingNoteId === n.id ? (
                          // Edit Mode with Collaborative Editor
                          <div className="space-y-3">
                            {currentUser && (
                              <CollaborativeNoteEditor
                                contactId={contactId}
                                initialContent={editingNoteBody}
                                currentUser={currentUser}
                                onUpdate={setEditingNoteBody}
                                placeholder="Edit your note..."
                                className="border-yellow-300"
                                value={editingNoteBody}
                                onSelectionChange={(pos, content) => {
                                  setCursorPosition(pos);
                                  // Check for @ mentions based on current content and cursor
                                  const textBeforeCursor = content.substring(0, pos);
                                  const match = textBeforeCursor.match(/@(\w*)$/);
                                  if (match) {
                                    setMentionQuery(match[1]);
                                    setShowMentions(true);
                                  } else {
                                    setShowMentions(false);
                                  }
                                }}
                              />
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <select
                                className="px-3 py-1 border-2 border-yellow-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-yellow-500 transition-all cursor-pointer"
                                value={editingNoteVisibility}
                                onChange={(e) => setEditingNoteVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                              >
                                <option value="PUBLIC">Public</option>
                                <option value="PRIVATE">Private 🔒</option>
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    updateNoteMutation.mutate({
                                      id: n.id,
                                      body: editingNoteBody,
                                      visibility: editingNoteVisibility,
                                    });
                                  }}
                                  disabled={updateNoteMutation.isPending || !editingNoteBody.trim()}
                                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                                >
                                  {updateNoteMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="flex items-center gap-1 bg-gray-400 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-gray-500 transition-all"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
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
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(n.createdAt)}</span>
                                </div>
                                {/* Edit/Delete buttons - only for EDITOR and ADMIN */}
                                {(permissions.user?.role === "EDITOR" || permissions.user?.role === "ADMIN") && (
                                  <div className="flex gap-1 ml-2">
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(n.id);
                                        setEditingNoteBody(n.body);
                                        setEditingNoteVisibility(n.visibility);
                                      }}
                                      className="p-1 hover:bg-yellow-200 rounded transition-colors"
                                      title="Edit note"
                                    >
                                      <Edit className="w-3 h-3 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this note?")) {
                                          deleteNoteMutation.mutate(n.id);
                                        }
                                      }}
                                      className="p-1 hover:bg-red-200 rounded transition-colors"
                                      title="Delete note"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {renderNoteWithMentions(n.body)}
                            </p>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes yet</p>
                    </div>
                  )}
                </div>

                {/* Add Note Form with Collaborative Editor */}
                {permissions.canCreateNote && currentUser ? (
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                    <CollaborativeNoteEditor
                      contactId={contactId}
                      currentUser={currentUser}
                      onUpdate={setNote}
                      placeholder="Add a note about this contact... Use @ to mention team members"
                      value={note}
                      onSelectionChange={(pos, content) => {
                        setCursorPosition(pos);
                        const textBeforeCursor = content.substring(0, pos);
                        const match = textBeforeCursor.match(/@(\w*)$/);
                        if (match) {
                          setMentionQuery(match[1]);
                          setShowMentions(true);
                        } else {
                          setShowMentions(false);
                        }
                      }}
                    />
                    
                    <div className="flex justify-between items-center mt-4">
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

                    {/* Mentions Dropdown for fallback */}
                    {showMentions && filteredMembers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredMembers.slice(0, 5).map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => insertMention(member)}
                            className="w-full px-4 py-2 text-left hover:bg-indigo-50 transition-colors text-sm flex items-center gap-2"
                          >
                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-indigo-700" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{member.name || member.email}</div>
                              {member.name && <div className="text-xs text-gray-500">{member.email}</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-yellow-800">
                      You don't have permission to add notes. Contact your administrator.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
