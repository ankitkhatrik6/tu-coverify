"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { StudentAcademicDetails } from "@/lib/firebase";
import TUCollegeAutocomplete from "@/components/TUCollegeAutocomplete";
import { TUCollege } from "@/lib/tu-colleges";
import {
  X,
  User,
  GraduationCap,
  Building2,
  MapPin,
  FileCheck2,
  Hash,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Save,
} from "lucide-react";

const TU_INSTITUTES_FACULTIES = [
  "Institute of Science and Technology",
  "Institute of Engineering",
  "Faculty of Management",
  "Faculty of Humanities and Social Sciences",
  "Faculty of Education",
  "Institute of Medicine",
  "Institute of Forestry",
  "Institute of Agriculture and Animal Science",
];

const TU_PROGRAMS = [
  "B.Sc. CSIT",
  "BCA",
  "BIT",
  "BIM",
  "BBM",
  "BBA",
  "B.E. Computer",
  "B.E. Civil",
  "B.E. Electronics",
  "B.Sc. Physics",
  "B.Sc. Chemistry",
  "B.Sc. Mathematics",
  "B.Sc. Microbiology",
  "B.Sc. Geology",
  "M.Sc. CSIT",
  "MCA",
  "MBA",
];

const TU_SEMESTERS = [
  "First Semester",
  "Second Semester",
  "Third Semester",
  "Fourth Semester",
  "Fifth Semester",
  "Sixth Semester",
  "Seventh Semester",
  "Eighth Semester",
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
];

