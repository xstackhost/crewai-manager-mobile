import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getServerUrl, getToken, clearAuth } from './src/api';
import { MainNavigator, AuthNavigator } from './src/navigation';

export default function App() {
  const [state, setState] = useState('loading'); // loading | auth | app

  useEffect(() => {
    async function checkState() {
      const url = await getServerUrl();
      if (!url) { setState('auth'); return; }
      const token = await getToken();
      if (!token) { setState('auth'); return; }
      setState('app');
    }
    checkState();
  }, []);

  async function handleLogout() {
    await clearAuth();
    setState('auth');
  }

  function handleLogin() {
    setState('app');
  }

  function handleServerConfigured(navigation) {
    // Navigation handled inside AuthNavigator
  }

  if (state === 'loading') {
    return (
      <View style={s.splash}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {state === 'auth' ? (
          <AuthNavigator
            onLogin={handleLogin}
            onServerConfigured={() => {}}
          />
        ) : (
          <MainNavigator onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
});
