import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createSchedulerJob, updateSchedulerJob, getCrews, getFlows } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import Toggle from '../components/Toggle';
import PickerModal from '../components/PickerModal';

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

export default function SchedulerForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const job = route.params?.job;
  const isEdit = !!job;

  const [name, setName] = useState(job?.name || '');
  const [targetType, setTargetType] = useState(job?.target_type || 'crew');
  const [targetId, setTargetId] = useState(job?.target_id || null);
  const [cronExpression, setCronExpression] = useState(job?.cron_expression || '');
  const [enabled, setEnabled] = useState(job?.enabled ?? true);
  const [inputEntries, setInputEntries] = useState(() => {
    const obj = job?.inputs || {};
    const entries = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
    return entries.length > 0 ? entries : [{ key: '', value: '' }];
  });

  const [crews, setCrews] = useState([]);
  const [flows, setFlows] = useState([]);
  const [targetPickerVisible, setTargetPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [crewsData, flowsData] = await Promise.all([getCrews(), getFlows()]);
        setCrews(crewsData);
        setFlows(flowsData);
      } catch (e) {}
    }
    loadOptions();
  }, []);

  const isCrew = targetType === 'crew';
  const targetItems = isCrew ? crews : flows;
  const targetLabel = targetId
    ? targetItems.find(t => t.id === targetId)?.name || 'Selected'
    : 'None selected';

  function addInput() {
    setInputEntries(prev => [...prev, { key: '', value: '' }]);
  }

  function removeInput(index) {
    setInputEntries(prev => prev.filter((_, i) => i !== index));
  }

  function updateInput(index, field, value) {
    setInputEntries(prev => prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry));
  }

  async function handleSave() {
    if (!name.trim() || !cronExpression.trim()) {
      Alert.alert('Validation', 'Name and Cron Expression are required.');
      return;
    }
    setSaving(true);
    try {
      const inputsObj = {};
      for (const entry of inputEntries) {
        if (entry.key.trim()) {
          inputsObj[entry.key.trim()] = entry.value;
        }
      }
      const payload = {
        name: name.trim(),
        target_type: targetType,
        target_id: targetId,
        cron_expression: cronExpression.trim(),
        inputs: inputsObj,
        enabled,
      };
      if (isEdit) {
        await updateSchedulerJob(job.id, payload);
      } else {
        await createSchedulerJob(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save job.');
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
  }, [saving, name, targetType, targetId, cronExpression, enabled, inputEntries]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="Daily Morning Run" />

        {/* Target type */}
        <View style={s.sectionBox}>
          <Text style={s.label}>Target Type</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleOpt, isCrew && s.toggleOptActive]}
              onPress={() => { setTargetType('crew'); setTargetId(null); }}
            >
              <Text style={[s.toggleOptText, isCrew && s.toggleOptTextActive]}>⚡ Crew</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleOpt, !isCrew && s.toggleOptActive]}
              onPress={() => { setTargetType('flow'); setTargetId(null); }}
            >
              <Text style={[s.toggleOptText, !isCrew && s.toggleOptTextActive]}>🔄 Flow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.pickerField}>
          <Text style={s.label}>Target {isCrew ? 'Crew' : 'Flow'}</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setTargetPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{targetLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Field
          label="Cron Expression *"
          value={cronExpression}
          onChangeText={setCronExpression}
          placeholder="0 9 * * 1-5"
          hint="Standard cron format: minute hour day-of-month month day-of-week"
        />

        {/* Input variables */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Input Variables</Text>
            <TouchableOpacity onPress={addInput} style={s.addBtn}>
              <Text style={s.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {inputEntries.map((entry, index) => (
            <InputRow
              key={index}
              entry={entry}
              index={index}
              onChange={updateInput}
              onRemove={removeInput}
            />
          ))}
        </View>

        <Toggle label="Enabled" value={enabled} onValueChange={setEnabled} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={targetPickerVisible}
        title={`Select ${isCrew ? 'Crew' : 'Flow'}`}
        items={targetItems}
        selected={targetId}
        multiple={false}
        onSelect={setTargetId}
        onClose={() => setTargetPickerVisible(false)}
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
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  addBtn: {
    backgroundColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
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
});
