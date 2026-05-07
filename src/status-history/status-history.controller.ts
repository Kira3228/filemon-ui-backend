import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { StatusHistoryService } from "./status-history.service";
import { Request, Response } from "express";
import { AnalysisStatusHistoryItem } from "./types/status-history-item.type";

@Controller(`/status-history`)
@injectable()
export class StatusHistoryController {
  constructor(
    private readonly statusHistoryService: StatusHistoryService
  ) { }

  @Get()
  async getStatusHistory(
    req: Request<Record<string, never>, AnalysisStatusHistoryItem[]>,
    res: Response<AnalysisStatusHistoryItem[]>,
  ) {
    const statusHistory = await this.statusHistoryService.getHistoryService();
    res.status(200).json(statusHistory);
  }
}
