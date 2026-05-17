"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { updateUserDocument } from "@/lib/firestore";
import { uploadProfilePhoto } from "@/lib/storage";
import { useAppStore } from "@/store";
import { INTEREST_OPTIONS } from "@/types";
import toast from "react-hot-toast";
import { Camera, ArrowLeft, ArrowRight, Check } from "lucide-react";
import Image from "next/image";

const STEPS = ["name", "details", "bio", "interests", "photo"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUid, user } = useAppStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Prefill name + photo from Google account
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  // Show Google profile photo as default preview
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length >= 8
        ? prev
        : [...prev, interest]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case "name": return name.trim().length >= 2;
      case "details": return age !== "" && parseInt(age) >= 18 && parseInt(age) <= 70 && gender !== "";
      case "bio": return true;
      case "interests": return interests.length >= 2;
      case "photo": return true;
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit
    if (!firebaseUid) return;
    setLoading(true);
    try {
      let photoURL: string | undefined;
      if (photo) {
        // User uploaded a custom photo — upload to Storage
        photoURL = await uploadProfilePhoto(firebaseUid, photo);
      } else if (user?.photoURL) {
        // Keep the Google profile photo
        photoURL = user.photoURL;
      }

      await updateUserDocument(firebaseUid, {
        name: name.trim(),
        age: parseInt(age),
        gender: gender as any,
        bio: bio.trim(),
        interests,
        photoURL,
        onboardingCompleted: true,
      });

      toast.success("Profile created! Welcome aboard 🚇");
      router.replace("/home");
    } catch (err: any) {
      toast.error("Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-metro-black px-6 py-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-metro-muted uppercase tracking-wider font-medium">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs text-metro-yellow font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-metro-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-metro-yellow rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === "name" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">What's your name?</h2>
                <p className="text-metro-muted text-sm mb-6">This is how other travelers will know you.</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first name"
                  className="input-base text-lg"
                  autoFocus
                  maxLength={30}
                />
              </div>
            )}

            {currentStep === "details" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">About you</h2>
                <p className="text-metro-muted text-sm mb-6">Age must be 18+.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      min={18}
                      max={70}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-metro-muted uppercase tracking-wider mb-2 block">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["male", "female", "non-binary", "prefer-not-to-say"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`px-4 py-3 rounded-2xl border text-sm font-medium capitalize transition-all ${
                            gender === g
                              ? "bg-metro-yellow text-metro-black border-metro-yellow"
                              : "bg-metro-card border-metro-border text-metro-muted"
                          }`}
                        >
                          {g.replace("-", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "bio" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your bio</h2>
                <p className="text-metro-muted text-sm mb-6">Tell people a bit about yourself. (optional)</p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Designer by day, startup enthusiast by night. Always looking for interesting conversations on my daily commute..."
                  rows={5}
                  maxLength={200}
                  className="input-base resize-none"
                />
                <p className="text-xs text-metro-muted mt-2 text-right">{bio.length}/200</p>
              </div>
            )}

            {currentStep === "interests" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your interests</h2>
                <p className="text-metro-muted text-sm mb-6">
                  Pick 2–8 topics. ({interests.length}/8 selected)
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => {
                    const selected = interests.includes(interest);
                    return (
                      <motion.button
                        key={interest}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                          selected
                            ? "bg-metro-yellow text-metro-black border-metro-yellow"
                            : "bg-metro-card border-metro-border text-metro-muted hover:border-metro-yellow/50"
                        }`}
                      >
                        {selected && <Check size={12} className="inline mr-1" />}
                        {interest}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === "photo" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Profile photo</h2>
                <p className="text-metro-muted text-sm mb-6">
                  {photoPreview
                    ? "Your Google photo is ready — or upload a different one."
                    : "Add a photo to make a great first impression. (optional)"}
                </p>

                <div className="flex flex-col items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <motion.div
                      whileTap={{ scale: 0.97 }}
                      className="w-36 h-36 rounded-3xl bg-metro-card border-2 border-dashed border-metro-border flex flex-col items-center justify-center overflow-hidden relative"
                    >
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <>
                          <Camera size={32} className="text-metro-muted mb-2" />
                          <span className="text-xs text-metro-muted">Tap to add photo</span>
                        </>
                      )}
                    </motion.div>
                  </label>

                  {photoPreview && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-xs text-metro-muted">Tap the photo to change it</p>
                      {photo && (
                        <button
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview(user?.photoURL || null);
                          }}
                          className="text-sm text-metro-muted hover:text-white transition-colors"
                        >
                          Use Google photo instead
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-metro-card border border-metro-border text-white font-medium"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className="btn-yellow flex-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-metro-black/30 border-t-metro-black rounded-full animate-spin" />
              Saving...
            </>
          ) : step === STEPS.length - 1 ? (
            <>Complete Profile <Check size={18} /></>
          ) : (
            <>Next <ArrowRight size={18} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
}
