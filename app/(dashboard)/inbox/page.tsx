"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAblyInbox } from "@/hooks/useAblyInbox";
import { ContactDrawerEnhanced } from "@/components/ContactDrawerEnhanced";
import { Search, Filter, MessageCircle, Clock, ArrowUpRight, ArrowDownLeft, Inbox as InboxIcon } from "lucide-react";

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
    isRead: boolean;
    contact: { id: string; name?: string | null; phone?: string | null; email?: string | null };
  };

  type ScheduledMessageItem = {
    id: string;
    body: string;
    channel: string;
    scheduledAt: string;
    status: string;
    contact: { id: string; name?: string | null; phone?: string | null; email?: string | null };
  };

  const { data: messages, isLoading } = useQuery<MessageListItem[]>({
    queryKey: ["messages"],
    queryFn: () => fetch("/api/messages").then((r) => r.json()),
  });

  const { data: scheduledMessages = [] } = useQuery<ScheduledMessageItem[]>({
    queryKey: ["scheduled"],
    queryFn: () => fetch("/api/schedule").then((r) => r.json()),
  });

  useAblyInbox();

  const getChannelBadge = (channel: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      SMS: { bg: "bg-blue-100", text: "text-blue-700", label: "SMS" },
      WHATSAPP: { bg: "bg-green-100", text: "text-green-700", label: "WhatsApp" },
      EMAIL: { bg: "bg-purple-100", text: "text-purple-700", label: "Email" },
      TWITTER: { bg: "bg-sky-100", text: "text-sky-700", label: "Twitter" },
      MESSENGER: { bg: "bg-blue-100", text: "text-blue-700", label: "Messenger" },
    };
    const config = configs[channel] || { bg: "bg-gray-100", text: "text-gray-700", label: channel };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Combine regular messages and scheduled messages based on filter
  const combinedMessages = (() => {
    if (filter === "scheduled") {
      return scheduledMessages
        .filter((sm) => sm.status === "PENDING")
        .map((sm) => ({
          id: sm.id,
          body: sm.body,
          channel: sm.channel,
          direction: "OUTBOUND" as const,
          createdAt: sm.scheduledAt,
          isRead: true,
          isScheduled: true,
          contact: sm.contact,
        }));
    } else {
      // For "all" and "unread" filters, show regular messages
      return messages || [];
    }
  })();

  const filteredMessages = combinedMessages.filter((m: any) => {
    // Apply search filter first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        m.contact.name?.toLowerCase().includes(query) ||
        m.contact.phone?.toLowerCase().includes(query) ||
        m.body.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Apply status filter
    if (filter === "unread") {
      return !m.isRead;
    }
    if (filter === "scheduled") {
      return m.isScheduled === true;
    }
    // "all" filter - show all messages
    return true;
  });

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins <= 1 ? "Just now" : `${mins}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6" data-testid="inbox-page">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <InboxIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unified Inbox</h1>
              <p className="text-sm text-gray-600">All your conversations in one place</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search contacts, messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white"
                data-testid="search-input"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-gray-50 focus:bg-white appearance-none cursor-pointer font-medium"
                data-testid="filter-select"
              >
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {isLoading ? (
            // Skeleton Loaders
            <div className="space-y-3 animate-fadeIn">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredMessages && filteredMessages.length > 0 ? (
            filteredMessages.map((m: any, index) => (
              <div
                key={m.id}
                className={`bg-white rounded-2xl p-5 border hover:border-indigo-300 cursor-pointer transition-all hover:shadow-lg card-hover group animate-fadeIn ${
                  !m.isRead && filter !== "scheduled" ? "border-indigo-400 border-2 shadow-md" : "border-gray-200"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelectedContact(m.contact.id)}
                data-testid={`message-item-${m.id}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar with unread indicator */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white shadow-md ${
                        m.direction === "INBOUND" 
                          ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                          : "bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}>
                        {(m.contact.name || m.contact.phone || m.contact.email || "?")[0].toUpperCase()}
                      </div>
                      {!m.isRead && filter !== "scheduled" && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`truncate ${!m.isRead && filter !== "scheduled" ? "font-bold text-gray-900" : "font-semibold text-gray-900"}`}>
                          {m.contact.name || m.contact.phone || m.contact.email}
                        </h3>
                        {getChannelBadge(m.channel)}
                        {m.isScheduled && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                            ⏰ Scheduled
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {m.direction === "INBOUND" ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-green-600" />
                            <span className="text-green-600 font-medium">Received</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-600 font-medium">{m.isScheduled ? "Scheduled" : "Sent"}</span>
                          </>
                        )}
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(m.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                
                <p className={`text-sm line-clamp-2 leading-relaxed ${!m.isRead && filter !== "scheduled" ? "font-medium text-gray-800" : "text-gray-700"}`}>
                  {m.body}
                </p>
              </div>
            ))
          ) : (
            // Empty State
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300 animate-fadeIn" data-testid="empty-state">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <InboxIcon className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? "No messages found" : "No messages yet"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search terms or filters" 
                  : "Start a conversation to see your messages here"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Drawer */}
      {selectedContact && (
        <ContactDrawerEnhanced
          contactId={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
}