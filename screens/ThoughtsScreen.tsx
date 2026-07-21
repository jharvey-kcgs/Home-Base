// screens/ThoughtsScreen.tsx

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Text from '../components/AppText';
import { useTheme, ThemeColors } from '../lib/theme';
import { useResponsive } from '../lib/responsive';
import { useFocusEffect } from '@react-navigation/native';
import { getThoughts, addThought, updateThought, deleteThought } from '../lib/storage';
import { Thought } from '../types/models';

const REGULAR = 'PlayfairDisplay_400Regular';

export default function ThoughtsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme.colors), [theme.colors]);
  const { maxContentWidth } = useResponsive();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [editing, setEditing] = useState<Thought | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showEditor, setShowEditor] = useState(false);

  const load = useCallback(async () => {
    setThoughts(await getThoughts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditing(null);
    setEditTitle('');
    setEditBody('');
    setShowEditor(true);
  };

  const openExisting = (thought: Thought) => {
    setEditing(thought);
    setEditTitle(thought.title);
    setEditBody(thought.body);
    setShowEditor(true);
  };

  const handleMenu = () => {
    Alert.alert('Thought Base', undefined, [
      { text: 'Add Thought', onPress: openNew },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const title = editTitle.trim() || 'Untitled';
    if (editing) {
      await updateThought(editing.id, title, editBody);
    } else {
      if (!editBody.trim() && !editTitle.trim()) {
        setShowEditor(false);
        return;
      }
      await addThought(title, editBody);
    }
    setShowEditor(false);
    load();
  };

  const handleDeleteMenu = () => {
    Alert.alert('Delete this thought?', undefined, [
      {
        text: 'Delete Thought',
        style: 'destructive',
        onPress: async () => {
          if (editing) {
            await deleteThought(editing.id);
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
          Thought Base
        </Text>
        <TouchableOpacity onPress={handleMenu} style={styles.headerSide} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={styles.menuDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        style={{ width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        data={thoughts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openExisting(item)}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            {item.body ? (
              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.body}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Tap ••• to jot something down.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.back}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.editorActions}>
              {editing && (
                <TouchableOpacity onPress={handleDeleteMenu} style={{ marginRight: 16 }}>
                  <Text style={styles.menuDots}>•••</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
            <TextInput
              placeholderTextColor={theme.colors.textMuted}
              style={styles.titleInput}
              placeholder="Title"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              placeholderTextColor={theme.colors.textMuted}
              style={styles.bodyInput}
              placeholder="Write your thought..."
              value={editBody}
              onChangeText={setEditBody}
              multiline
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
  row: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
  rowTitle: { fontSize: 16, fontFamily: REGULAR, fontWeight: '600' },
  rowPreview: { fontSize: 13, color: c.textMuted, marginTop: 2, fontFamily: REGULAR },
  empty: { padding: 20, textAlign: 'center', color: c.textMuted, fontFamily: REGULAR },
  editorContainer: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 60 : 24 },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  editorActions: { flexDirection: 'row', alignItems: 'center' },
  saveButton: { color: c.accent, fontSize: 16, fontFamily: REGULAR, fontWeight: '600' },
  titleInput: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', fontWeight: '700', paddingHorizontal: 16, marginBottom: 8, color: c.text },
  bodyInput: { flex: 1, fontSize: 16, fontFamily: REGULAR, paddingHorizontal: 16, textAlignVertical: 'top', color: c.text },
});
