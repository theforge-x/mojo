'use client';

import { useDataChannel, useLocalParticipant, useParticipants } from '@livekit/components-react';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const REACTIONS_TOPIC = 'mojo-reaction';
const HAND_RAISE_TOPIC = 'mojo-hand-raise';

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

export const REACTION_CHOICES = ['👍', '❤️', '😂', '🎉', '👏', '😮'] as const;

const REACTION_TTL_MS = 3200;
const MAX_REACTIONS = 8;

export interface ActiveReaction {
  id: string;
  emoji: string;
  name: string;
  identity: string;
}

interface LabReactionsContextValue {
  reactions: ActiveReaction[];
  sendReaction: (emoji: string) => void;
  handRaised: ReadonlyMap<string, string>;
  ownHandRaised: boolean;
  toggleHandRaised: () => void;
}

const LabReactionsContext = createContext<LabReactionsContextValue | null>(null);

export function useLabReactions(): LabReactionsContextValue {
  const value = useContext(LabReactionsContext);
  if (!value) {
    throw new Error('useLabReactions must be used within <LabReactionsProvider>');
  }
  return value;
}

/**
 * Reactions and hand-raise over a raw LiveKit data channel. The installed
 * @livekit/components-react has no built-in reactions API, so both work like
 * the whiteboard: JSON payloads on their own topic (REACTIONS_TOPIC /
 * HAND_RAISE_TOPIC), the sender's identity read off the message envelope.
 *
 * Must be rendered inside <LiveKitRoom/> (the data-channel and participant
 * hooks need the RoomContext) but outside the stage itself so both the stage
 * (to float the emoji) and the control bar (to send them) share one state.
 */
export function LabReactionsProvider({ children }: { children: ReactNode }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();

  const [reactions, setReactions] = useState<ActiveReaction[]>([]);
  const [raised, setRaised] = useState<Map<string, string>>(new Map());
  const [ownHandRaised, setOwnHandRaised] = useState(false);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const ownIdentity = localParticipant?.identity ?? '';
  const ownName = localParticipant?.name ?? ownIdentity;

  const removeReaction = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addReaction = useCallback(
    (reaction: ActiveReaction) => {
      setReactions((prev) => [...prev.slice(-(MAX_REACTIONS - 1)), reaction]);
      const timer = setTimeout(() => removeReaction(reaction.id), REACTION_TTL_MS);
      timers.current.set(reaction.id, timer);
    },
    [removeReaction],
  );

  const { send: publishReaction } = useDataChannel(REACTIONS_TOPIC, (msg) => {
    const identity = msg.from?.identity;
    if (!identity) return;
    try {
      const { emoji } = JSON.parse(DECODER.decode(msg.payload)) as { emoji: string };
      addReaction({
        id: crypto.randomUUID(),
        emoji,
        name: msg.from?.name ?? identity,
        identity,
      });
    } catch {
      // Ignore malformed payloads rather than crashing the room.
    }
  });

  const sendReaction = useCallback(
    (emoji: string) => {
      addReaction({ id: crypto.randomUUID(), emoji, name: ownName, identity: ownIdentity });
      void publishReaction(ENCODER.encode(JSON.stringify({ emoji })), { reliable: true }).catch(
        () => {},
      );
    },
    [addReaction, ownIdentity, ownName, publishReaction],
  );

  const { send: publishHandRaise } = useDataChannel(HAND_RAISE_TOPIC, (msg) => {
    const identity = msg.from?.identity;
    if (!identity) return;
    try {
      const { raised: isRaised } = JSON.parse(DECODER.decode(msg.payload)) as { raised: boolean };
      setRaised((prev) => {
        const next = new Map(prev);
        if (isRaised) {
          next.set(identity, msg.from?.name ?? identity);
        } else {
          next.delete(identity);
        }
        return next;
      });
    } catch {
      // Ignore malformed payloads rather than crashing the room.
    }
  });

  const toggleHandRaised = useCallback(() => {
    setOwnHandRaised((prev) => {
      const next = !prev;
      void publishHandRaise(ENCODER.encode(JSON.stringify({ raised: next })), {
        reliable: true,
      }).catch(() => {});
      return next;
    });
  }, [publishHandRaise]);

  // Drop hand-raise badges for participants who have left the room.
  useEffect(() => {
    const live = new Set(participants.map((p) => p.identity));
    if (ownIdentity && ownHandRaised) live.add(ownIdentity);
    setRaised((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const identity of Array.from(next.keys())) {
        if (!live.has(identity)) {
          next.delete(identity);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [participants, ownIdentity, ownHandRaised]);

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
    },
    [],
  );

  const value = useMemo(
    () => ({
      reactions,
      sendReaction,
      handRaised: raised,
      ownHandRaised,
      toggleHandRaised,
    }),
    [reactions, sendReaction, raised, ownHandRaised, toggleHandRaised],
  );

  return <LabReactionsContext.Provider value={value}>{children}</LabReactionsContext.Provider>;
}

/**
 * Floating emoji anchored to the centre of the stage; each self-removes after
 * REACTION_TTL_MS via the provider. pointer-events-none so it never eats
 * clicks meant for the video tiles beneath.
 */
export function ReactionsOverlay() {
  const { reactions } = useLabReactions();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
    >
      {reactions.map((reaction) => (
        <span
          key={reaction.id}
          role="img"
          aria-label={reaction.emoji}
          className="mojo-reaction absolute top-1/2 left-1/2"
          style={{
            marginLeft: `${((reaction.id.charCodeAt(0) % 7) - 3) * 0.75}rem`,
          }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Chip list (top-right of the stage) of everyone with a hand raised, pruned
 * automatically when they leave. The local participant's own hand shows
 * separately with "(you)" so it's distinguishable from the others.
 */
export function HandRaiseOverlay() {
  const { handRaised, ownHandRaised } = useLabReactions();
  const { localParticipant } = useLocalParticipant();

  const others = Array.from(handRaised.entries());

  if (others.length === 0 && !ownHandRaised) return null;

  return (
    <div className="pointer-events-none absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
      {others.map(([identity, name]) => (
        <span
          key={identity}
          className="flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-headline shadow-sm ring-1 ring-border"
        >
          <span aria-hidden>🖐️</span> {name}
        </span>
      ))}
      {ownHandRaised && localParticipant && (
        <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
          <span aria-hidden>🖐️</span> {localParticipant.name ?? localParticipant.identity} (you)
        </span>
      )}
    </div>
  );
}
