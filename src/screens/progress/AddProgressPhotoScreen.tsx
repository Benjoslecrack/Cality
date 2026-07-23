import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { useAddProgressPhoto } from '../../hooks/useProgressPhotos';
import { base64ToBytes } from '../../lib/base64';
import { todayDateKey } from '../../lib/dateUtils';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';

type Props = NativeStackScreenProps<SkillsStackParamList, 'AddProgressPhoto'>;

// Une photo de progression n'a pas besoin d'être haute résolution : on
// redimensionne et compresse avant l'upload (le brief le demande
// explicitement) plutôt que d'envoyer le JPEG brut de l'appareil photo, qui
// peut peser plusieurs Mo.
const MAX_WIDTH = 1080;
const JPEG_QUALITY = 0.7;

// Le .d.ts publié d'expo-image-manipulator 57 ne type pas correctement
// `ImageManipulator.manipulate` sur l'instance importée (résolu comme le
// type du contructeur plutôt que de l'instance — même famille de rough edge
// que expo-file-system en Bloc 2) : la méthode existe bel et bien au runtime,
// on retype localement le sous-ensemble utilisé ici.
type ManipulatorContext = {
  resize(size: { width?: number; height?: number }): ManipulatorContext;
  renderAsync(): Promise<{
    saveAsync(options: {
      compress?: number;
      format?: SaveFormat;
      base64?: boolean;
    }): Promise<{ uri: string; width: number; height: number; base64?: string }>;
  }>;
};
const manipulator = ImageManipulator as unknown as { manipulate(source: string): ManipulatorContext };

export function AddProgressPhotoScreen({ navigation }: Props) {
  const [dateKey, setDateKey] = useState(todayDateKey());
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const addPhoto = useAddProgressPhoto();

  const pickFrom = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission refusée',
        source === 'camera'
          ? "L'accès à l'appareil photo est nécessaire pour prendre une photo."
          : "L'accès à la galerie est nécessaire pour choisir une photo."
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!pickedUri) return;
    setPreparing(true);
    try {
      const image = await manipulator.manipulate(pickedUri).resize({ width: MAX_WIDTH }).renderAsync();
      const compressed = await image.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG, base64: true });
      if (!compressed.base64) throw new Error('Échec de la compression de la photo.');

      const bytes = base64ToBytes(compressed.base64);
      addPhoto.mutate(
        { takenDate: dateKey, bytes },
        {
          onSuccess: () => navigation.goBack(),
          onError: (error) => Alert.alert('Erreur', (error as Error).message),
        }
      );
    } catch (error) {
      Alert.alert('Erreur', (error as Error).message);
    } finally {
      setPreparing(false);
    }
  };

  const busy = preparing || addPhoto.isPending;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-6 pb-12 pt-6">
      <DateField label="Date de la photo" dateKey={dateKey} onChange={setDateKey} />

      <Text className="mb-3 font-bodyMedium text-sm text-textMuted">Photo</Text>
      {pickedUri ? (
        <Image source={{ uri: pickedUri }} className="mb-4 h-80 w-full rounded-2xl bg-surface" resizeMode="cover" />
      ) : (
        <View className="mb-4 h-80 w-full items-center justify-center rounded-2xl bg-surface">
          <Text className="font-body text-textMuted">Aucune photo sélectionnée</Text>
        </View>
      )}

      <View className="mb-8 flex-row gap-3">
        <View className="flex-1">
          <Button label="Prendre une photo" variant="secondary" onPress={() => pickFrom('camera')} disabled={busy} />
        </View>
        <View className="flex-1">
          <Button label="Depuis la galerie" variant="secondary" onPress={() => pickFrom('library')} disabled={busy} />
        </View>
      </View>

      <Button label="Enregistrer" onPress={handleSave} loading={busy} disabled={!pickedUri} />
    </ScrollView>
  );
}
