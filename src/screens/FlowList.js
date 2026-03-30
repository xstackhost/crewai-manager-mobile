import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getFlows, deleteFlow } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function FlowCard({ flow, onPress, onLongPress, onRun }) {
  const stepCount = flow.steps?.length || 0;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.flowName}>{flow.name}</Text>
        <Badge label={`${stepCount} steps`} color={theme.blue} />
      </View>
      {flow.description ? (
        <Text style={s.flowDesc} numberOfLines={2}>{flow.description}</Text>
      ) : null}
      <TouchableOpacity style={s.runBtn} onPress={onRun}>
        <Text style={s.runBtnText}>▶ Run</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FlowList() {
  const navigation = useNavigation();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getFlows();
      setFlows(data);
    } catch (e) {
      setError('Failed to load flows');
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
    navigation.navigate('FlowForm');
  }

  function handleEdit(flow) {
    navigation.navigate('FlowForm', { flow });
  }

  function handleRun(flow) {
    navigation.navigate('RunExecution', { type: 'flow', id: flow.id, name: flow.name });
  }

  function handleLongPress(flow) {
    Alert.alert(
      'Delete Flow',
      `Delete "${flow.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFlow(flow.id);
              setFlows(prev => prev.filter(f => f.id !== flow.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete flow.');
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
          data={flows}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <FlowCard
              flow={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
              onRun={() => handleRun(item)}
            />
          )}
          contentContainerStyle={flows.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🔄"
              title="No Flows Yet"
              subtitle="Create flows to orchestrate complex AI pipelines."
              action="Create Flow"
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
  flowName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  flowDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  runBtn: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
