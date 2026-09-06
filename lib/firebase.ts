import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore";
// Initialize Firebase App (idempotent). Environment variables make switching
// Firebase projects possible without changing application code.
const effectiveFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(effectiveFirebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(
  app,
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)"
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Error handler conforming to FirestoreErrorInfo from firebase-skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connectivity test mandated by firebase-skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.warn("Firestore client is offline or waiting for connection.");
      return false;
    }
    // Normal connection attempt result
    return true;
  }
}

// Student Academic Details interface
export interface StudentAcademicDetails {
  studentName?: string;
  collegeName?: string;
  collegeLocation?: string;
  facultyOrInstitute?: string;
  program?: string;
  semester?: string;
  rollNumber?: string;
  regdNumber?: string;
  examRollNumber?: string;
  batch?: string;
  teacherName?: string;
  teacherDepartment?: string;
}

// User Profile interface
export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOtpVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Student academic fields
  studentName?: string;
  collegeName?: string;
  collegeLocation?: string;
  facultyOrInstitute?: string;
  program?: string;
  semester?: string;
  rollNumber?: string;
  regdNumber?: string;
  examRollNumber?: string;
  batch?: string;
  teacherName?: string;
  teacherDepartment?: string;
}

// Helper to fetch or create user profile in Firestore
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const identityUpdates: Partial<UserProfile> = {};
      if (user.displayName && user.displayName !== data.displayName) {
        identityUpdates.displayName = user.displayName;
      }
      if (user.photoURL && user.photoURL !== data.photoURL) {
        identityUpdates.photoURL = user.photoURL;
      }

      if (Object.keys(identityUpdates).length > 0) {
        const updatedAt = new Date().toISOString();
        const updatedProfile = {
          ...data,
          ...identityUpdates,
          updatedAt,
        };
        await setDoc(userRef, { ...identityUpdates, updatedAt }, { merge: true });
        return updatedProfile;
      }

      return data;
    }

    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      userId: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "Student",
      photoURL: user.photoURL || "",
      isOtpVerified: false, // Mandated: Must verify OTP even if Google signup
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

// Helper to mark user as OTP verified in Firestore
export async function markUserOtpVerified(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data() as UserProfile) : null;
    const now = new Date().toISOString();

    await setDoc(
      userRef,
      {
        userId,
        email: existing?.email || auth.currentUser?.email || "",
        displayName: existing?.displayName || auth.currentUser?.displayName || "Student",
        photoURL: existing?.photoURL || auth.currentUser?.photoURL || "",
        isOtpVerified: true,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

// Helper to save or update student academic details in Firestore
export async function saveUserAcademicDetails(
  userId: string,
  details: StudentAcademicDetails
): Promise<UserProfile> {
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data() as UserProfile) : null;
    const now = new Date().toISOString();

    const updatedProfile: UserProfile = {
      userId,
      email: existing?.email || auth.currentUser?.email || "",
      displayName:
        details.studentName?.trim() ||
        existing?.displayName ||
        auth.currentUser?.displayName ||
        "Student",
      photoURL: existing?.photoURL || auth.currentUser?.photoURL || "",
      isOtpVerified: existing ? existing.isOtpVerified : true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      studentName: details.studentName || "",
      collegeName: details.collegeName || "",
      collegeLocation: details.collegeLocation || "",
      facultyOrInstitute:
        details.facultyOrInstitute || "Institute of Science and Technology",
      program: details.program || "",
      semester: details.semester || "",
      rollNumber: details.rollNumber || "",
      regdNumber: details.regdNumber || "",
      examRollNumber: details.examRollNumber || "",
      batch: details.batch || "",
      teacherName: details.teacherName || "",
      teacherDepartment: details.teacherDepartment || "",
    };

    await setDoc(userRef, updatedProfile, { merge: true });
    return updatedProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }
}

// Helper to log generation record in Firestore
export async function logGenerationRecord(
  userId: string,
  docType: "cover" | "batch" | "index",
  format: "pdf" | "docx" | "zip" | "png" | "typ"
): Promise<void> {
  try {
    const genRef = collection(db, "users", userId, "generations");
    await addDoc(genRef, {
      id: `${docType}_${Date.now()}`,
      userId,
      docType,
      format,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Could not log generation record:", err);
  }
}
