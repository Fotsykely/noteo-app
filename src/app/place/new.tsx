import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { DistrictPicker } from '@/components/district-picker';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/category-chip';
import { CATEGORIES, CATEGORY_BY_SLUG } from '@/constants/categories';
import { useColors } from '@/hooks/use-theme';
import { cn, noWebOutline } from '@/lib/utils';
import type { CategorySlug } from '@/types';

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

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const canSubmit = name.trim().length > 1 && category !== null && district !== null;

  function submit() {
    // À l'Étape 5, insertion dans Supabase avec status = 'pending'.
    Alert.alert(
      'Merci !',
      "Le lieu sera visible après vérification. L'envoi réel arrive à l'Étape 5.",
      [{ text: 'OK', onPress: () => router.back() }]
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
          Ajoutez un lieu absent du catalogue. Il sera contrôlé avant publication.
        </Text>

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
          label="Proposer ce lieu"
          fullWidth
          disabled={!canSubmit}
          className={cn('mt-8')}
          onPress={submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
