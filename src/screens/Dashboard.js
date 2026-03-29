import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { fetchDashboard, clearAuth, getUser } from '../api';

function StatCard({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ExecRow({ exec }) {
  const statusColors = { completed: '#10b981', failed: '#ef4444', running: '#3b82f6', pending: '#6b7280' };
  const color = statusColors[exec.status] || '#6b7280';
  return (
    <View style={s.execRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.execName}>{exec.target_name || `#${exec.id}`}</Text>
        <Text style={s.execTime}>{exec.started_at?.slice(0, 16).replace('T', ' ')}</Text>
      </View>
      <View style={[s.execBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <Text style={[s.execBadgeText, { color }]}>{exec.status}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen({ onLogout }) {
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

  if (!data) {
    return (
      <View style={s.centered}>
        {error
          ? <Text style={s.errorText}>{error}</Text>
          : <ActivityIndicator color="#7c3aed" size="large" />
        }
      </View>
    );
  }

  const recentExecs = (data.executions || []).slice(0, 5);

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />}
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
        <StatCard label="Agents" value={data.agents?.length || 0} color="#7c3aed" />
        <StatCard label="Crews" value={data.crews?.length || 0} color="#3b82f6" />
        <StatCard label="Executions" value={data.executions?.length || 0} color="#10b981" />
        <StatCard label="Running" value={data.executions?.filter(e => e.status === 'running').length || 0} color="#f59e0b" />
      </View>

      {/* Recent executions */}
      <Text style={s.sectionTitle}>Recent Executions</Text>
      <View style={s.card}>
        {recentExecs.length === 0
          ? <Text style={s.emptyText}>No executions yet</Text>
          : recentExecs.map(e => <ExecRow key={e.id} exec={e} />)
        }
      </View>

      {/* Quick nav */}
      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.quickGrid}>
        {['Agents', 'Crews', 'Tasks', 'Executions'].map(item => (
          <TouchableOpacity key={item} style={s.quickBtn}>
            <Text style={s.quickBtnText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  errorText: { color: '#ef4444', fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#9ca3af', fontSize: 13 },
  sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  statCard: { backgroundColor: '#111827', borderRadius: 12, padding: 16, flex: 1, minWidth: '44%', borderLeftWidth: 3, borderWidth: 1, borderColor: '#1f2937' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  card: { marginHorizontal: 20, backgroundColor: '#111827', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' },
  execRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  execName: { color: '#e5e7eb', fontSize: 14, fontWeight: '500' },
  execTime: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  execBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  execBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyText: { color: '#6b7280', padding: 20, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingBottom: 32 },
  quickBtn: { backgroundColor: '#111827', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 20, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  quickBtnText: { color: '#d1d5db', fontWeight: '600' },
});
