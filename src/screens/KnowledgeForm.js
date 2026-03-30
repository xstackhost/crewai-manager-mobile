import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createKnowledge } from '../api';
import theme from '../theme';
import Field from '../components/Field';

export default function KnowledgeForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const item = route.params?.item;

  const [name, setName] = useState(item?.name || '');
  const [sourceType, setSourceType] = useState(item?.source_type || 'text');
  const [rawText, setRawText] = useState(item?.raw_text || '');
  const [url, setUrl] = useState(item?.url || '');
  const [chunkSize, setChunkSize] = useState(String(item?.chunk_size ?? 1000));
  const [chunkOverlap, setChunkOverlap] = useState(String(item?.chunk_overlap ?? 200));
  const [saving, setSaving] = useState(false);

  const isText = sourceType === 'text';

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    if (isText && !rawText.trim()) {
      Alert.alert('Validation', 'Raw text is required for text sources.');
      return;
    }
    if (!isText && !url.trim()) {
      Alert.alert('Validation', 'URL is required for URL sources.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        source_type: sourceType,
        raw_text: isText ? rawText.trim() : null,
        url: !isText ? url.trim() : null,
        chunk_size: parseInt(chunkSize, 10) || 1000,
        chunk_overlap: parseInt(chunkOverlap, 10) || 200,
      };
      await createKnowledge(payload);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save knowledge source.');
    } finally {
      setSaving(false);
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
  }, [saving, name, sourceType, rawText, url, chunkSize, chunkOverlap]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My Knowledge Source" />

        {/* Source type toggle */}
        <View style={s.sectionBox}>
          <Text style={s.label}>Source Type</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleOpt, isText && s.toggleOptActive]}
              onPress={() => setSourceType('text')}
            >
              <Text style={[s.toggleOptText, isText && s.toggleOptTextActive]}>📄 Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleOpt, !isText && s.toggleOptActive]}
              onPress={() => setSourceType('url')}
            >
              <Text style={[s.toggleOptText, !isText && s.toggleOptTextActive]}>🌐 URL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isText ? (
          <Field
            label="Raw Text *"
            value={rawText}
            onChangeText={setRawText}
            placeholder="Paste your text content here..."
            multiline
            numberOfLines={10}
          />
        ) : (
          <Field
            label="URL *"
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com/page"
            keyboardType="url"
          />
        )}

        <Field label="Chunk Size" value={chunkSize} onChangeText={setChunkSize} keyboardType="number-pad" placeholder="1000" hint="Characters per chunk" />
        <Field label="Chunk Overlap" value={chunkOverlap} onChangeText={setChunkOverlap} keyboardType="number-pad" placeholder="200" hint="Overlap between chunks" />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingBottom: 40 },
  label: { color: '#d1d5db', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  sectionBox: { marginBottom: 16 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleOpt: {
    flex: 1,
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleOptActive: { backgroundColor: theme.primary + '30', borderColor: theme.primary },
  toggleOptText: { color: theme.textSub, fontWeight: '600', fontSize: 14 },
  toggleOptTextActive: { color: theme.primary },
});
