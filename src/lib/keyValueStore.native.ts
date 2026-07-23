// Module natif de première partie (fourni par Expo Go), garanti compatible avec la
// New Architecture — contrairement au package communautaire @react-native-async-storage
// qui a des soucis de compatibilité sur les SDK Expo récents. Réutilisé à la fois pour
// la session Supabase et pour la persistance offline du cache React Query.
export { default } from 'expo-sqlite/kv-store';
