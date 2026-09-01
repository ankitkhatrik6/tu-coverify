import { NextRequest, NextResponse } from "next/server";
import {
  getNotices,
  getNoticeDetail,
  searchNotices,
  SOURCES,
  SOURCE_METADATA,
  type SourceQuery,
  type NoticeSource,
} from "tu-scraper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceParam = (searchParams.get("source") || "all").toLowerCase();
    const query = searchParams.get("q") || "";
    const detailUrl = searchParams.get("url") || "";
    const detailSource = searchParams.get("detailSource") || undefined;

    // If detail is requested
    if (detailUrl) {
      const detail = await getNoticeDetail(detailUrl, detailSource, {
        timeout: 12000,
      });
      return NextResponse.json({ success: true, detail });
    }

    // If search query is provided
    if (query.trim()) {
      const validSrc = SOURCES.includes(sourceParam as NoticeSource) || sourceParam === "all"
        ? (sourceParam as SourceQuery)
        : "all";
      const rawNotices = await searchNotices(query.trim(), validSrc, {
        timeout: 12000,
      });
      const notices = rawNotices.filter((n) => n.source !== "ac" && (n.source as string) !== "fom");
      return NextResponse.json({
        success: true,
        source: validSrc,
        query: query.trim(),
        total: notices.length,
        notices,
      });
    }

    // Standard list of notices
    let targetSource: SourceQuery = "all";
    if (sourceParam === "all" || SOURCES.includes(sourceParam as NoticeSource)) {
      targetSource = sourceParam as SourceQuery;
    }

    const rawNotices = await getNotices(targetSource, {
      timeout: 12000,
    });
    const notices = rawNotices.filter((n) => n.source !== "ac" && (n.source as string) !== "fom");

    return NextResponse.json({
      success: true,
      source: targetSource,
      total: notices.length,
      sources: SOURCES.filter((s) => s !== "ac"),
      metadata: SOURCE_METADATA,
      notices,
    });
  } catch (error: unknown) {
    console.error("TU Scraper error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch notices";
    return NextResponse.json(
      { success: false, error: message, notices: [] },
      { status: 500 }
    );
  }
}
