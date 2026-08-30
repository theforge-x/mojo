/**
 * Domain types for the Lab — Mojo's live session room. One LiveKit room per
 * Session (see @mojo/scheduling), keyed by session id, holding as many
 * participants as actually join — a Lab room isn't capped at two, so
 * one-to-many sessions (a tutor with several students at once) need no
 * different code path here, only a layout that degrades gracefully past a
 * couple of tiles (see LabRoom in feature/).
 */

export interface LabAccess {
  readonly roomName: string;
  readonly serverUrl: string;
  readonly participantToken: string;
  readonly expiresAt: string;
}

export interface LabProvider {
  createAccess(input: {
    sessionId: string;
    participantId: string;
    participantName: string;
  }): Promise<LabAccess>;
}

/** A chat message, as carried over LiveKit's reliable data channel. */
export interface LabChatMessage {
  readonly id: string;
  readonly senderIdentity: string;
  readonly senderName: string;
  readonly body: string;
  readonly sentAt: string;
}

/** A single stroke segment on the shared whiteboard. */
export interface WhiteboardStroke {
  readonly id: string;
  readonly authorIdentity: string;
  readonly color: string;
  readonly widthPx: number;
  readonly points: readonly { x: number; y: number }[]; // normalized 0..1, resolution-independent
}

export type WhiteboardEvent =
  | { kind: 'stroke_start' | 'stroke_append' | 'stroke_end'; stroke: WhiteboardStroke }
  | { kind: 'clear' };

/** A file shared into the room — the bytes live in object storage, only
 *  the metadata travels over the data channel. */
export interface SharedFile {
  readonly id: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly url: string;
  readonly sharedByIdentity: string;
  readonly sharedByName: string;
  readonly sharedAt: string;
}

export interface FileStorageProvider {
  upload(input: {
    sessionId: string;
    file: Blob;
    fileName: string;
  }): Promise<{ url: string; sizeBytes: number }>;
}
