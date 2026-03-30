import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createTask, updateTask, getAgents, getTools, getTasks } from '../api';
import theme from '../theme';
import Field from '../components/Field';
import Toggle from '../components/Toggle';
import PickerModal from '../components/PickerModal';

export default function TaskForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const task = route.params?.task;
  const isEdit = !!task;

  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [expectedOutput, setExpectedOutput] = useState(task?.expected_output || '');
  const [agentId, setAgentId] = useState(task?.agent_id || null);
  const [toolIds, setToolIds] = useState(task?.tool_ids || []);
  const [contextTaskIds, setContextTaskIds] = useState(task?.context_task_ids || []);
  const [asyncExecution, setAsyncExecution] = useState(task?.async_execution ?? false);
  const [humanInput, setHumanInput] = useState(task?.human_input ?? false);

  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [agentPickerVisible, setAgentPickerVisible] = useState(false);
  const [toolPickerVisible, setToolPickerVisible] = useState(false);
  const [contextPickerVisible, setContextPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [agentsData, toolsData, tasksData] = await Promise.all([
          getAgents(), getTools(), getTasks(),
        ]);
        setAgents(agentsData);
        setTools(toolsData);
        setAllTasks(tasksData.filter(t => !task || t.id !== task.id));
      } catch (e) {}
    }
    loadOptions();
  }, []);

  async function handleSave() {
    if (!name.trim() || !description.trim() || !expectedOutput.trim()) {
      Alert.alert('Validation', 'Name, Description, and Expected Output are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        expected_output: expectedOutput.trim(),
        agent_id: agentId,
        tool_ids: toolIds,
        context_task_ids: contextTaskIds,
        async_execution: asyncExecution,
        human_input: humanInput,
      };
      if (isEdit) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to save task.');
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
  }, [saving, name, description, expectedOutput, agentId, toolIds, contextTaskIds, asyncExecution, humanInput]);

  const agentLabel = agentId
    ? agents.find(a => a.id === agentId)?.name || 'Selected'
    : 'None (unassigned)';

  const toolsLabel = toolIds.length > 0 ? `${toolIds.length} selected` : 'None';
  const contextLabel = contextTaskIds.length > 0 ? `${contextTaskIds.length} selected` : 'None';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Field label="Name *" value={name} onChangeText={setName} placeholder="Research Task" />
        <Field label="Description *" value={description} onChangeText={setDescription} placeholder="Research the topic..." multiline numberOfLines={3} />
        <Field label="Expected Output *" value={expectedOutput} onChangeText={setExpectedOutput} placeholder="A comprehensive report..." multiline numberOfLines={3} />

        <View style={s.pickerField}>
          <Text style={s.label}>Assigned Agent</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setAgentPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{agentLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.pickerField}>
          <Text style={s.label}>Tools</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setToolPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{toolsLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.pickerField}>
          <Text style={s.label}>Context Tasks</Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setContextPickerVisible(true)}>
            <Text style={s.pickerBtnText}>{contextLabel}</Text>
            <Text style={s.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Toggle label="Async Execution" value={asyncExecution} onValueChange={setAsyncExecution} />
        <Toggle label="Human Input Required" value={humanInput} onValueChange={setHumanInput} />

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={agentPickerVisible}
        title="Assign Agent"
        items={agents}
        selected={agentId}
        multiple={false}
        onSelect={setAgentId}
        onClose={() => setAgentPickerVisible(false)}
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
      <PickerModal
        visible={contextPickerVisible}
        title="Context Tasks"
        items={allTasks}
        selected={contextTaskIds}
        multiple={true}
        onSelect={setContextTaskIds}
        onClose={() => setContextPickerVisible(false)}
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
