import { inject, injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { FileManagementServiceToken } from "../constants/tokens";
import { FileManagementService } from "./file-management.service";
import { Request, Response } from "express";

@Controller(`/file`)
@injectable()
export class FileMamagementContoller {
  constructor(
    @inject(FileManagementServiceToken) private readonly fileManagementService: FileManagementService
  ) {
  }


  @Get(`/get/all`)
  async getFiles(_req: Request, res: Response) {
    const result = await this.fileManagementService.getFiles()
    res.status(200).json(result)
  }
}
