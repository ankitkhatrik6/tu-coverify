import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import os from "os";
import { generateDocx } from "@/lib/docx-generator";
import { generateIndexDocx } from "@/lib/docx-index-generator";
import { getTypstBinary } from "@/lib/typst";
import JSZip from "jszip";

// Disable HMR/Watch options for API-based temporary files
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const tmpDir = os.tmpdir();
  const uploadDir = path.join(tmpDir, "uploads");

  // Ensure directories exist
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (e) {
    console.error("Failed to create upload directory:", e);
  }

  const uniqueId = crypto.randomBytes(8).toString("hex");
  const tempFiles: string[] = [];

  try {
    const data = await req.json();
    const {
      documentType = "cover", // "cover" or "index"
      
      // Cover Page properties
      collegeName = "Amrit Science Campus",
      collegeLocation = "Lainchaur, Kathmandu",
      facultyOrInstitute = "Institute of Science and Technology",
      subjectName = "Microprocessor",
      courseCode = "CSC 167",
      program = "BSc CSIT",
      semester = "Second Semester",
      studentName = "Ankit Khatri KC",
      rollNumber = "09/82",
      regdNumber = "5-2-1234-567-2025",
      examRollNumber = "820015",
      batch = "2082",
      teacherName = "Mr. Kiran Joshi",
      teacherDepartment = "Department of CSIT",
      logoBase64,
      
      // Index Page properties
      indexTitle = "Lab Index",
      indexRows = [],

      // Marksheet properties
      marksheetType = "semester", // "semester" or "cumulative"
      marksheetCourses = [],
      marksheetSemesters = [],
      marksheetSgpa = 0,
      marksheetCgpa = 0,
      marksheetTotalCredits = 0,
      marksheetPassedCredits = 0,
      marksheetTotalQualityPoints = 0,
      marksheetDivisionRemarks = "Passed",
      marksheetHasBacklog = false,
      campusName = "Amrit Science Campus, Lainchaur, Kathmandu",
      issueDate = "",

      // Batch Cover Generator properties
      batchFormat = "combined_pdf", // "combined_pdf" | "zip" | "preview"
      students = [],
      previewIndex = 0,

      format = "pdf",
    } = data;

    // Helper for escaping Typst markup
    const escapeTypst = (val: any): string => {
      if (val === null || val === undefined) return "";
      return String(val)
        .replace(/\\/g, "\\\\")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")
        .replace(/"/g, '\\"')
        .replace(/#/g, "\\#")
        .replace(/\$/g, "\\$")
        .replace(/\*/g, "\\*")
        .replace(/_/g, "\\_");
    };

    // --- CASE C: MARKSHEET GENERATOR (TU IOST OFFICIAL FORMAT) ---
    if (documentType === "marksheet") {
      const tuLogoPath = path.join(process.cwd(), "public", "tu_logo.svg").replace(/\\/g, "/");

      const cleanStudentName = escapeTypst(studentName || "Ankit Khatri KC");
      const cleanExamRoll = escapeTypst(examRollNumber || rollNumber || "820015");
      const cleanRegd = escapeTypst(regdNumber || "5-2-0033-0123-2022");
      const cleanBatch = escapeTypst(batch || "2081 B.S.");
      const cleanCampus = escapeTypst(campusName || collegeName || "Amrit Science Campus, Lainchaur, Kathmandu");
      const cleanProgram = escapeTypst(program || "Bachelor of Science in Computer Science & Information Technology (B.Sc. CSIT)");
      const cleanSemester = escapeTypst(semester || "First Semester");
      const cleanDivision = escapeTypst(marksheetDivisionRemarks || (marksheetHasBacklog ? "Backpaper" : "Passed"));
      const todayFormatted = issueDate || new Date().toISOString().split("T")[0];
      const cleanIssueDate = escapeTypst(todayFormatted);

      let typstMarkup = "";
      let outputFilename = "";

      if (marksheetType === "cumulative") {
        outputFilename = `TU_IOST_BSc_CSIT_Cumulative_Transcript_${uniqueId}.pdf`;

        const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
        const semesterRowsMarkup = (marksheetSemesters && marksheetSemesters.length > 0 ? marksheetSemesters : [])
          .map((s: any, idx: number) => {
            const semNum = s.semesterNumber || (idx + 1);
            const roman = romanNumerals[semNum - 1] || `${semNum}`;
            const sName = escapeTypst(s.semesterName || `Semester ${semNum}`);
            const credits = s.credits ?? 0;
            const sgpaVal = Number(s.sgpa ?? 0).toFixed(2);
            const qpVal = Number(s.qualityPoints ?? (credits * Number(s.sgpa || 0))).toFixed(2);
            const hasBack = Boolean(s.hasBacklog);
            const statusColor = hasBack ? 'rgb("#b91c1c")' : 'rgb("#047857")';
            const statusText = hasBack ? "BACKLOG" : (credits > 0 && Number(sgpaVal) > 0 ? "PASS" : "-");
            return `[${roman}], [${sName}], [${credits}], [${sgpaVal}], [${qpVal}], [#text(weight: "bold", fill: ${statusColor})[${statusText}]]`;
          })
          .join(",\n      ");

        typstMarkup = `
#set page(
  paper: "a4",
  margin: (top: 0.5in, bottom: 0.5in, left: 0.55in, right: 0.55in),
  foreground: place(
    center + horizon,
    rotate(
      -35deg,
      text(
        size: 16pt,
        weight: "bold",
        tracking: 0.8pt,
        fill: rgb("#64748b").transparentize(82%),
        [THIS IS GENERATED USING TU COVERIFY • NOT AN OFFICIAL MARKSHEET]
      )
    )
  )
)
#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#0f172a"),
  size: 9.5pt
)

#rect(
  width: 100%,
  stroke: (paint: rgb("#0f172a"), thickness: 1.5pt),
  inset: 4pt
)[
  #rect(
    width: 100%,
    stroke: (paint: rgb("#0f172a"), thickness: 0.5pt),
    inset: 12pt
  )[
    #align(center)[
      #image("${tuLogoPath}", width: 52pt)
      #v(5pt)
      #text(size: 16pt, weight: "bold")[TRIBHUVAN UNIVERSITY] \\
      #v(2pt)
      #text(size: 12.5pt, weight: "bold")[INSTITUTE OF SCIENCE AND TECHNOLOGY] \\
      #v(2pt)
      #text(size: 9.5pt, weight: "medium")[Dean's Office, Examination Division] \\
      #text(size: 9pt)[Kirtipur, Kathmandu, Nepal]
      #v(6pt)
      #rect(
        fill: rgb("#f1f5f9"),
        stroke: 0.8pt + rgb("#0f172a"),
        inset: (x: 18pt, y: 4pt),
        radius: 2pt
      )[
        #text(size: 11pt, weight: "bold")[CUMULATIVE GRADE-SHEET / TRANSCRIPT]
      ]
      #v(4pt)
      #text(size: 10pt, weight: "bold")[${cleanProgram}] \\
      #text(size: 9.5pt, weight: "bold")[Four-Year Undergraduate Degree Cumulative Record]
    ]

    #v(8pt)
    #line(length: 100%, stroke: 0.6pt + rgb("#0f172a"))
    #v(4pt)

    #grid(
      columns: (1.2fr, 1fr),
      row-gutter: 4pt,
      [#text(weight: "bold")[Student's Name:] ${cleanStudentName}],
      [#text(weight: "bold")[Symbol / Roll No.:] ${cleanExamRoll}],
      [#text(weight: "bold")[T.U. Regd. No.:] ${cleanRegd}],
      [#text(weight: "bold")[Batch / Session:] ${cleanBatch}],
      grid.cell(colspan: 2)[#text(weight: "bold")[Campus / College:] ${cleanCampus}]
    )

    #v(8pt)

    #table(
      columns: (0.7fr, 3fr, 1.2fr, 1.2fr, 1.3fr, 1fr),
      align: (center + horizon, left + horizon, center + horizon, center + horizon, center + horizon, center + horizon),
      stroke: 0.5pt + rgb("#334155"),
      inset: (x: 5pt, y: 5.5pt),
      fill: (col, row) => if row == 0 { rgb("#f1f5f9") } else { none },
      
      [*Sem*], [*Semester Name*], [*Credits*], [*SGPA*], [*Quality Points*], [*Remarks*],
      
      ${semesterRowsMarkup ? semesterRowsMarkup + "," : ""}

      table.cell(colspan: 2, align: right + horizon)[#text(weight: "bold")[CUMULATIVE TOTAL:]],
      [#text(weight: "bold")[${marksheetTotalCredits} Cr]],
      [#text(weight: "bold")[${Number(marksheetCgpa).toFixed(2)}]],
      [#text(weight: "bold")[${Number(marksheetTotalQualityPoints).toFixed(2)}]],
      [#text(weight: "bold", fill: ${marksheetHasBacklog ? 'rgb("#b91c1c")' : 'rgb("#047857")'})[${marksheetHasBacklog ? "BACKLOG" : "CLEAR"}]]
    )

    #v(6pt)

    #grid(
      columns: (1fr, 1fr, 1fr, 1.2fr),
      stroke: 0.5pt + rgb("#334155"),
      inset: 6pt,
      align: center + horizon,
      [#text(size: 8.5pt)[Total Degree Credits]\\ #v(2pt) #text(size: 11pt, weight: "bold")[120 Cr]],
      [#text(size: 8.5pt)[Completed Credits]\\ #v(2pt) #text(size: 11pt, weight: "bold")[${marksheetTotalCredits} Cr]],
      [#text(size: 8.5pt)[Cumulative Quality Points]\\ #v(2pt) #text(size: 11pt, weight: "bold")[${Number(marksheetTotalQualityPoints).toFixed(2)}]],
      [#text(size: 8.5pt)[Cumulative CGPA]\\ #v(2pt) #text(size: 14pt, weight: "bold")[${Number(marksheetCgpa).toFixed(2)} / 4.00]]
    )

    #v(5pt)
    #rect(
      width: 100%,
      stroke: 0.5pt + rgb("#334155"),
      inset: 5pt,
      fill: rgb("#f8fafc")
    )[
      #grid(
        columns: (1fr, 1fr),
        [#text(weight: "bold")[Final Classification:] #text(weight: "bold", fill: ${marksheetHasBacklog ? 'rgb("#b91c1c")' : 'rgb("#047857")'})[${cleanDivision}]],
        align(right)[#text(weight: "bold")[Degree Status:] ${marksheetHasBacklog ? "INCOMPLETE (BACKLOGS PRESENT)" : "QUALIFIED FOR B.Sc. CSIT DEGREE"}]
      )
    ]

    #v(6pt)
    #text(size: 8pt, weight: "bold")[OFFICIAL T.U. CGPA CLASSIFICATION STANDARD:]
    #v(2pt)
    #table(
      columns: (1.5fr, 1.5fr, 3fr),
      align: (center + horizon, center + horizon, left + horizon),
      stroke: 0.4pt + rgb("#94a3b8"),
      inset: (x: 4pt, y: 3pt),
      fill: (col, row) => if row == 0 { rgb("#f1f5f9") } else { none },
      [#text(size: 7.5pt, weight: "bold")[CGPA Range]], [#text(size: 7.5pt, weight: "bold")[Division / Classification]], [#text(size: 7.5pt, weight: "bold")[Equivalence & Criteria]],
      [#text(size: 7.5pt)[3.60 to 4.00]], [#text(size: 7.5pt, weight: "bold")[Distinction]], [#text(size: 7.5pt)[Outstanding performance across 120 credit hours without backlogs]],
      [#text(size: 7.5pt)[3.00 to 3.59]], [#text(size: 7.5pt, weight: "bold")[First Division]], [#text(size: 7.5pt)[Very Good academic standing (>= 70% equivalent)]],
      [#text(size: 7.5pt)[2.40 to 2.99]], [#text(size: 7.5pt, weight: "bold")[Second Division]], [#text(size: 7.5pt)[Satisfactory performance in core & electives]],
      [#text(size: 7.5pt)[2.00 to 2.39]], [#text(size: 7.5pt, weight: "bold")[Third Division / Pass]], [#text(size: 7.5pt)[Minimum graduation threshold (40% - 49.9%)]]
    )

    #v(16pt)
    #grid(
      columns: (1fr, 1fr, 1fr),
      align: center + bottom,
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Prepared by]
      ],
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Checked by]
      ],
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Controller of Examinations]
      ]
    )

    #v(6pt)
    #grid(
      columns: (1fr, 1fr),
      [#text(size: 7.5pt, fill: rgb("#64748b"))[Date of Issue: ${cleanIssueDate} (Generated via TU Coverify • Unofficial Record)]],
      align(right)[#text(size: 7.5pt, fill: rgb("#64748b"))[Tribhuvan University, Institute of Science & Technology]]
    )
  ]
]
        `;
      } else {
        // Semester SGPA Marksheet
        outputFilename = `TU_IOST_${cleanSemester.replace(/\\s+/g, "_")}_Marksheet_${uniqueId}.pdf`;

        const courseRowsMarkup = (marksheetCourses && marksheetCourses.length > 0 ? marksheetCourses : [])
          .map((c: any, idx: number) => {
            const sn = idx + 1;
            const code = escapeTypst(c.code || c.courseCode || "");
            const title = escapeTypst(c.title || c.courseTitle || "");
            const credits = c.credits ?? c.creditHours ?? 3;
            const grade = escapeTypst(c.letterGrade || "F");
            const gp = Number(c.gradePoint ?? 0).toFixed(1);
            const qp = Number(c.qualityPoints ?? 0).toFixed(2);
            const isPass = c.isPass !== false && grade !== "F";
            const statusColor = isPass ? 'rgb("#047857")' : 'rgb("#b91c1c")';
            const statusText = isPass ? "PASS" : "BACK";
            return `[${sn}], [${code}], [${title}], [${credits}], [${grade}], [${gp}], [${qp}], [#text(weight: "bold", fill: ${statusColor})[${statusText}]]`;
          })
          .join(",\n      ");

        typstMarkup = `
#set page(
  paper: "a4",
  margin: (top: 0.5in, bottom: 0.5in, left: 0.55in, right: 0.55in),
  foreground: place(
    center + horizon,
    rotate(
      -35deg,
      text(
        size: 16pt,
        weight: "bold",
        tracking: 0.8pt,
        fill: rgb("#64748b").transparentize(82%),
        [THIS IS GENERATED USING TU COVERIFY • NOT AN OFFICIAL MARKSHEET]
      )
    )
  )
)
#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#0f172a"),
  size: 9.5pt
)

#rect(
  width: 100%,
  stroke: (paint: rgb("#0f172a"), thickness: 1.5pt),
  inset: 4pt
)[
  #rect(
    width: 100%,
    stroke: (paint: rgb("#0f172a"), thickness: 0.5pt),
    inset: 12pt
  )[
    #align(center)[
      #image("${tuLogoPath}", width: 52pt)
      #v(5pt)
      #text(size: 16pt, weight: "bold")[TRIBHUVAN UNIVERSITY] \\
      #v(2pt)
      #text(size: 12.5pt, weight: "bold")[INSTITUTE OF SCIENCE AND TECHNOLOGY] \\
      #v(2pt)
      #text(size: 9.5pt, weight: "medium")[Dean's Office, Examination Division] \\
      #text(size: 9pt)[Kirtipur, Kathmandu, Nepal]
      #v(6pt)
      #rect(
        fill: rgb("#f1f5f9"),
        stroke: 0.8pt + rgb("#0f172a"),
        inset: (x: 18pt, y: 4pt),
        radius: 2pt
      )[
        #text(size: 11pt, weight: "bold")[SEMESTER GRADE-SHEET]
      ]
      #v(4pt)
      #text(size: 10pt, weight: "bold")[${cleanProgram}] \\
      #text(size: 9.5pt, weight: "bold")[${cleanSemester} Examination - ${cleanBatch}]
    ]

    #v(8pt)
    #line(length: 100%, stroke: 0.6pt + rgb("#0f172a"))
    #v(4pt)

    #grid(
      columns: (1.2fr, 1fr),
      row-gutter: 4pt,
      [#text(weight: "bold")[Student's Name:] ${cleanStudentName}],
      [#text(weight: "bold")[Symbol / Roll No.:] ${cleanExamRoll}],
      [#text(weight: "bold")[T.U. Regd. No.:] ${cleanRegd}],
      [#text(weight: "bold")[Batch / Session:] ${cleanBatch}],
      grid.cell(colspan: 2)[#text(weight: "bold")[Campus / College:] ${cleanCampus}]
    )

    #v(8pt)

    #table(
      columns: (0.5fr, 1.3fr, 4.2fr, 0.7fr, 0.9fr, 0.9fr, 1.1fr, 0.9fr),
      align: (center + horizon, center + horizon, left + horizon, center + horizon, center + horizon, center + horizon, center + horizon, center + horizon),
      stroke: 0.5pt + rgb("#334155"),
      inset: (x: 4pt, y: 5pt),
      fill: (col, row) => if row == 0 { rgb("#f1f5f9") } else { none },
      
      [*S.N.*], [*Course Code*], [*Course Title*], [*Credit*], [*Grade*], [*Grade Point*], [*Credit Points*], [*Remarks*],
      
      ${courseRowsMarkup ? courseRowsMarkup + "," : ""}

      table.cell(colspan: 3, align: right + horizon)[#text(weight: "bold")[TOTAL / SUMMARY:]],
      [#text(weight: "bold")[${marksheetTotalCredits}]],
      [-],
      [-],
      [#text(weight: "bold")[${Number(marksheetTotalQualityPoints).toFixed(2)}]],
      [#text(weight: "bold", fill: ${marksheetHasBacklog ? 'rgb("#b91c1c")' : 'rgb("#047857")'})[${marksheetHasBacklog ? "BACKLOG" : "PASSED"}]]
    )

    #v(6pt)

    #grid(
      columns: (1fr, 1fr, 1fr, 1.2fr),
      stroke: 0.5pt + rgb("#334155"),
      inset: 6pt,
      align: center + horizon,
      [#text(size: 8.5pt)[Total Credits Registered]\\ #v(2pt) #text(size: 11pt, weight: "bold")[${marksheetTotalCredits} Cr]],
      [#text(size: 8.5pt)[Total Credits Earned]\\ #v(2pt) #text(size: 11pt, weight: "bold")[${marksheetPassedCredits} Cr]],
      [#text(size: 8.5pt)[Total Quality Points]\\ #v(2pt) #text(size: 11pt, weight: "bold")[${Number(marksheetTotalQualityPoints).toFixed(2)}]],
      [#text(size: 8.5pt)[Semester GPA (SGPA)]\\ #v(2pt) #text(size: 14pt, weight: "bold")[${Number(marksheetSgpa).toFixed(2)} / 4.00]]
    )

    #v(5pt)
    #rect(
      width: 100%,
      stroke: 0.5pt + rgb("#334155"),
      inset: 5pt,
      fill: rgb("#f8fafc")
    )[
      #grid(
        columns: (1fr, 1fr),
        [#text(weight: "bold")[Result Standing:] #text(weight: "bold", fill: ${marksheetHasBacklog ? 'rgb("#b91c1c")' : 'rgb("#047857")'})[${cleanDivision}]],
        align(right)[#text(weight: "bold")[Evaluation Standard:] 40% Internal + 60% External]
      )
    ]

    #v(6pt)
    #text(size: 8pt, weight: "bold")[OFFICIAL T.U. IOST GRADING SCALE & SYSTEM:]
    #v(2pt)
    #table(
      columns: (1fr, 1fr, 1.2fr, 1.5fr, 1fr, 1fr, 1.2fr, 1.5fr),
      align: center + horizon,
      stroke: 0.4pt + rgb("#94a3b8"),
      inset: (x: 2pt, y: 3pt),
      fill: (col, row) => if row == 0 { rgb("#f1f5f9") } else { none },
      [#text(size: 7pt, weight: "bold")[Grade]], [#text(size: 7pt, weight: "bold")[GP]], [#text(size: 7pt, weight: "bold")[Marks]], [#text(size: 7pt, weight: "bold")[Remarks]],
      [#text(size: 7pt, weight: "bold")[Grade]], [#text(size: 7pt, weight: "bold")[GP]], [#text(size: 7pt, weight: "bold")[Marks]], [#text(size: 7pt, weight: "bold")[Remarks]],

      [#text(size: 7pt)[A+]], [#text(size: 7pt)[4.0]], [#text(size: 7pt)[>= 90%]], [#text(size: 7pt)[Outstanding]],
      [#text(size: 7pt)[B]], [#text(size: 7pt)[2.8-3.1]], [#text(size: 7pt)[60-69.9%]], [#text(size: 7pt)[Good]],

      [#text(size: 7pt)[A]], [#text(size: 7pt)[3.6-3.9]], [#text(size: 7pt)[80-89.9%]], [#text(size: 7pt)[Excellent]],
      [#text(size: 7pt)[C+]], [#text(size: 7pt)[2.4-2.7]], [#text(size: 7pt)[50-59.9%]], [#text(size: 7pt)[Satisfactory]],

      [#text(size: 7pt)[B+]], [#text(size: 7pt)[3.2-3.5]], [#text(size: 7pt)[70-79.9%]], [#text(size: 7pt)[Very Good]],
      [#text(size: 7pt)[F]], [#text(size: 7pt)[0.0]], [#text(size: 7pt)[< 40%]], [#text(size: 7pt, fill: rgb("#b91c1c"))[Fail / Back]]
    )

    #v(3pt)
    #text(size: 7pt, style: "italic", fill: rgb("#475569"))[
      *Note:* SGPA = Total Quality Points (Sum of Cr x GP) / Total Credit Hours. Minimum pass mark in each component (theory external, internal assessment, and practical) is 40% separately. A student failing in any component is awarded an 'F' grade.
    ]

    #v(16pt)
    #grid(
      columns: (1fr, 1fr, 1fr),
      align: center + bottom,
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Prepared by]
      ],
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Checked by]
      ],
      [
        #line(length: 70%, stroke: 0.6pt + rgb("#0f172a"))
        #v(2pt)
        #text(size: 8pt, weight: "bold")[Controller of Examinations]
      ]
    )

    #v(6pt)
    #grid(
      columns: (1fr, 1fr),
      [#text(size: 7.5pt, fill: rgb("#64748b"))[Date of Issue: ${cleanIssueDate} (Generated via TU Coverify • Unofficial Record)]],
      align(right)[#text(size: 7.5pt, fill: rgb("#64748b"))[Tribhuvan University, Institute of Science & Technology]]
    )
  ]
]
        `;
      }

      // Save Typst markup to temporary file
      const tempTypPath = path.join(tmpDir, `marksheet_${uniqueId}.typ`);
      fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
      tempFiles.push(tempTypPath);

      const tempOutputPath = path.join(tmpDir, `marksheet_${uniqueId}.pdf`);
      tempFiles.push(tempOutputPath);

      const typstBin = await getTypstBinary();
      const typstCmd = `"${typstBin}" compile --root / "${tempTypPath}" "${tempOutputPath}"`;

      await execAsync(typstCmd, {
        env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv,
      });

      if (!fs.existsSync(tempOutputPath)) {
        throw new Error("Marksheet compilation failed: PDF not generated");
      }

      const outputBuffer = fs.readFileSync(tempOutputPath);

      return new NextResponse(outputBuffer as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${outputFilename}"`,
        },
      });
    }

    // --- CASE D: CR / CLASS REPRESENTATIVE BULK COVER PAGE GENERATOR ---
    if (documentType === "batch_cover") {
      const studentList = Array.isArray(students) ? students : [];
      if (studentList.length === 0) {
        return NextResponse.json(
          { error: "No students provided", details: "Roster is empty. Please provide student details." },
          { status: 400 }
        );
      }

      // 1. Resolve College Logo File
      let collegeLogoPath = path.join(process.cwd(), "public", "default_college_logo.svg").replace(/\\/g, "/");
      if (logoBase64) {
        try {
          const matches = logoBase64.match(/^data:([^;]+);base64,(.*)$/);
          let mimeType = "image/png";
          let base64Data = logoBase64;
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          } else {
            base64Data = logoBase64.replace(/^data:[^;]+;base64,/, "");
          }
          const logoBuffer = Buffer.from(base64Data, "base64");
          let extension = "png";
          if (mimeType.includes("svg")) {
            extension = "svg";
          } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
            extension = "jpg";
          } else if (mimeType.includes("webp")) {
            extension = "webp";
          }
          const logoFilename = `batch_logo_${uniqueId}.${extension}`;
          const logoFullPath = path.join(uploadDir, logoFilename).replace(/\\/g, "/");
          fs.writeFileSync(logoFullPath, logoBuffer);
          tempFiles.push(logoFullPath);
          collegeLogoPath = logoFullPath;
        } catch (err) {
          console.error("Failed to save custom logo for batch:", err);
          collegeLogoPath = path.join(process.cwd(), "public", "default_college_logo.svg").replace(/\\/g, "/");
        }
      }

      const tuLogoPath = path.join(process.cwd(), "public", "tu_logo.svg").replace(/\\/g, "/");
      const cleanCollege = escapeTypst(collegeName || "Tribhuvan University Affiliated College");
      const cleanLocation = escapeTypst(collegeLocation || "Kathmandu, Nepal");
      const cleanFaculty = escapeTypst(facultyOrInstitute || "Institute of Science and Technology");
      const cleanSubject = escapeTypst(subjectName || "Computer Science");
      const cleanCode = escapeTypst(courseCode || "CSC");
      const cleanProgram = escapeTypst(program || "B.Sc. CSIT");
      const cleanSemester = escapeTypst(semester || "First Semester");
      const cleanBatch = escapeTypst(batch || "2082");
      const cleanTeacher = escapeTypst(teacherName || "Subject Teacher");
      const cleanDepartment = escapeTypst(teacherDepartment || "Department of Computer Science");

      const buildStudentPageMarkup = (student: any) => {
        const sName = escapeTypst(student.name || "Student Name");
        const sRoll = escapeTypst(student.rollNumber || "");
        const sRegd = escapeTypst(student.regdNumber || "");
        const sExamRoll = escapeTypst(student.examRollNumber || student.rollNumber || "");

        return `
// Header Section (Three-column layout for logos and text)
#grid(
  columns: (1fr, 3.2fr, 1fr),
  align: (center + horizon, center + horizon, center + horizon),
  image("${tuLogoPath}", width: 62pt),
  [
    #set text(weight: "regular")
    #v(3pt)
    #text(size: 16pt)[Tribhuvan University] \\
    #v(3pt)
    #text(size: 15pt)[${cleanFaculty}] \\
    #v(6pt)
    #text(size: 20pt, weight: "bold")[${cleanCollege}] \\
    #v(3pt)
    #text(size: 13pt)[${cleanLocation}]
  ],
  image("${collegeLogoPath}", width: 62pt)
)

#v(22pt)

// Center Divider (Trishul)
#align(center)[
  #box(height: 160pt)[
    #align(horizon)[
      #stack(
        dir: ltr,
        spacing: 16pt,
        rect(width: 4pt, height: 105pt, fill: black),
        rect(width: 6.5pt, height: 160pt, fill: black),
        rect(width: 4pt, height: 105pt, fill: black)
      )
    ]
  ]
]

#v(24pt)

// Report Details
#align(center)[
  #text(size: 18pt, weight: "bold")[Lab Report] \\
  #v(5pt)
  #text(size: 16pt, weight: "bold")[${cleanSubject}] \\
  #v(2pt)
  #text(size: 15pt, weight: "bold")[(${cleanCode})] \\
  #v(5pt)
  #text(size: 16pt, weight: "bold")[${cleanProgram} ${cleanSemester}]
]

#v(45pt)

// Bottom Section (Submitted by & Submitted to)
#grid(
  columns: (1.25fr, 1fr),
  gutter: 15pt,
  align: (left, top),
  [
    #text(size: 15pt, weight: "bold")[Submitted by :] \\
    #v(10pt)
    #stack(
      spacing: 9pt,
      [#text(weight: "bold")[Name:] ${sName}],
      [#text(weight: "bold")[Roll no.:] ${sRoll}],
      [#text(weight: "bold")[Semester:] ${cleanSemester}],
      [#text(weight: "bold")[Batch:] ${cleanBatch}],
      [#text(weight: "bold")[Regd. No:] ${sRegd}],
      [#text(weight: "bold")[Exam Roll No:] ${sExamRoll}]
    )
  ],
  [
    #text(size: 15pt, weight: "bold")[Submitted to :] \\
    #v(45pt)
    #line(length: 95%, stroke: 1.5pt + black)
    #v(6pt)
    #stack(
      spacing: 9pt,
      [#text(size: 14pt)[${cleanTeacher}]],
      [#text(size: 14pt)[${cleanDepartment}]]
    )
  ]
)
`;
      };

      const typstBin = await getTypstBinary();
      const safeCourse = (courseCode || subjectName || "Batch").replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeSem = (semester || "Class").replace(/[^a-zA-Z0-9_-]/g, "_");

      // OPTION 1: PREVIEW MODE (Single page vector SVG for instant review)
      if (batchFormat === "preview") {
        const targetStudent = studentList[previewIndex] || studentList[0];
        const previewTypst = `
#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in)
)

#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#000000"),
  size: 14pt
)

${buildStudentPageMarkup(targetStudent)}
`;
        const tempTypPath = path.join(tmpDir, `batch_prev_${uniqueId}.typ`);
        fs.writeFileSync(tempTypPath, previewTypst, "utf-8");
        tempFiles.push(tempTypPath);

        const tempSvgPath = path.join(tmpDir, `batch_prev_${uniqueId}.svg`);
        tempFiles.push(tempSvgPath);

        const cmd = `"${typstBin}" compile --root / "${tempTypPath}" "${tempSvgPath}"`;
        await execAsync(cmd, {
          env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv,
        });

        if (!fs.existsSync(tempSvgPath)) {
          throw new Error("Batch preview generation failed");
        }

        const svgContent = fs.readFileSync(tempSvgPath);
        return new NextResponse(svgContent as any, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Content-Disposition": "inline",
          },
        });
      }

      // OPTION 2: COMBINED MULTI-PAGE PDF (Single file, 1 cover page per student)
      if (batchFormat === "combined_pdf") {
        const pagesMarkup = studentList.map((st: any) => buildStudentPageMarkup(st)).join("\n#pagebreak()\n");
        const combinedTypst = `
#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in)
)

#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#000000"),
  size: 14pt
)

${pagesMarkup}
`;
        const tempTypPath = path.join(tmpDir, `batch_all_${uniqueId}.typ`);
        fs.writeFileSync(tempTypPath, combinedTypst, "utf-8");
        tempFiles.push(tempTypPath);

        const tempPdfPath = path.join(tmpDir, `batch_all_${uniqueId}.pdf`);
        tempFiles.push(tempPdfPath);

        const cmd = `"${typstBin}" compile --root / "${tempTypPath}" "${tempPdfPath}"`;
        await execAsync(cmd, {
          env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv,
        });

        if (!fs.existsSync(tempPdfPath)) {
          throw new Error("Batch combined PDF compilation failed");
        }

        const pdfBuffer = fs.readFileSync(tempPdfPath);
        const combinedFilename = `TU_Cover_Batch_${safeCourse}_${safeSem}_Combined_${studentList.length}_Students.pdf`;

        return new NextResponse(pdfBuffer as any, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${combinedFilename}"`,
          },
        });
      }

      // OPTION 3: ZIP OF INDIVIDUAL PDF FILES (One distinct PDF file per student)
      if (batchFormat === "zip") {
        const zip = new JSZip();
        const concurrency = 6;

        for (let i = 0; i < studentList.length; i += concurrency) {
          const chunk = studentList.slice(i, i + concurrency);
          await Promise.all(
            chunk.map(async (student: any, cIdx: number) => {
              const studentIndex = i + cIdx + 1;
              const singleTypst = `
#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in)
)

#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#000000"),
  size: 14pt
)

${buildStudentPageMarkup(student)}
`;
              const sTypPath = path.join(tmpDir, `bzip_${uniqueId}_${studentIndex}.typ`);
              const sPdfPath = path.join(tmpDir, `bzip_${uniqueId}_${studentIndex}.pdf`);
              fs.writeFileSync(sTypPath, singleTypst, "utf-8");
              tempFiles.push(sTypPath);
              tempFiles.push(sPdfPath);

              const cmd = `"${typstBin}" compile --root / "${sTypPath}" "${sPdfPath}"`;
              await execAsync(cmd, {
                env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv,
              });

              if (fs.existsSync(sPdfPath)) {
                const pdfData = fs.readFileSync(sPdfPath);
                const safeNum = String(studentIndex).padStart(2, "0");
                const safeRoll = (student.rollNumber || "NoRoll").replace(/[\/\\:\*\?"<>\|]/g, "-").trim();
                const safeName = (student.name || `Student_${studentIndex}`).replace(/[^a-zA-Z0-9_-]/g, "_").trim();
                const individualFilename = `${safeNum}_${safeRoll}_${safeName}.pdf`;
                zip.file(individualFilename, pdfData);
              }
            })
          );
        }

        const zipBuffer = await zip.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const zipFilename = `TU_Cover_Batch_${safeCourse}_${safeSem}_${studentList.length}_Students.zip`;
        return new NextResponse(zipBuffer as any, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipFilename}"`,
          },
        });
      }
    }

    // --- CASE A: LAB INDEX PAGE GENERATOR ---
    if (documentType === "index") {
      // 1. If format is DOCX, route to DOCX Index generator
      if (format === "docx") {
        const docxBuffer = await generateIndexDocx({
          indexTitle,
          rows: indexRows,
        });

        return new NextResponse(docxBuffer as any, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="TU_Lab_Index_${uniqueId}.docx"`,
          },
        });
      }

      // Convert rows array to Typst syntax
      // Safe escaping for Typst bracket syntax inside rows
      const rowsMarkup = indexRows && indexRows.length > 0
        ? indexRows
            .map((row: any) => {
              const cleanTitle = escapeTypst(row.title || "");
              return `[${row.sn || ""}], [${cleanTitle}], [${row.date || ""}], [${row.signature || ""}]`;
            })
            .join(",\n  ")
        : "";

      // Generate Typst Markup Code for Index
      const typstMarkup = `
#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in)
)

#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#000000"),
  size: 11pt
)

#v(10pt)

#align(center)[
  #text(size: 22pt, weight: "bold")[${indexTitle}]
]

