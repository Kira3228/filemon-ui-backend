import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";

import { Request, Response } from "express";
import { DiagramDatasetService } from "./file-tree.service";
import { FileTreeResult } from "./types/file-tree-result.type";
import { PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/diagram-dataset`)
@injectable()
export class DiagramDatasetController {
  constructor(
    private readonly fileTreeService: DiagramDatasetService
  ) { }
  
  @Get()
  async getFileTree(
    req: Request<Record<string, never>, FileTreeResult, never, PaginationQuery>,
    res: Response<FileTreeResult>,
  ) {
    const fileTree = await this.fileTreeService.getFileTree(req.query);
    res.status(200).json(fileTree);
  }
}
