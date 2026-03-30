import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createAgent, updateAgent, getLLMConfigs, getTools } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import Toggle from '../components/Toggle';
import PickerModal from '../components/PickerModal';

export default function AgentForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const agent = route.params?.agent;
  const isEdit = !!agent;

  const [name, setName] = useState(agent?.name || '');
  const [role, setRole] = useState(agent?.role || '');
  const [goal, setGoal] = useState(agent?.goal || '');
  const [backstory, setBackstory] = useState(agent?.backstory || '');
  const [llmConfigId, setLlmConfigId] = useState(agent?.llm_config_id || null);
  const [toolIds, setToolIds] = useState(agent?.tool_ids || []);
  const [memory, setMemory] = useState(agent?.memory ?? false);
  const [allowDelegation, setAllowDelegation] = useState(agent?.allow_delegation ?? false);
  const [maxIter, setMaxIter] = useState(String(agent?.max_iter ?? 15));
  const [verbose, setVerbose] = useState(agent?.verbose ?? false);

  const [llmConfigs, setLlmConfigs] = useState([]);
  const [tools, setTools] = useState([]);
  const [llmPickerVisible, setLlmPickerVisible] = useState(false);
  const [toolPickerVisible, setToolPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [configs, toolsData] = await Promise.all([getLLMConfigs(), getTools()]);
        setLlmConfigs(configs);
        setTools(toolsData);
      } catch (e) {
        // silently fail
      }
    }
    loadOptions();
  }, []);

  async function handleSave() {
    if (!name.trim() || !role.trim() || !goal.trim() || !backstory.trim()) {
      Alert.alert('Validation', 'Name, Role, Goal, and Backstory are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        role: role.trim(),
        goal: goal.trim(),
        backstory: backstory.trim(),
        llm_config_id: llmConfigId,
        tool_ids: toolIds,
        memory,
        allow_delegation: allowDelegation,
        max_iter: parseInt(maxIter, 10) || 15,
        verbose,
      };
      if (isEdit) {
        await updateAgent(agent.id, payload);
      } else {
        await createAgent(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save agent.');
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
  }, [saving, name, role, goal, backstory, llmConfigId, toolIds, memory, allowDelegation, maxIter, verbose]);

  const llmLabel = llmConfigId
    ? llmConfigs.find(c => c.id === llmConfigId)?.name || 'Selected'
    : 'None selected';

  const toolsLabel = toolIds.length > 0
    ? `${toolIds.length} tool${toolIds.length > 1 ? 's' : ''} selected`
    : 'None selected';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My Agent" />
        <Field label="Role *" value={role} onChangeText={setRole} placeholder="Senior Researcher" />
        <Field label="Goal *" value={goal} onChangeText={setGoal} placeholder="Research and summarize topics..." multiline numberOfLines={3} />
        <Field label="Backstory *" value={backstory} onChangeText={setBackstory} placeholder="You are an expert researcher with years of experience..." multiline numberOfLines={4} />

        {/* LLM Config */}
        <View style={s.pickerField}>
          <Text style={s.label}>LLM Config</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setLlmPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{llmLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Tools */}
        <View style={s.pickerField}>
          <Text style={s.label}>Tools</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setToolPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{toolsLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Toggle label="Memory" value={memory} onValueChange={setMemory} hint="Allow agent to remember past interactions" />
        <Toggle label="Allow Delegation" value={allowDelegation} onValueChange={setAllowDelegation} hint="Let this agent delegate tasks" />
        <Toggle label="Verbose" value={verbose} onValueChange={setVerbose} />
        <Field
          label="Max Iterations"
          value={maxIter}
          onChangeText={setMaxIter}
          keyboardType="number-pad"
          placeholder="15"
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={llmPickerVisible}
        title="Select LLM Config"
        items={llmConfigs}
        selected={llmConfigId}
        multiple={false}
        onSelect={setLlmConfigId}
        onClose={() => setLlmPickerVisible(false)}
      />
      <PickerModal
        visible={toolPickerVisible}
        title="Select Tools"
        items={tools}
        selected={toolIds}
        multiple={true}
        onSelect={setToolIds}
        onClose={() => setToolPickerVisible(false)}
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
});
