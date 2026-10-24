import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';

import { AppSidebar } from '@/components/app-sidebar';
import { navigationTheme } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { queryClient } from '@/lib/query-client';
import { cn } from '@/lib/utils';

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const isDesktop = useIsDesktop();
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = isDark ? navigationTheme.dark : navigationTheme.light;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={{ ...base, colors: { ...base.colors, ...colors } }}>
        {/*
          Grand écran : barre latérale permanente + panneau de contenu détaché, façon
          application de bureau. La barre vit à la racine pour rester visible sur toutes
          les pages, y compris la fiche d'un lieu et les formulaires.
          Mobile : rien de tout cela, la navigation reste la barre d'onglets du bas.
        */}
        <View className="flex-1 flex-row bg-ink-50 dark:bg-black">
          {isDesktop && <AppSidebar />}

          {/* `min-w-0` est indispensable : sans lui, un enfant de flex-row adopte en CSS la
              largeur intrinsèque de son contenu (les carrousels horizontaux) et déborde. */}
          <View
            className={cn(
              'min-w-0 flex-1 overflow-hidden',
              isDesktop && 'my-2 mr-2 rounded-2xl'
            )}>
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
              <Stack.Screen name="moderation" options={{ title: 'Modération' }} />
              <Stack.Screen
                name="auth/sign-in"
                options={{ presentation: 'modal', title: 'Connexion' }}
              />
            </Stack>
          </View>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