function StudentProfileDialog({ onClose }: { onClose: () => void }) {
  const { user, userProfile, saveStudentAcademicDetails } = useAuth();

  const [details, setDetails] = useState<StudentAcademicDetails>(() => ({
    studentName:
      userProfile?.studentName ||
      userProfile?.displayName ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "",
    collegeName: userProfile?.collegeName || "Amrit Science Campus",
    collegeLocation: userProfile?.collegeLocation || "Lainchaur, Kathmandu",
    facultyOrInstitute:
      userProfile?.facultyOrInstitute || "Institute of Science and Technology",
    program: userProfile?.program || "B.Sc. CSIT",
    semester: userProfile?.semester || "Second Semester",
    rollNumber: userProfile?.rollNumber || "",
    regdNumber: userProfile?.regdNumber || "",
    examRollNumber: userProfile?.examRollNumber || "",
    batch: userProfile?.batch || "2082",
    teacherName: userProfile?.teacherName || "",
    teacherDepartment: userProfile?.teacherDepartment || "",
  }));

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const profilePhotoUrl = user?.photoURL || userProfile?.photoURL;
  const showPhoto = Boolean(profilePhotoUrl);
  const modalDisplayName =
    details.studentName ||
    userProfile?.studentName ||
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Student";
  const modalInitial = modalDisplayName.trim().charAt(0).toUpperCase() || "S";

  const handleChange = (field: keyof StudentAcademicDetails, val: string) => {
    setDetails((prev) => ({ ...prev, [field]: val }));
    if (error) setError(null);
  };

  const handleSelectCollege = (college: TUCollege) => {
    setDetails((prev) => ({
      ...prev,
      collegeName: college.name,
      collegeLocation: college.location,
    }));
  };

  const handleSave = async (andApplyToForm: boolean = true) => {
    if (!details.studentName?.trim()) {
      setError("Please enter your Student Name.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await saveStudentAcademicDetails(details);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (andApplyToForm && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tu_apply_profile_to_form", { detail: details })
        );
      }
      // Brief delay so user sees the green success state, then close
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setError(res.error || "Failed to save profile. Please check your connection.");
    }
  };

  return (
    <div
      id="student-profile-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="student-profile-modal-container"
        ref={modalRef}
        className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50/70 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black shrink-0 shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="profile-modal-heading"
                  className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white"
                >
                  Student Academic Profile
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  <UserCheck className="h-3 w-3" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-zinc-400">
                Record your official TU details once. They will automatically auto-fill every cover page.
              </p>
            </div>
          </div>

          <button
            id="btn-close-profile-modal"
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* User Account Info Strip */}
          <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 border border-neutral-200/80 dark:bg-zinc-800/40 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2.5 text-neutral-700 dark:text-zinc-300">
              {showPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePhotoUrl!}
                  alt={modalDisplayName}
                  className="h-5 w-5 rounded-full object-cover ring-1 ring-emerald-500/50 shrink-0"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-white dark:text-neutral-900 select-none shrink-0 ring-1 ring-neutral-200 dark:ring-zinc-700">
                  {modalInitial}
                </div>
              )}
              <span>
                Signed in as:{" "}
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  {user?.email}
                </strong>
              </span>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div
              id="profile-save-success-alert"
              className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60 animate-in fade-in"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Profile saved successfully! Applying to your cover generator...</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              id="profile-save-error-alert"
              className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: Personal & College Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-zinc-800">
              <Building2 className="h-4 w-4 text-neutral-700 dark:text-zinc-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-zinc-300">
                1. Student & Campus Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-studentName"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-studentName"
                    type="text"
                    value={details.studentName || ""}
                    onChange={(e) => handleChange("studentName", e.target.value)}
                    placeholder="e.g. Ankit Khatri KC"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-zinc-400">
                  Enter your official name as registered with Tribhuvan University.
                </p>
              </div>

              {/* College / Campus Autocomplete */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-collegeName"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Campus / College Name <span className="text-red-500">*</span>
                </label>
                <TUCollegeAutocomplete
                  id="profile-collegeName"
                  value={details.collegeName || ""}
                  onChange={(val) => handleChange("collegeName", val)}
                  onSelectCollege={handleSelectCollege}
                  placeholder="e.g. Amrit Science Campus, Patan Multiple Campus..."
                  icon={<Building2 className="h-4 w-4" />}
                  className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-white dark:focus:ring-white transition-all"
                />
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-zinc-400">
                  Select your campus from suggestions or type your college name.
                </p>
              </div>

              {/* College Location */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-collegeLocation"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Campus Location / Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-collegeLocation"
                    type="text"
                    value={details.collegeLocation || ""}
                    onChange={(e) => handleChange("collegeLocation", e.target.value)}
                    placeholder="e.g. Lainchaur, Kathmandu"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* Faculty or Institute */}
              <div>
                <label
                  htmlFor="profile-facultyOrInstitute"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Faculty / Institute
                </label>
                <select
                  id="profile-facultyOrInstitute"
                  value={details.facultyOrInstitute || "Institute of Science and Technology"}
                  onChange={(e) => handleChange("facultyOrInstitute", e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                >
                  {TU_INSTITUTES_FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Program / Degree */}
              <div>
                <label
                  htmlFor="profile-program"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Degree / Program
                </label>
                <div className="relative">
                  <input
                    id="profile-program"
                    type="text"
                    list="tu-program-presets"
                    value={details.program || ""}
                    onChange={(e) => handleChange("program", e.target.value)}
                    placeholder="e.g. B.Sc. CSIT"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                  />
                  <datalist id="tu-program-presets">
                    {TU_PROGRAMS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Semester */}
              <div>
                <label
                  htmlFor="profile-semester"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Current Semester / Year
                </label>
                <select
                  id="profile-semester"
                  value={details.semester || "Second Semester"}
                  onChange={(e) => handleChange("semester", e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                >
                  {TU_SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label
                  htmlFor="profile-batch"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Batch (B.S. or A.D.)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-batch"
                    type="text"
                    value={details.batch || ""}
                    onChange={(e) => handleChange("batch", e.target.value)}
                    placeholder="e.g. 2082 or 2025"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Roll Numbers & TU Registration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 dark:border-zinc-800">
              <FileCheck2 className="h-4 w-4 text-neutral-700 dark:text-zinc-300" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-zinc-300">
                2. Roll Numbers & TU Registration
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Campus / Class Roll No */}
              <div>
                <label
                  htmlFor="profile-rollNumber"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Class Roll No.
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-rollNumber"
                    type="text"
                    value={details.rollNumber || ""}
                    onChange={(e) => handleChange("rollNumber", e.target.value)}
                    placeholder="e.g. 09/82 or 14"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* TU Registration Number */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-regdNumber"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  TU Registration Number
                </label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-regdNumber"
                    type="text"
                    value={details.regdNumber || ""}
                    onChange={(e) => handleChange("regdNumber", e.target.value)}
                    placeholder="e.g. 5-2-1234-567-2025"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-zinc-400">
                  Tribhuvan University Registration Card Number (format: 5-2-XXXX-XXX-YYYY)
                </p>
              </div>

              {/* Exam Roll Number / Symbol Number */}
              <div>
                <label
                  htmlFor="profile-examRollNumber"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Exam Roll / Symbol No.
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    id="profile-examRollNumber"
                    type="text"
                    value={details.examRollNumber || ""}
                    onChange={(e) => handleChange("examRollNumber", e.target.value)}
                    placeholder="e.g. 820015"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                  />
                </div>
              </div>

              {/* Default Teacher / Supervisor */}
              <div>
                <label
                  htmlFor="profile-teacherName"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Default Teacher / Supervisor
                </label>
                <input
                  id="profile-teacherName"
                  type="text"
                  value={details.teacherName || ""}
                  onChange={(e) => handleChange("teacherName", e.target.value)}
                  placeholder="e.g. Mr. Kiran Joshi"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                />
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="profile-teacherDepartment"
                  className="block text-xs font-semibold text-neutral-800 dark:text-zinc-200 mb-1"
                >
                  Department
                </label>
                <input
                  id="profile-teacherDepartment"
                  type="text"
                  value={details.teacherDepartment || ""}
                  onChange={(e) => handleChange("teacherDepartment", e.target.value)}
                  placeholder="e.g. Department of CSIT"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 bg-neutral-50 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 shrink-0">
          <button
            id="btn-cancel-profile-modal"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/60 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-save-profile-only"
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Save Only
            </button>

            <button
              id="btn-save-and-apply-profile"
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Apply to Cover</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfileModal() {
  const { showProfileModal, setShowProfileModal } = useAuth();

  if (!showProfileModal) return null;

  return <StudentProfileDialog onClose={() => setShowProfileModal(false)} />;
}
