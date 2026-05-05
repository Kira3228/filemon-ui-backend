import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { OperationService } from "./operation.service";

@Controller(`/operations`)
@injectable()
export class OperationController {
  constructor(
    private readonly operationService: OperationService
  ) { }

  @Get()
  async getOperations(req: Request, res: Response) {
    const operations = await this.operationService.getOperations();
    res.status(200).json(operations);
  }
}
