"use client";

import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Plus,
  Search,
  Eye,
  Check,
  AlertCircle,
  FolderArchive,
  Printer,
  Layers,
  Building2,
  BookOpen,
  X,
  GraduationCap,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import TUCollegeAutocomplete from "@/components/TUCollegeAutocomplete";
import TUCourseAutocomplete from "@/components/TUCourseAutocomplete";
import { TUCollege } from "@/lib/tu-colleges";
import { TUCourse } from "@/lib/tu-courses";

export interface BatchStudent {
  id: string;
  name: string;
  rollNumber: string;
  regdNumber: string;
  examRollNumber: string;
}

export interface ClassInfo {
  collegeName: string;
  collegeLocation: string;
  facultyOrInstitute: string;
  subjectName: string;
  courseCode: string;
  program: string;
  semester: string;
  batch: string;
  teacherName: string;
  teacherDepartment: string;
  logoBase64?: string;
}

interface CRBulkCoverGeneratorProps {
  initialClassInfo?: Partial<ClassInfo>;
  onSyncWithSingle?: () => Partial<ClassInfo>;
}

const DEFAULT_CLASS_INFO: ClassInfo = {
  collegeName: "Amrit Science Campus",
  collegeLocation: "Lainchaur, Kathmandu",
  facultyOrInstitute: "Institute of Science and Technology",
  subjectName: "Microprocessor",
  courseCode: "CSC 167",
  program: "B.Sc. CSIT",
  semester: "Second Semester",
  batch: "2082",
  teacherName: "Mr. Kiran Joshi",
  teacherDepartment: "Department of CSIT",
};

