import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import axios from 'axios';
import { saveServerUrl } from '../api';

export default function ServerSetup({ onComplete }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'Server URL must start with http:// or https://');
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.get(`${trimmed}/health`, { timeout: 8000 });
      if (resp.data?.service?.includes('crewai')) {
        await saveServerUrl(trimmed);
        onComplete();
      } else {
        Alert.alert('Not a CrewAI server', 'The server responded but does not appear to be CrewAI Manager.');
      }
    } catch (err) {
      Alert.alert('Connection Failed', `Could not reach ${trimmed}\n\nMake sure the server is running and accessible from this device.`);
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
        <Text style={s.title}>Connect to CrewAI Server</Text>
        <Text style={s.subtitle}>
          Enter the address of your self-hosted CrewAI Manager instance.
        </Text>

        <View style={s.card}>
          <Text style={s.label}>Server URL</Text>
          <TextInput
            style={s.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://crewai.yourdomain.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleConnect}
          />
          <Text style={s.hint}>
            Examples:{'\n'}
            • https://crewai.yourdomain.com{'\n'}
            • http://192.168.1.100:3002{'\n'}
            • http://yourserver.local:3002
          </Text>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Connect</Text>
            }
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
  subtitle: { color: '#9ca3af', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
  label: { color: '#d1d5db', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, color: '#f9fafb', fontSize: 15, marginBottom: 12 },
  hint: { color: '#6b7280', fontSize: 12, lineHeight: 18, marginBottom: 20 },
  btn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
