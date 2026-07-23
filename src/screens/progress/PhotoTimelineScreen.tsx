import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDeleteProgressPhoto, useProgressPhotosQuery } from '../../hooks/useProgressPhotos';
import { formatDayLabel } from '../../lib/dateUtils';
import { COLORS, CARD_SHADOW } from '../../theme/tokens';
import type { SkillsStackParamList } from '../../navigation/SkillsStack';

type Props = NativeStackScreenProps<SkillsStackParamList, 'PhotoTimeline'>;

export function PhotoTimelineScreen({ navigation }: Props) {
  const { data: photos, isLoading } = useProgressPhotosQuery();
  const deletePhoto = useDeleteProgressPhoto();

  const confirmDelete = (photo: { id: string; storagePath: string }) => {
    Alert.alert('Supprimer cette photo ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          deletePhoto.mutate(photo, {
            onError: (error) => Alert.alert('Erreur', (error as Error).message),
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-6 pb-12 pt-6">
        <View className="mb-6">
          <Button navigation={navigation} />
        </View>

        {!photos || photos.length === 0 ? (
          <View style={CARD_SHADOW} className="items-center rounded-2xl bg-surface p-6">
            <Text className="text-center font-body text-textMuted">
              Pas encore de photo de progression. Ajoute-en une pour commencer ta timeline.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {photos.map((photo) => (
              <Pressable
                key={photo.id}
                onLongPress={() => confirmDelete(photo)}
                style={CARD_SHADOW}
                className="overflow-hidden rounded-2xl bg-surface"
              >
                {photo.signedUrl ? (
                  <Image
                    source={{ uri: photo.signedUrl }}
                    style={{ width: '100%', height: 320, backgroundColor: COLORS.bgSurface }}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View className="h-80 items-center justify-center">
                    <Text className="font-body text-textMuted">Image indisponible</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between px-4 py-3">
                  <Text className="font-bodyMedium text-sm text-text">{formatDayLabel(photo.takenDate)}</Text>
                  <Pressable onPress={() => confirmDelete(photo)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Bouton d'ajout en haut de la timeline plutôt qu'un header custom : reste
// cohérent avec le style "carte pleine largeur" du reste de l'écran Skills.
function Button({ navigation }: { navigation: Props['navigation'] }) {
  return (
    <Pressable
      onPress={() => navigation.navigate('AddProgressPhoto')}
      style={CARD_SHADOW}
      className="flex-row items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3"
    >
      <Ionicons name="camera-outline" size={20} color={COLORS.onAccent} />
      <Text className="font-bodySemibold text-base text-onAccent">Ajouter une photo</Text>
    </Pressable>
  );
}
