import { inject, injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { SourcesService } from "./sources.service";
import { Request, Response } from "express";

@Controller(`/sources`)
@injectable()
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService
  ) { }

  @Get()
  async getSources(req: Request, res: Response) {
    const sources = await this.sourcesService.getSources()
    res.status(200).send(sources)
  }
}