export default function CRBulkCoverGenerator({ initialClassInfo, onSyncWithSingle }: CRBulkCoverGeneratorProps) {
  // Class configuration state
  const [classInfo, setClassInfo] = useState<ClassInfo>({
    ...DEFAULT_CLASS_INFO,
    ...(initialClassInfo || {}),
  });

  // Students roster state
  const [students, setStudents] = useState<BatchStudent[]>([]);

  // Tab & Input modes
  const [inputTab, setInputTab] = useState<"upload" | "manual">("upload");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showClassDetails, setShowClassDetails] = useState<boolean>(true);

  // Manual row input
  const [manualName, setManualName] = useState("");
  const [manualRoll, setManualRoll] = useState("");
  const [manualRegd, setManualRegd] = useState("");
  const [manualExamRoll, setManualExamRoll] = useState("");

  // Generation & Status states
  const [isGeneratingCombined, setIsGeneratingCombined] = useState<boolean>(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CSV / TSV Parsing Logic ---
  const parseRosterText = (rawText: string): BatchStudent[] => {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : (firstLine.includes(";") ? ";" : ",");

    const splitLine = (line: string): string[] => {
      const res: string[] = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (c === delimiter && !inQ) {
          res.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      res.push(cur.trim());
      return res;
    };

    const rawRows = lines.map(splitLine);
    if (rawRows.length === 0) return [];

    const headerTokens = rawRows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    let nameIdx = -1;
    let rollIdx = -1;
    let regdIdx = -1;
    let examRollIdx = -1;

    headerTokens.forEach((col, idx) => {
      if (col.includes("name") || col.includes("student")) nameIdx = idx;
      else if (col.includes("exam") || col.includes("board")) examRollIdx = idx;
      else if (col.includes("reg") || col.includes("registration")) regdIdx = idx;
      else if (col.includes("roll") || col.includes("symbol") || col.includes("crroll")) rollIdx = idx;
    });

    const hasHeader = nameIdx !== -1 || rollIdx !== -1 || regdIdx !== -1;
    const dataRows = hasHeader ? rawRows.slice(1) : rawRows;

    if (!hasHeader) {
      nameIdx = 0;
      rollIdx = 1;
      regdIdx = 2;
      examRollIdx = 3;
    }

    const parsedList: BatchStudent[] = [];
    dataRows.forEach((r, idx) => {
      const name = (nameIdx !== -1 && r[nameIdx]) ? r[nameIdx] : (r[0] || "");
      const roll = (rollIdx !== -1 && r[rollIdx]) ? r[rollIdx] : (r[1] || "");
      const regd = (regdIdx !== -1 && r[regdIdx]) ? r[regdIdx] : (r[2] || "");
      const examRoll = (examRollIdx !== -1 && r[examRollIdx]) ? r[examRollIdx] : (r[3] || "");

      if (name.trim() || roll.trim()) {
        parsedList.push({
          id: `st_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          name: name.trim(),
          rollNumber: roll.trim(),
          regdNumber: regd.trim(),
          examRollNumber: examRoll.trim(),
        });
      }
    });

    return parsedList;
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseRosterText(text);
        if (parsed.length > 0) {
          setStudents(parsed);
          setStatusMessage(`Successfully imported ${parsed.length} students from ${file.name}`);
          setErrorMessage("");
        } else {
          setErrorMessage(`No valid student entries found in ${file.name}. Ensure it has columns for Name, Roll No, and Regd No.`);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseRosterText(text);
        if (parsed.length > 0) {
          setStudents(parsed);
          setStatusMessage(`Successfully imported ${parsed.length} students from ${file.name}`);
          setErrorMessage("");
        } else {
          setErrorMessage(`No valid student entries found in ${file.name}.`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleAddManualStudent = () => {
    if (!manualName.trim() && !manualRoll.trim()) {
      setErrorMessage("Please provide at least a Student Name or Roll Number.");
      return;
    }
    const newStudent: BatchStudent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: manualName.trim(),
      rollNumber: manualRoll.trim(),
      regdNumber: manualRegd.trim(),
      examRollNumber: manualExamRoll.trim(),
    };
    setStudents([...students, newStudent]);
    setManualName("");
    setManualRoll("");
    setManualRegd("");
    setManualExamRoll("");
    setErrorMessage("");
    setStatusMessage(`Added ${newStudent.name || "student"} to roster.`);
  };

  const handleUpdateStudent = (id: string, field: keyof BatchStudent, val: string) => {
    setStudents(students.map((st) => (st.id === id ? { ...st, [field]: val } : st)));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter((st) => st.id !== id));
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setStudents([]);
    setConfirmClear(false);
    setStatusMessage("Student roster cleared.");
  };

  // --- Preview Handler ---
  const handleOpenPreview = async (idx = 0) => {
    if (students.length === 0) {
      setErrorMessage("Add at least one student to preview.");
      return;
    }
    const targetIdx = Math.max(0, Math.min(students.length - 1, idx));
    setPreviewIndex(targetIdx);
    setPreviewOpen(true);
    setPreviewLoading(true);

    try {
      const payload = {
        documentType: "batch_cover",
        batchFormat: "preview",
        previewIndex: targetIdx,
        ...classInfo,
        students,
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let err: any = {};
        try { err = await res.json(); } catch(e) { err = { details: `Server error: ${res.statusText || res.status}` }; }
        throw new Error(err.details || err.error || "Failed to render sample preview");
      }

      let svgText = await res.text();
      // Ensure SVG scales responsively across all viewports
      svgText = svgText.replace(/width="[0-9.]+pt"/g, 'width="100%"');
      svgText = svgText.replace(/height="[0-9.]+pt"/g, 'height="100%"');
      setPreviewSvg(svgText);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  // --- Batch Download: Combined PDF ---
  const handleDownloadCombinedPDF = async () => {
    if (students.length === 0) {
      setErrorMessage("Cannot generate PDF: Roster is empty. Please add or upload students.");
      return;
    }

    setIsGeneratingCombined(true);
    setStatusMessage(`Compiling combined multi-page PDF for ${students.length} students via Typst...`);
    setErrorMessage("");

    try {
      const payload = {
        documentType: "batch_cover",
        batchFormat: "combined_pdf",
        ...classInfo,
        students,
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let err: any = {};
        try { err = await res.json(); } catch(e) { err = { details: `Server error: ${res.statusText || res.status}` }; }
        throw new Error(err.details || err.error || "Failed to generate combined PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeCourse = (classInfo.courseCode || classInfo.subjectName || "Batch").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeSem = (classInfo.semester || "Class").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `TU_Cover_Batch_${safeCourse}_${safeSem}_Combined_${students.length}_Students.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Successfully generated and downloaded combined PDF (${students.length} pages).`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error generating combined PDF");
    } finally {
      setIsGeneratingCombined(false);
    }
  };

  // --- Batch Download: ZIP Archive ---
  const handleDownloadZip = async () => {
    if (students.length === 0) {
      setErrorMessage("Cannot generate ZIP: Roster is empty. Please add or upload students.");
      return;
    }

    setIsGeneratingZip(true);
    setStatusMessage(`Compiling ${students.length} individual PDFs and packaging into ZIP...`);
    setErrorMessage("");

    try {
      const payload = {
        documentType: "batch_cover",
        batchFormat: "zip",
        ...classInfo,
        students,
      };

      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let err: any = {};
        try { err = await res.json(); } catch(e) { err = { details: `Server error: ${res.statusText || res.status}` }; }
        throw new Error(err.details || err.error || "Failed to package ZIP");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeCourse = (classInfo.courseCode || classInfo.subjectName || "Batch").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeSem = (classInfo.semester || "Class").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `TU_Cover_Batch_${safeCourse}_${safeSem}_${students.length}_Students.zip`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage(`Successfully generated and downloaded ZIP archive with ${students.length} student PDFs.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error generating ZIP archive");
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Filtered students for table search
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.regdNumber.toLowerCase().includes(q) ||
      s.examRollNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Feature Intro */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black shadow-xs">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white">
                Bulk Cover Generator
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
              Upload a spreadsheet or CSV with student names and roll numbers to generate a batch of official
              Tribhuvan University cover pages for your whole class in a single multi-page PDF or organized ZIP archive.
            </p>
          </div>
        </div>

        {/* Notifications & Status Banner */}
        {statusMessage && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage("")} className="text-rose-600 hover:text-rose-800">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 1. Class & Course Details Accordion */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowClassDetails(!showClassDetails)}
            className="flex items-center gap-2.5 text-left font-bold text-sm text-gray-900 dark:text-white hover:text-black dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-black dark:text-white" />
            <span>Class &amp; Subject Details (Shared on All Pages)</span>
            {showClassDetails ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span className="text-xs text-gray-500 dark:text-neutral-400">
            {classInfo.subjectName} ({classInfo.courseCode}) • {classInfo.collegeName}
          </span>
        </div>

        <AnimatePresence>
          {showClassDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-5 pt-1"
            >
              {/* Group 1: College & Faculty Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                  <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">1. College &amp; Faculty Info</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Faculty / Institute</label>
                    <input
                      id="batch-faculty-institute-input"
                      type="text"
                      value={classInfo.facultyOrInstitute}
                      onChange={(e) => setClassInfo({ ...classInfo, facultyOrInstitute: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Institute of Science and Technology"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">College Name</label>
                    <div className="mt-1.5">
                      <TUCollegeAutocomplete
                        id="batch-college-name-input"
                        value={classInfo.collegeName}
                        onChange={(val) => setClassInfo({ ...classInfo, collegeName: val })}
                        onSelectCollege={(c: TUCollege) =>
                          setClassInfo({
                            ...classInfo,
                            collegeName: c.name,
                            collegeLocation: c.location,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. Amrit Science Campus"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">College Location</label>
                    <input
                      id="batch-college-location-input"
                      type="text"
                      value={classInfo.collegeLocation}
                      onChange={(e) => setClassInfo({ ...classInfo, collegeLocation: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Lainchaur, Kathmandu"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Subject Details */}
              <div className="border-t border-gray-100 pt-5 dark:border-zinc-800 space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                  <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">2. Subject Details</h4>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Subject Name
                    </label>
                    <div className="mt-1.5">
                      <TUCourseAutocomplete
                        id="batch-subject-name-input"
                        value={classInfo.subjectName}
                        onChange={(val) => setClassInfo({ ...classInfo, subjectName: val })}
                        onSelectCourse={(course: TUCourse) =>
                          setClassInfo({
                            ...classInfo,
                            subjectName: course.title,
                            courseCode: course.code,
                            semester: course.semesterName,
                            program: course.program,
                          })
                        }
                        searchType="title"
                        placeholder="e.g. Microprocessor, C Programming, Discrete Structure..."
                        className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Course Code
                    </label>
                    <input
                      id="batch-course-code-input"
                      type="text"
                      value={classInfo.courseCode}
                      onChange={(e) => setClassInfo({ ...classInfo, courseCode: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. CSC 167"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Program
                    </label>
                    <input
                      id="batch-program-input"
                      type="text"
                      value={classInfo.program}
                      onChange={(e) => setClassInfo({ ...classInfo, program: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. B.Sc. CSIT"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Semester
                    </label>
                    <input
                      id="batch-semester-input"
                      type="text"
                      value={classInfo.semester}
                      onChange={(e) => setClassInfo({ ...classInfo, semester: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Second Semester"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Batch (B.S. Year)
                    </label>
                    <input
                      id="batch-year-input"
                      type="text"
                      value={classInfo.batch}
                      onChange={(e) => setClassInfo({ ...classInfo, batch: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. 2082"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Teacher Name (Submitted To)
                    </label>
                    <input
                      id="batch-teacher-name-input"
                      type="text"
                      value={classInfo.teacherName}
                      onChange={(e) => setClassInfo({ ...classInfo, teacherName: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Mr. Kiran Joshi"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">
                      Teacher Department
                    </label>
                    <input
                      id="batch-teacher-dept-input"
                      type="text"
                      value={classInfo.teacherDepartment}
                      onChange={(e) => setClassInfo({ ...classInfo, teacherDepartment: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Department of CSIT"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Roster Upload & Input Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black font-bold text-xs">
              2
            </span>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Student Roster Input
            </h3>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-neutral-200">
              {students.length} {students.length === 1 ? "Student" : "Students"}
            </span>
          </div>

          {/* Sub-tabs for input mode */}
          <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setInputTab("upload")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all cursor-pointer ${
                inputTab === "upload"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-zinc-700 dark:text-white font-semibold"
                  : "text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setInputTab("manual")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 transition-all cursor-pointer ${
                inputTab === "manual"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-zinc-700 dark:text-white font-semibold"
                  : "text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Upload File */}
        {inputTab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDropFile}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-black bg-gray-50 dark:border-white dark:bg-zinc-800/60"
                  : "border-gray-300 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-zinc-600"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-white mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Click to browse or drag and drop your Class Roster CSV / TSV file
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                Supports .CSV, .TSV, and .TXT files exported from Google Sheets or Microsoft Excel.
              </p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-neutral-500">
                Expected columns: <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-700 dark:text-neutral-300">Name</code>,{" "}
                <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-700 dark:text-neutral-300">Roll Number</code>,{" "}
                <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-700 dark:text-neutral-300">Registration Number</code>,{" "}
                <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-gray-700 dark:text-neutral-300">Exam Roll Number</code>
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Add Student Manually */}
        {inputTab === "manual" && (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Student Name"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  Roll No. *
                </label>
                <input
                  type="text"
                  value={manualRoll}
                  onChange={(e) => setManualRoll(e.target.value)}
                  placeholder="e.g. 01/82"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  TU Regd. No.
                </label>
                <input
                  type="text"
                  value={manualRegd}
                  onChange={(e) => setManualRegd(e.target.value)}
                  placeholder="5-2-0033-0101-2022"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-neutral-300 mb-1">
                  Exam Roll No. (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualExamRoll}
                    onChange={(e) => setManualExamRoll(e.target.value)}
                    placeholder="e.g. 820001"
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualStudent}
                    className="inline-flex items-center justify-center rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shrink-0 shadow-xs cursor-pointer"
                    title="Add student to class roster"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Interactive Student Roster Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or roll number..."
                className="w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview(0)}
                disabled={students.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-black hover:text-black disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:border-zinc-500 transition-colors shadow-xs cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-black dark:text-white" />
                <span>Preview Student #1</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={students.length === 0}
                onMouseLeave={() => {
                  if (confirmClear) {
                    setTimeout(() => setConfirmClear(false), 3000);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  confirmClear
                    ? "bg-rose-600 text-white shadow-xs animate-pulse"
                    : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400"
                }`}
                title={confirmClear ? "Click again to confirm clearing roster" : "Clear all students from roster"}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{confirmClear ? "Confirm Clear?" : "Clear Roster"}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 dark:bg-zinc-800/80 dark:text-neutral-300 border-b border-gray-200 dark:border-zinc-700">
                  <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-2.5 px-3 font-bold min-w-[180px]">Student Full Name</th>
                  <th className="py-2.5 px-3 font-bold w-28">Roll No.</th>
                  <th className="py-2.5 px-3 font-bold min-w-[160px]">TU Registration No.</th>
                  <th className="py-2.5 px-3 font-bold w-28">Exam Roll</th>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-neutral-400">
                      {students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                          <p className="font-semibold text-sm">No students in roster yet</p>
                          <p className="text-xs text-gray-400">
                            Upload a CSV spreadsheet or add students above to begin.
                          </p>
                        </div>
                      ) : (
                        <p>No students match your search query &ldquo;{searchQuery}&rdquo;</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-2 px-3 text-center font-mono text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => handleUpdateStudent(student.id, "name", e.target.value)}
                          placeholder="Student Name"
                          className="w-full rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent px-2 py-1 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none dark:text-white dark:focus:bg-zinc-800 dark:hover:border-zinc-700"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={student.rollNumber}
                          onChange={(e) => handleUpdateStudent(student.id, "rollNumber", e.target.value)}
                          placeholder="Roll No"
                          className="w-full rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent px-2 py-1 text-xs font-mono font-medium text-gray-900 focus:bg-white focus:outline-none dark:text-white dark:focus:bg-zinc-800 dark:hover:border-zinc-700"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={student.regdNumber}
                          onChange={(e) => handleUpdateStudent(student.id, "regdNumber", e.target.value)}
                          placeholder="Regd Number"
                          className="w-full rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent px-2 py-1 text-xs font-mono text-gray-900 focus:bg-white focus:outline-none dark:text-white dark:focus:bg-zinc-800 dark:hover:border-zinc-700"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={student.examRollNumber}
                          onChange={(e) => handleUpdateStudent(student.id, "examRollNumber", e.target.value)}
                          placeholder="Exam Roll"
                          className="w-full rounded border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent px-2 py-1 text-xs font-mono text-gray-900 focus:bg-white focus:outline-none dark:text-white dark:focus:bg-zinc-800 dark:hover:border-zinc-700"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="rounded p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete student"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Generation & Export Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-gray-950 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-black dark:text-white" />
              <span>Generate Class Cover Pages</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Ready to compile {students.length} cover pages for <strong>{classInfo.subjectName || "Subject"}</strong> ({classInfo.courseCode || "Course"}) • {classInfo.semester || "Semester"}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Action 1: Combined Multi-Page PDF */}
            <button
              id="bulk-download-pdf-btn"
              type="button"
              onClick={handleDownloadCombinedPDF}
              disabled={isGeneratingCombined || isGeneratingZip || students.length === 0}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-black px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              {isGeneratingCombined ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-black border-t-transparent" />
              ) : (
                <FileText className="h-4 w-4 shrink-0" />
              )}
              <span>Download Combined PDF ({students.length} Pages)</span>
            </button>

            {/* Primary Action 2: ZIP of Individual PDFs */}
            <button
              id="bulk-download-zip-btn"
              type="button"
              onClick={handleDownloadZip}
              disabled={isGeneratingCombined || isGeneratingZip || students.length === 0}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-gray-900 hover:border-black hover:text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800/80 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              {isGeneratingZip ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 dark:border-white border-t-transparent" />
              ) : (
                <FolderArchive className="h-4 w-4 shrink-0 text-gray-700 dark:text-neutral-300" />
              )}
              <span>Download ZIP (Individual PDFs)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Sample Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col w-full max-w-4xl h-[92vh] max-h-[92vh] rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 sm:px-5 py-3 dark:border-zinc-800 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-gray-950 dark:text-white shrink-0">
                    Cover Page Preview
                  </h3>
                  {students[previewIndex] && (
                    <span className="text-xs text-gray-500 dark:text-neutral-400 font-medium truncate max-w-[140px] sm:max-w-xs">
                      ({students[previewIndex].name} • Roll: {students[previewIndex].rollNumber || "N/A"})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Student Switcher */}
                  {students.length > 1 && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5 sm:p-1 text-xs">
                      <button
                        type="button"
                        disabled={previewIndex <= 0 || previewLoading}
                        onClick={() => handleOpenPreview(previewIndex - 1)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors font-medium text-gray-700 dark:bg-zinc-700 dark:text-neutral-200 shadow-2xs cursor-pointer text-[11px]"
                      >
                        ← Prev
                      </button>
                      <span className="px-1.5 font-mono text-[11px] font-semibold text-gray-700 dark:text-neutral-300">
                        {previewIndex + 1} / {students.length}
                      </span>
                      <button
                        type="button"
                        disabled={previewIndex >= students.length - 1 || previewLoading}
                        onClick={() => handleOpenPreview(previewIndex + 1)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors font-medium text-gray-700 dark:bg-zinc-700 dark:text-neutral-200 shadow-2xs cursor-pointer text-[11px]"
                      >
                        Next →
                      </button>
                    </div>
                  )}

                  {/* Zoom Controls */}
                  <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(60, z - 15))}
                      className="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-neutral-300 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(100)}
                      className="px-1.5 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-700 text-[11px] font-mono text-gray-600 dark:text-neutral-300 cursor-pointer"
                      title="Reset Zoom"
                    >
                      {previewZoom}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(180, z + 15))}
                      className="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-neutral-300 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewOpen(false)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Full Responsive A4 Document Canvas */}
              <div className="flex-1 overflow-auto p-3 sm:p-6 flex items-start sm:items-center justify-center bg-gray-100 dark:bg-zinc-950/80">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3 my-auto">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Compiling vector preview in Typst...</p>
                  </div>
                ) : previewSvg ? (
                  <div
                    className="relative flex items-center justify-center transition-transform duration-200 ease-out origin-top my-auto"
                    style={{ transform: `scale(${previewZoom / 100})` }}
                  >
                    <div className="w-[88vw] max-w-[560px] sm:max-w-[620px] aspect-[1/1.414] bg-white rounded-md shadow-2xl border border-neutral-300 dark:border-zinc-700 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
                      <div
                        className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                        dangerouslySetInnerHTML={{ __html: previewSvg }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 my-auto">No preview available.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 px-4 sm:px-5 py-3 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Every page in your batch uses this exact layout, typography, and formatting.
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-black dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
