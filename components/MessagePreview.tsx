"use client";

import { Calendar, MessageSquare, X } from "lucide-react";

interface MessagePreviewProps {
  body: string;
  channel: string;
  scheduledAt: string;
  recipientName?: string;
  onClose: () => void;
}

export function MessagePreview({
  body,
  channel,
  scheduledAt,
  recipientName,
  onClose,
}: MessagePreviewProps) {
  const getChannelColor = (ch: string) => {
    const colors: Record<string, string> = {
      sms: "bg-blue-100 text-blue-700 border-blue-200",
      whatsapp: "bg-green-100 text-green-700 border-green-200",
      email: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[ch] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Message Preview</h2>
              </div>
              <p className="text-indigo-100 text-sm">Review before scheduling</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Channel</label>
              <div className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium border-2 ${getChannelColor(channel)}`}>
                {channel.toUpperCase()}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled For</label>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="font-medium">{formatDate(scheduledAt)}</span>
              </div>
            </div>
          </div>

          {recipientName && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recipient</label>
              <div className="mt-1 text-sm font-medium text-gray-900">{recipientName}</div>
            </div>
          )}

          {/* Message Body */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Message</label>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {stripHtml(body)}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stripHtml(body).length} characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