#v(22pt)

#table(
  columns: (0.7fr, 4fr, 1.2fr, 1.2fr),
  align: (center + horizon, left + horizon, center + horizon, center + horizon),
  stroke: 0.5pt + rgb("#000000"),
  inset: 10pt,
  
  // Header Row
  [*SN*], [*Title*], [*Lab Date*], [*Signature*],
  
  // Data Rows
  ${rowsMarkup}
)
      `;

      // If requested format is 'typ', return the Typst source code directly
      if (format === "typ") {
        return new NextResponse(typstMarkup, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="TU_Lab_Index_${uniqueId}.typ"`,
          },
        });
      }

      // Save Typst markup to temporary file
      const tempTypPath = path.join(tmpDir, `index_${uniqueId}.typ`);
      fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
      tempFiles.push(tempTypPath);

      // Compile Typst
      const typstFormat = format === "jpg" ? "png" : format; // pdf, png, svg
      
      let tempOutputPath = "";
      let isMultiPageImage = false;
      
      if (typstFormat === "pdf") {
        tempOutputPath = path.join(tmpDir, `index_${uniqueId}.pdf`);
        tempFiles.push(tempOutputPath);
      } else {
        // Use {n} pattern to support multiple pages without failing in Typst
        tempOutputPath = path.join(tmpDir, `index_${uniqueId}-{n}.${typstFormat}`);
        isMultiPageImage = true;
      }

      const ppiOption = typstFormat === "png" ? " --ppi 150" : "";
      const typstBin = await getTypstBinary();
      const typstCmd = `"${typstBin}" compile --root / "${tempTypPath}" "${tempOutputPath}"${ppiOption}`;
      
      await execAsync(typstCmd, { 
        env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv
      });

      // Read compiled output
      let outputBuffer: Buffer;

      if (isMultiPageImage) {
        // Find all generated page files
        const pageFiles: string[] = [];
        let pageNum = 1;
        while (true) {
          const pagePath = path.join(tmpDir, `index_${uniqueId}-${pageNum}.${typstFormat}`);
          if (fs.existsSync(pagePath)) {
            pageFiles.push(pagePath);
            tempFiles.push(pagePath); // For automatic cleanup
            pageNum++;
          } else {
            break;
          }
        }

        if (pageFiles.length === 0) {
          throw new Error("No pages compiled");
        }

        if (pageFiles.length === 1) {
          outputBuffer = fs.readFileSync(pageFiles[0]);
        } else {
          // Multiple pages! Merge them vertically
          if (typstFormat === "svg") {
            let totalHeight = 0;
            const nestedSVGs: string[] = [];
            for (const file of pageFiles) {
              let content = fs.readFileSync(file, "utf8");
              content = content.replace(/<\?xml.*?\?>/g, "");
              const svgMatch = content.match(/<svg([^>]*?)>/);
              if (svgMatch) {
                const attrs = svgMatch[1];
                const widthMatch = attrs.match(/width="([\d\.]+)pt"/);
                const heightMatch = attrs.match(/height="([\d\.]+)pt"/);
                const viewBoxMatch = attrs.match(/viewBox="([^"]+)"/);
                
                const w = widthMatch ? parseFloat(widthMatch[1]) : 595.28;
                const h = heightMatch ? parseFloat(heightMatch[1]) : 841.89;
                
                const innerContent = content.substring(content.indexOf(">") + 1, content.lastIndexOf("</svg>"));
                nestedSVGs.push(`<svg y="${totalHeight}pt" width="${w}pt" height="${h}pt" viewBox="${viewBoxMatch ? viewBoxMatch[1] : `0 0 ${w} ${h}`}">${innerContent}</svg>`);
                totalHeight += h + 20; // 20pt gap between pages
              }
            }
            outputBuffer = Buffer.from(`
              <svg width="595.28pt" height="${totalHeight}pt" viewBox="0 0 595.28 ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: white;">
                ${nestedSVGs.join("\n")}
              </svg>
            `, "utf8");
          } else {
            // PNG / JPG - stack them vertically
            const pageBuffers = pageFiles.map(file => fs.readFileSync(file));
            const metadatas = await Promise.all(
              pageBuffers.map(buf => sharp(buf).metadata())
            );
            
            let totalHeight = 0;
            let maxWidth = 0;
            const compositeInputs: any[] = [];
            
            for (let i = 0; i < pageBuffers.length; i++) {
              const meta = metadatas[i];
              const w = meta.width || 0;
              const h = meta.height || 0;
              if (w > maxWidth) maxWidth = w;
              
              compositeInputs.push({
                input: pageBuffers[i],
                top: totalHeight,
                left: 0,
              });
              totalHeight += h + 30; // 30px gap
            }
            
            outputBuffer = await sharp({
              create: {
                width: maxWidth,
                height: totalHeight - 30,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
              }
            })
            .composite(compositeInputs)
            .png()
            .toBuffer();
          }
        }
      } else {
        outputBuffer = fs.readFileSync(tempOutputPath);
      }

      // Determine content type
      let contentType = "application/pdf";
      if (format === "png") {
        contentType = "image/png";
      } else if (format === "svg") {
        contentType = "image/svg+xml";
      } else if (format === "jpg") {
        contentType = "image/jpeg";
        outputBuffer = await sharp(outputBuffer)
          .jpeg({ quality: 95 })
          .toBuffer();
      }

      return new NextResponse(outputBuffer as any, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": (format === "svg" || format === "png") ? "inline" : `attachment; filename="TU_Lab_Index_${uniqueId}.${format}"`,
        },
      });
    }

    // --- CASE B: COVER PAGE GENERATOR ---
    // 1. If format is DOCX, route to DOCX generator
    if (format === "docx") {
      const docxBuffer = await generateDocx({
        collegeName,
        collegeLocation,
        facultyOrInstitute,
        subjectName,
        courseCode,
        program,
        semester,
        studentName,
        rollNumber,
        regdNumber,
        examRollNumber,
        batch,
        teacherName,
        teacherDepartment,
        logoBase64,
      });

      return new NextResponse(docxBuffer as any, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="TU_Coverify_${uniqueId}.docx"`,
        },
      });
    }

    // 2. Handle Custom Logo File if base64 is provided
    let collegeLogoPath = path.join(process.cwd(), "public", "default_college_logo.svg").replace(/\\/g, "/");
    if (logoBase64) {
      try {
        // Parse data URI: data:[<mediatype>][;base64],<data>
        const matches = logoBase64.match(/^data:([^;]+);base64,(.*)$/);
        let mimeType = "image/png";
        let base64Data = logoBase64;
        
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = logoBase64.replace(/^data:[^;]+;base64,/, "");
        }
        
        const logoBuffer = Buffer.from(base64Data, "base64");
        
        // Determine correct file extension based on mimeType
        let extension = "png";
        if (mimeType.includes("svg")) {
          extension = "svg";
        } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
          extension = "jpg";
        } else if (mimeType.includes("webp")) {
          extension = "webp";
        }
        
        const logoFilename = `logo_${uniqueId}.${extension}`;
        const logoFullPath = path.join(uploadDir, logoFilename).replace(/\\/g, "/");
        
        // Write the decoded logo file
        fs.writeFileSync(logoFullPath, logoBuffer);
        tempFiles.push(logoFullPath);
        
        // Typst references absolute paths for files outside its project root or relative to CWD.
        // On Vercel, referencing absolute path to /tmp works.
        collegeLogoPath = logoFullPath;
      } catch (err) {
        console.error("Failed to save custom logo:", err);
        collegeLogoPath = path.join(process.cwd(), "public", "default_college_logo.svg").replace(/\\/g, "/");
      }
    }

    const tuLogoPath = path.join(process.cwd(), "public", "tu_logo.svg").replace(/\\/g, "/");

    // 3. Generate Typst Markup Code
    const typstMarkup = `
#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1in, right: 1in)
)

#set text(
  font: ("Liberation Serif", "Nimbus Roman"),
  fill: rgb("#000000"),
  size: 14pt
)

