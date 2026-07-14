import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

/**
 * Phase 9 — PDF/Excel export for the Reports module. Every report endpoint already returns
 * structured JSON (Phase 3.11); this module turns that same data into a flat table (one
 * `ExportColumn[]` definition per report type, see `export-columns.ts`) and streams it back as
 * either a PDF or an XLSX file. Print-friendly output is handled entirely client-side
 * (`window.print()` + print CSS) — nothing to generate server-side for that.
 */

export interface ExportColumn<T> {
  header: string;
  width?: number;
  /** Raw value accessor — formatting (currency, date) happens in the renderer, not here. */
  value: (row: T) => string | number;
}

function filenameFor(reportType: string, ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${reportType}-report-${stamp}.${ext}`;
}

export function sendExcelExport<T>(
  res: Response,
  reportType: string,
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  summaryLines: string[] = [],
): void {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP Demo';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31));

  sheet.columns = columns.map((col) => ({ header: col.header, key: col.header, width: col.width ?? 20 }));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(columns.map((col) => col.value(row)));
  }

  if (summaryLines.length > 0) {
    sheet.addRow([]);
    for (const line of summaryLines) {
      const summaryRow = sheet.addRow([line]);
      summaryRow.font = { bold: true };
    }
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filenameFor(reportType, 'xlsx')}"`);

  void workbook.xlsx.write(res).then(() => res.end());
}

export function sendPdfExport<T>(
  res: Response,
  reportType: string,
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  summaryLines: string[] = [],
): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameFor(reportType, 'pdf')}"`);
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: 'left' });
  doc.fontSize(9).fillColor('#666').text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown();

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;
  const rowHeight = 18;

  function drawHeader(y: number): number {
    doc.fontSize(9).fillColor('#000').font('Helvetica-Bold');
    columns.forEach((col, i) => {
      doc.text(col.header, doc.page.margins.left + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
    doc.font('Helvetica');
    return y + rowHeight;
  }

  let y = drawHeader(doc.y + 6);

  for (const row of rows) {
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
    }
    doc.fontSize(8).fillColor('#111');
    columns.forEach((col, i) => {
      const val = col.value(row);
      doc.text(String(val), doc.page.margins.left + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
    y += rowHeight;
  }

  if (summaryLines.length > 0) {
    y += 10;
    doc.fontSize(10).font('Helvetica-Bold');
    for (const line of summaryLines) {
      if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.text(line, doc.page.margins.left, y);
      y += rowHeight;
    }
  }

  doc.end();
}

export type ExportFormat = 'pdf' | 'excel';

export function parseExportFormat(value: unknown): ExportFormat | null {
  if (value === 'pdf' || value === 'excel') return value;
  return null;
}
