import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { generateDocx } from "@/lib/docx-generator";

// Disable HMR/Watch options for API-based temporary files
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const tmpDir = "/tmp";

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
      collegeName = "Amrit Science Campus",
      collegeLocation = "Lainchaur, Kathmandu",
      subjectName = "Introduction to Information Technology",
      courseCode = "CSC 114",
      program = "BSc CSIT",
      semester = "First Semester",
      studentName = "Siddharth Shrestha",
      rollNumber = "15/82",
      regdNumber = "5-2-1234-567-2025",
      examRollNumber = "820015",
      batch = "2082",
      teacherName = "Prof. Dr. Hari Prasad",
      logoBase64,
      format = "pdf",
    } = data;

    // 1. If format is DOCX, route to DOCX generator
    if (format === "docx") {
      const docxBuffer = await generateDocx({
        collegeName,
        collegeLocation,
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
    let collegeLogoPath = "public/default_college_logo.svg";
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
        const logoFullPath = path.join(uploadDir, logoFilename);
        
        // Write the decoded logo file
        fs.writeFileSync(logoFullPath, logoBuffer);
        tempFiles.push(logoFullPath);
        
        // Typst references relative to project root
        collegeLogoPath = `public/uploads/${logoFilename}`;
      } catch (err) {
        console.error("Failed to save custom logo:", err);
        collegeLogoPath = "public/default_college_logo.svg";
      }
    }

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
  image("public/tu_logo.svg", width: 62pt),
  [
    #set text(weight: "regular")
    #v(3pt)
    #text(size: 16pt)[Tribhuvan University] \\
    #v(3pt)
    #text(size: 15pt)[Institute of Science and Technology] \\
    #v(6pt)
    #text(size: 20pt, weight: "bold")[${collegeName}] \\
    #v(3pt)
    #text(size: 13pt)[${collegeLocation}]
  ],
  image("${collegeLogoPath}", width: 62pt)
)

#v(42pt)

// Center Divider (Trishul)
#align(center)[
  #box(height: 125pt)[
    #align(horizon)[
      #stack(
        dir: ltr,
        spacing: 12pt,
        rect(width: 2.2pt, height: 80pt, fill: black),
        rect(width: 3.8pt, height: 125pt, fill: black),
        rect(width: 2.2pt, height: 80pt, fill: black)
      )
    ]
  ]
]

#v(48pt)

// Report Details
#align(center)[
  #text(size: 18pt, weight: "bold")[Lab Report] \\
  #v(8pt)
  #text(size: 16pt, weight: "bold")[${subjectName}] \\
  #v(4pt)
  #text(size: 15pt, weight: "bold")[(${courseCode})] \\
  #v(8pt)
  #text(size: 16pt, weight: "bold")[${program} ${semester}]
]

#v(58pt)

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
    #v(52pt)
    #line(length: 88%, stroke: 0.8pt + black)
    #v(4pt)
    #text(size: 14pt, weight: "regular")[${teacherName}]
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
    const tempTypPath = path.join(process.cwd(), `cover_${uniqueId}.typ`);
    fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
    tempFiles.push(tempTypPath);

    // Determine target format and output path
    // Note: JPG uses PNG intermediate compiling
    const typstFormat = format === "jpg" ? "png" : format; // pdf, png, svg
    const tempOutputPath = path.join(process.cwd(), `cover_${uniqueId}.${typstFormat}`);
    tempFiles.push(tempOutputPath);

    // 5. Execute Typst Compilation
    const ppiOption = typstFormat === "png" ? " --ppi 150" : "";
    const typstBin = path.join(process.cwd(), "bin", "typst");
    // Wrap all paths in quotes to safely handle spaces in directory names
    const typstCmd = `"${typstBin}" compile "${tempTypPath}" "${tempOutputPath}"${ppiOption}`;
    
    execSync(typstCmd, { stdio: "pipe" });

    // 6. Read compiled output
    let outputBuffer = fs.readFileSync(tempOutputPath);

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
        "Content-Disposition": format === "svg" ? "inline" : `attachment; filename="TU_Coverify_${uniqueId}.${format}"`,
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
