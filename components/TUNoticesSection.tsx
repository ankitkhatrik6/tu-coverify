"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Bell,
  Search,
  RefreshCw,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Filter,
  CheckCircle2,
  Download,
  BookOpen
} from "lucide-react";
import type { Notice, NoticeDetail } from "tu-scraper";

export interface InstituteTab {
  id: string;
  label: string;
  fullTitle: string;
  portalUrl: string;
  badgeColor: string;
  borderColor: string;
  textColor: string;
}

const INSTITUTES: InstituteTab[] = [
  {
    id: "all",
    label: "All Notices",
    fullTitle: "All Tribhuvan University Portals",
    portalUrl: "https://tu.edu.np",
    badgeColor: "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-neutral-200",
    borderColor: "border-gray-300 dark:border-zinc-700",
    textColor: "text-gray-900 dark:text-white",
  },
  {
    id: "ioe",
    label: "IOE",
    fullTitle: "Institute of Engineering (Pulchowk)",
    portalUrl: "https://ioe.tu.edu.np",
    badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300",
    borderColor: "border-amber-300 dark:border-amber-800/80",
    textColor: "text-amber-800 dark:text-amber-300",
  },
  {
    id: "iost",
    label: "IOST",
    fullTitle: "Institute of Science & Technology (Dean Office)",
    portalUrl: "https://iost.tu.edu.np",
    badgeColor: "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-800/80",
    textColor: "text-blue-800 dark:text-blue-300",
  },
  {
    id: "iaas",
    label: "IAAS",
    fullTitle: "Institute of Agriculture & Animal Science",
    portalUrl: "https://iaas.tu.edu.np",
    badgeColor: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300",
    borderColor: "border-emerald-300 dark:border-emerald-800/80",
    textColor: "text-emerald-800 dark:text-emerald-300",
  },
  {
    id: "fohss",
    label: "FOHSS",
    fullTitle: "Faculty of Humanities & Social Sciences",
    portalUrl: "https://fohss.tu.edu.np",
    badgeColor: "bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-800/80",
    textColor: "text-purple-800 dark:text-purple-300",
  },
  {
    id: "foe",
    label: "FOE",
    fullTitle: "Faculty of Education",
    portalUrl: "https://foe.tu.edu.np",
    badgeColor: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300",
    borderColor: "border-rose-300 dark:border-rose-800/80",
    textColor: "text-rose-800 dark:text-rose-300",
  },
  {
    id: "fol",
    label: "FOL",
    fullTitle: "Faculty of Law",
    portalUrl: "https://fol.tu.edu.np",
    badgeColor: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300",
    borderColor: "border-indigo-300 dark:border-indigo-800/80",
    textColor: "text-indigo-800 dark:text-indigo-300",
  },
  {
    id: "iof",
    label: "IOF",
    fullTitle: "Institute of Forestry",
    portalUrl: "https://iof.tu.edu.np",
    badgeColor: "bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300",
    borderColor: "border-teal-300 dark:border-teal-800/80",
    textColor: "text-teal-800 dark:text-teal-300",
  },
];

