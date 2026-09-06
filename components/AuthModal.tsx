"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

export default function AuthModal() {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalView,
    setAuthModalView,
    authModalMessage,
    pendingOtpEmail,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    verifyUserOtp,
    sendOtpToEmail,
    user,
    logout,
  } = useAuth();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP form states
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [prevView, setPrevView] = useState(authModalView);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset errors and inputs during render when view changes
  if (prevView !== authModalView) {
    setPrevView(authModalView);
    setError(null);
    setOtpError(null);
    if (authModalView === "otp") {
      setOtpDigits(["", "", "", "", "", ""]);
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showAuthModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAuthModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAuthModal, setShowAuthModal]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (authModalView !== "otp") return;
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [authModalView, resendCountdown]);

  // Handle auto-focusing first OTP input when opening OTP view
  useEffect(() => {
    if (authModalView === "otp") {
      const timer = setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [authModalView]);

  if (!showAuthModal) return null;

  // Handle Google Login
  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed before completing.");
      } else if (e.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else {
        let msg = e.message || "Failed to sign in with Google. Please try again.";
        try {
          if (typeof msg === "string" && msg.trim().startsWith("{") && msg.includes('"error"')) {
            const parsed = JSON.parse(msg);
            msg = parsed.error || msg;
          }
        } catch {
          // keep fallback
        }
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Email Submit (Sign In or Sign Up)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (authModalView === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (authModalView === "signin") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(name, email, password);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        setError("Invalid email or password. Please verify your credentials and try again.");
      } else if (e.code === "auth/user-not-found") {
        setError("No account found with this email. Please switch to Create Account.");
      } else if (e.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(e.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    setOtpError(null);
    const cleaned = val.replace(/\D/g, "");

    // Paste handling
    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6 && i < cleaned.length; i++) {
        newDigits[i] = cleaned[i];
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(cleaned.length, 5);
      otpInputsRef.current[nextIdx]?.focus();

      if (cleaned.length >= 6) {
        handleVerifyOtp(undefined, cleaned.slice(0, 6));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned[0] || "";
    setOtpDigits(newDigits);

    // Auto-advance
    if (cleaned.length === 1 && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const fullCode = overrideCode || otpDigits.join("");
    if (fullCode.length !== 6) {
      setOtpError("Please enter all 6 digits of your verification code.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    const result = await verifyUserOtp(fullCode);
    setOtpLoading(false);

    if (!result.success) {
      setOtpError(result.error || "Verification failed. Please check the code and try again.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resendLoading || !pendingOtpEmail) return;

    setResendLoading(true);
    setOtpError(null);
    setResendSuccess(false);

    const res = await sendOtpToEmail(pendingOtpEmail);
    setResendLoading(false);

    if (res.success) {
      setResendSuccess(true);
      setResendCountdown(45);
      setTimeout(() => setResendSuccess(false), 5000);
    } else {
      setOtpError(res.error || "Could not resend code. Please try again in a moment.");
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowAuthModal(false);
        }
      }}
    >
      <div
        id="auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[420px] my-auto overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-2xl dark:border-neutral-800 dark:bg-[#111113] transition-all"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          type="button"
          onClick={() => setShowAuthModal(false)}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* ==================================================================== */}
        {/* VIEW 1: SIGN IN / SIGN UP                                           */}
        {/* ==================================================================== */}
        {authModalView !== "otp" && (
          <div>
            {/* Brand Emblem & Heading */}
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50 text-neutral-900 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2
                id="auth-modal-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white"
              >
                TU Coverify
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Tribhuvan University Academic Generator
              </p>
            </div>

            {/* Segmented Control / Tab Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 mb-4 text-xs font-semibold">
              <button
                id="tab-auth-signin"
                type="button"
                onClick={() => {
                  setAuthModalView("signin");
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authModalView === "signin"
                    ? "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-auth-signup"
                type="button"
                onClick={() => {
                  setAuthModalView("signup");
                  setError(null);
                }}
                className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authModalView === "signup"
                    ? "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Quota Limit Context Banner (if triggered by hitting free quota) */}
            {authModalMessage && (
              <div
                id="auth-limit-banner"
                className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex-1 leading-relaxed">{authModalMessage}</div>
              </div>
            )}

            {/* Google Authentication Button */}
            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="flex w-full h-11 items-center justify-center gap-3 rounded-xl border border-neutral-300/80 bg-white text-sm font-semibold text-neutral-800 shadow-2xs hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800/80 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-neutral-600 dark:text-neutral-300" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              <span className="absolute bg-white px-2.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:bg-[#111113] dark:text-neutral-500">
                Or with email
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div
                id="auth-error-banner"
                className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authModalView === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      id="input-auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ankit Khatri KC"
                      className="h-10 sm:h-11 w-full rounded-xl border border-neutral-300/80 bg-neutral-50/50 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white transition-colors outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="h-10 sm:h-11 w-full rounded-xl border border-neutral-300/80 bg-neutral-50/50 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white transition-colors outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Password
                  </label>
                  {authModalView === "signin" && (
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      Min. 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    id="input-auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 sm:h-11 w-full rounded-xl border border-neutral-300/80 bg-neutral-50/50 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white transition-colors outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authModalView === "signup" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                    <input
                      id="input-auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 sm:h-11 w-full rounded-xl border border-neutral-300/80 bg-neutral-50/50 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white transition-colors outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 p-0.5 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                id="btn-submit-auth"
                type="submit"
                disabled={loading || googleLoading}
                className="mt-3 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-semibold text-white shadow-xs hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{authModalView === "signin" ? "Sign In" : "Create Account & Send Code"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================================================================== */}
        {/* VIEW 2: BREVO EMAIL OTP VERIFICATION                                 */}
        {/* ==================================================================== */}
        {authModalView === "otp" && (
          <div>
            {/* Back button */}
            <button
              id="btn-otp-back-to-signin"
              type="button"
              onClick={async () => {
                if (user) await logout();
                setAuthModalView("signin");
                setError(null);
                setOtpError(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-3 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>

            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200/80 bg-neutral-50 text-neutral-900 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
                <Mail className="h-6 w-6" />
              </div>
              <h2
                id="auth-modal-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white"
              >
                Verify Your Email
              </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                A 6-digit verification code has been dispatched to:
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-900 dark:text-white break-all">
                {pendingOtpEmail || user?.email || "your registered email"}
              </p>
            </div>

            {/* Information Notice: Check Mailbox */}
            <div
              id="otp-email-instruction-notice"
              className="mb-4 rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200 flex items-start gap-2.5 leading-relaxed"
            >
              <Mail className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <span>
                Please check your email inbox and enter the 6-digit one-time password below. If you
                don&apos;t see it, check your spam or junk folder.
              </span>
            </div>

            {/* Error / Success Banners */}
            {otpError && (
              <div
                id="otp-error-banner"
                className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="leading-relaxed">{otpError}</span>
              </div>
            )}

            {resendSuccess && (
              <div
                id="otp-resend-success-banner"
                className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>A new 6-digit verification code has been sent to your email!</span>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-12 w-11 sm:h-13 sm:w-12 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border border-neutral-300/90 bg-white text-neutral-900 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:ring-white transition-all outline-hidden shadow-2xs"
                  />
                ))}
              </div>

              <button
                id="btn-verify-otp-submit"
                type="submit"
                disabled={otpLoading || otpDigits.join("").length !== 6}
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-semibold text-white shadow-xs hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {otpLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Code & Switch Account Actions */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2 text-center text-xs">
              <p className="text-neutral-500 dark:text-neutral-400">
                Didn&apos;t receive the email?{" "}
                {resendCountdown > 0 ? (
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Resend in {resendCountdown}s
                  </span>
                ) : (
                  <button
                    id="btn-resend-otp"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="font-bold text-neutral-900 underline hover:text-neutral-700 dark:text-white dark:hover:text-neutral-200 cursor-pointer disabled:opacity-50 ml-1"
                  >
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </p>

              <div>
                <button
                  id="btn-switch-account-from-otp"
                  type="button"
                  onClick={async () => {
                    if (user) await logout();
                    setAuthModalView("signin");
                    setError(null);
                    setOtpError(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
