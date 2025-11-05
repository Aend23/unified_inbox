"use client";

import { useState, useRef, useEffect } from "react";
import { Bold, Italic, List, Link as LinkIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onMentionSearch?: (query: string) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Type your message...",
  minHeight = "120px",
  onMentionSearch,
}: RichTextEditorProps) {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateFormattingState();
  };

  const updateFormattingState = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
  };

  const handleInput = () => {
    const content = editorRef.current?.innerHTML || "";
    onChange(content);
    updateFormattingState();

    // Check for @ mentions
    if (onMentionSearch) {
      const text = editorRef.current?.textContent || "";
      const match = text.match(/@(\w*)$/);
      if (match) {
        onMentionSearch(match[1]);
      }
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="border-2 border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => handleFormat("bold")}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            isBold ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("italic")}
          className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
            isItalic ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => handleFormat("insertUnorderedList")}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) handleFormat("createLink", url);
          }}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateFormattingState}
        onClick={updateFormattingState}
        className="px-4 py-3 outline-none text-sm text-gray-900 overflow-y-auto"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
