import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { DistrictPicker } from '@/components/district-picker';
import { LocationSheet } from '@/components/location-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/category-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/query-state';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/constants/categories';
import { getVisitPosition } from '@/hooks/use-location';
import { usePlace } from '@/hooks/use-places';
import { useIsModerator } from '@/hooks/use-role';
import { useColors } from '@/hooks/use-theme';
import { REQUIRED_ON_SITE_REVIEWS } from '@/lib/places';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { cn, noWebOutline, showScrollbar } from '@/lib/utils';
import type { CategorySlug, Coordinates } from '@/types';
import { goBack } from '@/lib/navigation';

/**
 * La position est obligatoire : celle du téléphone (`device`) ou un repère placé sur la
 * carte (`map`). Sans elle, le lieu ne pourrait pas être vérifié par les avis sur place.
 */
type PositionState =
  | { status: 'locating' }
  | { status: 'found'; coords: Coordinates; source: 'device' | 'map' }
  | { status: 'missing' };

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
  const isModerator = useIsModerator();

  // `?id=…` : un modérateur corrige une fiche existante au lieu d'en créer une.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const { data: editedPlace, isPending: loadingPlace } = usePlace(id);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState<PositionState>({ status: 'locating' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  // On propose un lieu depuis place : la position du téléphone devient celle du lieu.
  const fetchPosition = useCallback(
    () =>
      getVisitPosition().then((coords) =>
        setPosition(coords ? { status: 'found', coords, source: 'device' } : { status: 'missing' })
      ),
    []
  );

  // L'état initial est déjà « localisation en cours » : l'effet ne fait que lancer la recherche.
  // Sans position (localisation éteinte, refusée), on ne devine rien : l'utilisateur place
  // le lieu sur la carte. En correction, la position de la fiche est conservée tant que le
  // modérateur ne la change pas : il peut corriger à distance.
  useEffect(() => {
    if (user && !editing) fetchPosition();
  }, [user, editing, fetchPosition]);

  // Préremplissage, une seule fois par fiche (ajustement pendant le rendu, sans effet).
  const [prefilledId, setPrefilledId] = useState<string | null>(null);
  if (editedPlace && prefilledId !== editedPlace.id) {
    setPrefilledId(editedPlace.id);
    setName(editedPlace.name);
    setCategory(editedPlace.categorySlug);
    setSubcategory(editedPlace.subcategory ?? null);
    setDistrict(editedPlace.district);
    setAddress(editedPlace.address ?? '');
    setPhone(editedPlace.phone ?? '');
    setPosition(
      editedPlace.lat !== null && editedPlace.lng !== null
        ? { status: 'found', coords: { lat: editedPlace.lat, lng: editedPlace.lng }, source: 'map' }
        : { status: 'missing' }
    );
  }

  function retryLocate() {
    setPosition({ status: 'locating' });
    fetchPosition();
  }

  const canSubmit =
    name.trim().length > 1 && category !== null && district !== null && position.status === 'found';

  async function submit() {
    if (!category || !district || position.status !== 'found') return;
    const coords = position.coords;

    setBusy(true);
    setError(null);

    if (editing) {
      const { error } = await supabase
        .from('places')
        .update({
          name: name.trim(),
          category_slug: category,
          subcategory,
          district,
          address: address.trim() || null,
          phone: phone.trim() || null,
          lat: coords.lat,
          lng: coords.lng,
        })
        .eq('id', id);

      // Un lieu « à confirmer » corrigé par un modérateur peut être publié sans attendre
      // ses 3 avis sur place (la base exige une position pour cela).
      const publish =
        !error && publishNow && editedPlace?.status === 'pending'
          ? await supabase.rpc('moderate_place', { p_place_id: id!, p_status: 'published' })
          : null;
      setBusy(false);

      if (error || publish?.error) {
        setError("La fiche n'a pas pu être corrigée. Vérifiez votre connexion et réessayez.");
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['places'] }),
        queryClient.invalidateQueries({ queryKey: ['place', id] }),
        queryClient.invalidateQueries({ queryKey: ['districts'] }),
        queryClient.invalidateQueries({ queryKey: ['moderation'] }),
      ]);
      goBack();
      return;
    }

    const { data, error } = await supabase
      .from('places')
      .insert({
        name: name.trim(),
        category_slug: category,
        subcategory,
        district,
        address: address.trim() || null,
        phone: phone.trim() || null,
        lat: coords.lat,
        lng: coords.lng,
        // Un modérateur (admin compris) publie directement ; les autres attendent 3 avis sur place.
        status: isModerator ? 'published' : 'pending',
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

  if (editing && user && !isModerator) {
    return (
      <View className="flex-1 bg-surface dark:bg-surface-dark">
        <EmptyState
          icon="lock-closed-outline"
          title="Réservé aux modérateurs"
          description="Pour signaler une erreur sur ce lieu, utilisez « Signaler un problème » sur sa fiche."
          actionLabel="Retour"
          onAction={() => goBack()}
        />
      </View>
    );
  }

  if (editing && user && loadingPlace) {
    return (
      <View className="flex-1 justify-center bg-surface dark:bg-surface-dark">
        <LoadingState />
      </View>
    );
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
      <Stack.Screen options={{ title: editing ? 'Corriger la fiche' : 'Ajouter un lieu' }} />
      <ScrollView
        showsVerticalScrollIndicator={showScrollbar}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          width: '100%',
          maxWidth: 680,
          alignSelf: 'center',
        }}>
        <Text className="text-sm leading-5 text-ink-500 dark:text-ink-300">
          {editing
            ? 'Corrigez les informations de ce lieu. Les changements sont visibles tout de suite.'
            : isModerator
            ? 'Ajoutez un lieu absent du catalogue. En tant que modérateur, il est publié directement.'
            : `Ajoutez un lieu absent du catalogue. Il apparaîtra « à confirmer » jusqu'à ce que ${REQUIRED_ON_SITE_REVIEWS} personnes l'aient noté sur place, vous compris.`}
        </Text>

        {/* Position : c'est elle qui permet de vérifier les avis donnés sur place. */}
        <View className="mt-5 rounded-card bg-ink-50 p-4 dark:bg-white/5">
          <View className="flex-row items-center gap-3">
            <Ionicons
              name={position.status === 'found' ? 'location' : 'location-outline'}
              size={20}
              color={position.status === 'found' ? colors.brand : colors.textMuted}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-ink dark:text-white">
                {position.status === 'locating'
                  ? 'Localisation en cours…'
                  : position.status === 'missing'
                    ? 'Indiquez où se trouve le lieu'
                    : editing
                      ? 'Position du lieu'
                      : position.source === 'device'
                        ? 'Position de votre téléphone'
                        : 'Repère placé sur la carte'}
              </Text>
              <Text className="mt-0.5 text-xs leading-4 text-ink-500 dark:text-ink-300">
                {position.status === 'missing'
                  ? 'Placez le lieu sur la carte, ou utilisez votre position si vous y êtes. Elle sert à vérifier les avis donnés sur place.'
                  : editing
                    ? 'Corrigez-la sur la carte si elle est inexacte.'
                    : position.status === 'found' && position.source === 'device'
                      ? 'Vous êtes sur place : la position de votre téléphone devient celle du lieu.'
                      : 'Les avis donnés sur place sont vérifiés par rapport à ce repère.'}
              </Text>
            </View>
          </View>
          {position.status !== 'locating' && (
            <View className="mt-3 flex-row gap-5 pl-8">
              <Pressable
                onPress={() => setMapOpen(true)}
                accessibilityRole="button"
                hitSlop={8}
                className="active:opacity-60">
                <Text className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                  {position.status === 'found' ? 'Modifier sur la carte' : 'Choisir sur la carte'}
                </Text>
              </Pressable>
              <Pressable
                onPress={retryLocate}
                accessibilityRole="button"
                hitSlop={8}
                className="active:opacity-60">
                <Text className="text-sm font-semibold text-brand-700 dark:text-brand-400">Ma position</Text>
              </Pressable>
            </View>
          )}
        </View>

        <LocationSheet
          visible={mapOpen}
          initial={position.status === 'found' ? position.coords : null}
          onClose={() => setMapOpen(false)}
          onConfirm={(coords) => {
            setPosition({ status: 'found', coords, source: 'map' });
            setMapOpen(false);
          }}
        />

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

        {editing && editedPlace?.status === 'pending' && position.status === 'found' && (
          <View className="mt-6 flex-row items-center justify-between gap-3 rounded-card bg-ink-50 p-4 dark:bg-white/5">
            <Text className="flex-1 text-sm leading-5 text-ink-700 dark:text-ink-200">
              Ce lieu est « à confirmer ». Le publier tout de suite, sans attendre les avis sur place ?
            </Text>
            <Chip
              label={publishNow ? 'Oui, publier' : 'Non'}
              selected={publishNow}
              onPress={() => setPublishNow(!publishNow)}
            />
          </View>
        )}

        <Button
          label={editing ? 'Enregistrer les corrections' : isModerator ? 'Publier ce lieu' : 'Proposer ce lieu'}
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
