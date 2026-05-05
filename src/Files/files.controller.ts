import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { FilesService } from "./files.service";

@Controller(`/files`)
@injectable()
export class FilesController {
  constructor(
    private readonly filesService: FilesService
  ) { }

  @Get()
  async getFiles(req: Request, res: Response) {
    const files = await this.filesService.getFiles();
    res.status(200).json(files);
  }
}
