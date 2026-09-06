"use client";

import { useState, useMemo } from "react";
import { 
  TU_CSIT_COURSES, 
  TUCourse, 
  searchTUCourses, 
  SEMESTER_LABELS 
} from "@/lib/tu-courses";
import { 
  BookOpen, 
  Search, 
  X, 
  Check, 
  GraduationCap, 
  Clock, 
  Award,
  Layers
} from "lucide-react";

interface TUCourseDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: TUCourse) => void;
  selectedCourseCode?: string;
}

export default function TUCourseDirectoryModal({
  isOpen,
  onClose,
  onSelectCourse,
  selectedCourseCode,
}: TUCourseDirectoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSemester, setActiveSemester] = useState<number | "all" | "electives">("all");

  const filteredCourses = useMemo(() => {
    let list = TU_CSIT_COURSES;

    if (activeSemester === "electives") {
      list = list.filter((c) => c.isElective);
    } else if (typeof activeSemester === "number") {
      list = list.filter((c) => c.semesterNumber === activeSemester);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
      list = list.filter((c) => {
        const code = c.code.toLowerCase().replace(/\s+/g, "");
        const oldCode = c.oldCode ? c.oldCode.toLowerCase().replace(/\s+/g, "") : "";
        const title = c.title.toLowerCase().replace(/\s+/g, "");
        return code.includes(q) || oldCode.includes(q) || title.includes(q) || c.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return list;
  }, [searchQuery, activeSemester]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-neutral-100">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100">
                  TU B.Sc. CSIT Course Directory
                </h3>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  New Syllabus
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Official Tribhuvan University (IOST) updated curriculum papers & course codes across Semesters I – VIII
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-zinc-800 dark:text-neutral-400 dark:hover:bg-zinc-900 dark:hover:text-white"
            title="Close directory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="border-b border-gray-100 p-4 sm:px-6 dark:border-zinc-800">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code or subject title (e.g., CSC162, Microprocessor, DSA, Web Technology)..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-100 dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:bg-zinc-950 dark:focus:ring-white"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Semester pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveSemester("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeSemester === "all"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-900 dark:text-neutral-300 dark:hover:bg-zinc-800"
              }`}
            >
              All ({TU_CSIT_COURSES.length})
            </button>

            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <button
                key={sem}
                onClick={() => setActiveSemester(sem)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  activeSemester === sem
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-900 dark:text-neutral-300 dark:hover:bg-zinc-800"
                }`}
              >
                Sem {sem}
              </button>
            ))}

            <button
              onClick={() => setActiveSemester("electives")}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                activeSemester === "electives"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-900 dark:text-neutral-300 dark:hover:bg-zinc-800"
              }`}
            >
              Electives
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-zinc-700" />
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-neutral-300">
                No matching courses found
              </p>
              <p className="text-xs text-gray-400 dark:text-neutral-500">
                Try searching for a different code or subject name.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourseCode === course.code;

                return (
                  <div
                    key={`${course.code}-${course.semesterNumber}`}
                    className={`flex flex-col justify-between rounded-lg border p-3.5 transition-all ${
                      isSelected
                        ? "border-black bg-zinc-50 dark:border-white dark:bg-zinc-900"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-neutral-100">
                          {course.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {course.isElective && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {course.electiveType || "Elective"}
                            </span>
                          )}
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-800 dark:text-neutral-400">
                            Sem {course.semesterNumber}
                          </span>
                        </div>
                      </div>

                      <h4 className="mt-1 text-sm font-semibold text-gray-900 dark:text-neutral-100">
                        {course.title}
                      </h4>

                      {course.oldCode && (
                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-neutral-500 font-mono">
                          Formerly {course.oldCode}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.creditHours} Credits
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Full Marks: {course.fullMarks}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-zinc-800">
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400">
                        {course.semesterName}
                      </span>
                      <button
                        onClick={() => {
                          onSelectCourse(course);
                          onClose();
                        }}
                        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "bg-gray-100 text-gray-800 hover:bg-black hover:text-white dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-white dark:hover:text-black"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3" />
                            Applied
                          </>
                        ) : (
                          "Use this Course"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500 dark:border-zinc-800 dark:text-neutral-400">
          <span>
            Showing {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"}
          </span>
          <span>Click &quot;Use this Course&quot; to auto-fill title, code, semester, and degree</span>
        </div>
      </div>
    </div>
  );
}
