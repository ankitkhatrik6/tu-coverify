"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Bot,
  BrainCircuit, 
  Check, 
  AlertCircle, 
  Loader2, 
  RotateCcw,
  ArrowRight,
  PlusCircle,
  Copy,
  Send,
  Lock,
  LogIn,
  UserCheck
} from "lucide-react";

export interface IndexRow {
  sn: string;
  title: string;
  date: string;
  signature: string;
}

interface LabIndexAIAssistantProps {
  currentIndexTitle: string;
  onApplyRows: (newRows: IndexRow[], newTitle?: string, mode?: "replace" | "append") => void;
  onClose?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    name: "Digital Logic (TU)",
    prompt: `Parse these Digital Logic experiments into clean, concise lab index titles:
Lab 1: Verification of truth tables of basic logic gates (AND, OR, NOT, NAND, NOR, XOR, XNOR) using 74xx series ICs.
Lab 2: To study and verify NAND and NOR gates as universal logic building blocks.
Lab 3: Experimental verification of De Morgan's First and Second Theorems.
Lab 4: Design and implementation of SOP and POS logic equations using minimal gates.
Lab 5: Design and construct Half Adder and Full Adder circuits and verify their sum and carry outputs.
Lab 6: Design and verify Half Subtractor and Full Subtractor circuits.
Lab 7: Implement 4-to-1 Multiplexer using basic logic gates and verify truth table.
Lab 8: Implementation of 3-to-8 Decoder and 8-to-3 Priority Encoder.
Lab 9: Verification of master-slave JK flip flop and D flip flop truth table and excitation table.
Lab 10: Design and test 4-bit Synchronous Up-Counter using JK flip flops.`,
  },
  {
    name: "C Programming & DSA",
    prompt: `Convert these C Programming questions into formal TU experiment titles starting with 'To write a program to...':
1. Write a C program to find the largest and smallest elements in an array and calculate their average.
2. Program to perform matrix addition, subtraction, and multiplication with dimension check.
3. Implementation of linear search and binary search algorithms.
4. Program to implement Bubble Sort and Selection Sort on a list of student records.
5. Create a structure for student database (name, roll, marks of 5 subjects) and display merit list.
6. Implementation of Stack using Array with Push, Pop, and Display operations.
7. Implementation of Queue and Circular Queue using Array.
8. Implementation of Singly Linked List with insertion and deletion.`,
  },
  {
    name: "Microprocessor 8085",
    prompt: `Extract these 8085 microprocessor questions and make titles short and crisp (under 10 words):
Experiment 1: Write an assembly language program to transfer a block of data from memory location 2050H to 2070H.
Experiment 2: Write 8085 assembly program to add two 16-bit numbers stored in memory and store the result with carry.
Experiment 3: Program to find the largest number among a series of 10 data bytes.
Experiment 4: Program to sort an array of 8-bit numbers in ascending order using bubble sort algorithm.
Experiment 5: Write program to convert packed BCD to ASCII and ASCII to packed BCD.
Experiment 6: Interfacing 8255 PPI with 8085 to generate square wave using timer delay routine.`,
  }
];

