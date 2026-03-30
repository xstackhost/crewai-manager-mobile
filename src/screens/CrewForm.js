import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createCrew, updateCrew, getAgents, getTasks, getLLMConfigs } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import Toggle from '../components/Toggle';
import PickerModal from '../components/PickerModal';

export default function CrewForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const crew = route.params?.crew;
  const isEdit = !!crew;

  const [name, setName] = useState(crew?.name || '');
  const [description, setDescription] = useState(crew?.description || '');
  const [process, setProcess] = useState(crew?.process || 'sequential');
  const [agentIds, setAgentIds] = useState(crew?.agent_ids || []);
  const [taskIds, setTaskIds] = useState(crew?.task_ids || []);
  const [managerLlmId, setManagerLlmId] = useState(crew?.manager_llm_id || null);
  const [memoryEnabled, setMemoryEnabled] = useState(crew?.memory_enabled ?? false);
  const [planning, setPlanning] = useState(crew?.planning ?? false);
  const [verbose, setVerbose] = useState(crew?.verbose ?? false);

  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [llmConfigs, setLlmConfigs] = useState([]);
  const [agentPickerVisible, setAgentPickerVisible] = useState(false);
  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const [llmPickerVisible, setLlmPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [agentsData, tasksData, llmData] = await Promise.all([
          getAgents(), getTasks(), getLLMConfigs(),
        ]);
        setAgents(agentsData);
        setTasks(tasksData);
        setLlmConfigs(llmData);
      } catch (e) {}
    }
    loadOptions();
  }, []);

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
        process,
        agent_ids: agentIds,
        task_ids: taskIds,
        manager_llm_id: process === 'hierarchical' ? managerLlmId : null,
        memory_enabled: memoryEnabled,
        planning,
        verbose,
      };
      if (isEdit) {
        await updateCrew(crew.id, payload);
      } else {
        await createCrew(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save crew.');
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
  }, [saving, name, description, process, agentIds, taskIds, managerLlmId, memoryEnabled, planning, verbose]);

  const isHierarchical = process === 'hierarchical';
  const agentsLabel = agentIds.length > 0 ? `${agentIds.length} selected` : 'None';
  const tasksLabel = taskIds.length > 0 ? `${taskIds.length} selected` : 'None';
  const managerLabel = managerLlmId
    ? llmConfigs.find(c => c.id === managerLlmId)?.name || 'Selected'
    : 'None selected';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="My Crew" />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="What this crew does..." multiline numberOfLines={3} />

        {/* Process type */}
        <View style={s.sectionBox}>
          <Text style={s.label}>Process Type</Text>
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleOpt, !isHierarchical && s.toggleOptActive]}
              onPress={() => setProcess('sequential')}
            >
              <Text style={[s.toggleOptText, !isHierarchical && s.toggleOptTextActive]}>Sequential</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleOpt, isHierarchical && s.toggleOptActive]}
              onPress={() => setProcess('hierarchical')}
            >
              <Text style={[s.toggleOptText, isHierarchical && s.toggleOptTextActive]}>Hierarchical</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.pickerField}>
          <Text style={s.label}>Agents</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setAgentPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{agentsLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.pickerField}>
          <Text style={s.label}>Tasks</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setTaskPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{tasksLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {isHierarchical && (
          <View style={s.pickerField}>
            <Text style={s.label}>Manager LLM</Text>
            <TouchableOpacity style={s.pickerBtn} onPress={() => setLlmPickerVisible(true)}>
              <Text style={s.pickerBtnText}>{managerLabel}</Text>
              <Text style={s.pickerChevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        <Toggle label="Memory Enabled" value={memoryEnabled} onValueChange={setMemoryEnabled} />
        <Toggle label="Planning" value={planning} onValueChange={setPlanning} hint="Enable planning phase before execution" />
        <Toggle label="Verbose" value={verbose} onValueChange={setVerbose} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={agentPickerVisible}
        title="Select Agents"
        items={agents}
        selected={agentIds}
        multiple={true}
        onSelect={setAgentIds}
        onClose={() => setAgentPickerVisible(false)}
      />
      <PickerModal
        visible={taskPickerVisible}
        title="Select Tasks"
        items={tasks}
        selected={taskIds}
        multiple={true}
        onSelect={setTaskIds}
        onClose={() => setTaskPickerVisible(false)}
      />
      <PickerModal
        visible={llmPickerVisible}
        title="Manager LLM"
        items={llmConfigs}
        selected={managerLlmId}
        multiple={false}
        onSelect={setManagerLlmId}
        onClose={() => setLlmPickerVisible(false)}
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
