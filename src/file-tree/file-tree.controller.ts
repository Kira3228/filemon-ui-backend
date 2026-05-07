import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";

import { Request, Response } from "express";
import { DiagramDatasetService } from "./file-tree.service";
import { FileTreeResult } from "./types/file-tree-result.type";

@Controller(`/diagram-dataset`)
@injectable()
export class DiagramDatasetController {
  constructor(
    private readonly fileTreeService: DiagramDatasetService
  ) { }
  
  @Get()
  async getFileTree(
    req: Request<Record<string, never>, FileTreeResult>,
    res: Response<FileTreeResult>,
  ) {
    const fileTree = await this.fileTreeService.getFileTree();
    res.status(200).json(fileTree);
  }
}
