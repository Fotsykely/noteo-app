import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-theme';
import { signIn } from '@/lib/session';
import type { IoniconName } from '@/types';

function SocialButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="h-14 flex-row items-center justify-center gap-3 rounded-pill border border-ink-200 active:bg-ink-50 dark:border-white/20 dark:active:bg-white/10">
      <Ionicons name={icon} size={20} color={color} />
      <Text className="text-base font-semibold text-ink dark:text-white">{label}</Text>
    </Pressable>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.includes('@') && password.length >= 6;

  function complete() {
    // À l'Étape 5, remplacé par supabase.auth.signInWithPassword / signUp / signInWithOAuth.
    signIn();
    router.back();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-2xl font-bold text-ink dark:text-white">
          {mode === 'signIn' ? 'Content de vous revoir' : 'Créer un compte'}
        </Text>
        <Text className="mt-1.5 text-sm leading-5 text-ink-500 dark:text-ink-300">
          Un compte n&apos;est nécessaire que pour publier un avis. La consultation reste libre.
        </Text>

        <View className="mt-7 gap-3">
          <SocialButton icon="logo-google" label="Continuer avec Google" color="#DB4437" onPress={complete} />
          <SocialButton icon="logo-facebook" label="Continuer avec Facebook" color="#1877F2" onPress={complete} />
        </View>

        <View className="my-7 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-ink-100 dark:bg-white/10" />
          <Text className="text-xs text-ink-500 dark:text-ink-300">ou par e-mail</Text>
          <View className="h-px flex-1 bg-ink-100 dark:bg-white/10" />
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Adresse e-mail"
          placeholderTextColor={colors.textFaint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          className="h-14 rounded-card border border-ink-100 px-4 text-base text-ink dark:border-white/10 dark:text-white"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe (6 caractères minimum)"
          placeholderTextColor={colors.textFaint}
          secureTextEntry
          autoCapitalize="none"
          className="mt-3 h-14 rounded-card border border-ink-100 px-4 text-base text-ink dark:border-white/10 dark:text-white"
        />

        <Button
          label={mode === 'signIn' ? 'Se connecter' : "S'inscrire"}
          fullWidth
          disabled={!canSubmit}
          className="mt-5"
          onPress={complete}
        />

        <Pressable
          onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          accessibilityRole="button"
          className="mt-5 active:opacity-60">
          <Text className="text-center text-sm text-ink-500 dark:text-ink-300">
            {mode === 'signIn' ? "Pas encore de compte ? " : 'Déjà inscrit ? '}
            <Text className="font-semibold text-brand-500">
              {mode === 'signIn' ? 'Créer un compte' : 'Se connecter'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
