import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  NATIVE_PAYMENT_CALLBACK,
  isOk,
  parsePaymentReference,
} from '@mojo/shared/api-contract';
import type { HubClient } from '../api/client';

interface Props {
  readonly client: HubClient;
  /** Present when the app cold-starts from a mojo:// payment callback. */
  readonly incomingReference?: string;
}

/**
 * Full redirect-checkout loop on native: initialize a test charge with the
 * `mojo://` callback, open Paystack in an auth session, catch the deep link
 * on return, then settle via the JSON verify endpoint.
 */
export function CheckoutScreen({ client, incomingReference }: Props) {
  const [status, setStatus] = useState('Idle — start a test payment to walk the loop.');
  const [busy, setBusy] = useState(false);

  async function settle(reference: string) {
    setBusy(true);
    setStatus(`Verifying ${reference}…`);
    try {
      const response = await client.verifyPayment(reference);
      setStatus(isOk(response) ? `Paid ✓ ${response.charge.status}` : `Not paid: ${response.error}`);
    } catch (unknown) {
      setStatus(unknown instanceof Error ? unknown.message : 'Verify failed.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // Settle-once per cold-start link; the manual button covers retries.
    if (typeof incomingReference === 'string' && incomingReference !== '') {
      void settle(incomingReference);
    }
  }, []);

  async function startTestPayment() {
    setBusy(true);
    setStatus('Booking a test slot…');
    try {
      const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const init = await client.initializePayment({
        tutorId: 't_1',
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        callbackUrl: NATIVE_PAYMENT_CALLBACK,
      });
      if (!isOk(init)) {
        setStatus(`Initialize failed: ${init.error}`);
        return;
      }
      const authUrl = init.authorizationUrl;
      if (typeof authUrl !== 'string' || authUrl === '') {
        setStatus('Paystack did not return a checkout URL.');
        return;
      }
      setStatus('Waiting in Paystack…');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, NATIVE_PAYMENT_CALLBACK);
      if (result.type !== 'success' || typeof result.url !== 'string') {
        setStatus('Checkout dismissed — no money moved.');
        return;
      }
      const reference = parsePaymentReference(result.url);
      if (reference === null) {
        setStatus('Returned without a reference — nothing to settle.');
        return;
      }
      await settle(reference);
    } catch (unknown) {
      setStatus(unknown instanceof Error ? unknown.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout demo</Text>
      <Text style={styles.status}>{status}</Text>
      <View style={styles.gap} />
      <Button title={busy ? 'Working…' : 'Start test payment'} onPress={startTestPayment} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  status: { fontSize: 15 },
  gap: { height: 12 },
});
