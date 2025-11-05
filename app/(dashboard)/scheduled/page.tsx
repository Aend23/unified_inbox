"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Trash2, MessageSquare, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface ScheduledMessage {
  id: string;
  contactId: string;
  channel: string;
  body: string;
  scheduledAt: string;
  status: "PENDING" | "SENT" | "CANCELLED";
  createdAt: string;
  sentAt?: string;
  contact: {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export default function ScheduledPage() {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "cancelled">("all");

  const { data: scheduledMessages = [], isLoading } = useQuery<ScheduledMessage[]>({
    queryKey: ["scheduled"],
    queryFn: () => fetch("/api/schedule").then((r) => r.json()),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled"] });
    },
  });

  const getChannelBadge = (channel: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      SMS: { bg: "bg-blue-100", text: "text-blue-700", label: "SMS" },
      WHATSAPP: { bg: "bg-green-100", text: "text-green-700", label: "WhatsApp" },
      EMAIL: { bg: "bg-purple-100", text: "text-purple-700", label: "Email" },
    };
    const config = configs[channel] || { bg: "bg-gray-100", text: "text-gray-700", label: channel };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
      SENT: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };
    const config = configs[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (scheduledAt: string) => new Date(scheduledAt) > new Date();

  const filteredMessages = scheduledMessages.filter((m) => {
    if (filter === "all") return true;
    if (filter === "pending") return m.status === "PENDING";
    if (filter === "sent") return m.status === "SENT";
    if (filter === "cancelled") return m.status === "CANCELLED";
    return true;
  });

  const stats = {
    pending: scheduledMessages.filter((m) => m.status === "PENDING").length,
    sent: scheduledMessages.filter((m) => m.status === "SENT").length,
    cancelled: scheduledMessages.filter((m) => m.status === "CANCELLED").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6" data-testid="scheduled-page">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scheduled Messages</h1>
              <p className="text-sm text-gray-600">Manage your scheduled outreach</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sent</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6 animate-fadeIn">
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "sent", label: "Sent" },
              { value: "cancelled", label: "Cancelled" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {isLoading ? (
            // Skeleton Loaders
            <div className="space-y-3 animate-fadeIn">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((msg, index) => (
              <div
                key={msg.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`scheduled-message-${msg.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {(msg.contact.name || msg.contact.phone || msg.contact.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {msg.contact.name || msg.contact.phone || msg.contact.email}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getChannelBadge(msg.channel)}
                          {getStatusBadge(msg.status)}
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
                      {msg.body}
                    </p>

                    {/* Timing */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled: {formatDateTime(msg.scheduledAt)}</span>
                      </div>
                      {msg.sentAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span>Sent: {formatDateTime(msg.sentAt)}</span>
                        </div>
                      )}
                      {isUpcoming(msg.scheduledAt) && msg.status === "PENDING" && (
                        <span className="text-yellow-600 font-medium">⏰ Upcoming</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {msg.status === "PENDING" && permissions.canCancelSchedule && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to cancel this scheduled message?")) {
                          cancelMutation.mutate(msg.id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                      title="Cancel scheduled message"
                      data-testid={`cancel-button-${msg.id}`}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            // Empty State
            <div
              className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300 animate-fadeIn"
              data-testid="empty-state"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No scheduled messages</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {filter === "all"
                  ? "You haven't scheduled any messages yet. Go to a contact to schedule a message."
                  : `No ${filter} messages found.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
