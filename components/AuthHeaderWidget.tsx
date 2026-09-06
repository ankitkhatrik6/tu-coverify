"use client";

import React, { useSyncExternalStore } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  LogIn,
  LogOut,
  ShieldCheck,
  AlertCircle,
  FileText,
  User as UserIcon,
} from "lucide-react";

const emptySubscribe = () => () => {};

export default function AuthHeaderWidget() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const {
    user,
    userProfile,
    loading,
    remainingGenerations,
    isOtpVerified,
    setShowAuthModal,
    setAuthModalView,
    setAuthModalMessage,
    setShowProfileModal,
    logout,
  } = useAuth();

  if (!isMounted || loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800" />
    );
  }

  // 1. Authenticated and OTP Verified User
  if (user && isOtpVerified) {
    const displayName =
      userProfile?.studentName ||
      userProfile?.displayName ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Student";
    const initial = displayName.trim().charAt(0).toUpperCase() || "S";

    const profilePhotoUrl = user.photoURL || userProfile?.photoURL;
    const showPhoto = Boolean(profilePhotoUrl);

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Profile Button / Interactive Pill */}
        <button
          id="btn-user-profile-header"
          type="button"
          onClick={() => setShowProfileModal(true)}
          className="flex items-center justify-center sm:justify-start gap-2 rounded-full border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50/90 h-8 w-8 sm:h-auto sm:w-auto p-0 sm:py-1 sm:pl-1.5 sm:pr-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 transition-all cursor-pointer group shrink-0"
          title={`Click to edit student academic profile (Name, College, Roll No, Reg No) for ${displayName}`}
          aria-label={`Student profile: ${displayName}`}
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profilePhotoUrl!}
              alt={displayName}
              className="h-7 w-7 sm:h-6 sm:w-6 rounded-full object-cover ring-1 ring-emerald-500/50 shrink-0"
            />
          ) : (
            <div className="flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-neutral-900 text-xs sm:text-[11px] font-bold text-white dark:bg-white dark:text-neutral-900 select-none shrink-0 ring-1 ring-neutral-200 dark:ring-zinc-700">
              {initial}
            </div>
          )}

          {/* Full Name: Hidden on Mobile View, Shown on sm: screens and above */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold leading-tight text-gray-900 group-hover:text-black dark:text-white max-w-[100px] sm:max-w-[130px] truncate">
              {displayName}
            </span>
          </div>

          {/* Verified Badge: Hidden on Mobile View, Shown on sm: screens and above */}
          <span
            className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"
            title="Verified TU Account • Click to record academic details"
          >
            <ShieldCheck className="h-3 w-3 shrink-0" />
            <span>Verified</span>
          </span>
        </button>

        {/* Sign Out Button */}
        <button
          id="btn-sign-out"
          type="button"
          onClick={() => logout()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 shrink-0 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 2. Authenticated but Needs OTP Verification
  if (user && !isOtpVerified) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="btn-verify-otp-warning"
          type="button"
          onClick={() => {
            setAuthModalMessage(
              "Please complete email verification to unlock your account generation access."
            );
            setAuthModalView("otp");
            setShowAuthModal(true);
          }}
          className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60 transition-all cursor-pointer"
        >
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Verify Email</span>
          <span className="sm:hidden">Verify</span>
        </button>

        <button
          id="btn-sign-out-unverified"
          type="button"
          onClick={() => logout()}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 shrink-0 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // 3. Guest / Anonymous User with Daily Quota Display
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* 24-Hour Free Quota Counter Pill */}
      <div
        id="quota-counter-pill"
        onClick={() => {
          if (remainingGenerations === 0) {
            setAuthModalMessage(
              "You have reached the 3 free generations limit for today. Sign in or sign up to continue."
            );
            setAuthModalView("signin");
            setShowAuthModal(true);
          }
        }}
        className={`flex items-center gap-1.5 rounded-full border py-1 px-2.5 text-[11px] font-semibold transition-all ${
          remainingGenerations === 0
            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50"
            : "border-gray-200 bg-gray-50 text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        }`}
        title={`${remainingGenerations} of 3 free daily generations remaining in 24 hours`}
      >
        <FileText
          className={`h-3 w-3 shrink-0 ${
            remainingGenerations === 0
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
        />
        <span>
          {remainingGenerations === 0 ? (
            <span className="font-bold">Limit Reached</span>
          ) : (
            <span>
              <strong className="text-gray-900 dark:text-white font-bold">
                {remainingGenerations}
              </strong>
              /3 free
            </span>
          )}
        </span>
      </div>

      {/* Sign In Button */}
      <button
        id="btn-open-sign-in"
        type="button"
        onClick={() => {
          setAuthModalMessage("");
          setAuthModalView("signin");
          setShowAuthModal(true);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 hover:text-gray-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white transition-all cursor-pointer"
      >
        <LogIn className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Sign In</span>
      </button>
    </div>
  );
}
