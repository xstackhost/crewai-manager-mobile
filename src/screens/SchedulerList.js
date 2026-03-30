import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, Switch,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getSchedulerJobs, deleteSchedulerJob, updateSchedulerJob } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function formatNextRun(nextRunAt) {
  if (!nextRunAt) return null;
  return nextRunAt.replace('T', ' ').slice(0, 16);
}

function JobCard({ job, onPress, onLongPress, onToggleEnabled }) {
  const [toggling, setToggling] = useState(false);
  const targetColor = job.target_type === 'crew' ? theme.primary : theme.blue;

  async function handleToggle(val) {
    setToggling(true);
    try {
      await onToggleEnabled(job.id, val);
    } finally {
      setToggling(false);
    }
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.jobName}>{job.name}</Text>
        {toggling ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Switch
            value={job.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: theme.borderLight, true: theme.primary + '80' }}
            thumbColor={job.enabled ? theme.primary : '#9ca3af'}
            ios_backgroundColor={theme.borderLight}
          />
        )}
      </View>
      <View style={s.metaRow}>
        <Badge label={job.target_type || 'crew'} color={targetColor} />
        <Text style={s.cron}>{job.cron_expression}</Text>
      </View>
      {job.next_run_at ? (
        <Text style={s.nextRun}>Next: {formatNextRun(job.next_run_at)}</Text>
      ) : null}
      {job.last_run_at ? (
        <Text style={s.lastRun}>Last: {formatNextRun(job.last_run_at)} · {job.last_status || 'unknown'}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SchedulerList() {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getSchedulerJobs();
      setJobs(data);
    } catch (e) {
      setError('Failed to load scheduled jobs');
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

  async function handleToggleEnabled(id, enabled) {
    try {
      const updated = await updateSchedulerJob(id, { enabled });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: updated.enabled } : j));
    } catch (e) {
      Alert.alert('Error', 'Failed to update job.');
    }
  }

  function handleCreate() {
    navigation.navigate('SchedulerForm');
  }

  function handleEdit(job) {
    navigation.navigate('SchedulerForm', { job });
  }

  function handleLongPress(job) {
    Alert.alert(
      'Delete Job',
      `Delete "${job.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSchedulerJob(job.id);
              setJobs(prev => prev.filter(j => j.id !== job.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete job.');
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
          data={jobs}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
              onToggleEnabled={handleToggleEnabled}
            />
          )}
          contentContainerStyle={jobs.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="⏰"
              title="No Scheduled Jobs"
              subtitle="Schedule crews and flows to run automatically."
              action="Create Job"
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
    marginBottom: 10,
  },
  jobName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cron: { color: theme.textSub, fontSize: 13, fontFamily: 'monospace' },
  nextRun: { color: theme.textMuted, fontSize: 12, marginBottom: 2 },
  lastRun: { color: theme.textMuted, fontSize: 12 },
});
