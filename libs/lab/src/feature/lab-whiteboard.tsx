'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { Button } from '@mojo/shared/ui';
import type { WhiteboardEvent, WhiteboardStroke } from '../domain/lab.types';

const TOPIC = 'mojo-whiteboard';
const STROKE_COLOR = '#00214d'; // headline navy on the shared canvas by default
const STROKE_WIDTH = 3;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * No LiveKit component does this — a whiteboard is exactly the kind of
 * low-latency ephemeral state LiveKit's data channels are meant for (the
 * same mechanism chat rides on, just with a Mojo-defined payload instead of
 * a plain string). Strokes are broadcast as they're drawn, not just on
 * pointer-up, so remote participants see drawing happen live rather than
 * snapping in after the fact.
 */
export function LabWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<WhiteboardStroke | null>(null);
  const { localParticipant } = useLocalParticipant();
  const [strokes, setStrokes] = useState<WhiteboardStroke[]>([]);

  const { send } = useDataChannel(TOPIC, (msg) => {
    const event = JSON.parse(decoder.decode(msg.payload)) as WhiteboardEvent;
    applyRemoteEvent(event);
  });

  const applyRemoteEvent = useCallback((event: WhiteboardEvent) => {
    if (event.kind === 'clear') {
      setStrokes([]);
      return;
    }
    setStrokes((prev) => {
      const withoutStroke = prev.filter((s) => s.id !== event.stroke.id);
      return event.kind === 'stroke_end' && event.stroke.points.length === 0
        ? withoutStroke
        : [...withoutStroke, event.stroke];
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      drawStroke(ctx, stroke, canvas.width, canvas.height);
    }
  }, [strokes]);

  function broadcast(event: WhiteboardEvent) {
    send(encoder.encode(JSON.stringify(event)), { reliable: true });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const point = toNormalizedPoint(e);
    const stroke: WhiteboardStroke = {
      id: crypto.randomUUID(),
      authorIdentity: localParticipant.identity,
      color: STROKE_COLOR,
      widthPx: STROKE_WIDTH,
      points: [point],
    };
    currentStroke.current = stroke;
    setStrokes((prev) => [...prev, stroke]);
    broadcast({ kind: 'stroke_start', stroke });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!currentStroke.current || e.buttons !== 1) return;
    const point = toNormalizedPoint(e);
    currentStroke.current = { ...currentStroke.current, points: [...currentStroke.current.points, point] };
    setStrokes((prev) => prev.map((s) => (s.id === currentStroke.current!.id ? currentStroke.current! : s)));
    broadcast({ kind: 'stroke_append', stroke: currentStroke.current });
  }

  function handlePointerUp() {
    if (!currentStroke.current) return;
    broadcast({ kind: 'stroke_end', stroke: currentStroke.current });
    currentStroke.current = null;
  }

  function handleClear() {
    setStrokes([]);
    broadcast({ kind: 'clear' });
  }

  function toNormalizedPoint(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold text-headline">Whiteboard</span>
        <Button size="sm" variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={600}
        className="flex-1 touch-none rounded-b-lg bg-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke, width: number, height: number) {
  const first = stroke.points[0];
  if (!first || stroke.points.length < 2) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.widthPx;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(first.x * width, first.y * height);
  for (const point of stroke.points.slice(1)) {
    ctx.lineTo(point.x * width, point.y * height);
  }
  ctx.stroke();
}
