import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

interface RequestBody {
  prompt: string;
  rawText?: string;
  indexTitle?: string;
  deviceId?: string;
  userId?: string;
  userEmail?: string;
}

// In-memory rate limiting store: identifier -> timestamp array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_PROMPT_LENGTH = 12000;
const MAX_INDEX_TITLE_LENGTH = 200;
const MAX_IDENTIFIER_LENGTH = 200;

function checkAndRecordRateLimit(identifiers: string[]): { allowed: boolean; remaining: number; resetHours: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Cleanup old entries
  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => t > windowStart);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, valid);
    }
  }

  // Find the highest usage count across all provided identifiers (IP, deviceId, etc.)
  let maxCount = 0;
  let oldestTimestamp = now;

  for (const id of identifiers) {
    if (!id) continue;
    const timestamps = (rateLimitMap.get(id) || []).filter((t) => t > windowStart);
    rateLimitMap.set(id, timestamps);
    if (timestamps.length > maxCount) {
      maxCount = timestamps.length;
      if (timestamps.length > 0) {
        oldestTimestamp = timestamps[0];
      }
    }
  }

  if (maxCount >= RATE_LIMIT_MAX) {
    const timeUntilResetMs = Math.max(0, oldestTimestamp + RATE_LIMIT_WINDOW_MS - now);
    const resetHours = Math.max(1, Math.ceil(timeUntilResetMs / (60 * 60 * 1000)));
    return { allowed: false, remaining: 0, resetHours };
  }

  // Record this request under all valid identifiers
  for (const id of identifiers) {
    if (!id) continue;
    const current = rateLimitMap.get(id) || [];
    current.push(now);
    rateLimitMap.set(id, current);
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - (maxCount + 1), resetHours: 24 };
}

interface ParsedIndexRow {
  sn: string;
  title: string;
  date?: string;
  signature?: string;
}

interface ParsedResponse {
  indexTitle?: string;
  rows: ParsedIndexRow[];
  modelUsed?: string;
}

function buildSystemPrompt(indexTitle?: string): string {
  return `You are an expert academic AI assistant for university and engineering lab reports (TU, BSc CSIT, BCA, BE, BIT, etc.).
Your primary goal is to STRICTLY and FAITHFULLY follow the user's prompt and formatting instructions when generating the Lab Index table.

CRITICAL DIRECTIVES FOR FOLLOWING USER INSTRUCTIONS:
1. **Length & Detail Control**:
   - If the user asks to make the titles LONG, DETAILED, EXPANDED, or FULL: Write out the comprehensive, full-length academic experiment objectives/questions in complete detail without shortening or summarizing. Include all technical specifics, components, and procedures mentioned.
   - If the user asks to make the titles SHORT, CONCISE, or BRIEF: Condense them into crisp, compact titles.
   - If the user asks for EXACT / AS-IS: Preserve the user's original wording verbatim.
2. **Custom Instructions & Rules**:
   - Strictly apply ANY specific styling, prefixing (e.g. "Experiment N:", "To implement..."), numbering schemes, date formats, or modifications requested in the user's prompt.
   - Extract ALL individual lab experiments/questions provided. Do not omit or skip any experiments.
3. **No Placeholders or Ellipses**:
   - Write out every single row completely. NEVER output "..." or ellipsis.

Output Format:
You MUST respond with a valid JSON object matching this structure:
{
  "indexTitle": "${indexTitle || "Lab Index"}",
  "rows": [
    {
      "sn": "1",
      "title": "Full experiment title strictly formatted according to user instructions",
      "date": "",
      "signature": ""
    }
  ]
}

Respond with ONLY the raw JSON object. Do not include markdown codeblocks or conversational text.`;
}

