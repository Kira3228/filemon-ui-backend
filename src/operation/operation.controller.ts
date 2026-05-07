import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { OperationService } from "./operation.service";
import { AnalysisOperationItem } from "./types/operation-item.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/operations`)
@injectable()
export class OperationController {
  constructor(
    private readonly operationService: OperationService
  ) { }

  @Get()
  async getOperations(
    req: Request<Record<string, never>, PaginatedResult<AnalysisOperationItem>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisOperationItem>>,
  ) {
    const operations = await this.operationService.getOperations(req.query);
    res.status(200).json(operations);
  }
}
