"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRetroSound } from "@/lib/useRetroSound";

type ChatAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: ChatAttachment[];
  createdAt: string;
};

type TerminalStatus = "done" | "typing" | "pending" | "idle";

export function FreeChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typedIds, setTypedIds] = useState<Record<string, boolean>>({});
  const [typingQueue, setTypingQueue] = useState<string[]>([]);
  const initialHydrateRef = useRef(false);
  const playSound = useRetroSound();

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to load chat");
      const data = await res.json();
      setMessages(data.messages ?? []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load chat history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages]);

  const typingOrder = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  useEffect(() => {
    if (!loading && !initialHydrateRef.current && messages.length > 0) {
      initialHydrateRef.current = true;
      setTypedIds((prev) => {
        const next = { ...prev };
        messages.forEach((msg) => {
          next[msg.id] = true;
        });
        return next;
      });
    }
  }, [loading, messages]);

  useEffect(() => {
    setTypingQueue((prev) => {
      const existing = new Set(prev);
      const pending = typingOrder
        .map((msg) => msg.id)
        .filter((id) => !typedIds[id] && !existing.has(id));
      if (pending.length === 0) return prev;
      return [...prev, ...pending];
    });
  }, [typingOrder, typedIds]);

  const handleTypingComplete = useCallback((id: string) => {
    setTypedIds((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: true };
    });
    setTypingQueue((prev) => prev.filter((queuedId) => queuedId !== id));
  }, []);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((draft.trim().length === 0 && !attachment) || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", draft.trim());
      if (attachment) {
        formData.append("image", attachment);
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }
      setDraft("");
      setAttachment(null);
      setAttachmentPreview(null);
      setAttachmentError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchMessages();
      playSound({ frequency: 780, duration: 0.12 });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      playSound({ frequency: 220, duration: 0.2 });
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setAttachment(null);
      setAttachmentPreview(null);
      setAttachmentError(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAttachment(null);
      setAttachmentPreview(null);
      setAttachmentError("Only image uploads are supported");
      return;
    }
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setAttachment(null);
      setAttachmentPreview(null);
      setAttachmentError("Image too large (limit 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAttachmentPreview(reader.result);
      } else {
        setAttachmentPreview(null);
      }
    };
    reader.readAsDataURL(file);
    setAttachment(file);
    setAttachmentError(null);
    playSound({ frequency: 640, duration: 0.08 });
  };

  return (
    <div className="free-chat">
      <div className="terminal-feed" aria-live="polite">
        {loading ? (
          <p className="terminal-line">initializing…</p>
        ) : sortedMessages.length === 0 ? (
          <p className="terminal-line">no chatter logged. start a new exchange.</p>
        ) : (
          sortedMessages.map((msg) => {
            const isTyped = Boolean(typedIds[msg.id]);
            const isTyping = typingQueue[0] === msg.id;
            const isPending = !isTyped && !isTyping && typingQueue.includes(msg.id);
            const status: TerminalStatus = isTyped ? "done" : isTyping ? "typing" : isPending ? "pending" : "idle";
            return (
              <TerminalLine
                key={`${msg.id}-${status}`}
                message={msg}
                status={status}
                onTypingComplete={handleTypingComplete}
              />
            );
          })
        )}
        <span className="terminal-cursor" aria-hidden>
          █
        </span>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="free-chat__composer">
        <label className="free-chat__textarea-wrapper">
          <span>Message</span>
          <textarea
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="Ping your bots outside a mission…"
          />
        </label>
        <div className="free-chat__composer-row">
          <label className="upload">
            <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
            Attach image
          </label>
          <button type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        {attachmentPreview && (
          <div className="free-chat__preview">
            <Image src={attachmentPreview} alt="Preview" width={140} height={140} />
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                setAttachmentPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove
            </button>
          </div>
        )}
      </form>
      {attachmentError && <p className="text-xs text-red-400">{attachmentError}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function TerminalLine({
  message,
  status,
  onTypingComplete,
}: {
  message: ChatMessage;
  status: TerminalStatus;
  onTypingComplete: (id: string) => void;
}) {
  const [displayed, setDisplayed] = useState(status === "done" ? message.content : "");

  useEffect(() => {
    if (status !== "typing") return;
    if (!message.content) {
      onTypingComplete(message.id);
      return;
    }

    let index = 0;
    let timeoutId: number | null = null;

    const beginTyping = () => {
      const typeNext = () => {
        index += 1;
        setDisplayed(message.content.slice(0, index));
        if (index < message.content.length) {
          const delay = message.content[index] === " " ? 18 : 26 + Math.random() * 40;
          timeoutId = window.setTimeout(typeNext, delay);
        } else {
          onTypingComplete(message.id);
        }
      };
      timeoutId = window.setTimeout(typeNext, 20);
    };

    timeoutId = window.setTimeout(beginTyping, 10);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [message.content, message.id, onTypingComplete, status]);

  const attachmentCount = message.attachments?.length ?? 0;

  return (
    <div className={`terminal-line terminal-line--${status}`}>
      <span className="terminal-prompt">{message.role === "user" ? "you" : "rabbies"}@vault$</span>
      <span className="terminal-text">{status === "pending" || status === "idle" ? "…" : displayed}</span>
      {attachmentCount > 0 && status === "done" && (
        <span className="terminal-text attachment-flag">[{attachmentCount} attachment{attachmentCount > 1 ? "s" : ""}]</span>
      )}
    </div>
  );
}
