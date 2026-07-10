"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Download, 
  RotateCcw, 
  Printer, 
  UploadCloud, 
  Sun, 
  Moon, 
  Eye, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  AlertCircle,
  Code,
  Image as ImageIcon,
  GraduationCap,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface FormData {
  collegeName: string;
  collegeLocation: string;
  subjectName: string;
  courseCode: string;
  program: string;
  semester: string;
  studentName: string;
  rollNumber: string;
  regdNumber: string;
  examRollNumber: string;
  batch: string;
  teacherName: string;
}

const SPECIMEN_POOL: FormData[] = [
  {
    collegeName: "Amrit Science Campus",
    collegeLocation: "Lainchaur, Kathmandu",
    subjectName: "Introduction to Information Technology",
    courseCode: "CSC 114",
    program: "BSc CSIT",
    semester: "First Semester",
    studentName: "Siddharth Shrestha",
    rollNumber: "15/82",
    regdNumber: "5-2-1234-567-2025",
    examRollNumber: "820015",
    batch: "2082",
    teacherName: "Prof. Dr. Hari Prasad",
  },
];

const EMPTY_DEFAULTS: FormData = {
  collegeName: "",
  collegeLocation: "",
  subjectName: "",
  courseCode: "",
  program: "",
  semester: "",
  studentName: "",
  rollNumber: "",
  regdNumber: "",
  examRollNumber: "",
  batch: "",
  teacherName: "",
};

