"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Calendar, Loader2, MessageSquare, Eye } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { MessagePreview } from "./MessagePreview";
import { usePermissions } from "@/hooks/usePermissions";

type Channel = "sms" | "whatsapp" | "email";

interface MessageComposerEnhancedProps {
  contactId?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactName?: string;
  onSent?: () => void;
}

export function MessageComposerEnhanced({
  contactId,
  contactPhone,
  contactEmail,
  contactName,
  onSent,
}: MessageComposerEnhancedProps) {
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [scheduledAt, setScheduledAt] = useState("");
  const [to, setTo] = useState(contactPhone || contactEmail || "");
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();
  const permissions = usePermissions();

  const sendMutation = useMutation({
    mutationFn: async (data: { to: string; body: string; channel: Channel }) => {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setBody("");
      setScheduledAt("");
      onSent?.();
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: {
      contactId: string;
      body: string;
      channel: string;
      scheduledAt: string;
    }) => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to schedule message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled"] });
      setBody("");
      setScheduledAt("");
      setShowPreview(false);
      onSent?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strip HTML tags for plain text channels
    const stripHtml = (html: string) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };
    
    const plainBody = stripHtml(body);
    
    if (!plainBody.trim() || !to.trim()) return;

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (isScheduled) {
      if (!contactId) {
        alert("Cannot schedule: contact ID required");
        return;
      }
      scheduleMutation.mutate({
        contactId,
        body: plainBody,
        channel: channel.toUpperCase(),
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
    } else {
      sendMutation.mutate({
        to,
        body: plainBody,
        channel,
      });
    }
  };

  const handlePreview = () => {
    if (scheduledAt && new Date(scheduledAt) > new Date() && body.trim()) {
      setShowPreview(true);
    }
  };

  const availableChannels: Channel[] = [];
  if (contactPhone) {
    availableChannels.push("sms", "whatsapp");
  }
  if (contactEmail) {
    availableChannels.push("email");
  }
  if (availableChannels.length === 0) {
    availableChannels.push("sms", "whatsapp", "email");
  }

  const getChannelColor = (ch: Channel) => {
    const colors = {
      sms: "bg-blue-100 text-blue-700 border-blue-200",
      whatsapp: "bg-green-100 text-green-700 border-green-200",
      email: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[ch];
  };

  const isPending = sendMutation.isPending || scheduleMutation.isPending;
  const error = sendMutation.error || scheduleMutation.error;
  const canSend = permissions.canSendMessage;
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  // Strip HTML for character count
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (!canSend) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center" data-testid="message-composer-disabled">
        <MessageSquare className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
        <p className="text-sm text-yellow-800 font-medium">
          You don't have permission to send messages. Contact your administrator.
        </p>
        <p className="text-xs text-yellow-600 mt-1">Current role: {permissions.role}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-lg"
        data-testid="message-composer"
      >
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Compose Message</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel & Recipient */}
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Channel)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm border-2 transition-all cursor-pointer appearance-none pr-10 ${getChannelColor(
                  channel
                )}`}
                data-testid="channel-select"
              >
                {availableChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            {!contactId && (
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={channel === "email" ? "email@example.com" : "+1234567890"}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-white"
                required
                data-testid="recipient-input"
              />
            )}
          </div>

          {/* Rich Text Editor */}
          <div className="relative">
            <RichTextEditor value={body} onChange={setBody} placeholder="Type your message here..." />
            <div className="mt-2 text-xs text-gray-400 text-right">
              {stripHtml(body).length} characters
            </div>
          </div>

          {/* Schedule & Send */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                placeholder="Schedule (optional)"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm bg-white"
                min={new Date().toISOString().slice(0, 16)}
                data-testid="schedule-input"
              />
            </div>
            
            {isScheduled && body.trim() && (
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                data-testid="preview-button"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
            
            <button
              type="submit"
              disabled={isPending || !body.trim() || !to.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              data-testid="send-message-button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  {isScheduled ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm text-red-700 animate-fadeIn"
              data-testid="composer-error"
            >
              <p className="font-medium">{error.message}</p>
            </div>
          )}
        </form>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <MessagePreview
          body={body}
          channel={channel}
          scheduledAt={scheduledAt}
          recipientName={contactName || to}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
