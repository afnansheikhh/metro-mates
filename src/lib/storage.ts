import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a profile photo and return a cache-busted download URL.
 *
 * Always writes to the same fixed path so old files don't accumulate
 * and the Storage object is overwritten in place.
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<string> {
  const fileRef = ref(storage, `profiles/${userId}/avatar`);

  await uploadBytes(fileRef, file, {
    contentType: file.type,
    customMetadata: { userId, uploadedAt: Date.now().toString() },
  });

  const url = await getDownloadURL(fileRef);

  /**
   * Firebase Storage download URLs are signed URLs that already contain
   * a `token` query param. Appending `&t=` directly to the string can
   * corrupt the URL in some SDK versions. Use URL API to set a safe
   * cache-buster param instead — forces both Firebase CDN and Next.js
   * image optimizer to treat it as a new resource.
   */
  const bustUrl = new URL(url);
  bustUrl.searchParams.set("_cb", Date.now().toString());
  return bustUrl.toString();
}

export async function deleteProfilePhoto(userId: string): Promise<void> {
  try {
    const fileRef = ref(storage, `profiles/${userId}/avatar`);
    await deleteObject(fileRef);
  } catch {
    // File may not exist — safe to ignore
  }
}