import { Request, Response } from "express";
import { injectable } from "tsyringe";
import {
  ApiErrorResponse,
  UpdateMonitoringStatusRequest,
  UpdateMonitoringStatusResult,
} from "../contracts/api-contracts";
import { Controller, Get, Patch, Post } from "../shared/utils/routing";
import {
  AnalysisReportResult,
  IExportTablePayload,
} from "./analysis.types";
import { AnalysisService } from "./analysis.service";
import { log } from "console";

type AnalysisReportQuery = {
  limit?: string;
};

type AnalysisRouteParams = {
  id: string;
};

@Controller(`/analysis`)
@injectable()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) { }

  @Get(`/report`)
  async getReport(
    req: Request<Record<string, never>, AnalysisReportResult, never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult>,
  ) {
    const result = await this.analysisService.getReport({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Post(`/export-table`)
  async exportTable(
    req: Request<Record<string, never>, unknown, IExportTablePayload>,
    res: Response,
  ) {
    const result = await this.analysisService.exportTable(req.body);
    const asciiFilename = this.toAsciiFilename(result.filename);
    const encodedFilename = encodeURIComponent(result.filename);

    res.set({
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      "Content-Length": result.buffer.length,
    });
    res.end(result.buffer);
  }

  @Patch(`/files/:id/status`)
  async updateFileStatus(
    req: Request<AnalysisRouteParams, UpdateMonitoringStatusResult | ApiErrorResponse, UpdateMonitoringStatusRequest>,
    res: Response<UpdateMonitoringStatusResult | ApiErrorResponse>,
  ) {
    const fileId = Number(req.params.id);
    const result = await this.analysisService.updateFileMonitoringStatus(fileId, req.body);
    res.status(200).json(result);
  }

  private toAsciiFilename(filename: string) {
    const [name, extension = ""] = String(filename).split(/\.(?=[^.]+$)/);
    const safeName = name
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "") || "table_export";
    const safeExtension = extension
      .replace(/[^a-zA-Z0-9]+/g, "")
      .toLowerCase();

    return safeExtension ? `${safeName}.${safeExtension}` : safeName;
  }
}
