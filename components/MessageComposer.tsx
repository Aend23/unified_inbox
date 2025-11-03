"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Channel = "sms" | "whatsapp" | "email";

interface MessageComposerProps {
  contactId?: string;
  contactPhone?: string;
  contactEmail?: string;
  onSent?: () => void;
}

export function MessageComposer({ contactId, contactPhone, contactEmail, onSent }: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("sms");
  const [scheduledAt, setScheduledAt] = useState("");
  const [to, setTo] = useState(contactPhone || contactEmail || "");
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (data: { to: string; body: string; channel: Channel }) => {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send message");
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
    mutationFn: async (data: { contactId: string; body: string; channel: string; scheduledAt: string }) => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to schedule message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled"] });
      setBody("");
      setScheduledAt("");
      onSent?.();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !to.trim()) return;

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    if (isScheduled) {
      if (!contactId) {
        alert("Cannot schedule: contact ID required");
        return;
      }
      scheduleMutation.mutate({
        contactId,
        body,
        channel: channel.toUpperCase(),
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
    } else {
      sendMutation.mutate({
        to,
        body,
        channel,
      });
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

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3">
      <div className="flex gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="border rounded px-3 py-2 text-sm"
        >
          {availableChannels.map((ch) => (
            <option key={ch} value={ch}>
              {ch.toUpperCase()}
            </option>
          ))}
        </select>
        {!contactId && (
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={channel === "email" ? "email@example.com" : "+1234567890"}
            className="flex-1 border rounded px-3 py-2 text-sm"
            required
          />
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type your message..."
        className="w-full border rounded px-3 py-2 text-sm min-h-[100px]"
        required
      />

      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          placeholder="Schedule (optional)"
          className="border rounded px-3 py-2 text-sm"
          min={new Date().toISOString().slice(0, 16)}
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || scheduleMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {scheduledAt && new Date(scheduledAt) > new Date() ? "Schedule" : "Send"}
        </button>
      </div>

      {(sendMutation.error || scheduleMutation.error) && (
        <div className="text-red-500 text-sm">
          {sendMutation.error?.message || scheduleMutation.error?.message}
        </div>
      )}
    </form>
  );
}

