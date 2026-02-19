import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  LevelFormat,
} from 'docx';

// Types matching the extraction results
interface FieldValue {
  value?: string;
  is_checked?: boolean;
  circled_options?: string[];
  confidence: number;
  has_correction?: boolean;
  original_value?: string;
}

interface AnnotationGroup {
  group_id: string;
  interpretation: string;
  clinical_significance?: string;
  member_element_ids: string[];
  note?: string;
}

interface FreeFormAnnotation {
  annotation_id: string;
  text_content: string;
  location_description: string;
  interpretation?: string;
  confidence: number;
  needs_review: boolean;
  review_reason?: string;
}

interface PageResult {
  page_number: number;
  field_values: Record<string, FieldValue>;
  annotation_groups: AnnotationGroup[];
  free_form_annotations: FreeFormAnnotation[];
  overall_confidence: number;
  items_needing_review: number;
  review_reasons: string[];
}

interface ExtractionResult {
  form_id: string;
  form_name: string;
  extraction_timestamp: string;
  patient_name?: string;
  patient_dob?: string;
  form_date?: string;
  overall_confidence: number;
  total_items_needing_review: number;
  all_review_reasons: string[];
  pages: PageResult[];
}

// Helper function to get confidence color as hex
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return '22C55E'; // green
  if (confidence >= 0.7) return 'EAB308'; // yellow
  return 'EF4444'; // red
}

// Helper function to get confidence label
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.7) return 'Medium';
  return 'Low';
}

// Create table cell border style
const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

