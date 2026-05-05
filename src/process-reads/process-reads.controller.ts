import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { ProcessReadsService } from "./process-reads.service";

@Controller(`/process-reads`)
@injectable()
export class ProcessReadsController {
  constructor(
    private readonly processReadsService: ProcessReadsService
  ) { }

  @Get()
  async getProcessReads(req: Request, res: Response) {
    const processReads = await this.processReadsService.getProcessReads();
    res.status(200).json(processReads);
  }
}