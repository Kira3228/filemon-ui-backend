import * as path from "path";
import { injectable } from "tsyringe";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, TFontDictionary } from "pdfmake/interfaces";
import { AnalysisNormalizerService } from "./analysis-normalizer.service";
import { IExportTablePayload, IExportTableResult, TExportFormat } from "./analysis.types";

@injectable()
export class AnalysisExportService {
  private readonly robotoFontPath = path.resolve(__dirname, "../assets/Roboto.ttf");

  constructor(private readonly normalizer: AnalysisNormalizerService) {}

  async exportTable(payload: IExportTablePayload): Promise<IExportTableResult> {
    const headers = Array.isArray(payload.headers) ? payload.headers.map((item) => String(item || "")) : [];
    const rows = Array.isArray(payload.rows)
      ? payload.rows.map((row) =>
        Array.isArray(row) ? row.map((cell) => this.normalizer.normalizeExportCell(cell)) : [],
      )
      : [];
    const rowKinds = Array.isArray(payload.rowKinds) ? payload.rowKinds.map((item) => String(item || "")) : [];
    const format: TExportFormat = payload.format === "csv" ? "csv" : "pdf";
    const title = String(payload.title || "Таблица").trim() || "Таблица";
    const fileBase = this.normalizer.toFileName(title);

    if (format === "csv") {
      return {
        filename: `${fileBase}.csv`,
        contentType: "text/csv; charset=utf-8",
        buffer: this.generateCsvBuffer(headers, rows),
      };
    }

    return {
      filename: `${fileBase}.pdf`,
      contentType: "application/pdf",
      buffer: await this.generateTablePdf(title, headers, rows, rowKinds),
    };
  }

  private generateCsvBuffer(headers: string[], rows: string[][]) {
    const escapeCell = (value: string) => {
      if (/[;"\r\n]/.test(value)) {
        return `"${value.replace(/"/g, `""`)}"`;
      }

      return value;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(";"))
      .join("\r\n");

    return Buffer.from(`\uFEFF${csv}`, "utf8");
  }

  private async generateTablePdf(title: string, headers: string[], rows: string[][], rowKinds: string[] = []) {
    const fonts: TFontDictionary = {
      Roboto: {
        normal: this.robotoFontPath,
        bold: this.robotoFontPath,
        italics: this.robotoFontPath,
        bolditalics: this.robotoFontPath,
      },
    };

    const printer = new PdfPrinter(fonts);
    const widths = new Array(headers.length).fill("auto");
    const tableBody = [
      headers.map((cell) => ({
        text: cell,
        bold: true,
        fillColor: "#dbe2ea",
      })),
      ...rows.map((row, rowIndex) => {
        const rowKind = rowKinds[rowIndex] || "";
        const isProcessRow = rowKind === "process";
        const rowFillColor = isProcessRow ? "#dbeafe" : rowKind === "spacer" ? "#ffffff" : undefined;

        return row.map((cell) => ({
          text: cell,
          bold: isProcessRow,
          fillColor: rowFillColor,
        }));
      }),
    ];
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: title, style: "header" },
        { text: `Сгенерировано: ${new Date().toLocaleString("ru-RU")}`, style: "subheader" },
        {
          table: {
            headerRows: 1,
            widths,
            dontBreakRows: true,
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) {
                return "#dbe2ea";
              }

              const rowKind = rowKinds[rowIndex - 1] || "";
              if (rowKind === "process") {
                return "#dbeafe";
              }
              if (rowKind === "spacer") {
                return "#ffffff";
              }

              return rowIndex % 2 === 0 ? "#f8fafc" : null;
            },
          },
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8], alignment: "center" },
        subheader: { fontSize: 9, margin: [0, 0, 0, 10], alignment: "center" },
      },
      defaultStyle: { font: "Roboto", fontSize: 7 },
      pageSize: "A4",
      pageOrientation: headers.length > 6 ? "landscape" : "portrait",
      pageMargins: [20, 24, 20, 24],
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));
      pdfDoc.end();
    });
  }
}
