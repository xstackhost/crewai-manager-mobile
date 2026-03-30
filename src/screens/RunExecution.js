import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { runCrew, runFlow } from '../api';
import theme from '../theme';

function InputRow({ entry, index, onChange, onRemove }) {
  return (
    <View style={s.inputRow}>
      <TextInput
        style={[s.inputField, { flex: 1 }]}
        value={entry.key}
        onChangeText={v => onChange(index, 'key', v)}
        placeholder="Key"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={s.equals}>=</Text>
      <TextInput
        style={[s.inputField, { flex: 2 }]}
        value={entry.value}
        onChangeText={v => onChange(index, 'value', v)}
        placeholder="Value"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(index)}>
        <Text style={s.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RunExecution() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, id, name } = route.params;

  const [inputs, setInputs] = useState([{ key: '', value: '' }]);
  const [running, setRunning] = useState(false);

  function addInput() {
    setInputs(prev => [...prev, { key: '', value: '' }]);
  }

  function removeInput(index) {
    setInputs(prev => prev.filter((_, i) => i !== index));
  }

  function updateInput(index, field, value) {
    setInputs(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }

  async function handleRun() {
    setRunning(true);
    try {
      const inputsObj = {};
      for (const entry of inputs) {
        if (entry.key.trim()) {
          inputsObj[entry.key.trim()] = entry.value;
        }
      }
      let result;
      if (type === 'crew') {
        result = await runCrew(id, inputsObj);
      } else {
        result = await runFlow(id, inputsObj);
      }
      navigation.replace('ExecutionDetail', { executionId: result.execution_id });
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to start execution.');
      setRunning(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        {/* Target info */}
        <View style={s.targetCard}>
          <Text style={s.targetType}>{type === 'crew' ? '⚡ Crew' : '🔄 Flow'}</Text>
          <Text style={s.targetName}>{name}</Text>
        </View>

        {/* Inputs */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Input Variables</Text>
            <TouchableOpacity onPress={addInput} style={s.addBtn}>
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>Optional key-value pairs passed to the {type}.</Text>
          {inputs.map((entry, index) => (
            <InputRow
              key={index}
              entry={entry}
              index={index}
              onChange={updateInput}
              onRemove={removeInput}
            />
          ))}
        </View>

        {/* Run button */}
        <TouchableOpacity
          style={[s.runBtn, running && s.runBtnDisabled]}
          onPress={handleRun}
          disabled={running}
        >
          {running ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.runBtnText}>▶ Run {type === 'crew' ? 'Crew' : 'Flow'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingBottom: 40 },
  targetCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  targetType: { color: theme.textSub, fontSize: 13, marginBottom: 8 },
  targetName: { fontSize: 20, fontWeight: '700', color: theme.text, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  addBtn: {
    backgroundColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  hint: { color: theme.textMuted, fontSize: 12, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputField: {
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
  },
  equals: { color: theme.textSub, fontSize: 16, fontWeight: '700' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.red + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { color: theme.red, fontSize: 14 },
  runBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
});
