import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { OverviewService } from "./overview.service";
import { Request, Response } from "express";

@Controller(`/overview`)
@injectable()
export class OverviewController {
  constructor(
    private readonly overviewService: OverviewService
  ) { }

  @Get()
  async getOverview(req: Request, res: Response): Promise<void> {
    const overview = await this.overviewService.getOverview()
    res.status(200).send(overview)
  }
}