'use client';

import { useState } from 'react';
import { useChat } from '@livekit/components-react';
import { Button, Input } from '@mojo/shared/ui';

/**
 * Built on LiveKit's own useChat() hook rather than reimplementing chat over
 * a raw data channel — chat is a first-class LiveKit concept (their reliable
 * data channel under the hood) with delivery already handled, unlike
 * whiteboard strokes and file metadata below, which are Mojo-specific
 * payloads over a named data-channel topic.
 */
export function LabChatPanel() {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState('');

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    await send(body);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold text-headline">Chat</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <div className="mb-0.5 flex items-baseline gap-2">
              <span className="font-semibold text-headline">{msg.from?.name ?? msg.from?.identity ?? 'Someone'}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-foreground">{msg.message}</p>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <p className="text-xs text-muted-foreground">No messages yet — say hello.</p>
        )}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message the room…"
        />
        <Button size="sm" onClick={handleSend} disabled={isSending || !draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
