// Convention de chemin Storage : le premier segment de dossier doit être
// l'UUID du propriétaire (vérifié par les policies RLS sur storage.objects,
// via storage.foldername(name)[1] = auth.uid()).
export function buildProgressPhotoPath(userId: string, photoId: string): string {
  return `${userId}/${photoId}.jpg`;
}
