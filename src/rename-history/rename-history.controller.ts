import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { RenameHistoryService } from "./rename-history.service";
import { AnalysisRenameHistoryItem } from "./types/rename-history-item.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/rename-history`)
@injectable()
export class RenameHistoryController {
  constructor(
    private readonly renameHistoryService: RenameHistoryService
  ) { }

  @Get()
  async getRenameHistory(
    req: Request<Record<string, never>, PaginatedResult<AnalysisRenameHistoryItem>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisRenameHistoryItem>>,
  ) {
    const renameHistory = await this.renameHistoryService.getRenameHistory(req.query);
    res.status(200).json(renameHistory);
  }
}
