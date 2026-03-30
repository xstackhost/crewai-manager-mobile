import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createFlow, updateFlow, getCrews, getLLMConfigs } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import PickerModal from '../components/PickerModal';

const STEP_TYPES = [
  { id: 'start', name: 'Start' },
  { id: 'listen', name: 'Listen' },
  { id: 'router', name: 'Router' },
  { id: 'crew_run', name: 'Crew Run' },
  { id: 'llm_call', name: 'LLM Call' },
  { id: 'end', name: 'End' },
];

function StepEditor({ step, index, crews, llmConfigs, onChange, onRemove }) {
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [crewPickerVisible, setCrewPickerVisible] = useState(false);
  const [llmPickerVisible, setLlmPickerVisible] = useState(false);

  const typeLabel = STEP_TYPES.find(t => t.id === step.step_type)?.name || 'Select type';
  const crewLabel = step.crew_id
    ? crews.find(c => c.id === step.crew_id)?.name || 'Selected'
    : 'None';
  const llmLabel = step.llm_config_id
    ? llmConfigs.find(c => c.id === step.llm_config_id)?.name || 'Selected'
    : 'None';

  return (
    <View style={s.stepCard}>
      <View style={s.stepHeader}>
        <Text style={s.stepIndex}>Step {index + 1}</Text>
        <TouchableOpacity onPress={() => onRemove(index)} style={s.removeBtn}>
          <Text style={s.removeBtnText}>✕ Remove</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={s.stepNameInput}
        value={step.step_name}
        onChangeText={v => onChange(index, 'step_name', v)}
        placeholder="Step name"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={s.fieldLabel}>Step Type</Text>
      <TouchableOpacity style={s.pickerBtn} onPress={() => setTypePickerVisible(true)}>
        <Text style={s.pickerBtnText}>{typeLabel}</Text>
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>

      {(step.step_type === 'crew_run') && (
        <>
          <Text style={s.fieldLabel}>Crew</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setCrewPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{crewLabel}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {(step.step_type === 'llm_call') && (
        <>
          <Text style={s.fieldLabel}>LLM Config</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setLlmPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{llmLabel}</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {(step.step_type === 'llm_call' || step.step_type === 'start') && (
        <>
          <Text style={s.fieldLabel}>Prompt Template</Text>
          <TextInput
            style={[s.stepNameInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
            value={step.prompt_template}
            onChangeText={v => onChange(index, 'prompt_template', v)}
            placeholder="Enter prompt template..."
            placeholderTextColor={theme.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}

      <PickerModal
        visible={typePickerVisible}
        title="Step Type"
        items={STEP_TYPES}
        selected={step.step_type}
        multiple={false}
        onSelect={v => onChange(index, 'step_type', v)}
        onClose={() => setTypePickerVisible(false)}
      />
      <PickerModal
        visible={crewPickerVisible}
        title="Select Crew"
        items={crews}
        selected={step.crew_id}
        multiple={false}
        onSelect={v => onChange(index, 'crew_id', v)}
        onClose={() => setCrewPickerVisible(false)}
      />
      <PickerModal
        visible={llmPickerVisible}
        title="LLM Config"
        items={llmConfigs}
        selected={step.llm_config_id}
        multiple={false}
        onSelect={v => onChange(index, 'llm_config_id', v)}
        onClose={() => setLlmPickerVisible(false)}
      />
    </View>
  );
}

export default function FlowForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const flow = route.params?.flow;
  const isEdit = !!flow;

  const [name, setName] = useState(flow?.name || '');
  const [description, setDescription] = useState(flow?.description || '');
  const [steps, setSteps] = useState(
    flow?.steps?.length > 0
      ? flow.steps
      : [{ step_name: '', step_type: 'start', crew_id: null, llm_config_id: null, prompt_template: '', sort_order: 0 }]
  );

  const [crews, setCrews] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [crewsData, llmData] = await Promise.all([getCrews(), getLLMConfigs()]);
        setCrews(crewsData);
        setLlmConfigs(llmData);
      } catch (e) {}
    }
    loadOptions();
  }, []);

  function addStep() {
    setSteps(prev => [...prev, {
      step_name: '',
      step_type: 'crew_run',
      crew_id: null,
      llm_config_id: null,
      prompt_template: '',
      sort_order: prev.length,
    }]);
  }

  function removeStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  function updateStep(index, field, value) {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, [field]: value } : step));
  }

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
        steps: steps.map((s, i) => ({ ...s, sort_order: i })),
      };
      if (isEdit) {
        await updateFlow(flow.id, payload);
      } else {
        await createFlow(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save flow.');
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
  }, [saving, name, description, steps]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My Flow" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="What this flow does..." multiline numberOfLines={3} />

        <View style={s.stepsSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Steps ({steps.length})</Text>
            <TouchableOpacity onPress={addStep} style={s.addBtn}>
              <Text style={s.addBtnText}>+ Add Step</Text>
            </TouchableOpacity>
          </View>
          {steps.map((step, index) => (
            <StepEditor
              key={index}
              step={step}
              index={index}
              crews={crews}
              llmConfigs={llmConfigs}
              onChange={updateStep}
              onRemove={removeStep}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingBottom: 40 },
  stepsSection: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#d1d5db', fontSize: 15, fontWeight: '700' },
  addBtn: {
    backgroundColor: theme.primary + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  addBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  stepCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndex: { color: theme.primary, fontWeight: '700', fontSize: 14 },
  removeBtn: {},
  removeBtnText: { color: theme.red, fontSize: 13, fontWeight: '600' },
  stepNameInput: {
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
    marginBottom: 10,
  },
  fieldLabel: { color: '#d1d5db', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  pickerBtn: {
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerBtnText: { color: theme.text, fontSize: 14, flex: 1 },
  chevron: { color: theme.textSub, fontSize: 18 },
});
