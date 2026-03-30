import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import theme from '../theme';

export default function PickerModal({
  visible,
  title,
  items = [],
  selected,
  multiple = false,
  onSelect,
  onClose,
}) {
  const [localSelected, setLocalSelected] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      if (multiple) {
        setLocalSelected(Array.isArray(selected) ? selected : selected ? [selected] : []);
      }
      setSearch('');
    }
  }, [visible, selected, multiple]);

  const filteredItems = search
    ? items.filter(item => {
        const label = item.name || item.label || '';
        return label.toLowerCase().includes(search.toLowerCase());
      })
    : items;

  function handleSingleSelect(id) {
    onSelect(id);
    onClose();
  }

  function handleMultiToggle(id) {
    setLocalSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleDone() {
    onSelect(localSelected);
    onClose();
  }

  function isSelected(id) {
    if (multiple) return localSelected.includes(id);
    return selected === id;
  }

  function renderItem({ item }) {
    const id = item.id;
    const label = item.name || item.label || String(id);
    const sel = isSelected(id);
    return (
      <TouchableOpacity
        style={[styles.item, sel && styles.itemSelected]}
        onPress={() => multiple ? handleMultiToggle(id) : handleSingleSelect(id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, sel && styles.itemTextSelected]}>{label}</Text>
        {sel ? <Text style={styles.check}>✓</Text> : null}
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title || 'Select'}</Text>
          {multiple ? (
            <TouchableOpacity onPress={handleDone} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done ({localSelected.length})</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.cancelBtn} />
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={theme.textMuted}
            autoCorrect={false}
          />
        </View>

        {/* None option for single select */}
        {!multiple && (
          <TouchableOpacity
            style={[styles.item, selected === null && styles.itemSelected]}
            onPress={() => handleSingleSelect(null)}
          >
            <Text style={[styles.itemText, { fontStyle: 'italic', color: theme.textSub }]}>None</Text>
            {selected === null ? <Text style={styles.check}>✓</Text> : null}
          </TouchableOpacity>
        )}

        <FlatList
          data={filteredItems}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  cancelBtn: {
    width: 80,
  },
  cancelText: {
    color: theme.textSub,
    fontSize: 16,
  },
  doneBtn: {
    width: 80,
    alignItems: 'flex-end',
  },
  doneText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchInput: {
    backgroundColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.bg,
  },
  itemSelected: {
    backgroundColor: theme.primary + '15',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  itemTextSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  check: {
    color: theme.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
    marginHorizontal: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.textSub,
    fontSize: 15,
  },
});
