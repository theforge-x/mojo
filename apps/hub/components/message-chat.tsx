'use client';

import { Button, Input } from '@mojo/shared/ui';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMessageTime } from '../lib/format';

export interface ChatMessage {
  readonly id: string;
  readonly senderId: string;
  readonly recipientId: string;
  readonly body: string;
  readonly sentAt: string;
  readonly readAt: string | null;
}

export function MessageChat({
  meId,
  partnerId,
  partnerName,
  initial,
}: {
  meId: string;
  partnerId: string;
  partnerName: string;
  initial: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (markRead: boolean) => {
      const res = await fetch(`/api/messages?with=${encodeURIComponent(partnerId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages);
      const hasUnread = data.messages.some((m) => m.recipientId === meId && m.readAt === null);
      if (hasUnread && markRead) {
        await fetch('/api/messages/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ with: partnerId }),
        });
        router.refresh();
      }
    },
    [meId, partnerId, router],
  );

  useEffect(() => {
    void load(true);
    const timer = setInterval(() => void load(false), 4000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: partnerId, body }),
      });
      const data = (await res.json()) as { message?: ChatMessage; error?: string };
      const sent = data.message;
      if (!res.ok || !sent) {
        setError(data.error ?? 'Could not send the message.');
        return;
      }
      setMessages((prev) => [...prev, sent]);
      setDraft('');
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="my-auto text-center text-sm text-muted-foreground">
            Say hello to {partnerName} — you can ask about availability before booking.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === meId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {formatMessageTime(message.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="flex items-center gap-2 border-t bg-background p-3"
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${partnerName}…`}
          aria-label="Message body"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
