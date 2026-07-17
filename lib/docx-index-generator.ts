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
} from "docx";

export interface IndexRow {
  sn: string;
  title: string;
  date: string;
  signature: string;
}

export interface IndexPageData {
  indexTitle: string;
  rows: IndexRow[];
}

export async function generateIndexDocx(data: IndexPageData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch = 1440 dxa
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // 1. Centered Lab Index Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 480 }, // Spacer
            children: [
              new TextRun({
                text: data.indexTitle || "Lab Index",
                font: "Times New Roman",
                size: 40, // 20pt
                bold: true,
              }),
            ],
          }),

          // 2. The Index Table
          new Table({
            width: {
              size: "100%",
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
            },
            rows: [
              // Header Row
              new TableRow({
                tableHeader: true,
                children: [
                  // SN Column (10%)
                  new TableCell({
                    width: { size: "10%", type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: "SN",
                            font: "Times New Roman",
                            size: 24, // 12pt
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Title Column (60%)
                  new TableCell({
                    width: { size: "60%", type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: "Title",
                            font: "Times New Roman",
                            size: 24, // 12pt
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Lab Date Column (15%)
                  new TableCell({
                    width: { size: "15%", type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: "Lab Date",
                            font: "Times New Roman",
                            size: 24, // 12pt
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // Signature Column (15%)
                  new TableCell({
                    width: { size: "15%", type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: "Signature",
                            font: "Times New Roman",
                            size: 24, // 12pt
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // Data Rows
              ...data.rows.map(
                (row) =>
                  new TableRow({
                    children: [
                      // SN Cell
                      new TableCell({
                        width: { size: "10%", type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 120, after: 120 },
                            children: [
                              new TextRun({
                                text: row.sn,
                                font: "Times New Roman",
                                size: 22, // 11pt
                              }),
                            ],
                          }),
                        ],
                      }),
                      // Title Cell
                      new TableCell({
                        width: { size: "60%", type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 120, after: 120 },
                            children: [
                              new TextRun({
                                text: row.title,
                                font: "Times New Roman",
                                size: 22, // 11pt
                              }),
                            ],
                          }),
                        ],
                      }),
                      // Lab Date Cell
                      new TableCell({
                        width: { size: "15%", type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 120, after: 120 },
                            children: [
                              new TextRun({
                                text: row.date,
                                font: "Times New Roman",
                                size: 22, // 11pt
                              }),
                            ],
                          }),
                        ],
                      }),
                      // Signature Cell
                      new TableCell({
                        width: { size: "15%", type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 120, after: 120 },
                            children: [
                              new TextRun({
                                text: row.signature,
                                font: "Times New Roman",
                                size: 22, // 11pt
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
