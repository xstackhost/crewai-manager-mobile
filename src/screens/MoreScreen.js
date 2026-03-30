import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { clearAuth } from '../api';
import theme from '../theme';

const MENU_ITEMS = [
  { icon: '📋', title: 'Tasks', subtitle: 'Manage agent tasks', screen: 'TaskList' },
  { icon: '🔧', title: 'Tools', subtitle: 'Configure agent tools', screen: 'ToolList' },
  { icon: '🧠', title: 'LLM Configs', subtitle: 'Language model settings', screen: 'LLMList' },
  { icon: '📚', title: 'Knowledge Sources', subtitle: 'Upload text & URL sources', screen: 'KnowledgeList' },
  { icon: '⏰', title: 'Scheduler', subtitle: 'Automated job scheduling', screen: 'SchedulerList' },
];

function MenuItem({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity style={s.menuCard} onPress={onPress} activeOpacity={0.75}>
      <Text style={s.menuIcon}>{icon}</Text>
      <View style={s.menuText}>
        <Text style={s.menuTitle}>{title}</Text>
        <Text style={s.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen({ onLogout }) {
  const navigation = useNavigation();

  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            if (onLogout) onLogout();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.sectionTitle}>Management</Text>
      {MENU_ITEMS.map(item => (
        <MenuItem
          key={item.screen}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}

      <View style={s.separator} />

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutIcon}>🚪</Text>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    color: theme.textSub,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuIcon: { fontSize: 24, marginRight: 14 },
  menuText: { flex: 1 },
  menuTitle: { color: theme.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  menuSubtitle: { color: theme.textSub, fontSize: 13 },
  chevron: { color: theme.textMuted, fontSize: 20, marginLeft: 8 },
  separator: { height: 1, backgroundColor: theme.border, marginVertical: 20 },
  logoutBtn: {
    backgroundColor: theme.red + '15',
    borderWidth: 1,
    borderColor: theme.red + '40',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { color: theme.red, fontWeight: '700', fontSize: 16 },
});
