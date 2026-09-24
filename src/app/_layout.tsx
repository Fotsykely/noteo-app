import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { navigationTheme } from '@/constants/theme';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = isDark ? navigationTheme.dark : navigationTheme.light;

  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, ...colors } }}>
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: 'minimal',
          headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen
          name="review/new"
          options={{ presentation: 'modal', title: 'Donner mon avis' }}
        />
        <Stack.Screen
          name="place/new"
          options={{ presentation: 'modal', title: 'Ajouter un lieu' }}
        />
        <Stack.Screen name="auth/sign-in" options={{ presentation: 'modal', title: 'Connexion' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
