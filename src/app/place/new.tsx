import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { DistrictPicker } from '@/components/district-picker';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/category-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/constants/categories';
import { getVisitPosition } from '@/hooks/use-location';
import { useHasRole } from '@/hooks/use-role';
import { useColors } from '@/hooks/use-theme';
import { REQUIRED_ON_SITE_REVIEWS } from '@/lib/places';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { cn, noWebOutline } from '@/lib/utils';
import type { CategorySlug, Coordinates } from '@/types';

type PositionState = { status: 'locating' } | { status: 'found'; coords: Coordinates } | { status: 'unavailable' };

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  optional,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  optional?: boolean;
}) {
  const colors = useColors();

  return (
    <View className="mt-5">
      <Text className="text-sm font-semibold text-ink dark:text-white">
        {label}
        {optional && <Text className="font-normal text-ink-500 dark:text-ink-300"> (facultatif)</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType ?? 'default'}
        className="mt-2 h-14 rounded-card border border-ink-100 focus:border-brand-500 px-4 text-base text-ink dark:border-white/10 dark:text-white"
      style={noWebOutline}
      />
    </View>
  );
}

export default function NewPlaceScreen() {
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const user = useSession();
  const isAdmin = useHasRole('admin');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<PositionState>({ status: 'locating' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On propose un lieu depuis place : la position du téléphone devient celle du lieu.
  const fetchPosition = useCallback(
    () =>
      getVisitPosition().then((coords) =>
        setPosition(coords ? { status: 'found', coords } : { status: 'unavailable' })
      ),
    []
  );

  // L'état initial est déjà « localisation en cours » : l'effet ne fait que lancer la recherche.
  useEffect(() => {
    if (user) fetchPosition();
  }, [user, fetchPosition]);

  function retryLocate() {
    setPosition({ status: 'locating' });
    fetchPosition();
  }

  const canSubmit =
    name.trim().length > 1 && category !== null && district !== null && position.status !== 'locating';

  async function submit() {
    if (!category || !district) return;
    const coords = position.status === 'found' ? position.coords : null;

    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: name.trim(),
        category_slug: category,
        subcategory,
        district,
        address: address.trim() || null,
        phone: phone.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        // Un admin publie directement ; sans position, même un admin doit repasser.
        status: isAdmin && coords ? 'published' : 'pending',
      })
      .select('id')
      .single();
    setBusy(false);

    if (error || !data) {
      setError("Le lieu n'a pas pu être enregistré. Vérifiez votre connexion et réessayez.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['places'] });
    // Son avis compte dès maintenant pour confirmer le lieu.
    router.replace(`/review/new?placeId=${data.id}`);
  }

  if (!user) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="person-circle-outline"
          title="Connectez-vous pour ajouter un lieu"
          description="Un compte permet de proposer des lieux et de publier des avis."
          actionLabel="Se connecter"
          onAction={() => router.push('/auth/sign-in')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface dark:bg-surface-dark"
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}>
        <Text className="text-sm leading-5 text-ink-500 dark:text-ink-300">
          {isAdmin
            ? 'Ajoutez un lieu absent du catalogue. En tant qu\'administrateur, il est publié directement.'
            : `Ajoutez un lieu absent du catalogue. Il apparaîtra « à confirmer » jusqu'à ce que ${REQUIRED_ON_SITE_REVIEWS} personnes l'aient noté sur place, vous compris.`}
        </Text>

        {/* Position : c'est elle qui permet de vérifier les avis donnés sur place. */}
        <View className="mt-5 flex-row items-center gap-3 rounded-card bg-ink-50 p-4 dark:bg-white/5">
          <Ionicons
            name={position.status === 'found' ? 'location' : 'location-outline'}
            size={20}
            color={position.status === 'found' ? colors.brand : colors.textMuted}
          />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-ink dark:text-white">
              {position.status === 'locating'
                ? 'Localisation en cours…'
                : position.status === 'found'
                  ? 'Position du lieu enregistrée'
                  : 'Position indisponible'}
            </Text>
            <Text className="mt-0.5 text-xs leading-4 text-ink-500 dark:text-ink-300">
              {position.status === 'unavailable'
                ? 'Le lieu sera vérifié par un administrateur avant d\'être publié. Activez la localisation pour qu\'il soit confirmé par les avis.'
                : 'Proposez le lieu depuis place : la position de votre téléphone devient celle du lieu.'}
            </Text>
          </View>
          {position.status === 'unavailable' && (
            <Pressable onPress={retryLocate} accessibilityRole="button" hitSlop={8} className="active:opacity-60">
              <Text className="text-sm font-semibold text-brand-500">Réessayer</Text>
            </Pressable>
          )}
        </View>

        <Field label="Nom du lieu" value={name} onChangeText={setName} placeholder="Ex. Garage Mamy Auto" />

        <Text className="mt-6 text-sm font-semibold text-ink dark:text-white">Catégorie</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <Chip
              key={item.slug}
              label={item.nameFr}
              icon={item.icon}
              selected={category === item.slug}
              onPress={() => {
                setCategory(item.slug);
                setSubcategory(null);
              }}
            />
          ))}
        </View>

        {category && (
          <>
            <Text className="mt-6 text-sm font-semibold text-ink dark:text-white">Type</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {CATEGORY_BY_SLUG[category].subcategories.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={subcategory === item}
                  onPress={() => setSubcategory(item)}
                />
              ))}
            </View>
          </>
        )}

        <Text className="mt-6 text-sm font-semibold text-ink dark:text-white">Quartier</Text>
        <View className="mt-2 flex-row">
          <DistrictPicker
            value={district}
            onChange={setDistrict}
            placeholder="Choisir un quartier"
          />
        </View>

        <Field
          label="Adresse"
          value={address}
          onChangeText={setAddress}
          placeholder="Rue, lot, point de repère"
          optional
        />
        <Field
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+261 34 00 000 00"
          keyboardType="phone-pad"
          optional
        />

        <Button
          label={isAdmin ? 'Publier ce lieu' : 'Proposer ce lieu'}
          fullWidth
          loading={busy}
          disabled={!canSubmit}
          className={cn('mt-8')}
          onPress={submit}
        />
        {error && (
          <Text className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
