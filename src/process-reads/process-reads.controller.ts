import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { ProcessReadsService } from "./process-reads.service";
import { AnalysisProcessReadGroup } from "./types/process-read-group.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/process-reads`)
@injectable()
export class ProcessReadsController {
  constructor(
    private readonly processReadsService: ProcessReadsService
  ) { }

  @Get()
  async getProcessReads(
    req: Request<Record<string, never>, PaginatedResult<AnalysisProcessReadGroup>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisProcessReadGroup>>,
  ) {
    const processReads = await this.processReadsService.getProcessReads(req.query);
    res.status(200).json(processReads);
  }
}