export default function Home() {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // --- Form & Logo State ---
  const [formData, setFormData] = useState<FormData>(EMPTY_DEFAULTS);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [logoFilename, setLogoFilename] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);

  // --- UI Theme & Preview States ---
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [compiling, setCompiling] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initial Load (LocalStorage side effects & Safe hydration) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);

      // Always load Amrit Science Campus data on mount (per user request)
      setFormData(SPECIMEN_POOL[0]);

      const isDark = localStorage.getItem("theme") === "dark";
      if (isDark) {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove("dark");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // --- Logo session-only management (not saved to localStorage per user request) ---
  useEffect(() => {
    // Logo is intentionally kept in memory-only and discarded on refresh/clear.
  }, [logoBase64, logoFilename, isMounted]);

  // --- Typst Preview Compiler ---
  const compilePreview = useCallback(async () => {
    setCompiling(true);
    setCompileError("");
    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logoBase64,
          format: "svg",
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.details || "Failed to render preview");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err: any) {
      console.error(err);
      setCompileError(err.message || "An error occurred during rendering");
    } finally {
      setCompiling(false);
    }
  }, [formData, logoBase64]);

  // --- Real-time Typst compilation with debounce ---
  useEffect(() => {
    const handler = setTimeout(() => {
      compilePreview();
    }, 450); // 450ms debounce rate

    return () => clearTimeout(handler);
  }, [compilePreview]);


  // --- Form Handlers ---
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (window.confirm("Reset to sample cover page details? This will overwrite your inputs.")) {
      const randomIdx = Math.floor(Math.random() * SPECIMEN_POOL.length);
      setFormData(SPECIMEN_POOL[randomIdx]);
      setLogoBase64("");
      setLogoFilename("");
      localStorage.removeItem("tu_coverpage_form");
      localStorage.removeItem("tu_coverpage_logo_base64");
      localStorage.removeItem("tu_coverpage_logo_filename");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Logo Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match(/image\/(png|jpg|jpeg|svg\+xml)/)) {
      alert("Invalid file format. Please upload PNG, JPG, JPEG, or SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setLogoBase64(e.target.result);
        setLogoFilename(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoBase64("");
    setLogoFilename("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Download Handler ---
  const downloadDocument = async (format: string) => {
    setIsDownloading(format);
    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logoBase64,
          format,
        }),
      });

      if (!response.ok) throw new Error("Compilation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const fileExtension = format === "docx" ? "docx" : format === "typ" ? "typ" : format === "jpg" ? "jpeg" : format;
      a.download = `TU_Coverpage_${formData.subjectName.replace(/\s+/g, "_") || "LabReport"}.${fileExtension}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to export. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  };

  // --- Hidden iframe print engine (Gold Standard for web printing) ---
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          logoBase64,
          format: "pdf",
        }),
      });

      if (!response.ok) throw new Error("Failed to compile PDF for printing");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1500);
      };
    } catch (err) {
      console.error("Printing failed:", err);
      alert("Failed to print cover page.");
    } finally {
      setIsPrinting(false);
    }
  };

  // --- UI Theme Switcher ---
  const toggleTheme = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="min-h-screen pb-12 transition-colors duration-300 bg-[#F9FAFB] dark:bg-zinc-950 font-sans text-[#111827] dark:text-neutral-50">
      
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-[64px] max-w-7xl items-center justify-between px-4 sm:px-8">
          
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black flex items-center justify-center rounded-lg text-white dark:bg-white dark:text-black shrink-0">
              <span className="font-bold text-[10px] sm:text-xs">TU</span>
            </div>
            <h1 id="app-title" className="font-bold tracking-tight text-base sm:text-xl leading-none">
              TU <span className="text-gray-400">Coverify</span>
            </h1>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Status Indicator — dot only on mobile, full pill on sm+ */}
            <div className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 px-2 py-1 sm:px-3 sm:py-1.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  compiling ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="hidden sm:block font-mono text-[11px] font-medium text-gray-500 dark:text-neutral-400 whitespace-nowrap">
                {compiling ? 'Compiling…' : 'Typst Active'}
              </span>
            </div>

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 shrink-0"
              title="Toggle Light/Dark Theme"
            >
              {darkMode
                ? <Sun className="h-4 w-4 text-amber-500" />
                : <Moon className="h-4 w-4 text-zinc-600" />}
            </button>
          </div>

        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* --- LEFT SIDE: FORM & EXPORTS (7 Columns) --- */}
          <div className="space-y-6 lg:col-span-7">
            
            {/* Bento Card 1: Header Welcome / Context */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-950 dark:bg-zinc-800 dark:text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">TU Coverify</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                    Fill in your details and get a ready-to-print TU lab report cover page. No more fixing margins in Word — just type, preview, and download.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2: Interactive Input Form */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">Cover Page Fields</h3>
                </div>
              </div>

              {/* Form Layout: Grouped Sections */}
              <div className="mt-6 space-y-6">
                
                {/* Group A: Campus & Location */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                    <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">1. College Info</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">College Name</label>
                      <input
                        id="college-name-input"
                        type="text"
                        value={formData.collegeName}
                        onChange={(e) => handleInputChange("collegeName", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. Amrit Science Campus"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">College Location</label>
                      <input
                        id="college-location-input"
                        type="text"
                        value={formData.collegeLocation}
                        onChange={(e) => handleInputChange("collegeLocation", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. Lainchaur, Kathmandu"
                      />
                    </div>
                  </div>
                </div>

                {/* Group B: Academic / Report Info */}
                <div className="border-t border-gray-100 pt-5 dark:border-zinc-800">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                    <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">2. Subject Details</h4>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Subject Name</label>
                      <input
                        id="subject-name-input"
                        type="text"
                        value={formData.subjectName}
                        onChange={(e) => handleInputChange("subjectName", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. Introduction to Information Technology"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Course Code</label>
                      <input
                        id="course-code-input"
                        type="text"
                        value={formData.courseCode}
                        onChange={(e) => handleInputChange("courseCode", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. CSC 114"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Program / Degree</label>
                      <input
                        id="program-input"
                        type="text"
                        value={formData.program}
                        onChange={(e) => handleInputChange("program", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. BSc CSIT"
                      />
                    </div>
                  </div>
                </div>

                {/* Group C: Student Specific Info */}
                <div className="border-t border-gray-100 pt-5 dark:border-zinc-800">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                    <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">3. Your Details</h4>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Student Name</label>
                      <input
                        id="student-name-input"
                        type="text"
                        value={formData.studentName}
                        onChange={(e) => handleInputChange("studentName", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. Siddharth Shrestha"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Roll Number</label>
                      <input
                        id="roll-number-input"
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => handleInputChange("rollNumber", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. 15/82"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Semester</label>
                      <input
                        id="semester-input"
                        type="text"
                        value={formData.semester}
                        onChange={(e) => handleInputChange("semester", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. First Semester"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Batch Year</label>
                      <input
                        id="batch-input"
                        type="text"
                        value={formData.batch}
                        onChange={(e) => handleInputChange("batch", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. 2082"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">TU Registration No.</label>
                      <input
                        id="regd-number-input"
                        type="text"
                        value={formData.regdNumber}
                        onChange={(e) => handleInputChange("regdNumber", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. 5-2-1234-567-2025"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">TU Exam Roll No.</label>
                      <input
                        id="exam-roll-number-input"
                        type="text"
                        value={formData.examRollNumber}
                        onChange={(e) => handleInputChange("examRollNumber", e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                        placeholder="e.g. 820015"
                      />
                    </div>
                  </div>
                </div>

                {/* Group D: Teacher Info */}
                <div className="border-t border-gray-100 pt-5 dark:border-zinc-800">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2.5 dark:border-zinc-800/80">
                    <div className="h-4 w-1 rounded-full bg-black dark:bg-white" />
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 dark:text-neutral-400">4. Teacher</h4>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300">Teacher / Supervisor Name</label>
                    <input
                      id="teacher-name-input"
                      type="text"
                      value={formData.teacherName}
                      onChange={(e) => handleInputChange("teacherName", e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-neutral-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-950 dark:focus:border-white dark:focus:ring-white/5 transition-all"
                      placeholder="e.g. Prof. Dr. Hari Prasad"
                    />
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Bento Card 3: College Logo Upload */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">College Logo</h3>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
                {/* Drag-and-Drop Area */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex-1 w-full h-32 flex flex-col items-center justify-center rounded-xl border border-dashed transition-all cursor-pointer ${
                    dragActive 
                      ? "border-black bg-gray-50 dark:border-white dark:bg-zinc-800/50" 
                      : "border-gray-200 hover:border-black hover:bg-gray-50/50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="logo-upload-input"
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-300">Drag & drop logo here</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">PNG, JPG, JPEG, or SVG up to 2MB</p>
                </div>

                {/* Thumbnail Preview Card */}
                <div className="w-full sm:w-40 h-32 flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50 dark:border-zinc-800 dark:bg-zinc-950/80 p-3 shrink-0 relative">
                  {logoBase64 ? (
                    <>
                      <div className="relative h-16 w-16 bg-white p-1 rounded border border-gray-200 flex items-center justify-center">
                        <img 
                          id="logo-preview-thumbnail"
                          src={logoBase64} 
                          alt="Uploaded College Logo" 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 truncate w-32 mt-1.5 text-center font-medium">{logoFilename}</span>
                      <button
                        id="clear-logo-btn"
                        onClick={handleClearLogo}
                        className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors text-[10px] font-bold"
                        title="Remove Logo"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="relative h-16 w-16 bg-white p-2 rounded border border-gray-200 flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
                        <img 
                          src="/default_college_logo.svg" 
                          alt="Default College Logo" 
                          className="max-h-full max-w-full object-contain filter dark:invert"
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1.5 text-center font-bold uppercase tracking-wider">Default Logo</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Bento Card 4: Export Options Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
                <Download className="h-4 w-4 text-gray-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">Download Cover Page</h3>
              </div>

              {/* Download Buttons Matrix */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                
                {/* PDF */}
                <button
                  id="export-pdf-btn"
                  onClick={() => downloadDocument("pdf")}
                  disabled={isDownloading !== null || compiling}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3 hover:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 group-hover:scale-105 transition-transform dark:bg-red-500/10 dark:text-red-400">
                    {isDownloading === "pdf" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 dark:text-neutral-200">PDF</span>
                  <span className="text-[8px] text-gray-400 font-semibold uppercase mt-0.5">Print</span>
                </button>

                {/* DOCX */}
                <button
                  id="export-docx-btn"
                  onClick={() => downloadDocument("docx")}
                  disabled={isDownloading !== null || compiling}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3 hover:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform dark:bg-blue-500/10 dark:text-blue-400">
                    {isDownloading === "docx" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 dark:text-neutral-200">DOCX</span>
                  <span className="text-[8px] text-gray-400 font-semibold uppercase mt-0.5">Word</span>
                </button>

                {/* PNG */}
                <button
                  id="export-png-btn"
                  onClick={() => downloadDocument("png")}
                  disabled={isDownloading !== null || compiling}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3 hover:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform dark:bg-emerald-500/10 dark:text-emerald-400">
                    {isDownloading === "png" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 dark:text-neutral-200">PNG</span>
                  <span className="text-[8px] text-gray-400 font-semibold uppercase mt-0.5">Image</span>
                </button>

                {/* JPG */}
                <button
                  id="export-jpg-btn"
                  onClick={() => downloadDocument("jpg")}
                  disabled={isDownloading !== null || compiling}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3 hover:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform dark:bg-amber-500/10 dark:text-amber-400">
                    {isDownloading === "jpg" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 dark:text-neutral-200">JPG</span>
                  <span className="text-[8px] text-gray-400 font-semibold uppercase mt-0.5">Web</span>
                </button>

                {/* Typst source code */}
                <button
                  id="export-typst-btn"
                  onClick={() => downloadDocument("typ")}
                  disabled={isDownloading !== null || compiling}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-3 hover:border-black dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 transition-all cursor-pointer group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 group-hover:scale-105 transition-transform dark:bg-zinc-800 dark:text-zinc-100">
                    {isDownloading === "typ" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Code className="h-4 w-4" />}
                  </div>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 dark:text-neutral-200">SOURCE</span>
                  <span className="text-[8px] text-gray-400 font-semibold uppercase mt-0.5">Typst</span>
                </button>

              </div>
            </motion.div>

          </div>

          {/* --- RIGHT SIDE: LIVE COVER PAGE PREVIEW (5 Columns) --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-22 space-y-4">
            
            {/* Live Preview Bento Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm overflow-hidden"
            >
              
              {/* Preview Header & Action Menu */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-400">Live Preview</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center space-x-1 rounded-full border border-gray-200 bg-gray-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    <button
                      id="zoom-out-btn"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                      className="rounded-full p-1 hover:bg-white dark:hover:bg-zinc-800 text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-all"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1.5 font-mono text-[10px] font-bold text-gray-500">
                      {zoomLevel}%
                    </span>
                    <button
                      id="zoom-in-btn"
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                      className="rounded-full p-1 hover:bg-white dark:hover:bg-zinc-800 text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-all"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Document Canvas */}
              <div className="relative flex min-h-[580px] items-center justify-center bg-[#F3F4F6] p-6 dark:bg-zinc-950/70 overflow-auto">
                
                {/* Loader Overlay */}
                <AnimatePresence>
                  {compiling && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-zinc-900/70"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black shadow-md animate-spin mb-3">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <p className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">Generating Preview...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Compilation Error Notice */}
                {compileError && (
                  <div className="absolute inset-x-6 top-6 z-20 flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 animate-fade-in">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Compilation Error</p>
                      <p className="text-[11px] font-mono mt-1 text-red-600 dark:text-red-400 break-all leading-relaxed">{compileError}</p>
                    </div>
                  </div>
                )}

                {/* Document Stage */}
                <div 
                  id="preview-stage-container"
                  className="rounded bg-white shadow-xl border border-neutral-200/50 transition-all duration-300 origin-center max-w-full"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {previewUrl ? (
                    <img 
                      id="preview-rendered-image"
                      src={previewUrl} 
                      alt="TU Cover Page Preview" 
                      className="h-auto w-[420px] max-w-full select-none"
                      draggable={false}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    // Placeholder card layout (Skeleton)
                    <div className="flex h-[550px] w-[390px] flex-col justify-between p-8 text-neutral-300">
                      <div className="flex justify-between items-center">
                        <div className="h-10 w-10 rounded bg-neutral-200 animate-pulse" />
                        <div className="space-y-2 flex-1 mx-4">
                          <div className="h-4 w-3/4 rounded bg-neutral-200 animate-pulse mx-auto" />
                          <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse mx-auto" />
                        </div>
                        <div className="h-10 w-10 rounded bg-neutral-200 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-2 w-full rounded bg-neutral-200 animate-pulse" />
                        <div className="h-2 w-full rounded bg-neutral-200 animate-pulse" />
                        <div className="h-2 w-2/3 rounded bg-neutral-200 animate-pulse" />
                      </div>
                      <div className="flex justify-between">
                        <div className="space-y-2 w-1/2">
                          <div className="h-3 w-2/3 rounded bg-neutral-200 animate-pulse" />
                          <div className="h-3 w-3/4 rounded bg-neutral-200 animate-pulse" />
                          <div className="h-3 w-1/2 rounded bg-neutral-200 animate-pulse" />
                        </div>
                        <div className="space-y-2 w-1/3">
                          <div className="h-3 w-full rounded bg-neutral-200 animate-pulse" />
                          <div className="h-10 w-full rounded bg-neutral-200 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Preview Footer / Information */}
              <div className="bg-white px-5 py-3 border-t border-gray-100 dark:bg-zinc-900/50 dark:border-zinc-800 text-[10px] text-gray-400 uppercase tracking-widest text-center font-bold leading-normal">
                Made by Ankit Khatri KC
              </div>

            </motion.div>

          </div>

        </div>

      </main>

    </div>
  );
}
