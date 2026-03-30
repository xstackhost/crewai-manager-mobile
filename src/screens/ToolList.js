import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getTools, deleteTool } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

function ToolCard({ tool, onPress, onLongPress }) {
  const typeColor = tool.tool_type === 'builtin' ? theme.green : theme.yellow;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.toolName}>{tool.name}</Text>
        <Badge label={tool.tool_type || 'builtin'} color={typeColor} />
      </View>
      {tool.description ? (
        <Text style={s.toolDesc} numberOfLines={2}>{tool.description}</Text>
      ) : null}
      {tool.builtin_class ? (
        <Text style={s.builtinClass}>{tool.builtin_class}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function ToolList() {
  const navigation = useNavigation();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getTools();
      setTools(data);
    } catch (e) {
      setError('Failed to load tools');
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
    navigation.navigate('ToolForm');
  }

  function handleEdit(tool) {
    navigation.navigate('ToolForm', { tool });
  }

  function handleLongPress(tool) {
    Alert.alert(
      'Delete Tool',
      `Delete "${tool.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTool(tool.id);
              setTools(prev => prev.filter(t => t.id !== tool.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete tool.');
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
          data={tools}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ToolCard
              tool={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={tools.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🔧"
              title="No Tools Yet"
              subtitle="Add tools your agents can use."
              action="Create Tool"
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
  toolName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  toolDesc: { color: theme.textSub, fontSize: 13, lineHeight: 18 },
  builtinClass: { color: theme.textMuted, fontSize: 12, marginTop: 6, fontFamily: 'monospace' },
});
