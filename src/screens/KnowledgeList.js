import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getKnowledge, deleteKnowledge } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function KnowledgeCard({ item, onPress, onLongPress }) {
  const typeColor = item.source_type === 'url' ? theme.blue : theme.green;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.itemName}>{item.name}</Text>
        <Badge label={item.source_type || 'text'} color={typeColor} />
      </View>
      {item.source_type === 'url' && item.url ? (
        <Text style={s.url} numberOfLines={1}>{item.url}</Text>
      ) : null}
      {item.chunk_size ? (
        <Text style={s.meta}>Chunk size: {item.chunk_size} · Overlap: {item.chunk_overlap || 0}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function KnowledgeList() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getKnowledge();
      setItems(data);
    } catch (e) {
      setError('Failed to load knowledge sources');
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
    navigation.navigate('KnowledgeForm');
  }

  function handleView(item) {
    const preview = item.raw_text
      ? item.raw_text.slice(0, 300) + (item.raw_text.length > 300 ? '...' : '')
      : item.url || 'No content';
    Alert.alert(item.name, preview);
  }

  function handleLongPress(item) {
    Alert.alert(
      'Delete Knowledge',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteKnowledge(item.id);
              setItems(prev => prev.filter(k => k.id !== item.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete knowledge source.');
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
          data={items}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <KnowledgeCard
              item={item}
              onPress={() => handleView(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={items.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="📚"
              title="No Knowledge Sources"
              subtitle="Add text or URL sources for your agents to reference."
              action="Add Source"
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
  itemName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  url: { color: theme.blue, fontSize: 13, marginBottom: 6 },
  meta: { color: theme.textMuted, fontSize: 12 },
});