export default function TUNoticesSection() {
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [, startTransition] = useTransition();

  // Selected notice for detail modal view
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [noticeDetail, setNoticeDetail] = useState<NoticeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string>("");

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch notices whenever source or search changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchNoticesData() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("source", selectedSource);
        if (debouncedQuery.trim()) {
          params.set("q", debouncedQuery.trim());
        }

        const res = await fetch(`/api/notices?${params.toString()}`);
        const data = await res.json();

        if (isCancelled) return;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load notices");
        }

        startTransition(() => {
          setNotices(data.notices || []);
        });
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("Notice fetch error:", err);
        setError(err instanceof Error ? err.message : "Unable to retrieve notices from TU portal.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchNoticesData();

    return () => {
      isCancelled = true;
    };
  }, [selectedSource, debouncedQuery]);

  // Fetch detail when a notice is clicked
  const handleOpenDetail = async (notice: Notice) => {
    setActiveNotice(notice);
    setNoticeDetail(null);
    setDetailLoading(true);
    setDetailError("");

    try {
      const params = new URLSearchParams({
        url: notice.url,
        detailSource: notice.source,
      });

      const res = await fetch(`/api/notices?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not retrieve full notice details.");
      }

      setNoticeDetail(data.detail);
    } catch (err: unknown) {
      console.error("Detail error:", err);
      setDetailError(err instanceof Error ? err.message : "Could not fetch deep notice content.");
    } finally {
      setDetailLoading(false);
    }
  };

  const getBadgeStyle = (src: string) => {
    const found = INSTITUTES.find((i) => i.id === src.toLowerCase());
    return found
      ? found.badgeColor
      : "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-neutral-200";
  };

  const getSourceLabel = (src: string) => {
    const found = INSTITUTES.find((i) => i.id === src.toLowerCase());
    return found ? found.label : src.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Bell className="h-5 w-5 animate-bounce-subtle" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Official Tribhuvan University Notices
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Updates directly from official dean offices, faculties, institutes, and campuses.
            </p>
          </div>
        </div>

        {/* Source Documentation Link */}
        <a
          href="https://tu-scraper.js.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center self-start sm:self-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-950 dark:text-neutral-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>tu-scraper docs</span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>
      </div>

      {/* Institute Tabs & Search Controls */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, exam, routine, admission..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs sm:text-sm text-gray-950 placeholder:text-gray-400 focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-neutral-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950 dark:focus:border-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setDebouncedQuery("");
              setLoading(true);
              fetch(`/api/notices?source=${selectedSource}&bypassCache=true`)
                .then((r) => r.json())
                .then((d) => setNotices(d.notices || []))
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-neutral-200 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh latest notices"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Faculty & Institute Filter Buttons */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-2">
            <Filter className="h-3 w-3" />
            <span>Select Institute / Faculty</span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {INSTITUTES.map((inst) => {
              const isSelected = selectedSource === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedSource(inst.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-zinc-950/60 dark:text-neutral-300 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{inst.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notices List Display */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 dark:text-neutral-500 mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Fetching notices from Tribhuvan University…
          </p>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            Retrieving latest academic updates and attachments.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-red-900 dark:text-red-200">Unable to Fetch Notices</h4>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => setSelectedSource("all")}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry All Sources
          </button>
        </div>
      ) : notices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-zinc-800/80 dark:bg-zinc-900 shadow-sm">
          <FileText className="h-8 w-8 mx-auto text-gray-300 dark:text-zinc-600 mb-3" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No notices found</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            {searchQuery ? `No results matching "${searchQuery}". Try another keyword.` : "No published notices available for this filter right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-gray-500 dark:text-neutral-400">
            <span>Showing <strong>{notices.length}</strong> official notices</span>
            <span>Sorted by recent publication</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {notices.map((notice) => {
              const hasPdf = Boolean(notice.pdf || (notice.pdfs && notice.pdfs.length > 0));
              const hasImage = Boolean(notice.image || (notice.images && notice.images.length > 0));

              return (
                <div
                  key={`${notice.source}-${notice.id}-${notice.url}`}
                  className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4.5 transition-all hover:border-gray-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Institute Badge + Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${getBadgeStyle(notice.source)}`}>
                        {getSourceLabel(notice.source)}
                      </span>

                      {notice.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
                          <Calendar className="h-3 w-3 opacity-70" />
                          {notice.date}
                        </span>
                      )}
                    </div>

                    {/* Notice Title */}
                    <h3
                      onClick={() => handleOpenDetail(notice)}
                      className="text-xs sm:text-sm font-semibold text-gray-950 dark:text-white leading-snug line-clamp-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                      title={notice.title}
                    >
                      {notice.title}
                    </h3>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    {/* Attachments Indicator Badges */}
                    <div className="flex items-center gap-1.5">
                      {hasPdf && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/40">
                          <FileText className="h-2.5 w-2.5" /> PDF
                        </span>
                      )}
                      {hasImage && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
                          <ImageIcon className="h-2.5 w-2.5" /> Scan
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDetail(notice)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-neutral-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>

                      <a
                        href={notice.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                        title="Open on official portal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notice Detail Modal / Drawer */}
      {activeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getBadgeStyle(activeNotice.source)}`}>
                  {getSourceLabel(activeNotice.source)}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 font-mono">
                  {activeNotice.date || "TU Official Notice"}
                </span>
              </div>

              <button
                onClick={() => setActiveNotice(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-800 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Notice Title */}
              <h2 className="text-base sm:text-lg font-bold text-gray-950 dark:text-white leading-snug">
                {activeNotice.title}
              </h2>

              {detailLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-gray-500 dark:text-neutral-400 font-medium">
                    Loading deep notice content & attachments…
                  </p>
                </div>
              ) : detailError ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-semibold">Notice Content Preview</p>
                  <p className="mt-1">{detailError}</p>
                </div>
              ) : (
                <>
                  {/* Detailed Dates & Metadata */}
                  {(noticeDetail?.nepaliDate || noticeDetail?.englishDate || noticeDetail?.author) && (
                    <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-950/60 border border-gray-100 dark:border-zinc-800 text-xs text-gray-600 dark:text-neutral-400 font-mono">
                      {noticeDetail.nepaliDate && (
                        <div>
                          <span className="text-gray-400 dark:text-zinc-500">Nepali Date: </span>
                          <strong className="text-gray-900 dark:text-white">{noticeDetail.nepaliDate}</strong>
                        </div>
                      )}
                      {noticeDetail.englishDate && (
                        <div>
                          <span className="text-gray-400 dark:text-zinc-500">English Date: </span>
                          <strong className="text-gray-900 dark:text-white">{noticeDetail.englishDate}</strong>
                        </div>
                      )}
                      {noticeDetail.author && (
                        <div>
                          <span className="text-gray-400 dark:text-zinc-500">Published By: </span>
                          <strong className="text-gray-900 dark:text-white">{noticeDetail.author}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Text */}
                  {noticeDetail?.content && (
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed bg-gray-50/50 dark:bg-zinc-950/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-800">
                      {noticeDetail.content}
                    </div>
                  )}

                  {/* Scanned Image / Notice Attachments */}
                  {(noticeDetail?.images?.length || noticeDetail?.image) ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" /> Scanned Notice Documents
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {(noticeDetail.images || [noticeDetail.image!]).filter(Boolean).map((imgUrl, i) => (
                          <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-zinc-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imgUrl}
                              alt={`Scanned notice attachment ${i + 1}`}
                              className="w-full object-contain max-h-[420px] mx-auto"
                            />
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-gray-500 dark:text-neutral-400">Scanned Document #{i + 1}</span>
                              <a
                                href={imgUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Download className="h-3 w-3" /> Full Image
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* PDF Attachments */}
                  {(noticeDetail?.pdfs?.length || noticeDetail?.pdf || noticeDetail?.attachments?.some((a) => a.type === "pdf")) ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Attached PDF Files
                      </h4>
                      <div className="space-y-1.5">
                        {Array.from(new Set([
                          noticeDetail.pdf,
                          ...(noticeDetail.pdfs || []),
                          ...(noticeDetail.attachments?.filter((a) => a.type === "pdf").map((a) => a.url) || []),
                        ])).filter(Boolean).map((pdfUrl, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <FileText className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                              <span className="font-semibold text-gray-900 dark:text-neutral-200 truncate">
                                {pdfUrl!.split("/").pop() || `Notice_Document_${idx + 1}.pdf`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={pdfUrl!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                              >
                                <Eye className="h-3 w-3" /> Open PDF
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-950/60">
              <a
                href={activeNotice.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View on official TU Portal
              </a>

              <button
                onClick={() => setActiveNotice(null)}
                className="px-4 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-gray-800 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
