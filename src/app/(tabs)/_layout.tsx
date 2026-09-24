import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';

import { useColors } from '@/hooks/use-theme';
import type { IoniconName } from '@/types';

function icon(name: IoniconName, outline: IoniconName) {
  return ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? name : outline} size={size} color={color} />
  );
}

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.select({ ios: 86, default: 64 }),
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Classements', tabBarIcon: icon('trophy', 'trophy-outline') }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: 'Noter', tabBarIcon: icon('star', 'star-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: icon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
