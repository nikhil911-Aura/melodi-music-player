import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { Colors, Spacing, BorderRadius } from '../utils/theme';

export default function SettingsScreen() {
  const { shuffleMode, repeatMode, toggleShuffle, toggleRepeat } = usePlayerStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Playback</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="shuffle" size={20} color={Colors.primary} />
            <Text style={styles.rowLabel}>Shuffle</Text>
          </View>
          <Switch
            value={shuffleMode}
            onValueChange={toggleShuffle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="repeat" size={20} color={Colors.primary} />
            <Text style={styles.rowLabel}>Repeat Mode</Text>
          </View>
          <TouchableOpacity onPress={toggleRepeat} style={styles.repeatChip}>
            <Text style={styles.repeatText}>
              {repeatMode === 'off' ? 'Off' : repeatMode === 'queue' ? 'Queue' : 'Track'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="musical-notes" size={20} color={Colors.primary} />
            <Text style={styles.rowLabel}>Mume Music Player</Text>
          </View>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.rowLeft}>
            <Ionicons name="code-slash" size={20} color={Colors.primary} />
            <Text style={styles.rowLabel}>Powered by JioSaavn API</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, color: Colors.text },
  repeatChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  repeatText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  version: { fontSize: 13, color: Colors.textMuted },
});
