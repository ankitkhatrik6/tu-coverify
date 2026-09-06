"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  syncUserProfile,
  markUserOtpVerified,
  logGenerationRecord,
  UserProfile,
  StudentAcademicDetails,
  saveUserAcademicDetails,
  testFirestoreConnection,
} from "@/lib/firebase";

const DAILY_FREE_LIMIT = 3;
const STORAGE_KEY = "tu_coverify_gen_timestamps_v1";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  dailyCount: number;
  remainingGenerations: number;
  isLimitReached: boolean;
  isOtpVerified: boolean;
  // Modal states
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authModalView: "signin" | "signup" | "otp";
  setAuthModalView: (view: "signin" | "signup" | "otp") => void;
  authModalMessage: string;
  setAuthModalMessage: (msg: string) => void;
  pendingOtpEmail: string;
  setPendingOtpEmail: (email: string) => void;
  // Student Profile Modal states
  showProfileModal: boolean;
  setShowProfileModal: (open: boolean) => void;
  saveStudentAcademicDetails: (
    details: StudentAcademicDetails
  ) => Promise<{ success: boolean; error?: string }>;
  // Auth methods
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signupWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // OTP methods
  sendOtpToEmail: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyUserOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  // Generation access gate
  checkCanGenerate: () => boolean;
  recordSuccessfulGeneration: (
    docType: "cover" | "batch" | "index",
    format?: "pdf" | "docx" | "zip"
  ) => Promise<void>;
  promptLoginForQuota: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Daily anonymous/free generation timestamps in last 24h
  const [dailyCount, setDailyCount] = useState<number>(0);

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<"signin" | "signup" | "otp">("signin");
  const [authModalMessage, setAuthModalMessage] = useState<string>("");
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Calculate timestamps in last 24h
  const refreshDailyCount = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setDailyCount(0);
        return;
      }
      const timestamps: number[] = JSON.parse(raw);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const valid = timestamps.filter((t) => typeof t === "number" && t > cutoff);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      setDailyCount(valid.length);
    } catch {
      setDailyCount(0);
    }
  }, []);

  // Check connection and initialize
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      refreshDailyCount();
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });
          setUserProfile(profile);

          // If logged in but not OTP verified, set pending email
          if (!profile.isOtpVerified && currentUser.email) {
            setPendingOtpEmail(currentUser.email);
          }
        } catch (err) {
          console.error("Error syncing profile:", err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshDailyCount]);

  const isOtpVerified = Boolean(user && userProfile?.isOtpVerified);
  const remainingGenerations = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user && dailyCount >= DAILY_FREE_LIMIT;

  // Send OTP
  const sendOtpToEmail = async (email: string, name?: string) => {
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Failed to send code." };
      }
      setPendingOtpEmail(email);
      return { success: true };
    } catch (err) {
      console.error("Send OTP error:", err);
      return { success: false, error: "Network error sending verification code." };
    }
  };

  // Verify OTP
  const verifyUserOtp = async (code: string) => {
    if (!pendingOtpEmail) {
      return { success: false, error: "No pending email to verify." };
    }

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingOtpEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid code." };
      }

      // Update in Firestore
      if (user) {
        await markUserOtpVerified(user.uid);
        setUserProfile((prev) => (prev ? { ...prev, isOtpVerified: true } : null));
      }

      // Close modal
      setShowAuthModal(false);
      return { success: true };
    } catch (err) {
      console.error("Verify OTP error:", err);
      return { success: false, error: "Failed to verify code. Please try again." };
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      setUserProfile(profile);

      // Check OTP verification requirement:
      // "without OTP verification unable to access features even signed up using google"
      if (!profile.isOtpVerified && result.user.email) {
        setPendingOtpEmail(result.user.email);
        setAuthModalView("otp");
        setAuthModalMessage(
          "We sent a one-time verification code to your Google email to confirm your student account."
        );
        setShowAuthModal(true);
        // Automatically dispatch OTP
        await sendOtpToEmail(result.user.email, result.user.displayName || undefined);
        return false;
      }

      setShowAuthModal(false);
      return true;
    } catch (err) {
      console.error("Google login error:", err);
      throw err;
    }
  };

  // Email Login
  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await syncUserProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
      photoURL: cred.user.photoURL,
    });
    setUserProfile(profile);

    if (!profile.isOtpVerified && cred.user.email) {
      setPendingOtpEmail(cred.user.email);
      setAuthModalView("otp");
      setAuthModalMessage("Please verify your email with the OTP code to continue.");
      setShowAuthModal(true);
      await sendOtpToEmail(cred.user.email, cred.user.displayName || undefined);
      return false;
    }

    setShowAuthModal(false);
    return true;
  };

  // Email Signup
  const signupWithEmail = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }

    const profile = await syncUserProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name.trim() || cred.user.email?.split("@")[0] || "Student",
      photoURL: "",
    });
    setUserProfile(profile);

    // Prompt OTP immediately
    setPendingOtpEmail(email.trim());
    setAuthModalView("otp");
    setAuthModalMessage(
      `We sent a 6-digit verification code to ${email}. Please enter it below to activate your account.`
    );
    setShowAuthModal(true);
    await sendOtpToEmail(email.trim(), name.trim());
    return true;
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setPendingOtpEmail("");
  };

  // Prompt login
  const promptLoginForQuota = (
    reason = "You have used your 3 free generations for today. Sign in or create an account to continue generating."
  ) => {
    setAuthModalMessage(reason);
    setAuthModalView("signin");
    setShowAuthModal(true);
  };

  // Access check before generating
  const checkCanGenerate = (): boolean => {
    // 1. If logged in and verified -> Unlimited allowed!
    if (user && userProfile?.isOtpVerified) {
      return true;
    }

    // 2. If logged in but NOT verified -> Block and show OTP modal!
    if (user && !userProfile?.isOtpVerified) {
      setPendingOtpEmail(user.email || "");
      setAuthModalMessage(
        "Verification required: Please enter the verification code sent to your email to continue."
      );
      setAuthModalView("otp");
      setShowAuthModal(true);
      if (user.email) {
        sendOtpToEmail(user.email, user.displayName || undefined);
      }
      return false;
    }

    // 3. If guest: check 24h limit (max 3)
    if (dailyCount >= DAILY_FREE_LIMIT) {
      promptLoginForQuota();
      return false;
    }

    return true;
  };

  // Record a generation
  const recordSuccessfulGeneration = async (
    docType: "cover" | "batch" | "index",
    format: "pdf" | "docx" | "zip" = "pdf"
  ) => {
    const now = Date.now();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const timestamps: number[] = raw ? JSON.parse(raw) : [];
      const cutoff = now - 24 * 60 * 60 * 1000;
      const updated = [...timestamps.filter((t) => typeof t === "number" && t > cutoff), now];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setDailyCount(updated.length);
    } catch {
      // ignore storage error
    }

    // If logged in, log to Firestore
    if (user) {
      await logGenerationRecord(user.uid, docType, format);
    }
  };

  // Save student academic details
  const saveStudentAcademicDetails = async (
    details: StudentAcademicDetails
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Please sign in to save your academic details." };
    }
    try {
      const updated = await saveUserAcademicDetails(user.uid, details);
      setUserProfile(updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tu_academic_profile_updated", { detail: updated })
        );
      }
      return { success: true };
    } catch (err) {
      console.error("Failed to save academic profile:", err);
      let errorMsg = "Could not save your academic profile. Please try again.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = parsed.error || errorMsg;
        } catch {
          errorMsg = err.message;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        dailyCount,
        remainingGenerations,
        isLimitReached,
        isOtpVerified,
        showAuthModal,
        setShowAuthModal,
        authModalView,
        setAuthModalView,
        authModalMessage,
        setAuthModalMessage,
        pendingOtpEmail,
        setPendingOtpEmail,
        showProfileModal,
        setShowProfileModal,
        saveStudentAcademicDetails,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        sendOtpToEmail,
        verifyUserOtp,
        checkCanGenerate,
        recordSuccessfulGeneration,
        promptLoginForQuota,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
