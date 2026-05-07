import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { ProcessReadsService } from "./process-reads.service";
import { AnalysisProcessReadGroup } from "./types/process-read-group.type";

@Controller(`/process-reads`)
@injectable()
export class ProcessReadsController {
  constructor(
    private readonly processReadsService: ProcessReadsService
  ) { }

  @Get()
  async getProcessReads(
    req: Request<Record<string, never>, AnalysisProcessReadGroup[]>,
    res: Response<AnalysisProcessReadGroup[]>,
  ) {
    const processReads = await this.processReadsService.getProcessReads();
    res.status(200).json(processReads);
  }
}
