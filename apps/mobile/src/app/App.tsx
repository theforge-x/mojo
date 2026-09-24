import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { HubClient, defaultHubUrl } from '../api/client';
import { clearSession, loadSession } from '../auth/session';
import type { AuthState, RootStackParamList } from '../navigation/types';
import { CheckoutScreen } from '../screens/Checkout';
import { LabRoomScreen } from '../screens/LabRoom';
import { SessionDetailScreen } from '../screens/SessionDetail';
import { SessionsScreen } from '../screens/Sessions';
import { SignInScreen } from '../screens/SignIn';
import { SignUpScreen } from '../screens/SignUp';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['mojo://'],
  config: {
    screens: {
      // Paystack redirects here after payment; the reference settles via JSON.
      Checkout: {
        path: 'payments/verify',
        parse: { reference: (reference: string) => reference },
      },
      SignIn: 'signin',
      Sessions: 'sessions',
    },
  },
};

export function App() {
  const [hubUrl, setHubUrl] = useState(defaultHubUrl());
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    // Restore once on launch; hubUrl edits apply to the next sign-in.
    loadSession()
      .then((stored) => {
        if (stored !== null) {
          setAuth({ token: stored.token, user: stored.user, hubUrl });
        }
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  const client = useMemo(
    () => new HubClient(auth?.hubUrl ?? hubUrl, () => auth?.token ?? null),
    [auth, hubUrl],
  );

  async function signOut() {
    try {
      await client.logout();
    } catch {
      // Server logout is best-effort; the device session always clears.
    }
    await clearSession();
    setAuth(null);
  }

  if (restoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        {auth === null ? (
          <>
            <Stack.Screen name="SignIn" options={{ title: 'Sign in' }}>
              {({ navigation }) => (
                <SignInScreen
                  hubUrl={hubUrl}
                  onHubUrlChange={setHubUrl}
                  onSignedIn={setAuth}
                  goSignUp={() => navigation.navigate('SignUp')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SignUp" options={{ title: 'Sign up' }}>
              {() => <SignUpScreen hubUrl={hubUrl} onSignedIn={setAuth} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Sessions" options={{ title: 'Mojo' }}>
              {({ navigation }) => (
                <SessionsScreen
                  client={client}
                  openSession={(session) => navigation.navigate('SessionDetail', { session })}
                  openCheckout={() => navigation.navigate('Checkout', {})}
                  signOut={() => void signOut()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="SessionDetail" options={{ title: 'Session' }}>
              {({ navigation, route }) => (
                <SessionDetailScreen
                  session={route.params.session}
                  joinLab={() => navigation.navigate('LabRoom', { sessionId: route.params.session.id })}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="LabRoom" options={{ title: 'Lab' }}>
              {({ route }) => <LabRoomScreen client={client} sessionId={route.params.sessionId} />}
            </Stack.Screen>
            <Stack.Screen name="Checkout" options={{ title: 'Checkout' }}>
              {({ route }) => (
                <CheckoutScreen client={client} incomingReference={route.params.reference} />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
