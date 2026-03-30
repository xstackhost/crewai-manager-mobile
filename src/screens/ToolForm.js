import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createTool, updateTool } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import PickerModal from '../components/PickerModal';

const BUILTIN_CLASSES = [
  { id: 'WebsiteSearchTool', name: 'WebsiteSearchTool' },
  { id: 'FileReadTool', name: 'FileReadTool' },
  { id: 'ScrapeWebsiteTool', name: 'ScrapeWebsiteTool' },
  { id: 'SerperDevTool', name: 'SerperDevTool' },
  { id: 'CodeInterpreterTool', name: 'CodeInterpreterTool' },
  { id: 'DallETool', name: 'DallETool' },
  { id: 'YoutubeVideoSearchTool', name: 'YoutubeVideoSearchTool' },
  { id: 'GithubSearchTool', name: 'GithubSearchTool' },
  { id: 'DirectoryReadTool', name: 'DirectoryReadTool' },
  { id: 'PDFSearchTool', name: 'PDFSearchTool' },
  { id: 'CSVSearchTool', name: 'CSVSearchTool' },
  { id: 'JSONSearchTool', name: 'JSONSearchTool' },
  { id: 'TXTSearchTool', name: 'TXTSearchTool' },
  { id: 'BrowserbaseTool', name: 'BrowserbaseTool' },
  { id: 'EXASearchTool', name: 'EXASearchTool' },
];

export default function ToolForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const tool = route.params?.tool;
  const isEdit = !!tool;

  const [name, setName] = useState(tool?.name || '');
  const [description, setDescription] = useState(tool?.description || '');
  const [toolType, setToolType] = useState(tool?.tool_type || 'builtin');
  const [builtinClass, setBuiltinClass] = useState(tool?.builtin_class || '');
  const [sourceCode, setSourceCode] = useState(tool?.source_code || '');
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const isBuiltin = toolType === 'builtin';

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        tool_type: toolType,
        builtin_class: isBuiltin ? builtinClass : null,
        source_code: !isBuiltin ? sourceCode : null,
      };
      if (isEdit) {
        await updateTool(tool.id, payload);
      } else {
        await createTool(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save tool.');
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
  }, [saving, name, description, toolType, builtinClass, sourceCode]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My Tool" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="What this tool does..." multiline numberOfLines={3} />

        {/* Tool type selector */}
        <View style={s.sectionBox}>
          <Text style={s.label}>Tool Type</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleOpt, isBuiltin && s.toggleOptActive]}
              onPress={() => setToolType('builtin')}
            >
              <Text style={[s.toggleOptText, isBuiltin && s.toggleOptTextActive]}>Built-in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleOpt, !isBuiltin && s.toggleOptActive]}
              onPress={() => setToolType('custom')}
            >
              <Text style={[s.toggleOptText, !isBuiltin && s.toggleOptTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isBuiltin ? (
          <View style={s.pickerField}>
            <Text style={s.label}>Builtin Class</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setClassPickerVisible(true)}>
              <Text style={s.pickerBtnText}>{builtinClass || 'Select class'}</Text>
              <Text style={s.pickerChevron}>›</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Field
            label="Source Code"
            value={sourceCode}
            onChangeText={setSourceCode}
            placeholder="# Python code here..."
            multiline
            numberOfLines={12}
            hint="Write your custom tool as a Python class inheriting from BaseTool."
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={classPickerVisible}
        title="Select Builtin Class"
        items={BUILTIN_CLASSES}
        selected={builtinClass}
        multiple={false}
        onSelect={setBuiltinClass}
        onClose={() => setClassPickerVisible(false)}
      />
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
});
