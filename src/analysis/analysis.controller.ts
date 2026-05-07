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
  AnalysisReportSummary,
  IExportTablePayload,
} from "./analysis.types";
import { AnalysisService } from "./analysis.service";

type AnalysisReportQuery = {
  limit?: string;
  page?: string;
};

type AnalysisRouteParams = {
  id: string;
};

@Controller(`/analysis`)
@injectable()
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
  ) { }

  @Get(`/report`)
  async getReport(
    req: Request<Record<string, never>, AnalysisReportResult, never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult>,
  ): Promise<void> {
    const result = await this.analysisService.getReport({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/capabilities`)
  async getReportCapabilities(
    req: Request<Record<string, never>, AnalysisReportResult["capabilities"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["capabilities"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportCapabilities({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/summary`)
  async getReportSummary(
    req: Request<Record<string, never>, AnalysisReportSummary, never, AnalysisReportQuery>,
    res: Response<AnalysisReportSummary>,
  ): Promise<void> {
    const result = await this.analysisService.getReportSummary({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }
 
  @Get(`/report/overview`)
  async getReportOverview(
    req: Request<Record<string, never>, AnalysisReportResult["overview"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["overview"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportOverview({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/sources`)
  async getReportSources(
    req: Request<Record<string, never>, AnalysisReportResult["sources"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["sources"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportSources({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/timeline`)
  async getReportTimeline(
    req: Request<Record<string, never>, AnalysisReportResult["timeline"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["timeline"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportTimeline({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/files`)
  async getReportFiles(
    req: Request<Record<string, never>, AnalysisReportResult["files"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["files"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportFiles({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/status-history`)
  async getReportStatusHistory(
    req: Request<Record<string, never>, AnalysisReportResult["statusHistory"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["statusHistory"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportStatusHistory({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/rename-history`)
  async getReportRenameHistory(
    req: Request<Record<string, never>, AnalysisReportResult["renameHistory"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["renameHistory"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportRenameHistory({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/process-reads`)
  async getReportProcessReads(
    req: Request<Record<string, never>, AnalysisReportResult["processReads"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["processReads"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportProcessReads({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/operations`)
  async getReportOperations(
    req: Request<Record<string, never>, AnalysisReportResult["operations"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["operations"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportOperations({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/diagram`)
  async getReportDiagram(
    req: Request<Record<string, never>, AnalysisReportResult["diagramData"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["diagramData"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportDiagram({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/chains`)
  async getReportChains(
    req: Request<Record<string, never>, AnalysisReportResult["chains"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["chains"]>,
  ): Promise<void> {

    const result = await this.analysisService.getReportChains({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Get(`/report/notices`)
  async getReportNotices(
    req: Request<Record<string, never>, AnalysisReportResult["notices"], never, AnalysisReportQuery>,
    res: Response<AnalysisReportResult["notices"]>,
  ): Promise<void> {
    const result = await this.analysisService.getReportNotices({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
    });

    res.set("Cache-Control", "no-store");
    res.status(200).json(result);
  }

  @Post(`/export-table`)
  async exportTable(
    req: Request<Record<string, never>, unknown, IExportTablePayload>,
    res: Response,
  ): Promise<void> {
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
  ): Promise<void> {
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