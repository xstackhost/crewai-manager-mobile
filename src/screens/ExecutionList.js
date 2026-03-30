import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getExecutions } from '../api';
import theme from '../theme';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

const STATUS_COLORS = {
  completed: theme.green,
  failed: theme.red,
  running: theme.blue,
  pending: theme.textMuted,
};

function formatDuration(started, finished) {
  if (!started || !finished) return null;
  const ms = new Date(finished) - new Date(started);
  if (ms < 0) return null;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function ExecCard({ exec, onPress }) {
  const color = STATUS_COLORS[exec.status] || theme.textMuted;
  const duration = formatDuration(exec.started_at, exec.finished_at);
  const typeColor = exec.target_type === 'crew' ? theme.primary : theme.blue;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.execName}>{exec.target_name || `#${exec.id}`}</Text>
        <Badge label={exec.status} color={color} />
      </View>
      <View style={s.metaRow}>
        <Badge label={exec.target_type || 'crew'} color={typeColor} />
        {exec.started_at ? (
          <Text style={s.time}>{exec.started_at.slice(0, 16).replace('T', ' ')}</Text>
        ) : null}
        {duration ? <Text style={s.duration}>{duration}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ExecutionList() {
  const navigation = useNavigation();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getExecutions();
      setExecutions(data);
    } catch (e) {
      setError('Failed to load executions');
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
          data={executions}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ExecCard
              exec={item}
              onPress={() => navigation.navigate('ExecutionDetail', { executionId: item.id })}
            />
          )}
          contentContainerStyle={executions.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="📊"
              title="No Executions Yet"
              subtitle="Run a crew or flow to see executions here."
            />
          }
        />
      )}
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
    marginBottom: 10,
    gap: 8,
  },
  execName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  time: { color: theme.textMuted, fontSize: 12 },
  duration: { color: theme.textSub, fontSize: 12, fontWeight: '600' },
});
