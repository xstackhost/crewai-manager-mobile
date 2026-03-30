import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchDashboard, clearAuth, getUser } from '../api';
import theme from '../theme';

function StatCard({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ExecRow({ exec, onPress }) {
  const statusColors = {
    completed: theme.green,
    failed: theme.red,
    running: theme.blue,
    pending: theme.textMuted,
  };
  const color = statusColors[exec.status] || theme.textMuted;
  return (
    <TouchableOpacity style={s.execRow} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={s.execName}>{exec.target_name || `#${exec.id}`}</Text>
        <Text style={s.execTime}>{exec.started_at?.slice(0, 16).replace('T', ' ')}</Text>
      </View>
      <View style={[s.execBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[s.execBadgeText, { color }]}>{exec.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ onLogout }) {
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const [d, u] = await Promise.all([fetchDashboard(), getUser()]);
      setData(d);
      setUser(u);
    } catch (e) {
      if (e.response?.status === 401) { onLogout(); return; }
      setError('Failed to load dashboard');
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleLogout() {
    await clearAuth();
    onLogout();
  }

  function navigateToExecution(exec) {
    navigation.navigate('RunsTab', {
      screen: 'ExecutionDetail',
      params: { executionId: exec.id },
    });
  }

  if (!data) {
    return (
      <View style={s.centered}>
        {error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : (
          <ActivityIndicator color={theme.primary} size="large" />
        )}
      </View>
    );
  }

  const recentExecs = (data.executions || []).slice(0, 5);
  const runningCount = (data.executions || []).filter(e => e.status === 'running').length;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {user?.username || 'Admin'} 👋</Text>
          <Text style={s.subtitle}>CrewAI Manager</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <Text style={s.sectionTitle}>Overview</Text>
      <View style={s.statsGrid}>
        <StatCard label="Agents" value={data.agents?.length || 0} color={theme.primary} />
        <StatCard label="Crews" value={data.crews?.length || 0} color={theme.blue} />
        <StatCard label="Tools" value={data.tools?.length || 0} color={theme.yellow} />
        <StatCard label="LLM Configs" value={data.llmConfigs?.length || 0} color="#a855f7" />
        <StatCard label="Executions" value={data.executions?.length || 0} color={theme.green} />
        <StatCard label="Running" value={runningCount} color={theme.yellow} />
      </View>

      {/* Quick actions */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.quickGrid}>
        <TouchableOpacity
          style={s.quickCard}
          onPress={() => navigation.navigate('AgentsTab', { screen: 'AgentForm' })}
        >
          <Text style={s.quickIcon}>🤖</Text>
          <Text style={s.quickTitle}>New Agent</Text>
          <Text style={s.quickSub}>Create an AI agent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickCard}
          onPress={() => navigation.navigate('CrewsTab', { screen: 'CrewForm' })}
        >
          <Text style={s.quickIcon}>⚡</Text>
          <Text style={s.quickTitle}>New Crew</Text>
          <Text style={s.quickSub}>Assemble a crew</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickCard}
          onPress={() => navigation.navigate('CrewsTab', { screen: 'CrewList' })}
        >
          <Text style={s.quickIcon}>▶️</Text>
          <Text style={s.quickTitle}>Run Crew</Text>
          <Text style={s.quickSub}>Execute a crew</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.quickCard}
          onPress={() => navigation.navigate('RunsTab', { screen: 'ExecutionList' })}
        >
          <Text style={s.quickIcon}>📊</Text>
          <Text style={s.quickTitle}>View Runs</Text>
          <Text style={s.quickSub}>See all executions</Text>
        </TouchableOpacity>
      </View>

      {/* Recent executions */}
      <Text style={s.sectionTitle}>Recent Executions</Text>
      <View style={s.card}>
        {recentExecs.length === 0 ? (
          <Text style={s.emptyText}>No executions yet</Text>
        ) : (
          recentExecs.map(e => (
            <ExecRow key={e.id} exec={e} onPress={() => navigateToExecution(e)} />
          ))
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg },
  errorText: { color: theme.red, fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  logoutBtn: {
    backgroundColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { color: theme.textSub, fontSize: 13 },
  sectionTitle: {
    color: theme.textSub,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  statCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '44%',
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  statLabel: { color: theme.textSub, fontSize: 12, marginTop: 4 },
  card: {
    marginHorizontal: 20,
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  execRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  execName: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  execTime: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  execBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  execBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyText: { color: theme.textMuted, padding: 20, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  quickCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '44%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickTitle: { color: theme.text, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  quickSub: { color: theme.textSub, fontSize: 12 },
});
