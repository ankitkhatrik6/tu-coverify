"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import StudentProfileModal from "@/components/StudentProfileModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
      <StudentProfileModal />
    </AuthProvider>
  );
}
