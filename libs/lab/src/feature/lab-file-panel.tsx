'use client';

import { useRef, useState } from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { FileText } from 'lucide-react';
import { Button } from '@mojo/shared/ui';
import type { FileStorageProvider, SharedFile } from '../domain/lab.types';

const TOPIC = 'mojo-files';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface LabFilePanelProps {
  sessionId: string;
  storage: FileStorageProvider;
}

/**
 * Bytes never touch the data channel — only the metadata does, after the
 * real upload completes. A data channel is for signaling, not payload; the
 * file itself goes to object storage via FileStorageProvider first.
 */
export function LabFilePanel({ sessionId, storage }: LabFilePanelProps) {
  const { localParticipant } = useLocalParticipant();
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { send } = useDataChannel(TOPIC, (msg) => {
    const file = JSON.parse(decoder.decode(msg.payload)) as SharedFile;
    setFiles((prev) => [...prev, file]);
  });

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setUploading(true);
    try {
      const { url, sizeBytes } = await storage.upload({ sessionId, file: chosen, fileName: chosen.name });
      const shared: SharedFile = {
        id: crypto.randomUUID(),
        name: chosen.name,
        sizeBytes,
        url,
        sharedByIdentity: localParticipant.identity,
        sharedByName: localParticipant.name ?? localParticipant.identity,
        sharedAt: new Date().toISOString(),
      };
      setFiles((prev) => [...prev, shared]);
      send(encoder.encode(JSON.stringify(shared)), { reliable: true });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold text-headline">Files</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {files.map((file) => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted"
          >
            <FileText size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{formatSize(file.sizeBytes)}</span>
          </a>
        ))}
        {files.length === 0 && <p className="text-xs text-muted-foreground">No files shared yet.</p>}
      </div>
      <div className="border-t border-border p-3">
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChosen} />
        <Button size="sm" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Share a file'}
        </Button>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
