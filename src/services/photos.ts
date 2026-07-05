import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { isFirebaseEnabled, requireStorage } from '@/services/firebase';
import type { UserId } from '@/types/models';
import { uid } from '@/utils/id';

export interface PickedImage {
  uri: string;
  base64: string | null;
}

/** Ouvre la galerie (ou l'appareil photo) et retourne l'image choisie. */
export async function pickImage(useCamera = false): Promise<PickedImage | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsEditing: true,
  };
  const result = useCamera
    ? await (async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return null;
        return ImagePicker.launchCameraAsync(options);
      })()
    : await ImagePicker.launchImageLibraryAsync(options);
  if (!result || result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, base64: asset.base64 ?? null };
}

/**
 * Upload vers Firebase Storage si configuré, sinon on garde l'URI locale
 * (suffisant pour le mode démo sur l'appareil).
 */
export async function uploadPhoto(userId: UserId, localUri: string, folder: string): Promise<string> {
  if (!isFirebaseEnabled) return localUri;
  const res = await fetch(localUri);
  const blob = await res.blob();
  const path = `${folder}/${userId}/${uid()}.jpg`;
  const storageRef = ref(requireStorage(), path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
