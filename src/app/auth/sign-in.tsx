import type { AuthError } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-theme';
import { refreshSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { cn, noWebOutline } from '@/lib/utils';

type Step = 'email' | 'code' | 'name';

/** Supabase n'autorise qu'un envoi de code par minute et par adresse. */
const RESEND_DELAY_S = 60;

const INPUT =
  'h-14 rounded-card border border-ink-100 px-4 text-base text-ink focus:border-brand-500 dark:border-white/10 dark:text-white';

function errorMessage(error: AuthError): string {
  switch (error.code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Trop de demandes. Patientez une minute avant de réessayer.';
    case 'otp_expired':
      return 'Code incorrect ou expiré. Vérifiez-le ou demandez-en un nouveau.';
    case 'email_address_invalid':
      return 'Cette adresse e-mail ne semble pas valide.';
    default:
      return 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
  }
}

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const trimmedEmail = email.trim().toLowerCase();

  async function sendCode() {
    setBusy(true);
    setError(null);
    // Crée le compte à la première connexion : pas de distinction inscription / connexion.
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    setCode('');
    setStep('code');
    setCooldown(RESEND_DELAY_S);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: code.trim(),
      type: 'email',
    });
    if (error || !data.user) {
      setBusy(false);
      return setError(error ? errorMessage(error) : 'Connexion impossible, réessayez.');
    }

    // Première connexion par e-mail : aucun nom connu, le profil porte un nom
    // provisoire. On demande un vrai nom, affiché sous les avis.
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', data.user.id)
      .maybeSingle();
    setBusy(false);

    const provisionalNames = ['Membre Noteo', trimmedEmail.split('@')[0]];
    const provisional = !profile || provisionalNames.includes(profile.display_name);
    if (provisional && !data.user.user_metadata?.full_name) {
      setStep('name');
      return;
    }
    router.back();
  }

  async function saveName() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return router.back();

    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() })
      .eq('id', data.user.id);
    setBusy(false);
    if (error) return setError("Ce nom n'a pas pu être enregistré. Réessayez.");
    await refreshSession();
    router.back();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}>
        {step === 'email' && (
          <>
            <Text className="text-2xl font-bold text-ink dark:text-white">
              Connexion ou inscription
            </Text>
            <Text className="mt-1.5 text-sm leading-5 text-ink-500 dark:text-ink-300">
              Nouveau ? Votre compte est créé automatiquement. Un compte n&apos;est nécessaire que
              pour publier un avis ; la consultation reste libre. Nous vous envoyons un code par
              e-mail : pas de mot de passe à retenir.
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Adresse e-mail"
              placeholderTextColor={colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              returnKeyType="send"
              onSubmitEditing={() => trimmedEmail.includes('@') && sendCode()}
              className={cn('mt-7', INPUT)}
              style={noWebOutline}
            />
            <Button
              label="Recevoir un code"
              fullWidth
              loading={busy}
              disabled={!/^\S+@\S+\.\S+$/.test(trimmedEmail)}
              className="mt-5"
              onPress={sendCode}
            />
          </>
        )}

        {step === 'code' && (
          <>
            <Text className="text-2xl font-bold text-ink dark:text-white">Vérifiez vos e-mails</Text>
            <Text className="mt-1.5 text-sm leading-5 text-ink-500 dark:text-ink-300">
              Saisissez le code envoyé à{' '}
              <Text className="font-semibold text-ink dark:text-white">{trimmedEmail}</Text>. Pensez
              à regarder dans les courriers indésirables.
            </Text>

            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              placeholder="Code à 6 chiffres"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={8}
              autoFocus
              className={cn('mt-7 text-center tracking-[6px]', INPUT)}
              style={noWebOutline}
            />
            <Button
              label="Se connecter"
              fullWidth
              loading={busy}
              disabled={code.length < 6}
              className="mt-5"
              onPress={verifyCode}
            />

            <View className="mt-5 flex-row justify-center gap-6">
              <Pressable
                onPress={() => setStep('email')}
                accessibilityRole="button"
                className="active:opacity-60">
                <Text className="text-sm text-ink-500 dark:text-ink-300">Changer d&apos;adresse</Text>
              </Pressable>
              <Pressable
                onPress={sendCode}
                disabled={cooldown > 0 || busy}
                accessibilityRole="button"
                className="active:opacity-60">
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    cooldown > 0 ? 'text-ink-300 dark:text-ink-500' : 'text-brand-500'
                  )}>
                  {cooldown > 0 ? `Renvoyer (${cooldown} s)` : 'Renvoyer le code'}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'name' && (
          <>
            <Text className="text-2xl font-bold text-ink dark:text-white">
              Comment vous appeler ?
            </Text>
            <Text className="mt-1.5 text-sm leading-5 text-ink-500 dark:text-ink-300">
              Ce nom apparaîtra sous vos avis. Un prénom et l&apos;initiale du nom suffisent, par
              exemple « Miora R. ».
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="words"
              autoComplete="name"
              maxLength={60}
              autoFocus
              className={cn('mt-7', INPUT)}
              style={noWebOutline}
            />
            <Button
              label="Continuer"
              fullWidth
              loading={busy}
              disabled={name.trim().length < 2}
              className="mt-5"
              onPress={saveName}
            />
          </>
        )}

        {error && (
          <Text className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
