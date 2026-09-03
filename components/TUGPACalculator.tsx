"use client";

import { useState, useMemo, useEffect } from "react";
import {
  TU_GRADING_SYSTEM,
  CourseGradeEntry,
  SemesterSGPAInput,
  calculateSemesterSGPA,
  calculateOverallCGPA,
  getDefaultCoursesForSemester,
} from "@/lib/tu-gpa";
import { TU_CSIT_COURSES, SEMESTER_LABELS } from "@/lib/tu-courses";
import {
  Calculator,
  Award,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Check,
  Copy,
  FileText,
  SlidersHorizontal,
  Info,
  FileDown,
  Download,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";

export default function TUGPACalculator() {
  const [activeTab, setActiveTab] = useState<"sgpa" | "cgpa" | "grading">("sgpa");

  // --- SGPA State ---
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [courses, setCourses] = useState<CourseGradeEntry[]>(() =>
    getDefaultCoursesForSemester(1)
  );

  // --- CGPA 8-Semesters State ---
  const [semestersData, setSemestersData] = useState<SemesterSGPAInput[]>([
    { semesterNumber: 1, semesterName: "First Semester", sgpa: 3.65, credits: 15, hasBacklog: false },
    { semesterNumber: 2, semesterName: "Second Semester", sgpa: 3.52, credits: 15, hasBacklog: false },
    { semesterNumber: 3, semesterName: "Third Semester", sgpa: 3.70, credits: 15, hasBacklog: false },
    { semesterNumber: 4, semesterName: "Fourth Semester", sgpa: 3.44, credits: 15, hasBacklog: false },
    { semesterNumber: 5, semesterName: "Fifth Semester", sgpa: 0, credits: 0, hasBacklog: false },
    { semesterNumber: 6, semesterName: "Sixth Semester", sgpa: 0, credits: 0, hasBacklog: false },
    { semesterNumber: 7, semesterName: "Seventh Semester", sgpa: 0, credits: 0, hasBacklog: false },
    { semesterNumber: 8, semesterName: "Eighth Semester", sgpa: 0, credits: 0, hasBacklog: false },
  ]);

  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // --- Marksheet PDF Generator State ---
  const [isMarksheetModalOpen, setIsMarksheetModalOpen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string>("");
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [marksheetConfig, setMarksheetConfig] = useState(() => {
    const defaultConfig = {
      studentName: "Ankit Khatri KC",
      rollNumber: "820015",
      regdNumber: "5-2-0033-0123-2022",
      campusName: "Amrit Science Campus, Lainchaur, Kathmandu",
      batch: "2081 B.S.",
      type: "semester" as "semester" | "cumulative",
    };
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tu_cover_form_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...defaultConfig,
            studentName: parsed.studentName || defaultConfig.studentName,
            rollNumber: parsed.examRollNumber || parsed.rollNumber || defaultConfig.rollNumber,
            regdNumber: parsed.regdNumber || defaultConfig.regdNumber,
            campusName: parsed.collegeName
              ? `${parsed.collegeName}${parsed.collegeLocation ? `, ${parsed.collegeLocation}` : ""}`
              : defaultConfig.campusName,
            batch: parsed.batch ? `${parsed.batch} B.S.` : defaultConfig.batch,
          };
        }
      } catch {
        // Ignore
      }
    }
    return defaultConfig;
  });

  // When changing semester, prompt/switch courses
  const handleSemesterChange = (semNum: number) => {
    setSelectedSemester(semNum);
    setCourses(getDefaultCoursesForSemester(semNum));
  };

  // Elective replacement options for current semester
  const availableElectives = useMemo(() => {
    return TU_CSIT_COURSES.filter(
      (c) => c.semesterNumber === selectedSemester && c.isElective
    );
  }, [selectedSemester]);

  // Compute SGPA in real-time
  const sgpaResult = useMemo(() => {
    return calculateSemesterSGPA(courses);
  }, [courses]);

  // Compute CGPA in real-time
  const cgpaResult = useMemo(() => {
    return calculateOverallCGPA(semestersData);
  }, [semestersData]);

  // Update a course in SGPA
  const updateCourse = (id: string, updates: Partial<CourseGradeEntry>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Quick set all courses to a specific letter grade
  const setAllGrades = (letter: string) => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        inputMode: "grade",
        letterGrade: letter,
      }))
    );
  };

  // Remove a course
  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // Add custom course
  const addCourse = () => {
    const newEntry: CourseGradeEntry = {
      id: `custom-${Date.now()}`,
      courseCode: `CSC${Math.floor(100 + Math.random() * 800)}`,
      courseTitle: "Elective / Special Subject",
      creditHours: 3,
      inputMode: "grade",
      letterGrade: "A",
      theoryExternal: 48,
      internalAssessment: 16,
      practicalExternal: 16,
    };
    setCourses((prev) => [...prev, newEntry]);
  };

  // Sync current SGPA to the CGPA table
  const syncSgpaToCgpa = () => {
    setSemestersData((prev) =>
      prev.map((s) =>
        s.semesterNumber === selectedSemester
          ? {
              ...s,
              sgpa: sgpaResult.sgpa,
              credits: sgpaResult.totalCredits,
              hasBacklog: sgpaResult.hasBacklog,
            }
          : s
      )
    );
    setActiveTab("cgpa");
  };

  // Update a semester row in CGPA
  const updateSemester = (semNum: number, updates: Partial<SemesterSGPAInput>) => {
    setSemestersData((prev) =>
      prev.map((s) => (s.semesterNumber === semNum ? { ...s, ...updates } : s))
    );
  };

  // Quick preset: Fill sample 4 semesters
  const fillSampleSemesters = () => {
    setSemestersData([
      { semesterNumber: 1, semesterName: "First Semester", sgpa: 3.70, credits: 15, hasBacklog: false },
      { semesterNumber: 2, semesterName: "Second Semester", sgpa: 3.55, credits: 15, hasBacklog: false },
      { semesterNumber: 3, semesterName: "Third Semester", sgpa: 3.82, credits: 15, hasBacklog: false },
      { semesterNumber: 4, semesterName: "Fourth Semester", sgpa: 3.60, credits: 15, hasBacklog: false },
      { semesterNumber: 5, semesterName: "Fifth Semester", sgpa: 3.48, credits: 15, hasBacklog: false },
      { semesterNumber: 6, semesterName: "Sixth Semester", sgpa: 0, credits: 0, hasBacklog: false },
      { semesterNumber: 7, semesterName: "Seventh Semester", sgpa: 0, credits: 0, hasBacklog: false },
      { semesterNumber: 8, semesterName: "Eighth Semester", sgpa: 0, credits: 0, hasBacklog: false },
    ]);
  };

  const clearAllSemesters = () => {
    setSemestersData([
      { semesterNumber: 1, semesterName: "First Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 2, semesterName: "Second Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 3, semesterName: "Third Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 4, semesterName: "Fourth Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 5, semesterName: "Fifth Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 6, semesterName: "Sixth Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 7, semesterName: "Seventh Semester", sgpa: 0, credits: 15, hasBacklog: false },
      { semesterNumber: 8, semesterName: "Eighth Semester", sgpa: 0, credits: 15, hasBacklog: false },
    ]);
  };

  const copySummaryToClipboard = () => {
    let summaryText = "";
    if (activeTab === "sgpa") {
      summaryText = `TRIBHUVAN UNIVERSITY (TU) - INSTITUTE OF SCIENCE AND TECHNOLOGY
B.Sc. Computer Science and Information Technology (B.Sc. CSIT)
Semester Grade Report: ${SEMESTER_LABELS[selectedSemester]}

• SGPA: ${sgpaResult.sgpa.toFixed(2)} / 4.00
• Result Standing: ${sgpaResult.divisionRemarks}
• Total Credits: ${sgpaResult.totalCredits} Cr | Quality Points: ${sgpaResult.totalQualityPoints.toFixed(2)}
• Passed Credits: ${sgpaResult.passedCredits} / ${sgpaResult.totalCredits} Cr
• Status: ${sgpaResult.hasBacklog ? "Has Backpaper / Incomplete" : "Passed All"}

Course Breakdown:
${sgpaResult.courseDetails
  .map(
    (c) =>
      `• [${c.courseCode}] ${c.courseTitle}: Grade ${c.letterGrade} (${c.gradePoint.toFixed(1)} GP) × ${c.creditHours} Cr = ${c.qualityPoints.toFixed(2)} QP`
  )
  .join("\n")}`;
    } else {
      summaryText = `TRIBHUVAN UNIVERSITY (TU) - INSTITUTE OF SCIENCE AND TECHNOLOGY
B.Sc. CSIT Cumulative Grade Point Average (CGPA)

• Cumulative CGPA: ${cgpaResult.cgpa.toFixed(2)} / 4.00
• Degree Standing: ${cgpaResult.division}
• Completed Credits: ${cgpaResult.totalCompletedCredits} / 120 Credits
• Total Quality Points: ${cgpaResult.totalQualityPoints.toFixed(2)}

Semesters Breakdown:
${cgpaResult.semestersSummary
  .map(
    (s) =>
      `• Semester ${s.semesterNumber}: SGPA ${s.sgpa.toFixed(2)} (${s.credits} Credits, Quality Points: ${s.qualityPoints.toFixed(2)}, ${s.hasBacklog ? "Backlog" : "Clear"})`
  )
  .join("\n")}`;
    }

    navigator.clipboard.writeText(summaryText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // --- Marksheet PDF Downloader ---
  const downloadMarksheet = async (typeOverride?: "semester" | "cumulative") => {
    const targetType = typeOverride || marksheetConfig.type || (activeTab === "cgpa" ? "cumulative" : "semester");
    setIsDownloading(true);
    setDownloadError("");
    try {
      const isCumulative = targetType === "cumulative";
      const payload = {
        documentType: "marksheet",
        marksheetType: targetType,
        studentName: marksheetConfig.studentName.trim() || "Ankit Khatri KC",
        rollNumber: marksheetConfig.rollNumber.trim() || "820015",
        examRollNumber: marksheetConfig.rollNumber.trim() || "820015",
        regdNumber: marksheetConfig.regdNumber.trim() || "5-2-0033-0123-2022",
        campusName: marksheetConfig.campusName.trim() || "Amrit Science Campus, Lainchaur, Kathmandu",
        batch: marksheetConfig.batch.trim() || "2081 B.S.",
        semester: SEMESTER_LABELS[selectedSemester] || `Semester ${selectedSemester}`,
        semesterNumber: selectedSemester,
        marksheetCourses: sgpaResult.courseDetails.map((c) => ({
          code: c.courseCode,
          title: c.courseTitle,
          credits: c.creditHours,
          letterGrade: c.letterGrade,
          gradePoint: c.gradePoint,
          qualityPoints: c.qualityPoints,
          isPass: c.isPass,
          remarks: c.remarks,
          totalMarks: c.totalMarks,
        })),
        marksheetSemesters: semestersData,
        marksheetSgpa: sgpaResult.sgpa,
        marksheetCgpa: cgpaResult.cgpa,
        marksheetTotalCredits: isCumulative ? cgpaResult.totalCompletedCredits : sgpaResult.totalCredits,
        marksheetPassedCredits: sgpaResult.passedCredits,
        marksheetTotalQualityPoints: isCumulative ? cgpaResult.totalQualityPoints : sgpaResult.totalQualityPoints,
        marksheetDivisionRemarks: isCumulative ? cgpaResult.division : sgpaResult.divisionRemarks,
        marksheetHasBacklog: isCumulative ? cgpaResult.hasBacklogsAcrossDegree : sgpaResult.hasBacklog,
        format: "pdf",
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Failed to generate TU Marksheet PDF");
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = isCumulative
        ? `TU_IOST_BSc_CSIT_Cumulative_Transcript.pdf`
        : `TU_IOST_Semester_${selectedSemester}_Marksheet.pdf`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadAnchor);

      setIsMarksheetModalOpen(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed downloading marksheet:", err);
      setDownloadError(err.message || "Failed to generate marksheet PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Official TU IOST Marksheet PDF downloaded successfully! Check your downloads folder.</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccess(false)}
            className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Institutional Header & Main Controller */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-2xl">
              TU SGPA &amp; CGPA Calculator
            </h2>
            <p className="text-xs text-gray-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              Calculates semester SGPA and 4-year cumulative CGPA based on the official Tribhuvan University Institute of Science and Technology evaluation criteria (40% internal + 60% external, minimum 40% category pass requirement).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copySummaryToClipboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:border-black hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
              title="Copy formatted transcript report"
            >
              {copiedNotification ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-gray-600 dark:text-neutral-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setMarksheetConfig((prev) => ({
                  ...prev,
                  type: activeTab === "cgpa" ? "cumulative" : "semester",
                }));
                setIsMarksheetModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition-colors cursor-pointer"
              title="Download official TU IOST Marksheet in PDF format"
            >
              <FileDown className="h-3.5 w-3.5 text-white dark:text-black" />
              <span>Download Marksheet</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab("sgpa")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === "sgpa"
                ? "bg-white text-gray-950 shadow-xs dark:bg-zinc-800 dark:text-white font-bold"
                : "text-gray-600 hover:text-gray-950 dark:text-neutral-400 dark:hover:text-white font-medium"
            }`}
          >
            <Calculator className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs leading-tight sm:whitespace-nowrap">Semester SGPA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cgpa")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === "cgpa"
                ? "bg-white text-gray-950 shadow-xs dark:bg-zinc-800 dark:text-white font-bold"
                : "text-gray-600 hover:text-gray-950 dark:text-neutral-400 dark:hover:text-white font-medium"
            }`}
          >
            <Award className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs leading-tight sm:whitespace-nowrap">Cumulative CGPA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grading")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === "grading"
                ? "bg-white text-gray-950 shadow-xs dark:bg-zinc-800 dark:text-white font-bold"
                : "text-gray-600 hover:text-gray-950 dark:text-neutral-400 dark:hover:text-white font-medium"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] sm:text-xs leading-tight sm:whitespace-nowrap">Scale &amp; Ordinance</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEMESTER SGPA CALCULATOR                                          */}
      {/* ========================================================================= */}
      {activeTab === "sgpa" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* Main Course Table (8 cols on lg) */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              
              {/* Semester Selector Header */}
              <div className="flex flex-col gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                    Select Semester
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Syllabus papers and credit hours are loaded automatically.
                  </p>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => handleSemesterChange(sem)}
                      className={`h-8 w-8 shrink-0 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSemester === sem
                          ? "bg-black text-white shadow-xs dark:bg-white dark:text-black"
                          : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-300 dark:hover:border-zinc-700"
                      }`}
                      title={`Semester ${sem}`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Grade Preset Bar & Subheader */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  {SEMESTER_LABELS[selectedSemester]} Papers ({courses.length} subjects)
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-400 dark:text-neutral-500 text-[11px]">Set all:</span>
                  {(["A+", "A", "B+", "B", "C+"] as const).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setAllGrades(grade)}
                      className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-700 hover:border-black hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-300 dark:hover:border-zinc-700 cursor-pointer"
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Courses List */}
              <div className="space-y-3">
                {courses.map((course, idx) => {
                  const detail = sgpaResult.courseDetails[idx];
                  const isBacklog = detail && !detail.isPass;

                  return (
                    <div
                      key={course.id}
                      className={`rounded-lg border p-4 transition-all ${
                        isBacklog
                          ? "border-red-300 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20"
                          : "border-gray-200 bg-gray-50/40 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70"
                      }`}
                    >
                      {/* Top Header: Code, Title, Mode switcher, Trash */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-black/10 px-2 py-0.5 font-mono text-[11px] font-bold text-gray-900 dark:bg-white/10 dark:text-white">
                              {course.courseCode}
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {course.courseTitle}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-neutral-400">
                            <span>Credits: <strong className="text-gray-800 dark:text-neutral-200">{course.creditHours}</strong></span>
                            <span>•</span>
                            <span>
                              Quality Points:{" "}
                              <strong className="text-gray-900 dark:text-white">
                                {detail?.qualityPoints.toFixed(2) || "0.00"}
                              </strong>
                            </span>
                            {detail?.categoryFailReason && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  {detail.categoryFailReason}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Mode Selector & Delete */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <div className="flex rounded-md border border-gray-200 bg-gray-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-800">
                            <button
                              type="button"
                              onClick={() => updateCourse(course.id, { inputMode: "grade" })}
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                course.inputMode === "grade"
                                  ? "bg-white text-gray-950 shadow-xs dark:bg-zinc-700 dark:text-white"
                                  : "text-gray-500 hover:text-gray-900 dark:text-neutral-400"
                              }`}
                            >
                              Grade
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCourse(course.id, { inputMode: "marks" })}
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                                course.inputMode === "marks"
                                  ? "bg-white text-gray-950 shadow-xs dark:bg-zinc-700 dark:text-white"
                                  : "text-gray-500 hover:text-gray-900 dark:text-neutral-400"
                              }`}
                            >
                              Marks
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCourse(course.id)}
                            className="rounded p-1 text-gray-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove Course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Input Section */}
                      <div className="mt-3 pt-3 border-t border-gray-200/70 dark:border-zinc-800/80">
                        {course.inputMode === "grade" ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-gray-600 dark:text-neutral-400">
                                Letter Grade:
                              </label>
                              <select
                                value={course.letterGrade}
                                onChange={(e) => updateCourse(course.id, { letterGrade: e.target.value })}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                              >
                                {TU_GRADING_SYSTEM.map((tier) => (
                                  <option key={tier.letter} value={tier.letter}>
                                    {tier.letter} — {tier.gradePoint.toFixed(1)} GP ({tier.remarks})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 dark:text-neutral-400 font-medium">Credits:</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={course.creditHours}
                                onChange={(e) =>
                                  updateCourse(course.id, {
                                    creditHours: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-center font-bold text-gray-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                              />
                            </div>

                            {/* Elective replacer if this semester has electives */}
                            {availableElectives.length > 0 && (
                              <div className="ml-auto">
                                <select
                                  onChange={(e) => {
                                    const chosen = availableElectives.find((c) => c.code === e.target.value);
                                    if (chosen) {
                                      updateCourse(course.id, {
                                        courseCode: chosen.code,
                                        courseTitle: chosen.title,
                                        creditHours: chosen.creditHours,
                                      });
                                    }
                                  }}
                                  className="text-[11px] font-medium text-gray-600 dark:text-neutral-400 bg-transparent border-none cursor-pointer underline hover:text-black dark:hover:text-white"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Swap with Elective...</option>
                                  {availableElectives.map((el) => (
                                    <option key={el.code} value={el.code}>
                                      {el.code} - {el.title}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Marks input mode (TU 40 internal / 60 external) */
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
                            <div>
                              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                                <span>Theory Ext</span>
                                <span className={course.theoryExternal < 24 ? "text-red-600 font-bold" : ""}>Pass ≥ 24</span>
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={60}
                                value={course.theoryExternal}
                                onChange={(e) =>
                                  updateCourse(course.id, {
                                    theoryExternal: Math.max(0, Math.min(60, Number(e.target.value) || 0)),
                                  })
                                }
                                className={`mt-1 w-full rounded-md border px-2 py-1 text-xs font-bold text-gray-950 dark:bg-zinc-950 dark:text-white ${
                                  course.theoryExternal < 24
                                    ? "border-red-400 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                                    : "border-gray-200 bg-white dark:border-zinc-800"
                                }`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                                <span>Internal</span>
                                <span className={course.internalAssessment < 8 ? "text-red-600 font-bold" : ""}>Pass ≥ 8</span>
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={course.internalAssessment}
                                onChange={(e) =>
                                  updateCourse(course.id, {
                                    internalAssessment: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                                  })
                                }
                                className={`mt-1 w-full rounded-md border px-2 py-1 text-xs font-bold text-gray-950 dark:bg-zinc-950 dark:text-white ${
                                  course.internalAssessment < 8
                                    ? "border-red-400 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                                    : "border-gray-200 bg-white dark:border-zinc-800"
                                }`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                                <span>Practical</span>
                                <span className={course.practicalExternal < 8 ? "text-red-600 font-bold" : ""}>Pass ≥ 8</span>
                              </div>
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={course.practicalExternal}
                                onChange={(e) =>
                                  updateCourse(course.id, {
                                    practicalExternal: Math.max(0, Math.min(20, Number(e.target.value) || 0)),
                                  })
                                }
                                className={`mt-1 w-full rounded-md border px-2 py-1 text-xs font-bold text-gray-950 dark:bg-zinc-950 dark:text-white ${
                                  course.practicalExternal < 8
                                    ? "border-red-400 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                                    : "border-gray-200 bg-white dark:border-zinc-800"
                                }`}
                              />
                            </div>

                            <div className="rounded-lg bg-gray-100 p-2 text-center dark:bg-zinc-800/80">
                              <div className="text-[10px] font-semibold text-gray-500 dark:text-neutral-400">
                                Total Marks &amp; Grade
                              </div>
                              <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-950 dark:text-white">
                                <span>{detail?.totalMarks || 0}/100</span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[11px] ${
                                    detail?.isPass
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                  }`}
                                >
                                  {detail?.letterGrade} ({detail?.gradePoint.toFixed(1)} GP)
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions: Add Course, Reset */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={addCourse}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:border-black hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Custom Subject</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCourses(getDefaultCoursesForSemester(selectedSemester))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to {SEMESTER_LABELS[selectedSemester]} Syllabus</span>
                </button>
              </div>
            </div>
          </div>

          {/* SGPA Summary Transcript (4 cols on lg) */}
          <div className="space-y-4 lg:col-span-4 sticky top-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  Semester Transcript
                </span>
                <span className="rounded bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-white/10 dark:text-neutral-200">
                  {SEMESTER_LABELS[selectedSemester]}
                </span>
              </div>

              {/* Big SGPA Score Banner */}
              <div className="mt-5 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Calculated SGPA
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                    {sgpaResult.sgpa.toFixed(2)}
                  </span>
                  <span className="text-base font-bold text-gray-400 dark:text-neutral-500">
                    / 4.00
                  </span>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      sgpaResult.hasBacklog
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : sgpaResult.sgpa >= 3.7
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : sgpaResult.sgpa >= 3.0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {sgpaResult.hasBacklog ? (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{sgpaResult.divisionRemarks}</span>
                  </span>
                </div>
              </div>

              {/* Detailed Mathematical Breakdown */}
              <div className="mt-6 divide-y divide-gray-100 rounded-lg bg-gray-50 p-3.5 text-xs dark:divide-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Total Semester Credits:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sgpaResult.totalCredits} Cr
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Passed Credits:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sgpaResult.passedCredits} / {sgpaResult.totalCredits} Cr
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Total Quality Points (Σ Cr × GP):</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sgpaResult.totalQualityPoints.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Official Formula:</span>
                  <span className="font-mono text-[11px] text-gray-800 dark:text-neutral-200">
                    {sgpaResult.totalQualityPoints.toFixed(2)} ÷ {sgpaResult.totalCredits} = {sgpaResult.sgpa.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Push to 8-Semesters CGPA Button & Download Marksheet */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={syncSgpaToCgpa}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-black py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all cursor-pointer"
                >
                  <Award className="h-4 w-4 shrink-0" />
                  <span>Push to 8-Semesters CGPA</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMarksheetConfig((prev) => ({ ...prev, type: "semester" }));
                    setIsMarksheetModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2 px-4 text-xs font-bold text-gray-800 shadow-xs hover:border-black hover:text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-neutral-200 dark:hover:border-zinc-500 transition-all cursor-pointer"
                >
                  <FileDown className="h-4 w-4 shrink-0 text-black dark:text-white" />
                  <span>Download Semester Marksheet (PDF)</span>
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-neutral-400">
                <Info className="h-4 w-4 text-gray-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                <span>
                  According to TU IoST rules, securing less than 40% in theory external (&lt;24/60) or practical/internal (&lt;8/20) results in an F grade (backpaper).
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUMULATIVE CGPA CALCULATOR (8 SEMESTERS)                           */}
      {/* ========================================================================= */}
      {activeTab === "cgpa" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* Semesters Table (8 cols on lg) */}
          <div className="space-y-4 lg:col-span-8">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              
              <div className="flex flex-col gap-2 pb-4 border-b border-gray-100 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                    All 8 Semesters SGPA Overview
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Enter or adjust the SGPA and credits for each semester to compute the degree CGPA.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fillSampleSemesters}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Sample Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearAllSemesters}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-neutral-200 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Semester rows */}
              <div className="mt-4 space-y-2.5">
                {semestersData.map((sem) => {
                  const qp = Number((sem.sgpa * sem.credits).toFixed(2));
                  const isCompleted = sem.credits > 0 && sem.sgpa > 0;

                  return (
                    <div
                      key={sem.semesterNumber}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 transition-all ${
                        isCompleted
                          ? "border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700"
                          : "border-dashed border-gray-200 bg-gray-50/50 opacity-60 dark:border-zinc-800/80 dark:bg-zinc-950/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                            isCompleted
                              ? "bg-black text-white dark:bg-white dark:text-black"
                              : "bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-neutral-400"
                          }`}
                        >
                          S{sem.semesterNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-950 dark:text-white">
                              {sem.semesterName}
                            </span>
                            {sem.hasBacklog && (
                              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                                Backlog
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                            Quality Points:{" "}
                            <strong className="text-gray-900 dark:text-white">{qp.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                            SGPA:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="4"
                            value={sem.sgpa || ""}
                            placeholder="0.00"
                            onChange={(e) =>
                              updateSemester(sem.semesterNumber, {
                                sgpa: Math.min(4, Math.max(0, parseFloat(e.target.value) || 0)),
                              })
                            }
                            className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-center text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-semibold text-gray-600 dark:text-neutral-400">
                            Credits:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={sem.credits || ""}
                            placeholder="0"
                            onChange={(e) =>
                              updateSemester(sem.semesterNumber, {
                                credits: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-center text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sem.hasBacklog}
                            onChange={(e) =>
                              updateSemester(sem.semesterNumber, {
                                hasBacklog: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300 text-black focus:ring-black dark:border-zinc-700"
                          />
                          <span>Backlog?</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CGPA Summary Transcript (4 cols on lg) */}
          <div className="space-y-4 lg:col-span-4 sticky top-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  Cumulative Standing
                </span>
                <span className="rounded bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-white/10 dark:text-neutral-200">
                  Full Degree (4 Yrs)
                </span>
              </div>

              {/* Big CGPA Banner */}
              <div className="mt-5 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  Cumulative CGPA
                </div>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                    {cgpaResult.cgpa.toFixed(2)}
                  </span>
                  <span className="text-base font-bold text-gray-400 dark:text-neutral-500">
                    / 4.00
                  </span>
                </div>

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      cgpaResult.hasBacklogsAcrossDegree
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : cgpaResult.cgpa >= 3.7
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                        : cgpaResult.cgpa >= 3.0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    <span>{cgpaResult.division}</span>
                  </span>
                </div>
              </div>

              {/* Degree Progress Bar */}
              <div className="mt-6 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600 dark:text-neutral-400">
                    Degree Completion
                  </span>
                  <span className="font-bold text-gray-950 dark:text-white">
                    {cgpaResult.totalCompletedCredits} / 120 Credits
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (cgpaResult.totalCompletedCredits / 120) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="mt-6 divide-y divide-gray-100 rounded-lg bg-gray-50 p-3.5 text-xs dark:divide-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Completed Credits:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {cgpaResult.totalCompletedCredits} Cr
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">Total Quality Points:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {cgpaResult.totalQualityPoints.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 dark:text-neutral-400">CGPA Formula:</span>
                  <span className="font-mono text-[11px] text-gray-800 dark:text-neutral-200">
                    Σ(SGPA × Cr) ÷ Σ(Cr)
                  </span>
                </div>
              </div>

              {/* Download Cumulative Transcript Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMarksheetConfig((prev) => ({ ...prev, type: "cumulative" }));
                    setIsMarksheetModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-black bg-black py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-gray-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <FileDown className="h-4 w-4 shrink-0" />
                  <span>Download 8-Semesters Transcript (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TU GRADING RULES & POLICY REFERENCE                                */}
      {/* ========================================================================= */}
      {activeTab === "grading" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            
            {/* Table of Grading Scale */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                    TU IoST Official Grading Scale
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Tribhuvan University 4.0 grading system for B.Sc. CSIT semester transcripts.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/60 font-semibold text-gray-700 dark:text-neutral-300">
                      <th className="py-2.5 px-3">Letter Grade</th>
                      <th className="py-2.5 px-3">Grading Scale (%)</th>
                      <th className="py-2.5 px-3">Grade Point</th>
                      <th className="py-2.5 px-3">Performance Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {TU_GRADING_SYSTEM.map((tier) => (
                      <tr
                        key={tier.letter}
                        className={`hover:bg-gray-50/60 dark:hover:bg-zinc-900/40 ${
                          tier.letter === "F" ? "text-red-600 dark:text-red-400 font-bold" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold">{tier.letter}</td>
                        <td className="py-2.5 px-3 font-mono">{tier.description}</td>
                        <td className="py-2.5 px-3 font-bold">{tier.gradePoint.toFixed(1)}</td>
                        <td className="py-2.5 px-3 font-medium">{tier.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-[11px] text-gray-500 dark:text-neutral-400">
                *Pass refers to acceptable performance (minimum 40% in each individual evaluation component).
              </div>
            </div>

            {/* Evaluation & Instructions Card */}
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:col-span-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-zinc-800">
                <SlidersHorizontal className="h-4 w-4 text-gray-600 dark:text-neutral-400" />
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">
                  Course Evaluation Criteria
                </h3>
              </div>

              <div className="space-y-3.5 text-xs text-gray-700 dark:text-neutral-300">
                <div>
                  <h4 className="font-bold text-gray-950 dark:text-white">
                    1. Course Duration &amp; Working Hours
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-neutral-400 leading-relaxed">
                    • 8 semesters (4 academic years) with separate semester-end examinations.<br />
                    • 90 working days in a semester.<br />
                    • 3 credit hours theory + lab: 3 lecture hours + 3 lab hours = 6 working hours/week.<br />
                    • 3 credit hours theory-only: 3 lecture hours + 2 tutorial hours = 5 working hours/week.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-950 dark:text-white">
                    2. Internal &amp; External Weightage
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-neutral-400 leading-relaxed">
                    • <strong>Internal (40%)</strong>: Divided into 20% laboratory practical examination and 20% internal term assessment.<br />
                    • <strong>External (60%)</strong>: Conducted by TU Institute of Science and Technology (IoST).<br />
                    • <strong>Crucial Rule</strong>: A student must secure a <strong>minimum of 40% in each category</strong> (≥24/60 in external, ≥8/20 in internal assessment, ≥8/20 in lab) to pass.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-950 dark:text-white">
                    3. Project Work &amp; Internship
                  </h4>
                  <p className="mt-1 text-gray-600 dark:text-neutral-400 leading-relaxed">
                    Evaluated by different evaluators with external examiner assignments. Students must secure at least 40% marks in each evaluator&apos;s score.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <a
                    href="https://portal.tu.edu.np/downloads/2025_12_03_16_19_29.pdf"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-black dark:text-white hover:underline"
                  >
                    <span>View Official TU IoST Syllabus PDF</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL TU IOST MARKSHEET GENERATION & DOWNLOAD                  */}
      {/* ========================================================================= */}
      {isMarksheetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-2 sm:p-4 md:p-6 flex min-h-full items-center justify-center">
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg lg:max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 text-left overflow-hidden my-auto"
          >
            {/* Modal Header (Fixed) */}
            <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                  <FileDown className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-950 dark:text-white leading-tight">
                    Download TU IOST Marksheet
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-neutral-400">
                    Official Tribhuvan University format in PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMarksheetModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-500 dark:hover:bg-zinc-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Modal Form (Scrollable body) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs overscroll-contain">
              {/* Type Selection Tabs */}
              <div>
                <label className="block font-bold text-gray-800 dark:text-neutral-200 mb-1.5 text-xs">
                  Marksheet Document Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarksheetConfig((prev) => ({ ...prev, type: "semester" }))}
                    className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      marksheetConfig.type === "semester"
                        ? "border-black bg-gray-50 dark:border-white dark:bg-zinc-900"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <span className="font-bold text-gray-950 dark:text-white text-xs sm:text-[13px]">
                      Current Semester ({SEMESTER_LABELS[selectedSemester]})
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                      SGPA: {sgpaResult.sgpa.toFixed(2)} • {sgpaResult.totalCredits} Cr
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarksheetConfig((prev) => ({ ...prev, type: "cumulative" }))}
                    className={`flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      marksheetConfig.type === "cumulative"
                        ? "border-black bg-gray-50 dark:border-white dark:bg-zinc-900"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-800 dark:bg-zinc-950"
                    }`}
                  >
                    <span className="font-bold text-gray-950 dark:text-white text-xs sm:text-[13px]">
                      4-Year Full Degree (CGPA)
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                      CGPA: {cgpaResult.cgpa.toFixed(2)} • 8 Semesters
                    </span>
                  </button>
                </div>
              </div>

              {/* Student Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1 text-[11px] sm:text-xs">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    value={marksheetConfig.studentName}
                    onChange={(e) =>
                      setMarksheetConfig((prev) => ({ ...prev, studentName: e.target.value }))
                    }
                    placeholder="e.g. Ankit Khatri KC"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1 text-[11px] sm:text-xs">
                    Exam Roll / Symbol No.
                  </label>
                  <input
                    type="text"
                    value={marksheetConfig.rollNumber}
                    onChange={(e) =>
                      setMarksheetConfig((prev) => ({ ...prev, rollNumber: e.target.value }))
                    }
                    placeholder="e.g. 820015"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1 text-[11px] sm:text-xs">
                    T.U. Registration No.
                  </label>
                  <input
                    type="text"
                    value={marksheetConfig.regdNumber}
                    onChange={(e) =>
                      setMarksheetConfig((prev) => ({ ...prev, regdNumber: e.target.value }))
                    }
                    placeholder="e.g. 5-2-0033-0123-2022"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1 text-[11px] sm:text-xs">
                    Batch / Session
                  </label>
                  <input
                    type="text"
                    value={marksheetConfig.batch}
                    onChange={(e) =>
                      setMarksheetConfig((prev) => ({ ...prev, batch: e.target.value }))
                    }
                    placeholder="e.g. 2081 B.S."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 dark:text-neutral-300 mb-1 text-[11px] sm:text-xs">
                    Campus / College Name
                  </label>
                  <input
                    type="text"
                    value={marksheetConfig.campusName}
                    onChange={(e) =>
                      setMarksheetConfig((prev) => ({ ...prev, campusName: e.target.value }))
                    }
                    placeholder="e.g. Amrit Science Campus, Lainchaur, Kathmandu"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-gray-950 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Document Preview Spec Info */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-3.5 text-[11px] sm:text-xs dark:border-zinc-800 dark:bg-zinc-900/60 space-y-1.5">
                <div className="flex items-center justify-between font-semibold gap-2">
                  <span className="text-gray-500 dark:text-neutral-400 shrink-0">Target Document:</span>
                  <span className="text-gray-900 dark:text-white text-right truncate">
                    {marksheetConfig.type === "cumulative"
                      ? "4-Year Cumulative Transcript (All 8 Semesters)"
                      : `${SEMESTER_LABELS[selectedSemester]} Grade-Sheet`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-neutral-400 shrink-0">Program:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">B.Sc. CSIT (IoST)</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-neutral-400 shrink-0">Emblem &amp; Format:</span>
                  <span className="text-gray-900 dark:text-white font-medium text-right">Official TU Emblem + Double Border</span>
                </div>
              </div>

              {/* Error Display */}
              {downloadError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="break-words">{downloadError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed & responsive) */}
            <div className="shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 p-3 sm:p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40">
              <button
                type="button"
                onClick={() => setIsMarksheetModalOpen(false)}
                disabled={isDownloading}
                className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2.5 sm:py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-neutral-300 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50 text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => downloadMarksheet()}
                disabled={isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 sm:py-2 text-xs font-bold text-white shadow-xs hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Compiling TU PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Download Official Marksheet (PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
