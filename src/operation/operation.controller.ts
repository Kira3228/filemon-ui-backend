import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { OperationService } from "./operation.service";
import { AnalysisOperationItem } from "./types/operation-item.type";

@Controller(`/operations`)
@injectable()
export class OperationController {
  constructor(
    private readonly operationService: OperationService
  ) { }

  @Get()
  async getOperations(
    req: Request<Record<string, never>, AnalysisOperationItem[]>,
    res: Response<AnalysisOperationItem[]>,
  ) {
    const operations = await this.operationService.getOperations();
    res.status(200).json(operations);
  }
}
