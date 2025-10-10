"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

type User = { id: string; name?: string | null; email?: string | null };
type Participant = { id: string; userId: string; user: User };
type Conversation = {
    id: string;
    orderId?: string | null;
    participants: Participant[];
    messages?: Array<{
        id: string;
        content: string;
        createdAt: string;
        sender: User;
    }>;
    _count?: { messages: number };
};
type Message = { id: string; content: string; createdAt: string; sender: User };

export default function MessagesPage() {
    return (
        <Suspense
            fallback={
                <div className="p-6 text-gray-600">Loading messages…</div>
            }
        >
            <MessagesPageInner />
        </Suspense>
    );
}

function MessagesPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedIdFromUrl = searchParams.get("c");
    const { user } = useUser();

    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(
        selectedIdFromUrl
    );
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState("");

    // Load conversations
    useEffect(() => {
        let ignore = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch("/api/messages/conversations", {
                    cache: "no-store",
                });
                const data = await res.json();
                if (!ignore) setConversations(data.conversations ?? []);
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, []);

    // Load messages for selected conversation
    useEffect(() => {
        if (!selectedId) return;
        let ignore = false;
        async function load() {
            try {
                const res = await fetch(
                    `/api/messages/conversations/${selectedId}/messages`,
                    { cache: "no-store" }
                );
                const data = await res.json();
                if (!ignore) setMessages(data.messages ?? []);
            } catch (e) {
                // noop
            }
        }
        load();
        const t = setInterval(load, 5000); // simple polling
        return () => {
            ignore = true;
            clearInterval(t);
        };
    }, [selectedId]);

    const selectedConversation = useMemo(
        () => conversations.find((c) => c.id === selectedId) ?? null,
        [conversations, selectedId]
    );

    function openConversation(id: string) {
        setSelectedId(id);
        router.replace(`?c=${id}`);
    }

    async function send() {
        const text = input.trim();
        if (!text || !selectedId) return;
        setSending(true);
        try {
            // optimistic
            const optimistic: Message = {
                id: `temp-${Date.now()}`,
                content: text,
                createdAt: new Date().toISOString(),
                sender: { id: "me" },
            } as any;
            setMessages((m) => [...m, optimistic]);
            setInput("");
            const res = await fetch(
                `/api/messages/conversations/${selectedId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: text }),
                }
            );
            const data = await res.json();
            if (res.ok && data.message) {
                setMessages((m) =>
                    m.map((x) => (x.id === optimistic.id ? data.message : x))
                );
            } else {
                // rollback
                setMessages((m) => m.filter((x) => x.id !== optimistic.id));
            }
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <aside className="w-80 border-r overflow-y-auto">
                <div className="p-4 border-b font-semibold">Messages</div>
                {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">
                        Loading…
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                        No conversations yet.
                    </div>
                ) : (
                    <ul>
                        {conversations.map((c) => {
                            const last = c.messages?.[0];
                            const title = c.participants
                                .map(
                                    (p) =>
                                        p.user?.name ||
                                        p.user?.email ||
                                        p.userId
                                )
                                .join(", ");
                            return (
                                <li key={c.id}>
                                    <button
                                        onClick={() => openConversation(c.id)}
                                        className={cn(
                                            "w-full text-left p-3 hover:bg-accent",
                                            selectedId === c.id && "bg-accent"
                                        )}
                                    >
                                        <div className="font-medium line-clamp-1">
                                            {title}
                                        </div>
                                        {last ? (
                                            <div className="text-xs text-muted-foreground line-clamp-1">
                                                {last.content}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground">
                                                No messages
                                            </div>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            <main className="flex-1 flex flex-col">
                {!selectedConversation ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <header className="p-4 border-b">
                            <div className="font-semibold">
                                {selectedConversation.participants
                                    .map(
                                        (p) =>
                                            p.user?.name ||
                                            p.user?.email ||
                                            p.userId
                                    )
                                    .join(", ")}
                            </div>
                        </header>
                        <section className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.map((m) => {
                                const isMe =
                                    m?.sender?.id === user?.id ||
                                    m?.sender?.id === "me";
                                return (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex w-full",
                                            isMe
                                                ? "justify-end"
                                                : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[75%] rounded-2xl px-3 py-2 border whitespace-pre-wrap break-words",
                                                isMe
                                                    ? "bg-orange-100 border-orange-200 text-orange-900 rounded-br-none"
                                                    : "bg-gray-100 border-gray-200 text-gray-900 rounded-bl-none"
                                            )}
                                        >
                                            <div className="text-[10px] opacity-60 mb-1">
                                                {new Date(
                                                    m.createdAt
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                            <div>{m.content}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                        <footer className="p-3 border-t flex gap-2 mb-5">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") send();
                                }}
                                className="flex-1 border rounded px-3 py-2"
                                placeholder="Type a message"
                            />
                            <button
                                onClick={send}
                                disabled={sending || !input.trim()}
                                className="border rounded px-3 py-2"
                            >
                                Send
                            </button>
                        </footer>
                    </div>
                )}
            </main>
        </div>
    );
}
