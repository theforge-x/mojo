import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { SessionSummary } from '@mojo/shared/api-contract';

interface Props {
  readonly session: SessionSummary;
  readonly joinLab: () => void;
}

export function SessionDetailScreen({ session, joinLab }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session</Text>
      <Text style={styles.line}>ID: {session.id}</Text>
      <Text style={styles.line}>Starts: {new Date(session.startIso).toLocaleString()}</Text>
      <Text style={styles.line}>Ends: {new Date(session.endIso).toLocaleString()}</Text>
      <Text style={styles.line}>Status: {session.status}</Text>
      <Text style={styles.line}>
        Format: {session.groupId === null ? 'One-on-one' : `Group lab (${session.groupId.slice(0, 8)})`}
      </Text>
      <View style={styles.gap} />
      <Button title="Join lab" onPress={joinLab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  line: { fontSize: 15, marginBottom: 6 },
  gap: { height: 12 },
});
