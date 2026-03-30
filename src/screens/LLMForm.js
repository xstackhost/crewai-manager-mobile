import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createLLMConfig, updateLLMConfig, testLLMConfig } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import PickerModal from '../components/PickerModal';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google' },
  { id: 'groq', name: 'Groq' },
  { id: 'ollama', name: 'Ollama' },
  { id: 'custom', name: 'Custom' },
];

export default function LLMForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const config = route.params?.config;
  const isEdit = !!config;

  const [name, setName] = useState(config?.name || '');
  const [provider, setProvider] = useState(config?.provider || 'openai');
  const [model, setModel] = useState(config?.model || '');
  const [apiKey, setApiKey] = useState(config?.api_key || '');
  const [baseUrl, setBaseUrl] = useState(config?.base_url || '');
  const [temperature, setTemperature] = useState(String(config?.temperature ?? 0.7));
  const [maxTokens, setMaxTokens] = useState(config?.max_tokens ? String(config.max_tokens) : '');

  const [providerPickerVisible, setProviderPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const providerLabel = PROVIDERS.find(p => p.id === provider)?.name || provider;

  async function handleSave() {
    if (!name.trim() || !model.trim()) {
      Alert.alert('Validation', 'Name and Model are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        provider,
        model: model.trim(),
        api_key: apiKey.trim() || null,
        base_url: baseUrl.trim() || null,
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: maxTokens ? parseInt(maxTokens, 10) : null,
      };
      let savedId;
      if (isEdit) {
        await updateLLMConfig(config.id, payload);
        savedId = config.id;
      } else {
        const result = await createLLMConfig(payload);
        savedId = result.id;
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save config.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!isEdit) {
      Alert.alert('Save First', 'Save the config before testing.');
      return;
    }
    setTesting(true);
    try {
      const result = await testLLMConfig(config.id);
      if (result.ok) {
        Alert.alert('Test Passed ✅', result.response?.slice(0, 300) || 'Connection OK');
      } else {
        Alert.alert('Test Failed ❌', result.error || 'Unknown error');
      }
    } catch (e) {
      Alert.alert('Test Error', e.response?.data?.detail || 'Connection failed');
    } finally {
      setTesting(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginRight: 4 }}>
          {saving ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [saving, name, provider, model, apiKey, baseUrl, temperature, maxTokens]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My GPT-4 Config" />

        <View style={s.pickerField}>
          <Text style={s.label}>Provider</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setProviderPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{providerLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Field label="Model *" value={model} onChangeText={setModel} placeholder="gpt-4o, claude-3-5-sonnet-20241022, etc." />
        <Field label="API Key" value={apiKey} onChangeText={setApiKey} placeholder="sk-..." secureTextEntry />
        <Field label="Base URL (optional)" value={baseUrl} onChangeText={setBaseUrl} placeholder="https://api.openai.com/v1" keyboardType="url" />
        <Field label="Temperature" value={temperature} onChangeText={setTemperature} placeholder="0.7" keyboardType="decimal-pad" hint="0.0 - 2.0" />
        <Field label="Max Tokens (optional)" value={maxTokens} onChangeText={setMaxTokens} placeholder="4096" keyboardType="number-pad" />

        {isEdit && (
          <TouchableOpacity
            style={[s.testBtn, testing && s.testBtnDisabled]}
            onPress={handleTest}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={theme.blue} />
            ) : (
              <Text style={s.testBtnText}>🧪 Test Connection</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={providerPickerVisible}
        title="Select Provider"
        items={PROVIDERS}
        selected={provider}
        multiple={false}
        onSelect={setProvider}
        onClose={() => setProviderPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingBottom: 40 },
  label: { color: '#d1d5db', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  pickerField: { marginBottom: 16 },
  pickerBtn: {
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerBtnText: { color: theme.text, fontSize: 15, flex: 1 },
  pickerChevron: { color: theme.textSub, fontSize: 20 },
  testBtn: {
    backgroundColor: theme.blue + '20',
    borderWidth: 1,
    borderColor: theme.blue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  testBtnDisabled: { opacity: 0.5 },
  testBtnText: { color: theme.blue, fontWeight: '700', fontSize: 15 },
});