// Header Section (Three-column layout for logos and text)
#grid(
  columns: (1fr, 3.2fr, 1fr),
  align: (center + horizon, center + horizon, center + horizon),
  image("${tuLogoPath}", width: 62pt),
  [
    #set text(weight: "regular")
    #v(3pt)
    #text(size: 16pt)[Tribhuvan University] \\
    #v(3pt)
    #text(size: 15pt)[${facultyOrInstitute}] \\
    #v(6pt)
    #text(size: 20pt, weight: "bold")[${collegeName}] \\
    #v(3pt)
    #text(size: 13pt)[${collegeLocation}]
  ],
  image("${collegeLogoPath}", width: 62pt)
)

#v(22pt)

// Center Divider (Trishul)
#align(center)[
  #box(height: 160pt)[
    #align(horizon)[
      #stack(
        dir: ltr,
        spacing: 16pt,
        rect(width: 4pt, height: 105pt, fill: black),
        rect(width: 6.5pt, height: 160pt, fill: black),
        rect(width: 4pt, height: 105pt, fill: black)
      )
    ]
  ]
]

#v(24pt)

// Report Details
#align(center)[
  #text(size: 18pt, weight: "bold")[Lab Report] \\
  #v(5pt)
  #text(size: 16pt, weight: "bold")[${subjectName}] \\
  #v(2pt)
  #text(size: 15pt, weight: "bold")[(${courseCode})] \\
  #v(5pt)
  #text(size: 16pt, weight: "bold")[${program} ${semester}]
]

