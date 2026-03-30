import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import theme from '../theme';

export default function Toggle({ label, value, onValueChange, hint }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.borderLight, true: theme.primary + '80' }}
          thumbColor={value ? theme.primary : '#9ca3af'}
          ios_backgroundColor={theme.borderLight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.border,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
