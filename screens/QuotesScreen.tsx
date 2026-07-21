// screens/QuotesScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,TextInput,
  TouchableOpacity,
  SectionList,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import {
  getQuotesGroupedByCategory,
  getQuoteCategories,
  addQuoteCategory,
  updateQuoteCategory,
  deleteQuoteCategory,
  addQuote,
  updateQuote,
  deleteQuote,
} from '../lib/storage';
import { Quote, QuoteCategory } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function QuotesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [sections, setSections] = useState<{ title: string; data: Quote[] }[]>([]);
  const [categories, setCategories] = useState<QuoteCategory[]>([]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const load = useCallback(async () => {
    setSections(await getQuotesGroupedByCategory());
    setCategories(await getQuoteCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditingId(null);
    setAuthor('');
    setText('');
    setNotes('');
    setCategoryId(null);
    setShowEditor(true);
  };

  const openExisting = (quote: Quote) => {
    setEditingId(quote.id);
    setAuthor(quote.author);
    setText(quote.text);
    setNotes(quote.notes);
    setCategoryId(quote.categoryId);
    setShowEditor(true);
  };

  const handleMenu = () => {
    Alert.alert('Quote Base', undefined, [
      { text: 'Add Quote', onPress: openNew },
      { text: 'Add Category', onPress: () => setShowCategoryModal(true) },
      { text: 'Edit Category', onPress: handleEditCategoryMenu },
      { text: 'Delete Category', onPress: handleDeleteCategoryMenu, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleEditCategoryMenu = () => {
    if (categories.length === 0) {
      Alert.alert('No categories yet', 'Add a category first.');
      return;
    }
    Alert.alert(
      'Edit Category',
      undefined,
      [
        ...categories.map((c) => ({
          text: c.name,
          onPress: () => {
            setRenamingCategoryId(c.id);
            setRenameText(c.name);
            setShowRenameModal(true);
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleDeleteCategoryMenu = () => {
    if (categories.length === 0) {
      Alert.alert('No categories yet', 'Nothing to delete.');
      return;
    }
    Alert.alert(
      'Delete Category',
      'Quotes in that category will become Uncategorized.',
      [
        ...categories.map((c) => ({
          text: c.name,
          style: 'destructive' as const,
          onPress: () => confirmDeleteCategory(c.id, c.name),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const confirmDeleteCategory = (id: string, name: string) => {
    Alert.alert(`Delete "${name}"?`, undefined, [
      {
        text: 'Delete Category',
        style: 'destructive',
        onPress: async () => {
          await deleteQuoteCategory(id);
          load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveRename = async () => {
    const trimmed = renameText.trim();
    if (!trimmed || !renamingCategoryId) return;
    await updateQuoteCategory(renamingCategoryId, trimmed);
    setShowRenameModal(false);
    load();
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    await addQuoteCategory(trimmed);
    setNewCategoryName('');
    setShowCategoryModal(false);
    load();
  };

  const handleSave = async () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const payload = { author: author.trim(), text: trimmedText, notes, categoryId };
    if (editingId) {
      await updateQuote(editingId, payload);
    } else {
      await addQuote(payload);
    }
    setShowEditor(false);
    load();
  };

  const handleDeleteMenu = () => {
    Alert.alert('Delete this quote?', undefined, [
      {
        text: 'Delete Quote',
        style: 'destructive',
        onPress: async () => {
          if (editingId) {
            await deleteQuote(editingId);
            setShowEditor(false);
            load();
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.back}>‹ Home Base</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          Quote Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openExisting(item)}>
            <Text style={styles.quoteText} numberOfLines={3}>
              {item.text}
            </Text>
            {item.author ? <Text style={styles.author}>— {item.author}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Tap ••• to add your first quote.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Quote editor */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>{editingId ? 'Edit Quote' : 'New Quote'}</Text>
            <View style={styles.editorActions}>
              {editingId && (
                <TouchableOpacity onPress={handleDeleteMenu} style={{ marginRight: 16 }}>
                  <Text style={styles.menuDots}>•••</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave} disabled={!text.trim()}>
                <Text style={[styles.saveButton, !text.trim() && styles.disabled]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={[styles.form, { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Author / Publication (optional)</Text>
            <TextInput placeholderTextColor={theme.colors.textMuted} style={styles.input} placeholder="Author or source" value={author} onChangeText={setAuthor} />

            <Text style={styles.fieldLabel}>Quote</Text>
            <TextInput
            placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.multilineInput]}
              placeholder="The quote itself"
              value={text}
              onChangeText={setText}
              multiline
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
            placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.multilineInput]}
              placeholder="Any notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, categoryId === null && styles.chipActive]}
                onPress={() => setCategoryId(null)}
              >
                <Text style={[styles.chipText, categoryId === null && styles.chipTextActive]}>None</Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, categoryId === c.id && styles.chipActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* New category modal */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>New Category</Text>
            <TouchableOpacity onPress={handleSaveCategory}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <TextInput
            placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              placeholder="Category name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Rename category modal */}
      <Modal visible={showRenameModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowRenameModal(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>Rename Category</Text>
            <TouchableOpacity onPress={handleSaveRename}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <TextInput
            placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              placeholder="Category name"
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  back: { color: c.accent, fontSize: 16, fontFamily: REGULAR },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  headerSide: { minWidth: 50, flexShrink: 0 },
  menuDots: { fontSize: 18, color: c.accent, letterSpacing: 1 },
  sectionHeader: {
    fontSize: 13,
    fontFamily: REGULAR,
    color: c.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: c.background,
  },
  row: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  quoteText: { fontSize: 16, fontFamily: 'PlayfairDisplay_400Regular_Italic' },
  author: { fontSize: 13, color: c.textSecondary, marginTop: 4, fontFamily: REGULAR },
  empty: { padding: 20, textAlign: 'center', color: c.textMuted, fontFamily: REGULAR },
  editorContainer: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 60 : 24 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  editorTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700' },
  editorActions: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { color: c.accent, fontSize: 16, fontFamily: REGULAR },
  disabled: { opacity: 0.3 },
  form: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 13, color: c.textMuted, marginTop: 16, marginBottom: 6, fontFamily: REGULAR },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, fontSize: 16, fontFamily: REGULAR, color: c.text },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: c.surface },
  chipActive: { backgroundColor: c.accent },
  chipText: { fontSize: 14, color: c.text, fontFamily: REGULAR },
  chipTextActive: { color: c.accentText },
});