export async function POST(request: NextRequest) {
  try {
    const results: ExtractionResult = await request.json();

    // Create the document
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 22 }, // 11pt
          },
        },
        paragraphStyles: [
          {
            id: 'Title',
            name: 'Title',
            basedOn: 'Normal',
            run: { size: 48, bold: true, color: '1E40AF' },
            paragraph: { spacing: { after: 200 }, alignment: AlignmentType.CENTER },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 32, bold: true, color: '1F2937' },
            paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 26, bold: true, color: '374151' },
            paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 },
          },
        ],
      },
      numbering: {
        config: [
          {
            reference: 'bullet-list',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '\u2022',
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              },
            ],
          },
          {
            reference: 'review-list',
            levels: [
              {
                level: 0,
                format: LevelFormat.DECIMAL,
                text: '%1.',
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: 'Medical Form Extraction Report',
                      size: 18,
                      color: '6B7280',
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Page ', size: 18, color: '6B7280' }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '6B7280' }),
                    new TextRun({ text: ' of ', size: 18, color: '6B7280' }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '6B7280' }),
                  ],
                }),
              ],
            }),
          },
          children: [
            // Title
            new Paragraph({
              heading: HeadingLevel.TITLE,
              children: [new TextRun('Medical Form Extraction Report')],
            }),

            // Form name subtitle
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: results.form_name,
                  size: 28,
                  color: '4B5563',
                }),
              ],
            }),

            // Patient Information Section
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun('Patient Information')],
            }),

            // Patient info table
            new Table({
              columnWidths: [3000, 6000],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Patient Name', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [new TextRun(results.patient_name || 'Not detected')],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Date of Birth', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [new TextRun(results.patient_dob || 'Not detected')],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Form Date', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [new TextRun(results.form_date || 'Not detected')],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Extraction Date', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun(new Date(results.extraction_timestamp).toLocaleString()),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Summary Section
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun('Extraction Summary')],
            }),

            // Summary table
            new Table({
              columnWidths: [4500, 4500],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Overall Confidence', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: `${(results.overall_confidence * 100).toFixed(0)}% (${getConfidenceLabel(results.overall_confidence)})`,
                              color: getConfidenceColor(results.overall_confidence),
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Total Pages Analyzed', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [new TextRun(results.pages.length.toString())],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Total Fields Extracted', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun(
                              results.pages
                                .reduce((sum, p) => sum + Object.keys(p.field_values).length, 0)
                                .toString()
                            ),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: 'Items Requiring Review', bold: true })],
                        }),
                      ],
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: results.total_items_needing_review.toString(),
                              color:
                                results.total_items_needing_review > 0 ? 'EAB308' : '22C55E',
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            // Complete Extraction by Page - Shows ALL extracted field values
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun('Complete Extraction Summary')],
            }),
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: 'All extracted field values organized by page:',
                  color: '6B7280',
                }),
              ],
            }),

            // For each page, create a table of extracted fields
            ...results.pages.flatMap((page) => {
              const fieldEntries = Object.entries(page.field_values);
              if (fieldEntries.length === 0) {
                return [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun(`Page ${page.page_number}`)],
                  }),
                  new Paragraph({
                    spacing: { after: 200 },
                    children: [
                      new TextRun({
                        text: 'No fields extracted from this page.',
                        italics: true,
                        color: '6B7280',
                      }),
                    ],
                  }),
                ];
              }

              // Helper to format field value for display
              const formatValue = (fv: FieldValue): string => {
                if (fv.circled_options && fv.circled_options.length > 0) {
                  return fv.circled_options.join(', ');
                }
                if (fv.is_checked !== null && fv.is_checked !== undefined) {
                  return fv.is_checked ? 'YES' : 'NO';
                }
                return fv.value || '(empty)';
              };

              return [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [new TextRun(`Page ${page.page_number}`)],
                }),
                new Table({
                  columnWidths: [3500, 4500, 1500],
                  rows: [
                    // Header row
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: cellBorders,
                          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: 'Field', bold: true })],
                            }),
                          ],
                        }),
                        new TableCell({
                          borders: cellBorders,
                          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: 'Value', bold: true })],
                            }),
                          ],
                        }),
                        new TableCell({
                          borders: cellBorders,
                          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
                          children: [
                            new Paragraph({
                              children: [new TextRun({ text: 'Confidence', bold: true })],
                            }),
                          ],
                        }),
                      ],
                    }),
                    // Data rows
                    ...fieldEntries.map(([fieldId, fieldValue]) =>
                      new TableRow({
                        children: [
                          new TableCell({
                            borders: cellBorders,
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: fieldId, size: 20 })],
                              }),
                            ],
                          }),
                          new TableCell({
                            borders: cellBorders,
                            children: [
                              new Paragraph({
                                children: [new TextRun({ text: formatValue(fieldValue), size: 20 })],
                              }),
                            ],
                          }),
                          new TableCell({
                            borders: cellBorders,
                            children: [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: `${(fieldValue.confidence * 100).toFixed(0)}%`,
                                    size: 20,
                                    color: getConfidenceColor(fieldValue.confidence),
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
                // Add spacing after each table
                new Paragraph({ spacing: { after: 300 }, children: [] }),
              ];
            }),

            // Review Items Section (if any)
            ...(results.all_review_reasons.length > 0
              ? [
                  new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun('Items Requiring Review')],
                  }),
                  new Paragraph({
                    spacing: { after: 200 },
                    children: [
                      new TextRun({
                        text: 'The following items were flagged during extraction and may require manual verification:',
                        color: '6B7280',
                      }),
                    ],
                  }),
                  ...results.all_review_reasons.map(
                    (reason, idx) =>
                      new Paragraph({
                        numbering: { reference: 'review-list', level: 0 },
                        children: [new TextRun(reason)],
                      })
                  ),
                ]
              : []),

            // Page-by-Page Clinical Annotations
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun('Clinical Annotations & Review Items by Page')],
            }),

            // Each page
            ...results.pages.flatMap((page) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                  new TextRun(`Page ${page.page_number}`),
                  new TextRun({
                    text: ` (${(page.overall_confidence * 100).toFixed(0)}% confidence)`,
                    color: getConfidenceColor(page.overall_confidence),
                  }),
                ],
              }),

              // Page stats
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: `Fields: ${Object.keys(page.field_values).length} | `,
                    color: '6B7280',
                  }),
                  new TextRun({
                    text: `Annotations: ${page.annotation_groups.length} | `,
                    color: '6B7280',
                  }),
                  new TextRun({
                    text: `Review items: ${page.items_needing_review}`,
                    color: page.items_needing_review > 0 ? 'EAB308' : '6B7280',
                  }),
                ],
              }),

              // Annotation groups for this page
              ...(page.annotation_groups.length > 0
                ? [
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [
                        new TextRun({
                          text: 'Clinical Annotations:',
                          bold: true,
                          color: '1F2937',
                        }),
                      ],
                    }),
                    ...page.annotation_groups.map(
                      (group) =>
                        new Paragraph({
                          numbering: { reference: 'bullet-list', level: 0 },
                          children: [
                            new TextRun(group.interpretation),
                            ...(group.note
                              ? [
                                  new TextRun({
                                    text: ` (Note: ${group.note})`,
                                    italics: true,
                                    color: '6B7280',
                                  }),
                                ]
                              : []),
                          ],
                        })
                    ),
                  ]
                : []),

              // Review reasons for this page
              ...(page.review_reasons.length > 0
                ? [
                    new Paragraph({
                      spacing: { before: 200 },
                      children: [
                        new TextRun({
                          text: 'Review Required:',
                          bold: true,
                          color: 'EAB308',
                        }),
                      ],
                    }),
                    ...page.review_reasons.map(
                      (reason) =>
                        new Paragraph({
                          numbering: { reference: 'bullet-list', level: 0 },
                          children: [new TextRun({ text: reason, color: '92400E' })],
                        })
                    ),
                  ]
                : []),
            ]),

            // Footer note
            new Paragraph({
              spacing: { before: 600 },
              children: [
                new TextRun({
                  text: 'This report was generated automatically by Digital Ink AI-powered extraction. All findings should be verified by qualified medical personnel.',
                  size: 18,
                  italics: true,
                  color: '9CA3AF',
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generate the document
    const buffer = await Packer.toBuffer(doc);

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${results.form_name}_findings_report.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
