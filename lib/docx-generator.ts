import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  UnderlineType,
} from "docx";
import fs from "fs";
import path from "path";
import sharp from "sharp";

interface CoverPageData {
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
  logoBase64?: string; // uploaded college logo as base64 string
}

export async function generateDocx(data: CoverPageData): Promise<Buffer> {
  const assetsPath = path.join(process.cwd(), "public");

  // 1. Get TU Logo Buffer
  let tuLogoBuffer: Buffer;
  try {
    tuLogoBuffer = fs.readFileSync(path.join(assetsPath, "tu_logo.png"));
  } catch (error) {
    // Fallback if not loaded yet
    tuLogoBuffer = Buffer.alloc(0);
  }

  // 2. Get College Logo Buffer (handle upload base64 or default SVG converted to PNG)
  let collegeLogoBuffer: Buffer;
  if (data.logoBase64) {
    try {
      const matches = data.logoBase64.match(/^data:([^;]+);base64,(.*)$/);
      let base64Data = data.logoBase64;
      if (matches && matches.length === 3) {
        base64Data = matches[2];
      } else {
        base64Data = data.logoBase64.replace(/^data:[^;]+;base64,/, "");
      }
      const uploadedBuffer = Buffer.from(base64Data, "base64");
      // Use sharp to resize and ensure it is a clean PNG
      collegeLogoBuffer = await sharp(uploadedBuffer)
        .resize({ width: 150, height: 150, fit: "inside" })
        .png()
        .toBuffer();
    } catch (e) {
      // Fallback to default
      collegeLogoBuffer = await sharp(path.join(assetsPath, "default_college_logo.svg"))
        .png()
        .toBuffer();
    }
  } else {
    try {
      collegeLogoBuffer = await sharp(path.join(assetsPath, "default_college_logo.svg"))
        .png()
        .toBuffer();
    } catch (e) {
      collegeLogoBuffer = Buffer.alloc(0);
    }
  }

  // 3. Generate the three vertical divider lines (Trishul) as a PNG buffer to guarantee perfect alignment
  const linesSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
      <rect x="42" y="32.5" width="2.6" height="85" fill="black" />
      <rect x="72.7" y="10" width="4.6" height="130" fill="black" />
      <rect x="105.4" y="32.5" width="2.6" height="85" fill="black" />
    </svg>
  `;
  let linesPngBuffer: Buffer;
  try {
    linesPngBuffer = await sharp(Buffer.from(linesSvg))
      .png()
      .toBuffer();
  } catch (e) {
    linesPngBuffer = Buffer.alloc(0);
  }

  // 4. Create Paragraphs
  const pSpace = (points: number) => {
    return new Paragraph({
      spacing: { before: points * 20, after: 0 }, // in dxa (1/20 of a pt)
    });
  };

  // Build the Header Grid Table (3 columns)
  // Left column: TU Logo (width 1.2 inches)
  // Center column: College Details (width 4.0 inches)
  // Right column: College Logo (width 1.2 inches)
  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          // Left Cell (TU Logo)
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: tuLogoBuffer.length > 0 ? [
                  new ImageRun({
                    data: tuLogoBuffer,
                    transformation: {
                      width: 68,
                      height: 68,
                    },
                  } as any),
                ] : [],
              }),
            ],
          }),
          // Center Cell (Details Text)
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({
                    text: "Tribhuvan University",
                    font: "Times New Roman",
                    size: 32, // 16pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 120 },
                children: [
                  new TextRun({
                    text: "Institute of Science and Technology",
                    font: "Times New Roman",
                    size: 30, // 15pt
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({
                    text: data.collegeName || "Amrit Campus",
                    font: "Times New Roman",
                    size: 40, // 20pt
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: data.collegeLocation || "Thamel, Kathmandu",
                    font: "Times New Roman",
                    size: 26, // 13pt
                  }),
                ],
              }),
            ],
          }),
          // Right Cell (College Logo)
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: collegeLogoBuffer.length > 0 ? [
                  new ImageRun({
                    data: collegeLogoBuffer,
                    transformation: {
                      width: 68,
                      height: 68,
                    },
                  } as any),
                ] : [],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Vertical lines divider paragraph
  const dividerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: linesPngBuffer.length > 0 ? [
      new ImageRun({
        data: linesPngBuffer,
        transformation: {
          width: 110,
          height: 110,
        },
      } as any),
    ] : [],
  });

  // Lab Report Section
  const reportSection = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: "Lab Report",
          font: "Times New Roman",
          size: 36, // 18pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: data.subjectName || "Introduction to Information Technology",
          font: "Times New Roman",
          size: 32, // 16pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: data.courseCode ? `(${data.courseCode})` : "(CSC 114)",
          font: "Times New Roman",
          size: 30, // 15pt
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: `${data.program || "BSc CSIT"} ${data.semester || "First Semester"}`,
          font: "Times New Roman",
          size: 32, // 16pt
          bold: true,
        }),
      ],
    }),
  ];

  // Bottom Section (Submitted by & Submitted to columns)
  const bottomTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          // Submitted By Cell
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 160 },
                children: [
                  new TextRun({
                    text: "Submitted by :",
                    font: "Times New Roman",
                    size: 30, // 15pt
                    bold: true,
                    underline: {
                      type: UnderlineType.SINGLE,
                    },
                  }),
                ],
              }),
              ...[
                { label: "Name: ", val: data.studentName || "Ankit Khatri KC" },
                { label: "Roll no.: ", val: data.rollNumber || "09/82" },
                { label: "Semester: ", val: data.semester || "I" },
                { label: "Batch: ", val: data.batch || "2082" },
                { label: "Regd. No: ", val: data.regdNumber || "5-2-33-43-2025" },
                { label: "Exam Roll No: ", val: data.examRollNumber || "82010151" },
              ].map(
                (item) =>
                  new Paragraph({
                    spacing: { before: 0, after: 120 },
                    children: [
                      new TextRun({
                        text: item.label,
                        font: "Times New Roman",
                        size: 28, // 14pt
                        bold: true,
                      }),
                      new TextRun({
                        text: item.val,
                        font: "Times New Roman",
                        size: 28, // 14pt
                      }),
                    ],
                  })
              ),
            ],
          }),
          // Submitted To Cell
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 160 },
                children: [
                  new TextRun({
                    text: "Submitted to :",
                    font: "Times New Roman",
                    size: 30, // 15pt
                    bold: true,
                    underline: {
                      type: UnderlineType.SINGLE,
                    },
                  }),
                ],
              }),
              pSpace(40), // Spacing before signature line
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({
                    text: "--------------------------------------------------",
                    font: "Times New Roman",
                    size: 24,
                    color: "555555",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: data.teacherName || "Gyani Ray",
                    font: "Times New Roman",
                    size: 28, // 14pt
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Assemble document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch in dxa
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          headerTable,
          pSpace(24),
          dividerParagraph,
          pSpace(24),
          ...reportSection,
          pSpace(32),
          bottomTable,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
