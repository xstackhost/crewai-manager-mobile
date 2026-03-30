import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAgents, deleteAgent } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function AgentCard({ agent, onPress, onLongPress }) {
  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      <View style={s.cardHeader}>
        <Text style={s.agentName}>{agent.name}</Text>
        <View style={s.badges}>
          {agent.memory ? <Badge label="memory" color={theme.green} /> : null}
          {agent.allow_delegation ? <Badge label="delegate" color={theme.blue} /> : null}
        </View>
      </View>
      <Text style={s.agentRole}>{agent.role}</Text>
      {agent.goal ? (
        <Text style={s.agentGoal} numberOfLines={2}>{agent.goal}</Text>
      ) : null}
      <View style={s.footer}>
        {agent.llm_config_name ? (
          <Badge label={agent.llm_config_name} color={theme.primary} />
        ) : null}
        {agent.tool_ids?.length > 0 ? (
          <Badge label={`${agent.tool_ids.length} tools`} color={theme.yellow} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function AgentList() {
  const navigation = useNavigation();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (e) {
      setError('Failed to load agents');
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
    navigation.navigate('AgentForm');
  }

  function handleEdit(agent) {
    navigation.navigate('AgentForm', { agent });
  }

  function handleLongPress(agent) {
    Alert.alert(
      'Delete Agent',
      `Delete "${agent.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAgent(agent.id);
              setAgents(prev => prev.filter(a => a.id !== agent.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete agent.');
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
          data={agents}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <AgentCard
              agent={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={agents.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🤖"
              title="No Agents Yet"
              subtitle="Create your first AI agent to get started."
              action="Create Agent"
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  agentName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1, marginRight: 8 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  agentRole: { color: theme.textSub, fontSize: 13, marginBottom: 6 },
  agentGoal: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
});
