import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { login, getServerUrl, clearAuth } from '../api';

export default function LoginScreen({ onLogin, onChangeServer }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Missing fields', 'Enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      onLogin();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.iconBox}>
          <Text style={s.iconText}>🤖</Text>
        </View>
        <Text style={s.title}>CrewAI Manager</Text>
        <Text style={s.subtitle}>Sign in to manage your AI crews</Text>

        <View style={s.card}>
          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Text style={[s.label, { marginTop: 12 }]}>Password</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPass}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={s.eyeText}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.changeServer} onPress={onChangeServer}>
            <Text style={s.changeServerText}>Change server address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  iconBox: { width: 72, height: 72, backgroundColor: '#7c3aed', borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
  iconText: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#9ca3af', textAlign: 'center', marginBottom: 28 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  label: { color: '#d1d5db', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, color: '#f9fafb', fontSize: 15 },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12 },
  eyeText: { fontSize: 18 },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  changeServer: { marginTop: 16, alignItems: 'center' },
  changeServerText: { color: '#7c3aed', fontSize: 13 },
});
