import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { FilesService } from "./files.service";
import { AnalysisFileItem } from "./types/file-item.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/files`)
@injectable()
export class FilesController {
  constructor(
    private readonly filesService: FilesService
  ) { }

  @Get()
  async getFiles(
    req: Request<Record<string, never>, PaginatedResult<AnalysisFileItem>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisFileItem>>,
  ) {
    const files = await this.filesService.getFiles(req.query);
    res.status(200).json(files);
  }
}
