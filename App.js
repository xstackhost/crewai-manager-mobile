import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getServerUrl, getToken } from './src/api';
import ServerSetup from './src/screens/ServerSetup';
import LoginScreen from './src/screens/Login';
import DashboardScreen from './src/screens/Dashboard';

export default function App() {
  const [screen, setScreen] = useState('loading'); // loading | setup | login | app

  useEffect(() => {
    async function checkState() {
      const url = await getServerUrl();
      if (!url) { setScreen('setup'); return; }
      const token = await getToken();
      if (!token) { setScreen('login'); return; }
      setScreen('app');
    }
    checkState();
  }, []);

  if (screen === 'loading') {
    return (
      <View style={s.splash}>
        <ActivityIndicator color="#7c3aed" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (screen === 'setup') {
    return (
      <>
        <ServerSetup onComplete={() => setScreen('login')} />
        <StatusBar style="light" />
      </>
    );
  }

  if (screen === 'login') {
    return (
      <>
        <LoginScreen
          onLogin={() => setScreen('app')}
          onChangeServer={() => setScreen('setup')}
        />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <DashboardScreen onLogout={() => setScreen('login')} />
      <StatusBar style="light" />
    </>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
});
