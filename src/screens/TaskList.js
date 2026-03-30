import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getTasks, deleteTask } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function TaskCard({ task, onPress, onLongPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.taskName}>{task.name}</Text>
        {task.agent_name ? <Badge label={task.agent_name} color={theme.primary} /> : null}
      </View>
      {task.description ? (
        <Text style={s.taskDesc} numberOfLines={2}>{task.description}</Text>
      ) : null}
      {task.expected_output ? (
        <Text style={s.expectedOutput} numberOfLines={1}>
          <Text style={{ color: theme.textSub }}>Output: </Text>{task.expected_output}
        </Text>
      ) : null}
      <View style={s.footer}>
        {task.async_execution ? <Badge label="async" color={theme.yellow} /> : null}
        {task.human_input ? <Badge label="human input" color={theme.blue} /> : null}
        {task.tool_ids?.length > 0 ? (
          <Badge label={`${task.tool_ids.length} tools`} color={theme.textSub} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function TaskList() {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleCreate() {
    navigation.navigate('TaskForm');
  }

  function handleEdit(task) {
    navigation.navigate('TaskForm', { task });
  }

  function handleLongPress(task) {
    Alert.alert(
      'Delete Task',
      `Delete "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              setTasks(prev => prev.filter(t => t.id !== task.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={tasks.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No Tasks Yet"
              subtitle="Create tasks to assign to your agents."
              action="Create Task"
              onAction={handleCreate}
            />
          }
        />
      )}
      <Fab onPress={handleCreate} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.red, fontSize: 15 },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  taskName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  taskDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  expectedOutput: { color: theme.textMuted, fontSize: 12, marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
});
