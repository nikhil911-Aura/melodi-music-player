import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import MiniPlayer from '../components/MiniPlayer';
import { Colors, BorderRadius } from '../utils/theme';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AudioController() {
  useAudioPlayer();
  return null;
}

function TabBarWithMiniPlayer({ state, descriptors, navigation }: any) {
  const { queue, currentIndex } = usePlayerStore();
  const hasSong = queue[currentIndex] != null;

  return (
    <View style={styles.tabBarWrapper}>
      {hasSong && (
        <MiniPlayer onPress={() => navigation.navigate('Player')} />
      )}
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const iconName = (focused: boolean): keyof typeof Ionicons.glyphMap => {
            switch (route.name) {
              case 'Home': return focused ? 'home' : 'home-outline';
              case 'Favorites': return focused ? 'heart' : 'heart-outline';
              case 'Playlists': return focused ? 'list' : 'list-outline';
              case 'Downloads': return focused ? 'download' : 'download-outline';
              case 'Settings': return focused ? 'settings' : 'settings-outline';
              default: return 'ellipse';
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <View style={[styles.tabButton, isFocused && styles.tabButtonActive]}>
                <Ionicons
                  name={iconName(isFocused)}
                  size={22}
                  color={isFocused ? Colors.primary : Colors.textMuted}
                  onPress={() => navigation.navigate(route.name)}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarWithMiniPlayer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AudioController />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            cardStyle: { backgroundColor: Colors.background },
            cardOverlayEnabled: true,
            gestureEnabled: true,
            gestureDirection: 'vertical',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
tabBar: {
  flexDirection: 'row',
  paddingTop: 8,
  paddingHorizontal: 16,
  paddingBottom: 34,
  backgroundColor: Colors.background,
},
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
});