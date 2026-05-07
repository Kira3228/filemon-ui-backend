import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { FilesService } from "./files.service";
import { AnalysisFileItem } from "./types/file-item.type";

@Controller(`/files`)
@injectable()
export class FilesController {
  constructor(
    private readonly filesService: FilesService
  ) { }

  @Get()
  async getFiles(
    req: Request<Record<string, never>, AnalysisFileItem[]>,
    res: Response<AnalysisFileItem[]>,
  ) {
    const files = await this.filesService.getFiles();
    res.status(200).json(files);
  }
}
