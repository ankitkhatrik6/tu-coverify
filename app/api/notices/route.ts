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

const MAX_QUERY_LENGTH = 200;
const MAX_DETAIL_URL_LENGTH = 2048;

function isAllowedNoticeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "tu.edu.np" || url.hostname.endsWith(".tu.edu.np"));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceParam = (searchParams.get("source") || "all").toLowerCase();
    const query = searchParams.get("q") || "";
    const detailUrl = searchParams.get("url") || "";
    const detailSource = searchParams.get("detailSource") || undefined;

    if (query.length > MAX_QUERY_LENGTH || detailUrl.length > MAX_DETAIL_URL_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Request parameters are too long." },
        { status: 400 }
      );
    }

    // If detail is requested
    if (detailUrl) {
      if (!isAllowedNoticeUrl(detailUrl)) {
        return NextResponse.json(
          { success: false, error: "The notice URL is not an allowed TU source." },
          { status: 400 }
        );
      }
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
