import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCrews, deleteCrew } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function CrewCard({ crew, onPress, onLongPress, onRun }) {
  const processColor = crew.process === 'hierarchical' ? theme.yellow : theme.green;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.crewName}>{crew.name}</Text>
        <Badge label={crew.process || 'sequential'} color={processColor} />
      </View>
      {crew.description ? (
        <Text style={s.crewDesc} numberOfLines={2}>{crew.description}</Text>
      ) : null}
      <View style={s.statsRow}>
        <Badge label={`${crew.agent_ids?.length || 0} agents`} color={theme.primary} />
        <Badge label={`${crew.task_ids?.length || 0} tasks`} color={theme.blue} />
        {crew.memory_enabled ? <Badge label="memory" color={theme.green} /> : null}
        {crew.planning ? <Badge label="planning" color="#a855f7" /> : null}
      </View>
      <TouchableOpacity style={s.runBtn} onPress={onRun}>
        <Text style={s.runBtnText}>▶ Run</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function CrewList() {
  const navigation = useNavigation();
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getCrews();
      setCrews(data);
    } catch (e) {
      setError('Failed to load crews');
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
    navigation.navigate('CrewForm');
  }

  function handleEdit(crew) {
    navigation.navigate('CrewForm', { crew });
  }

  function handleRun(crew) {
    navigation.navigate('RunExecution', { type: 'crew', id: crew.id, name: crew.name });
  }

  function handleLongPress(crew) {
    Alert.alert(
      'Crew Options',
      crew.name,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEdit(crew) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrew(crew.id);
              setCrews(prev => prev.filter(c => c.id !== crew.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete crew.');
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
      {/* Flows button */}
      <TouchableOpacity style={s.flowsBtn} onPress={() => navigation.navigate('FlowList')}>
        <Text style={s.flowsBtnText}>🔄 View Flows</Text>
      </TouchableOpacity>

      {error ? (
        <View style={s.centered}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={crews}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <CrewCard
              crew={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
              onRun={() => handleRun(item)}
            />
          )}
          contentContainerStyle={crews.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="⚡"
              title="No Crews Yet"
              subtitle="Assemble your first crew of AI agents."
              action="Create Crew"
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
  flowsBtn: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  flowsBtnText: { color: theme.primary, fontWeight: '600', fontSize: 14 },
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
  crewName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  crewDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  runBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