#v(45pt)

// Bottom Section (Submitted by & Submitted to)
#grid(
  columns: (1.25fr, 1fr),
  gutter: 15pt,
  align: (left, top),
  [
    #text(size: 15pt, weight: "bold")[Submitted by :] \\
    #v(10pt)
    #stack(
      spacing: 9pt,
      [#text(weight: "bold")[Name:] ${studentName}],
      [#text(weight: "bold")[Roll no.:] ${rollNumber}],
      [#text(weight: "bold")[Semester:] ${semester}],
      [#text(weight: "bold")[Batch:] ${batch}],
      [#text(weight: "bold")[Regd. No:] ${regdNumber}],
      [#text(weight: "bold")[Exam Roll No:] ${examRollNumber}]
    )
  ],
  [
    #text(size: 15pt, weight: "bold")[Submitted to :] \\
    #v(45pt)
    #line(length: 95%, stroke: 1.5pt + black)
    #v(6pt)
    #stack(
      spacing: 9pt,
      [#text(size: 14pt)[${teacherName}]],
      [#text(size: 14pt)[${teacherDepartment}]]
    )
  ]
)
    `;

    // If requested format is 'typ', return the Typst source code directly
    if (format === "typ") {
      return new NextResponse(typstMarkup, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="TU_Coverify_${uniqueId}.typ"`,
        },
      });
    }

    // 4. Save Typst markup to a temporary file in the project root
    const tempTypPath = path.join(tmpDir, `cover_${uniqueId}.typ`);
    fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
    tempFiles.push(tempTypPath);

    // Determine target format and output path
    // Note: JPG uses PNG intermediate compiling
    const typstFormat = format === "jpg" ? "png" : format; // pdf, png, svg
    
    let tempOutputPath = "";
    let isMultiPageImage = false;
    
    if (typstFormat === "pdf") {
      tempOutputPath = path.join(tmpDir, `cover_${uniqueId}.pdf`);
      tempFiles.push(tempOutputPath);
    } else {
      // Use {n} pattern to support multiple pages without failing in Typst
      tempOutputPath = path.join(tmpDir, `cover_${uniqueId}-{n}.${typstFormat}`);
      isMultiPageImage = true;
    }

    // 5. Execute Typst Compilation
    const ppiOption = typstFormat === "png" ? " --ppi 150" : "";
    const typstBin = await getTypstBinary();
    const typstCmd = `"${typstBin}" compile --root / "${tempTypPath}" "${tempOutputPath}"${ppiOption}`;
    
    await execAsync(typstCmd, { 
      env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" } as unknown as NodeJS.ProcessEnv
    });

    // 6. Read compiled output
    let outputBuffer: Buffer;

    if (isMultiPageImage) {
      // Find all generated page files
      const pageFiles: string[] = [];
      let pageNum = 1;
      while (true) {
        const pagePath = path.join(tmpDir, `cover_${uniqueId}-${pageNum}.${typstFormat}`);
        if (fs.existsSync(pagePath)) {
          pageFiles.push(pagePath);
          tempFiles.push(pagePath); // For automatic cleanup
          pageNum++;
        } else {
          break;
        }
      }

      if (pageFiles.length === 0) {
        throw new Error("No pages compiled");
      }

      if (pageFiles.length === 1) {
        outputBuffer = fs.readFileSync(pageFiles[0]);
      } else {
        // Multiple pages! Merge them vertically
        if (typstFormat === "svg") {
          let totalHeight = 0;
          const nestedSVGs: string[] = [];
          for (const file of pageFiles) {
            let content = fs.readFileSync(file, "utf8");
            content = content.replace(/<\?xml.*?\?>/g, "");
            const svgMatch = content.match(/<svg([^>]*?)>/);
            if (svgMatch) {
              const attrs = svgMatch[1];
              const widthMatch = attrs.match(/width="([\d\.]+)pt"/);
              const heightMatch = attrs.match(/height="([\d\.]+)pt"/);
              const viewBoxMatch = attrs.match(/viewBox="([^"]+)"/);
              
              const w = widthMatch ? parseFloat(widthMatch[1]) : 595.28;
              const h = heightMatch ? parseFloat(heightMatch[1]) : 841.89;
              
              const innerContent = content.substring(content.indexOf(">") + 1, content.lastIndexOf("</svg>"));
              nestedSVGs.push(`<svg y="${totalHeight}pt" width="${w}pt" height="${h}pt" viewBox="${viewBoxMatch ? viewBoxMatch[1] : `0 0 ${w} ${h}`}">${innerContent}</svg>`);
              totalHeight += h + 20; // 20pt gap between pages
            }
          }
          outputBuffer = Buffer.from(`
            <svg width="595.28pt" height="${totalHeight}pt" viewBox="0 0 595.28 ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: white;">
              ${nestedSVGs.join("\n")}
            </svg>
          `, "utf8");
        } else {
          // PNG / JPG - stack them vertically
          const pageBuffers = pageFiles.map(file => fs.readFileSync(file));
          const metadatas = await Promise.all(
            pageBuffers.map(buf => sharp(buf).metadata())
          );
          
          let totalHeight = 0;
          let maxWidth = 0;
          const compositeInputs: any[] = [];
          
          for (let i = 0; i < pageBuffers.length; i++) {
            const meta = metadatas[i];
            const w = meta.width || 0;
            const h = meta.height || 0;
            if (w > maxWidth) maxWidth = w;
            
            compositeInputs.push({
              input: pageBuffers[i],
              top: totalHeight,
              left: 0,
            });
            totalHeight += h + 30; // 30px gap
          }
          
          outputBuffer = await sharp({
            create: {
              width: maxWidth,
              height: totalHeight - 30,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            }
          })
          .composite(compositeInputs)
          .png()
          .toBuffer();
        }
      }
    } else {
      outputBuffer = fs.readFileSync(tempOutputPath);
    }

    // 7. If JPG is requested, convert compiled PNG to JPG using sharp
    let contentType = "application/pdf";
    if (format === "png") {
      contentType = "image/png";
    } else if (format === "svg") {
      contentType = "image/svg+xml";
    } else if (format === "jpg") {
      contentType = "image/jpeg";
      outputBuffer = await sharp(outputBuffer)
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    // 8. Return the binary response
    return new NextResponse(outputBuffer as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": (format === "svg" || format === "png") ? "inline" : `attachment; filename="TU_Coverify_${uniqueId}.${format}"`,
      },
    });

  } catch (error: any) {
    console.error("Compilation error in API Route:", error);
    return NextResponse.json(
      {
        error: "Compilation failed",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  } finally {
    // 9. Clean up temporary files asynchronously or in finally block to prevent disk clutter
    for (const filePath of tempFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupErr) {
        console.error("Failed to delete temp file:", filePath, cleanupErr);
      }
    }
  }
}
