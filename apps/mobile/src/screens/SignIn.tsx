import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { isOk } from '@mojo/shared/api-contract';
import { HubClient } from '../api/client';
import { saveSession } from '../auth/session';
import type { AuthState } from '../navigation/types';

interface Props {
  readonly hubUrl: string;
  readonly onHubUrlChange: (url: string) => void;
  readonly onSignedIn: (auth: AuthState) => void;
  readonly goSignUp: () => void;
}

export function SignInScreen({ hubUrl, onHubUrlChange, onSignedIn, goSignUp }: Props) {
  const [email, setEmail] = useState('student@mojo.dev');
  const [password, setPassword] = useState('Password123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const client = new HubClient(hubUrl, () => null);
      const response = await client.login({ email: email.trim(), password });
      if (!isOk(response)) {
        setError(response.error);
        return;
      }
      await saveSession(response.token, response.user);
      onSignedIn({ token: response.token, user: response.user, hubUrl });
    } catch (unknown) {
      setError(unknown instanceof Error ? unknown.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mojo</Text>
      <Text style={styles.label}>Hub URL</Text>
      <TextInput style={styles.input} value={hubUrl} onChangeText={onHubUrlChange} autoCapitalize="none" />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={signIn} disabled={busy} />
      <View style={styles.gap} />
      <Button title="No account? Sign up" onPress={goSignUp} />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 13, color: '#555', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  error: { color: '#b00020', marginVertical: 8 },
  gap: { height: 8 },
});