function extractAndParseJson(raw: string, fallbackTitle: string): ParsedResponse {
  let cleaned = raw.trim();

  // Remove markdown code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }

  // Find outermost JSON object boundaries { ... }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Remove JS/C-style comments
  cleaned = cleaned.replace(/\/\/.*$/gm, "");
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove ellipsis tokens (...) or (…) that LLMs sometimes insert outside of quotes
  cleaned = cleaned.replace(/,?\s*(?:\.{3}|…)[^\n,}\]]*(?=[\n,}\]])/g, "");
  cleaned = cleaned.replace(/,?\s*(?:\.{3}|…)\s*([\]}])/g, "$1");
  cleaned = cleaned.replace(/\n\s*(?:\.{3}|…)\s*\n/g, "\n");

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  try {
    const parsed = JSON.parse(cleaned) as ParsedResponse;
    if (parsed && Array.isArray(parsed.rows) && parsed.rows.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("Standard JSON parse failed, attempting relaxed recovery:", err);
  }

  // Resilient Regex Fallback 1: Extract individual object items { "sn": "...", "title": "...", ... }
  const rows: ParsedIndexRow[] = [];
  const itemRegex = /\{\s*"sn"\s*:\s*"([^"]*)"\s*,\s*"title"\s*:\s*"([^"]*)"(?:\s*,\s*"date"\s*:\s*"([^"]*)")?/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(raw)) !== null) {
    if (match[2] && match[2].trim() && match[2] !== "...") {
      rows.push({
        sn: match[1] || String(rows.length + 1),
        title: match[2].trim(),
        date: match[3] || "",
        signature: "",
      });
    }
  }

  // Resilient Regex Fallback 2: Extract "title": "..." occurrences
  if (rows.length === 0) {
    const titleRegex = /"title"\s*:\s*"([^"]+)"/gi;
    let tMatch: RegExpExecArray | null;
    let count = 1;
    while ((tMatch = titleRegex.exec(raw)) !== null) {
      const t = tMatch[1].trim();
      if (t && t !== "...") {
        rows.push({
          sn: String(count++),
          title: t,
          date: "",
          signature: "",
        });
      }
    }
  }

  // Resilient Regex Fallback 3: Extract numbered list lines like "1. Experiment title" if AI responded in plain text
  if (rows.length === 0) {
    const lineRegex = /^(?:(?:Lab|Experiment|Exp|Q\.?)\s*)?(\d+)[\.\:\-\)]\s*(.+)$/gim;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = lineRegex.exec(raw)) !== null) {
      const lineSn = lMatch[1].trim();
      const lineTitle = lMatch[2].trim().replace(/^["']|["']$/g, "");
      if (lineTitle && lineTitle !== "...") {
        rows.push({
          sn: lineSn,
          title: lineTitle,
          date: "",
          signature: "",
        });
      }
    }
  }

  if (rows.length > 0) {
    return {
      indexTitle: fallbackTitle,
      rows,
    };
  }

  throw new Error("Could not parse valid lab index rows from the AI output.");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const combinedPrompt = (body.prompt || body.rawText || "").trim();
    const indexTitle = (body.indexTitle || "Lab Index").trim().slice(0, MAX_INDEX_TITLE_LENGTH);
    const clientDeviceId = (body.deviceId || "").trim().slice(0, MAX_IDENTIFIER_LENGTH);
    const userId = (body.userId || "").trim().slice(0, MAX_IDENTIFIER_LENGTH);

    if (!userId) {
      return NextResponse.json(
        { error: "AI Lab Index Assistant is only available for logged-in students. Please sign in to your account." },
        { status: 401 }
      );
    }

    if (!combinedPrompt) {
      return NextResponse.json(
        { error: "Please enter your lab questions or prompt." },
        { status: 400 }
      );
    }

    if (combinedPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: "Please keep the lab prompt under 12,000 characters." },
        { status: 413 }
      );
    }

    // Identify client by IP headers, user ID, and device ID
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || cfConnectingIp || "unknown-ip";

    const identifiers = [
      `user:${userId}`,
      clientIp !== "unknown-ip" ? `ip:${clientIp}` : "",
      clientDeviceId ? `device:${clientDeviceId}` : "",
    ].filter(Boolean);

    // If we have any identifier, check rate limits (5 per 24 hours)
    if (identifiers.length > 0) {
      const rateStatus = checkAndRecordRateLimit(identifiers);
      if (!rateStatus.allowed) {
        return NextResponse.json(
          {
            error: `Daily limit reached (5 AI generations per 24 hours). Please try again in ~${rateStatus.resetHours} hours.`,
            rateLimited: true,
            resetHours: rateStatus.resetHours,
          },
          { status: 429 }
        );
      }
    }

    const systemPrompt = buildSystemPrompt(indexTitle);
    const userPrompt = `[USER PROMPT & LAB CONTENT]:
${combinedPrompt}

CRITICAL: Strictly execute the instructions given above (e.g. make titles long/detailed, make short, add dates, format objectives, etc.). Return only the final JSON object.`;

    const groqKey = process.env.GROQ_API_KEY;

    let rawJsonResult: string | null = null;
    let modelUsed = "";
    let lastError: string = "";

    if (!rawJsonResult && groqKey) {
      const groq = new Groq({ apiKey: groqKey.trim() });
      
      // Verified stable Groq models in priority order
      const candidateModels = [
        "qwen/qwen3.8-27b",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "groq/compound",
      ];

      for (const model of candidateModels) {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            model,
            temperature: 0.2,
            max_tokens: 4096,
            response_format: { type: "json_object" },
          });

          const content = completion.choices[0]?.message?.content;
          if (content && content.trim()) {
            rawJsonResult = content;
            modelUsed = `Groq (${model})`;
            break;
          }
        } catch (groqErr: unknown) {
          const errObj = groqErr as { message?: string; status?: number; error?: { message?: string } };
          const errMsg = errObj?.error?.message || errObj?.message || String(groqErr);
          lastError = errMsg;

          // If JSON mode or model failed, try standard completion without response_format
          try {
            const retryComp = await groq.chat.completions.create({
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              model,
              temperature: 0.2,
              max_tokens: 4096,
            });
            const retryContent = retryComp.choices[0]?.message?.content;
            if (retryContent && retryContent.trim()) {
              rawJsonResult = retryContent;
              modelUsed = `Groq (${model})`;
              break;
            }
          } catch (retryErr: unknown) {
            const retryObj = retryErr as { message?: string; error?: { message?: string } };
            const retryMsg = retryObj?.error?.message || retryObj?.message || String(retryErr);
            lastError = retryMsg;
          }
        }
      }
    }

    if (!rawJsonResult) {
      if (!groqKey) {
        return NextResponse.json(
          {
            error: "GROQ_API_KEY is not configured in the server environment.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: lastError
            ? `AI Provider error: ${lastError}`
            : "Unable to generate response from AI providers.",
        },
        { status: 502 }
      );
    }

    const parsedData = extractAndParseJson(rawJsonResult, indexTitle);

    // Sanitize rows
    const sanitizedRows: ParsedIndexRow[] = parsedData.rows.map((row, index) => ({
      sn: String(row.sn || index + 1),
      title: String(row.title || "").trim(),
      date: String(row.date || "").trim(),
      signature: String(row.signature || "").trim(),
    }));

    return NextResponse.json({
      success: true,
      indexTitle: parsedData.indexTitle || indexTitle,
      rows: sanitizedRows,
      modelUsed,
      count: sanitizedRows.length,
    });
  } catch (err: unknown) {
    console.error("Lab Index AI parse error:", err);
    const message = err instanceof Error ? err.message : "Failed to parse lab questions with AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
