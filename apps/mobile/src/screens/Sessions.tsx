import React, { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { isOk, type SessionSummary } from '@mojo/shared/api-contract';
import type { HubClient } from '../api/client';
import { registerPushToken } from '../push/register';

interface Props {
  readonly client: HubClient;
  readonly openSession: (session: SessionSummary) => void;
  readonly openCheckout: () => void;
  readonly signOut: () => void;
}

export function SessionsScreen({ client, openSession, openCheckout, signOut }: Props) {
  const [sessions, setSessions] = useState<readonly SessionSummary[]>([]);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await client.mySessions();
    if (isOk(response)) {
      setSessions(response.sessions);
      setError(null);
    } else {
      setError(response.error);
    }
  }, [client]);

  useEffect(() => {
    void refresh();
    // Best-effort: reminders only reach this phone once its token is registered.
    void registerPushToken(client).then((result) => {
      setPushNote(result.registered ? 'Push registered ✓' : `Push off: ${result.reason}`);
    });
  }, [client, refresh]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My sessions</Text>
      {pushNote !== null ? <Text style={styles.note}>{pushNote}</Text> : null}
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={[...sessions]}
        keyExtractor={(item) => item.id}
        onRefresh={refresh}
        refreshing={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>
                {new Date(item.startIso).toLocaleString()} · {item.status}
              </Text>
              <Text style={styles.rowSub}>
                {item.groupId === null ? 'One-on-one' : 'Group lab'} · {item.id.slice(0, 8)}
              </Text>
            </View>
            <Button title="Open" onPress={() => openSession(item)} />
          </View>
        )}
      />
      <View style={styles.gap} />
      <Button title="Try checkout demo" onPress={openCheckout} />
      <View style={styles.gap} />
      <Button title="Refresh" onPress={refresh} />
      <View style={styles.gap} />
      <Button title="Sign out" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  note: { fontSize: 13, color: '#555', marginBottom: 8 },
  error: { color: '#b00020', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, color: '#555' },
  gap: { height: 8 },
});
