import * as Crypto from 'expo-crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { buildProgressPhotoPath } from '../lib/progressPhotoPath';

const BUCKET = 'progress-photos';
// Assez long pour couvrir une session d'appairage à l'écran Timeline, sans
// laisser une URL signée valable indéfiniment sur un bucket privé.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type ProgressPhoto = {
  id: string;
  takenDate: string;
  storagePath: string;
  signedUrl: string | null;
};

export function useProgressPhotosQuery() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['progress_photos', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ProgressPhoto[]> => {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('user_id', userId!)
        .order('taken_date', { ascending: true });
      if (error) throw error;
      if (data.length === 0) return [];

      const paths = data.map((row) => row.storage_path);
      const { data: signedUrls, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;

      const signedUrlByPath = new Map(signedUrls.map((entry) => [entry.path, entry.signedUrl]));

      return data.map((row) => ({
        id: row.id,
        takenDate: row.taken_date,
        storagePath: row.storage_path,
        signedUrl: signedUrlByPath.get(row.storage_path) ?? null,
      }));
    },
  });
}

type AddProgressPhotoInput = {
  takenDate: string;
  bytes: Uint8Array;
};

// La compression/redimensionnement a déjà eu lieu côté écran (expo-image-manipulator) :
// ce hook ne fait que l'upload Storage + l'écriture de la ligne de métadonnée.
export function useAddProgressPhoto() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ takenDate, bytes }: AddProgressPhotoInput) => {
      const photoId = Crypto.randomUUID();
      const storagePath = buildProgressPhotoPath(userId!, photoId);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, bytes, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('progress_photos').insert({
        id: photoId,
        user_id: userId!,
        taken_date: takenDate,
        storage_path: storagePath,
      });
      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress_photos', userId] });
    },
  });
}

export function useDeleteProgressPhoto() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: { id: string; storagePath: string }) => {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([photo.storagePath]);
      if (storageError) throw storageError;

      const { error: deleteError } = await supabase.from('progress_photos').delete().eq('id', photo.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress_photos', userId] });
    },
  });
}
