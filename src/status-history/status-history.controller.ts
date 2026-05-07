import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { StatusHistoryService } from "./status-history.service";
import { Request, Response } from "express";
import { AnalysisStatusHistoryItem } from "./types/status-history-item.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/status-history`)
@injectable()
export class StatusHistoryController {
  constructor(
    private readonly statusHistoryService: StatusHistoryService
  ) { }

  @Get()
  async getStatusHistory(
    req: Request<Record<string, never>, PaginatedResult<AnalysisStatusHistoryItem>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisStatusHistoryItem>>,
  ) {
    const statusHistory = await this.statusHistoryService.getHistoryService(req.query);
    res.status(200).json(statusHistory);
  }
}
