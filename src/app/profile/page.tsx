"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore } from "@/store";
import { updateUserDocument } from "@/lib/firestore";
import { logout } from "@/lib/auth";
import { INTEREST_OPTIONS } from "@/types";
import { BottomNav } from "@/components/layout/BottomNav";
import toast from "react-hot-toast";
import {
  Camera,
  Check,
  LogOut,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Image from "next/image";

/**
 * Compress and convert an image File to a base64 JPEG data URL.
 *
 * WHY THIS INSTEAD OF FIREBASE STORAGE:
 * Firebase Storage requires CORS headers to be configured via `gsutil`
 * CLI — it cannot be done from the Firebase console. Without that setup,
 * every `uploadBytes()` call is blocked by the browser's CORS preflight
 * and hangs/fails silently. Rather than require CLI setup, we resize the
 * image client-side using Canvas and store the resulting data URL directly
 * on the Firestore user document. At 300×300 / JPEG 0.82 quality the
 * output is ~60–120 KB — well under Firestore's 1 MB field limit.
 */
function compressToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 300;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image — try a different file"));
    };

    img.src = objectUrl;
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, firebaseUid, setUser } = useAppStore();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [sameGenderMode, setSameGenderMode] = useState(
    user?.sameGenderMode || false
  );
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Tracks what the avatar <img> displays — starts at the persisted URL/dataURL
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(
    user?.photoURL || null
  );

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length >= 8
        ? prev
        : [...prev, interest]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    setPhotoFile(file);
    // Show blob preview immediately — no upload yet
    setLocalPhotoURL(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!firebaseUid || !user) return;
    setSaving(true);
    try {
      let photoURL = user.photoURL;

      if (photoFile) {
        // Compress in-browser → store as data URL on Firestore
        // No Firebase Storage, no CORS, no gsutil needed
        photoURL = await compressToDataURL(photoFile);
        setLocalPhotoURL(photoURL);
        setPhotoFile(null);
      }

      await updateUserDocument(firebaseUid, {
        name,
        bio,
        interests,
        sameGenderMode,
        photoURL,
      });

      // Update Zustand immediately — don't wait for Firestore listener round-trip
      setUser({ ...user, name, bio, interests, sameGenderMode, photoURL });

      toast.success("Profile updated!");
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Profile save error:", msg);
      toast.error(`Failed to save: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setBio(user?.bio || "");
    setInterests(user?.interests || []);
    setSameGenderMode(user?.sameGenderMode || false);
    setPhotoFile(null);
    setLocalPhotoURL(user?.photoURL || null);
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <div className="min-h-dvh bg-metro-black pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-metro-muted text-sm mb-1">Your account</p>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>
          <button
            onClick={() => (editing ? handleCancel() : setEditing(true))}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              editing
                ? "border-metro-yellow text-metro-yellow"
                : "border-metro-border text-metro-muted"
            }`}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Photo + Name */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-metro-card border-2 border-metro-border flex items-center justify-center">
              {localPhotoURL ? (
                <Image
                  src={localPhotoURL}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {editing && (
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-metro-yellow flex items-center justify-center cursor-pointer shadow-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                  onClick={(e) =>
                    ((e.target as HTMLInputElement).value = "")
                  }
                />
                <Camera size={14} className="text-metro-black" />
              </label>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-metro-muted text-sm">{user?.email}</p>
            {user?.age && (
              <p className="text-xs text-metro-muted mt-0.5">
                {user.age} · {user.gender}
              </p>
            )}
          </div>
        </div>

        {photoFile && !saving && (
          <p className="text-xs text-metro-yellow mt-2 ml-1">
            📸 New photo ready — tap Save Changes to apply
          </p>
        )}
      </div>

      {/* Edit Form */}
      {editing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 space-y-5"
        >
          <div>
            <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              maxLength={30}
            />
          </div>

          <div>
            <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              className="input-base resize-none"
              placeholder="Tell people about yourself..."
            />
            <p className="text-xs text-metro-muted mt-1 text-right">
              {bio.length}/200
            </p>
          </div>

          <div>
            <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">
              Interests ({interests.length}/8)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      selected
                        ? "bg-metro-yellow text-metro-black border-metro-yellow"
                        : "bg-metro-card border-metro-border text-metro-muted"
                    }`}
                  >
                    {selected && <Check size={10} className="inline mr-1" />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-yellow flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-metro-black/30 border-t-metro-black rounded-full animate-spin" />
            ) : (
              <>
                Save Changes <Check size={18} />
              </>
            )}
          </motion.button>
        </motion.div>
      ) : (
        <div className="px-5 space-y-4">
          {user?.bio && (
            <div className="bg-metro-card border border-metro-border rounded-2xl p-4">
              <p className="text-xs text-metro-muted uppercase tracking-wider mb-2">
                Bio
              </p>
              <p className="text-sm text-white leading-relaxed">{user.bio}</p>
            </div>
          )}

          {user?.interests && user.interests.length > 0 && (
            <div className="bg-metro-card border border-metro-border rounded-2xl p-4">
              <p className="text-xs text-metro-muted uppercase tracking-wider mb-3">
                Interests
              </p>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-xl bg-metro-yellow/10 text-metro-yellow border border-metro-yellow/20 text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-metro-card border border-metro-border rounded-2xl p-4">
            <p className="text-xs text-metro-muted uppercase tracking-wider mb-3">
              Safety
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-metro-yellow" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Same Gender Mode
                  </p>
                  <p className="text-xs text-metro-muted">
                    Only show same-gender travelers
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const newVal = !sameGenderMode;
                  setSameGenderMode(newVal);
                  if (firebaseUid && user) {
                    await updateUserDocument(firebaseUid, {
                      sameGenderMode: newVal,
                    });
                    setUser({ ...user, sameGenderMode: newVal });
                    toast.success(
                      newVal ? "Same gender mode on" : "Same gender mode off"
                    );
                  }
                }}
              >
                {sameGenderMode ? (
                  <ToggleRight size={32} className="text-metro-yellow" />
                ) : (
                  <ToggleLeft size={32} className="text-metro-muted" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-metro-card border border-red-500/30 text-red-400 rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>

          <p className="text-center text-xs text-metro-muted pb-4">
            MetroMates v1.0 · Not a dating app
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}