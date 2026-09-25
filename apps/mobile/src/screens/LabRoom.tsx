import { LiveKitRoom, registerGlobals, useTracks, VideoTrack } from '@livekit/react-native';
import { isOk, type LabAccess } from '@mojo/shared/api-contract';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { HubClient } from '../api/client';

try {
  // WebRTC globals for the native LiveKit SDK. No-op when already registered.
  registerGlobals();
} catch {
  // Expo Go has no native WebRTC module — the room below stays disconnected
  // there and works in a dev build instead.
}

function TrackGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  if (tracks.length === 0) {
    return <Text style={styles.note}>Connected — waiting for video tracks…</Text>;
  }
  return (
    <View>
      {tracks.map((trackRef) => (
        <VideoTrack
          key={trackRef.participant.identity + trackRef.source}
          trackRef={trackRef}
          style={styles.video}
        />
      ))}
    </View>
  );
}

interface Props {
  readonly client: HubClient;
  readonly sessionId: string;
}

/**
 * Joins the lesson room: mints a per-participant token from
 * `POST /api/lab/[id]/token`, then connects the native LiveKit room.
 * Needs a dev build (native WebRTC) — in Expo Go the token fetch still
 * proves the contract, but the room cannot connect.
 */
export function LabRoomScreen({ client, sessionId }: Props) {
  const [access, setAccess] = useState<LabAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .labToken(sessionId)
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (isOk(response)) {
          setAccess(response.access);
        } else {
          setError(response.error);
        }
      })
      .catch((unknown: unknown) => {
        if (!cancelled) {
          setError(unknown instanceof Error ? unknown.message : 'Could not join the lab.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, sessionId]);

  if (error !== null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lab</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (access === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lab</Text>
        <Text style={styles.note}>Minting your seat token…</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{access.roomName}</Text>
      <LiveKitRoom serverUrl={access.serverUrl} token={access.participantToken} connect audio video>
        <TrackGrid />
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  note: { fontSize: 14, color: '#555' },
  error: { color: '#b00020' },
  video: { width: '100%', height: 220, marginBottom: 8, backgroundColor: '#000' },
});
