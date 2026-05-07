import { inject, injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { SourcesService } from "./sources.service";
import { Request, Response } from "express";
import { SourceDto } from "./dto/sources.dto";
import { SourceListResult } from "./types/source-list-result.type";

@Controller(`/sources`)
@injectable()
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService
  ) { }

  @Get()
  async getSources(
    req: Request<Record<string, never>, SourceListResult, never, SourceDto>,
    res: Response<SourceListResult>,
  ) {
    const sources = await this.sourcesService.getSources(req.query)
    res.status(200).send(sources)
  }
}
