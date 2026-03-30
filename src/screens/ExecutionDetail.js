import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Animated,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getExecution } from '../api';
import theme from '../theme';
import Badge from '../components/Badge';

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

function RunningBadge({ status }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const color = STATUS_COLORS[status] || theme.textMuted;

  return (
    <Animated.View style={{ opacity: status === 'running' ? pulseAnim : 1 }}>
      <Badge label={status} color={color} />
    </Animated.View>
  );
}

export default function ExecutionDetail() {
  const route = useRoute();
  const { executionId } = route.params;
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  async function fetchData() {
    try {
      const data = await getExecution(executionId);
      setExecution(data);
      setError(null);
      if (data.status !== 'pending' && data.status !== 'running') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (e) {
      setError('Failed to load execution.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 2000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [executionId]);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (error || !execution) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error || 'Execution not found.'}</Text>
      </View>
    );
  }

  const duration = formatDuration(execution.started_at, execution.finished_at);
  const isActive = execution.status === 'pending' || execution.status === 'running';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.execName}>{execution.target_name || `Execution #${execution.id}`}</Text>
          <Text style={s.execType}>{execution.target_type}</Text>
        </View>
        <RunningBadge status={execution.status} />
      </View>

      {/* Meta info */}
      <View style={s.metaCard}>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Started</Text>
          <Text style={s.metaValue}>{execution.started_at?.replace('T', ' ').slice(0, 19) || '—'}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Finished</Text>
          <Text style={s.metaValue}>{execution.finished_at?.replace('T', ' ').slice(0, 19) || '—'}</Text>
        </View>
        {duration && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Duration</Text>
            <Text style={s.metaValue}>{duration}</Text>
          </View>
        )}
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>ID</Text>
          <Text style={s.metaValue}>#{execution.id}</Text>
        </View>
      </View>

      {/* Active indicator */}
      {isActive && (
        <View style={s.activeRow}>
          <ActivityIndicator color={theme.blue} size="small" />
          <Text style={s.activeText}>
            {execution.status === 'running' ? 'Execution in progress...' : 'Waiting to start...'}
          </Text>
        </View>
      )}

      {/* Output log */}
      {execution.output_log ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Output Log</Text>
          <View style={s.terminalBox}>
            <ScrollView horizontal={false} showsVerticalScrollIndicator>
              <Text style={s.terminalText}>{execution.output_log}</Text>
            </ScrollView>
          </View>
        </View>
      ) : null}

      {/* Final output */}
      {execution.final_output ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Final Output</Text>
          <View style={s.outputBox}>
            <Text style={s.outputText}>{execution.final_output}</Text>
          </View>
        </View>
      ) : null}

      {/* Error */}
      {execution.error_message ? (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Error</Text>
          <View style={s.errorBox}>
            <Text style={s.errorBoxText}>{execution.error_message}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  errorText: { color: theme.red, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  headerLeft: { flex: 1 },
  execName: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 4 },
  execType: { color: theme.textSub, fontSize: 13, textTransform: 'capitalize' },
  metaCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  metaLabel: { color: theme.textSub, fontSize: 13 },
  metaValue: { color: theme.text, fontSize: 13, fontWeight: '500' },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.blue + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.blue + '40',
  },
  activeText: { color: theme.blue, fontSize: 14, fontWeight: '500' },
  section: { marginBottom: 16 },
  sectionTitle: {
    color: theme.textSub,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  terminalBox: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 14,
    maxHeight: 300,
  },
  terminalText: {
    color: '#c9d1d9',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  outputBox: {
    backgroundColor: theme.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.green + '40',
    padding: 14,
  },
  outputText: { color: theme.text, fontSize: 14, lineHeight: 22 },
  errorBox: {
    backgroundColor: theme.red + '10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.red + '40',
    padding: 14,
  },
  errorBoxText: { color: theme.red, fontSize: 14, lineHeight: 20 },
});
