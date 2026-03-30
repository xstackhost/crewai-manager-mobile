import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getLLMConfigs, deleteLLMConfig, testLLMConfig } from '../api';
import theme from '../theme';
import Fab from '../components/Fab';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

const PROVIDER_COLORS = {
  openai: theme.green,
  anthropic: '#d4763b',
  google: theme.blue,
  groq: theme.yellow,
  ollama: '#6ee7b7',
  custom: theme.primary,
};

function LLMCard({ config, onPress, onLongPress, onTest }) {
  const [testing, setTesting] = useState(false);
  const providerColor = PROVIDER_COLORS[config.provider] || theme.textSub;

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testLLMConfig(config.id);
      if (result.ok) {
        Alert.alert('Test Passed', `Response: ${result.response?.slice(0, 200) || 'OK'}`);
      } else {
        Alert.alert('Test Failed', result.error || 'Unknown error');
      }
    } catch (e) {
      Alert.alert('Test Error', e.response?.data?.detail || 'Connection failed');
    } finally {
      setTesting(false);
    }
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <Text style={s.configName}>{config.name}</Text>
        <Badge label={config.provider || 'unknown'} color={providerColor} />
      </View>
      <Text style={s.model}>{config.model}</Text>
      <View style={s.footer}>
        {config.temperature != null ? (
          <Text style={s.temp}>temp: {config.temperature}</Text>
        ) : null}
        {config.max_tokens ? (
          <Text style={s.temp}>max_tokens: {config.max_tokens}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={[s.testBtn, testing && s.testBtnDisabled]} onPress={handleTest} disabled={testing}>
        {testing ? (
          <ActivityIndicator color={theme.blue} size="small" />
        ) : (
          <Text style={s.testBtnText}>🧪 Test</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function LLMList() {
  const navigation = useNavigation();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      const data = await getLLMConfigs();
      setConfigs(data);
    } catch (e) {
      setError('Failed to load LLM configs');
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
    navigation.navigate('LLMForm');
  }

  function handleEdit(config) {
    navigation.navigate('LLMForm', { config });
  }

  function handleLongPress(config) {
    Alert.alert(
      'Delete LLM Config',
      `Delete "${config.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLLMConfig(config.id);
              setConfigs(prev => prev.filter(c => c.id !== config.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete config.');
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
          data={configs}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <LLMCard
              config={item}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={configs.length === 0 ? s.emptyContainer : s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="🧠"
              title="No LLM Configs"
              subtitle="Configure language models to power your agents."
              action="Add LLM Config"
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
    marginBottom: 6,
    gap: 8,
  },
  configName: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  model: { color: theme.textSub, fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  temp: { color: theme.textMuted, fontSize: 12 },
  testBtn: {
    borderWidth: 1,
    borderColor: theme.blue,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  testBtnDisabled: { opacity: 0.5 },
  testBtnText: { color: theme.blue, fontWeight: '600', fontSize: 13 },
});
