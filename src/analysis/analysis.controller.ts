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
import { AnalysisReportSectionKey, AnalysisService } from "./analysis.service";

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

  @Get(`/report/capabilities`)
  async getReportCapabilities(
    req: Request<Record<string, never>, AnalysisReportResult["capabilities"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["capabilities"]>,
  ) {
    await this.sendReportSection(req, res, "capabilities");
  }

  @Get(`/report/overview`)
  async getReportOverview(
    req: Request<Record<string, never>, AnalysisReportResult["overview"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["overview"]>,
  ) {
    await this.sendReportSection(req, res, "overview");
  }

  @Get(`/report/sources`)
  async getReportSources(
    req: Request<Record<string, never>, AnalysisReportResult["sources"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["sources"]>,
  ) {
    await this.sendReportSection(req, res, "sources");
  }

  @Get(`/report/timeline`)
  async getReportTimeline(
    req: Request<Record<string, never>, AnalysisReportResult["timeline"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["timeline"]>,
  ) {
    await this.sendReportSection(req, res, "timeline");
  }

  @Get(`/report/files`)
  async getReportFiles(
    req: Request<Record<string, never>, AnalysisReportResult["files"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["files"]>,
  ) {
    await this.sendReportSection(req, res, "files");
  }

  @Get(`/report/status-history`)
  async getReportStatusHistory(
    req: Request<Record<string, never>, AnalysisReportResult["statusHistory"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["statusHistory"]>,
  ) {
    await this.sendReportSection(req, res, "statusHistory");
  }

  @Get(`/report/rename-history`)
  async getReportRenameHistory(
    req: Request<Record<string, never>, AnalysisReportResult["renameHistory"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["renameHistory"]>,
  ) {
    await this.sendReportSection(req, res, "renameHistory");
  }

  @Get(`/report/process-reads`)
  async getReportProcessReads(
    req: Request<Record<string, never>, AnalysisReportResult["processReads"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["processReads"]>,
  ) {
    await this.sendReportSection(req, res, "processReads");
  }

  @Get(`/report/operations`)
  async getReportOperations(
    req: Request<Record<string, never>, AnalysisReportResult["operations"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["operations"]>,
  ) {
    await this.sendReportSection(req, res, "operations");
  }

  @Get(`/report/diagram`)
  async getReportDiagram(
    req: Request<Record<string, never>, AnalysisReportResult["diagramData"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["diagramData"]>,
  ) {
    await this.sendReportSection(req, res, "diagramData");
  }

  @Get(`/report/chains`)
  async getReportChains(
    req: Request<Record<string, never>, AnalysisReportResult["chains"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["chains"]>,
  ) {
    await this.sendReportSection(req, res, "chains");
  }

  @Get(`/report/notices`)
  async getReportNotices(
    req: Request<Record<string, never>, AnalysisReportResult["notices"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["notices"]>,
  ) {
    await this.sendReportSection(req, res, "notices");
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

  private async sendReportSection<K extends AnalysisReportSectionKey>(
    req: Request<Record<string, never>, AnalysisReportResult[K], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult[K]>,
    section: K,
  ) {
    const result = await this.analysisService.getReportSection(section, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }
}
