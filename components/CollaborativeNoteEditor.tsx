"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useCallback, useRef } from "react";
import { Bold, Italic, List, Users, Loader2 } from "lucide-react";
import Pusher, { PresenceChannel, Members } from "pusher-js";

interface CollaborativeNoteEditorProps {
  contactId: string;
  initialContent?: string;
  currentUser: {
    id: string;
    name: string;
    color: string;
  };
  onUpdate?: (content: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onSelectionChange?: (position: number, content: string) => void;
}

export function CollaborativeNoteEditor({
  contactId,
  initialContent = "",
  currentUser,
  onUpdate,
  placeholder = "Start typing...",
  className = "",
  value,
  onSelectionChange,
}: CollaborativeNoteEditorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; color: string }>>(
    []
  );
  const [content, setContent] = useState(initialContent);
  const channelRef = useRef<PresenceChannel | null>(null);

  type Member = { id: string; info: { id: string; name: string; color: string } };

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getText();
      setContent(newContent);
      onUpdate?.(newContent);
      onSelectionChange?.(editor.state.selection.from, newContent);
      
      const ch = channelRef.current;
      const isSubscribed = (ch as PresenceChannel | null)?.subscribed === true && (ch as unknown as { subscriptionPending?: boolean })?.subscriptionPending !== true;
      if (ch && isConnected && isSubscribed && newContent !== content) {
        setTimeout(() => {
          try {
            ch.trigger("client-content-update", {
              content: newContent,
              userId: currentUser.id,
            });
          } catch {
            // ignore send errors during reconnect
          }
        }, 50);
      }
    },
  });

  // External value control: sync parent-provided value into the editor
  useEffect(() => {
    if (typeof value === "string" && editor && editor.getText() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Initialize Pusher for real-time collaboration
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY!;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;
console.log(pusherKey,pusherCluster,'adfljsl')
    if (!pusherKey || !pusherCluster) {
      console.error("Missing Pusher configuration");
      return;
    }

    const pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });

    const channelName = `presence-note-${contactId}`;
    const noteChannel = pusherClient.subscribe(channelName) as PresenceChannel;

    channelRef.current = noteChannel;

    // Connection handlers
    noteChannel.bind("pusher:subscription_succeeded", (members: Members) => {
      setIsConnected(true);
      const m = members as unknown as { me?: { id?: string }, each: (cb: (member: Member) => void) => void };
      const meId = m.me?.id || currentUser.id;
      const users: Array<{ id: string; name: string; color: string }> = [];
      m.each((member: Member) => {
        if (member.id !== meId) {
          users.push(member.info);
        }
      });
      setActiveUsers(users.filter(u => u.id !== meId));
    });

    noteChannel.bind("pusher:subscription_error", () => {
      setIsConnected(false);
    });

    pusherClient.connection.bind("disconnected", () => setIsConnected(false));
    pusherClient.connection.bind("error", () => setIsConnected(false));

    noteChannel.bind("pusher:member_added", (member: Member) => {
      const meId = (noteChannel as unknown as { members?: { me?: { id?: string } } }).members?.me?.id || currentUser.id;
      if (member.id !== meId) {
        setActiveUsers((prev) => [...prev.filter(u => u.id !== member.id), member.info].filter(u => u.id !== meId));
      }
    });

    noteChannel.bind("pusher:member_removed", (member: Member) => {
      setActiveUsers((prev) => prev.filter(u => u.id !== member.id));
    });

    // Content synchronization
    noteChannel.bind("client-content-update", (data: { content: string; userId: string }) => {
      if (data.userId !== currentUser.id) {
        if (editor && editor.getText() !== data.content) {
          editor.commands.setContent(data.content, { emitUpdate: false });
        }
      }
    });

    return () => {
      noteChannel.unbind_all();
      pusherClient.unsubscribe(channelName);
      pusherClient.disconnect();
      channelRef.current = null;
    };
  }, [contactId, currentUser, editor]);

  const handleBoldToggle = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const handleItalicToggle = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleBulletListToggle = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        <p className="text-sm">Loading collaborative editor...</p>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleBoldToggle}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 ${
              editor.isActive("bold") ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleItalicToggle}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 ${
              editor.isActive("italic") ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={handleBulletListToggle}
            className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${
              editor.isActive("bulletList") ? "bg-indigo-100 text-indigo-700" : "text-gray-700"
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Connection status and active users */}
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
            title={isConnected ? "Connected" : "Disconnected"}
          ></div>

          {/* Active users indicator */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-indigo-50 px-3 py-1 rounded-full">
              <Users className="w-3 h-3" />
              <span>
                {activeUsers.length === 1
                  ? `${activeUsers[0].name} editing`
                  : `${activeUsers.length} people editing`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent
          editor={editor}
          className="min-h-[120px] prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px] [&_.collaboration-cursor__caret]:border-l-2 [&_.collaboration-cursor__label]:text-xs [&_.collaboration-cursor__label]:bg-black [&_.collaboration-cursor__label]:text-white [&_.collaboration-cursor__label]:px-1 [&_.collaboration-cursor__label]:rounded"
          placeholder={placeholder}
        />
      </div>

      {/* Real-time status */}
      <div className="px-4 pb-3 text-xs text-gray-500 italic">
        💡 Real-time collaborative editing is active. Changes sync automatically with other team members.
      </div>
    </div>
  );
}