export default function LabIndexAIAssistant({
  currentIndexTitle,
  onApplyRows,
}: LabIndexAIAssistantProps) {
  const { user, setShowAuthModal, setAuthModalView, setAuthModalMessage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedResult, setParsedResult] = useState<{
    indexTitle: string;
    rows: IndexRow[];
    modelUsed: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const getDeviceId = () => {
    if (typeof window === "undefined") return "";
    let storedId = localStorage.getItem("tu_coverify_device_id");
    if (!storedId) {
      storedId = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem("tu_coverify_device_id", storedId);
    }
    return storedId;
  };

  const handleOpenAuthModal = () => {
    setAuthModalView("signin");
    setAuthModalMessage("Please sign in with your student account to use the AI Lab Index Assistant.");
    setShowAuthModal(true);
  };

  const handleToggle = () => {
    if (!user) {
      handleOpenAuthModal();
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleGenerate = async () => {
    if (!user) {
      handleOpenAuthModal();
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter your prompt or paste your lab questions.");
      return;
    }

    setLoading(true);
    setError("");
    setParsedResult(null);

    try {
      const devId = getDeviceId();
      const response = await fetch("/api/ai/lab-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          indexTitle: currentIndexTitle,
          deviceId: devId || undefined,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      let data: { error?: string; indexTitle?: string; rows?: IndexRow[]; modelUsed?: string } = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to process with AI");
      }

      if (!data.rows || !Array.isArray(data.rows)) {
        throw new Error("Invalid response received from AI assistant.");
      }

      setParsedResult({
        indexTitle: data.indexTitle || currentIndexTitle,
        rows: data.rows,
        modelUsed: data.modelUsed || "Groq AI",
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (applyMode: "replace" | "append") => {
    if (!parsedResult || parsedResult.rows.length === 0) return;
    onApplyRows(parsedResult.rows, parsedResult.indexTitle, applyMode);
    setIsOpen(false);
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-xs">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black shadow-xs">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                AI Lab Index Assistant
              </h4>
              {user ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  <UserCheck className="h-2.5 w-2.5" />
                  Logged In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                  <Lock className="h-2.5 w-2.5" />
                  Login Required
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-zinc-400 leading-tight">
              {user
                ? "Type or paste your lab questions and describe how to format your index table."
                : "Exclusively for logged-in students to automatically format experiments."}
            </p>
          </div>
        </div>

        {user ? (
          <button
            id="toggle-ai-assistant-btn"
            type="button"
            onClick={handleToggle}
            className="flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <BrainCircuit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 dark:text-emerald-600" />
            {isOpen ? "Close Assistant" : "Auto-Fill with AI"}
          </button>
        ) : (
          <button
            id="btn-login-for-ai-assistant"
            type="button"
            onClick={handleOpenAuthModal}
            className="flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in to Use AI
          </button>
        )}
      </div>

      {/* When user is NOT logged in and tries to view or open */}
      {!user && isOpen && (
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Student Account Required</p>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Please sign in with your student account to automatically generate, format, and apply lab index tables with AI.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAuthModal}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shrink-0"
          >
            <LogIn className="h-3 w-3" />
            Sign In Now
          </button>
        </div>
      )}

      {/* Expandable Assistant Panel (Available for Logged-In Users) */}
      {user && isOpen && (
        <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4 dark:border-zinc-800">
          
          {/* Single Unified Prompt Field */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
              <label className="text-xs sm:text-sm font-semibold text-neutral-700 dark:text-zinc-300">
                Prompt & Lab Questions
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(sample.prompt);
                      setError("");
                    }}
                    className="text-[10px] sm:text-xs text-neutral-600 hover:text-black dark:text-zinc-400 dark:hover:text-white underline decoration-dotted px-1.5 py-1 rounded hover:bg-white/60 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    title={`Load ${sample.name} prompt`}
                  >
                    Sample: {sample.name.split(" ")[0]}
                  </button>
                ))}
                {prompt && (
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="text-[10px] sm:text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 flex items-center gap-0.5 cursor-pointer ml-1 py-1"
                  >
                    <RotateCcw className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={10}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your instructions and paste your lab questions here..."
              className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 font-mono resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Action Button */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              id="run-groq-ai-btn"
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Preview of AI Parsed Results */}
          {parsedResult && (
            <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-950 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                    <Check className="h-3 w-3" />
                  </span>
                  <h5 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Generated {parsedResult.rows.length} Index Rows ({parsedResult.modelUsed})
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const textData = parsedResult.rows.map(r => `${r.sn}. ${r.title} ${r.date ? `(${r.date})` : ''}`).join('\n');
                    navigator.clipboard.writeText(textData);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-2.5 w-2.5" />
                  {copied ? "Copied!" : "Copy Text"}
                </button>
              </div>

              {/* Rows preview list */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-100 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950 space-y-2 text-xs divide-y divide-gray-100 dark:divide-zinc-800">
                {parsedResult.rows.map((row, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                    <span className="font-mono font-bold text-neutral-400 dark:text-zinc-500 text-[11px] shrink-0 w-6">
                      #{row.sn}
                    </span>
                    <div className="flex-1 text-neutral-800 dark:text-zinc-200 text-xs">
                      {row.title}
                    </div>
                    {row.date && (
                      <span className="font-mono text-[10px] text-neutral-500 dark:text-zinc-400 bg-neutral-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded shrink-0">
                        {row.date}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons to apply */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApply("append")}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Append to Existing Rows
                </button>
                <button
                  type="button"
                  onClick={() => handleApply("replace")}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Replace All Rows & Apply
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
