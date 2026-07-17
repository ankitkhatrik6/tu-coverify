import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { generateDocx } from "@/lib/docx-generator";
import { generateIndexDocx } from "@/lib/docx-index-generator";

// Disable HMR/Watch options for API-based temporary files
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

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

      format = "pdf",
    } = data;

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
              const cleanTitle = (row.title || "")
                .replace(/\\/g, "\\\\")
                .replace(/\[/g, "\\[")
                .replace(/\]/g, "\\]");
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
      const tempTypPath = path.join(process.cwd(), `index_${uniqueId}.typ`);
      fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
      tempFiles.push(tempTypPath);

      // Compile Typst
      const typstFormat = format === "jpg" ? "png" : format; // pdf, png, svg
      
      let tempOutputPath = "";
      let isMultiPageImage = false;
      
      if (typstFormat === "pdf") {
        tempOutputPath = path.join(process.cwd(), `index_${uniqueId}.pdf`);
        tempFiles.push(tempOutputPath);
      } else {
        // Use {n} pattern to support multiple pages without failing in Typst
        tempOutputPath = path.join(process.cwd(), `index_${uniqueId}-{n}.${typstFormat}`);
        isMultiPageImage = true;
      }

      const ppiOption = typstFormat === "png" ? " --ppi 150" : "";
      const typstBin = path.join(process.cwd(), "bin", "typst");
      const typstCmd = `"${typstBin}" compile "${tempTypPath}" "${tempOutputPath}"${ppiOption}`;
      
      await execAsync(typstCmd, { 
        env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" }
      });

      // Read compiled output
      let outputBuffer: Buffer;

      if (isMultiPageImage) {
        // Find all generated page files
        const pageFiles: string[] = [];
        let pageNum = 1;
        while (true) {
          const pagePath = path.join(process.cwd(), `index_${uniqueId}-${pageNum}.${typstFormat}`);
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
    const tempTypPath = path.join(process.cwd(), `cover_${uniqueId}.typ`);
    fs.writeFileSync(tempTypPath, typstMarkup, "utf-8");
    tempFiles.push(tempTypPath);

    // Determine target format and output path
    // Note: JPG uses PNG intermediate compiling
    const typstFormat = format === "jpg" ? "png" : format; // pdf, png, svg
    
    let tempOutputPath = "";
    let isMultiPageImage = false;
    
    if (typstFormat === "pdf") {
      tempOutputPath = path.join(process.cwd(), `cover_${uniqueId}.pdf`);
      tempFiles.push(tempOutputPath);
    } else {
      // Use {n} pattern to support multiple pages without failing in Typst
      tempOutputPath = path.join(process.cwd(), `cover_${uniqueId}-{n}.${typstFormat}`);
      isMultiPageImage = true;
    }

    // 5. Execute Typst Compilation
    const ppiOption = typstFormat === "png" ? " --ppi 150" : "";
    const typstBin = path.join(process.cwd(), "bin", "typst");
    const typstCmd = `"${typstBin}" compile "${tempTypPath}" "${tempOutputPath}"${ppiOption}`;
    
    await execAsync(typstCmd, { 
      env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "" }
    });

    // 6. Read compiled output
    let outputBuffer: Buffer;

    if (isMultiPageImage) {
      // Find all generated page files
      const pageFiles: string[] = [];
      let pageNum = 1;
      while (true) {
        const pagePath = path.join(process.cwd(), `cover_${uniqueId}-${pageNum}.${typstFormat}`);
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
