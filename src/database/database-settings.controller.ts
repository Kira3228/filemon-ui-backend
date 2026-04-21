import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { Controller, Get, Patch } from "../shared/utils/routing";
import {
  DatabaseConnectionSettings,
  UpdateDatabaseSettingsRequest,
  ApiErrorResponse,
} from "../contracts/api-contracts";
import { AppDatabaseService } from "./app-database.service";

@Controller(`/settings`)
@injectable()
export class DatabaseSettingsController {
  constructor(private readonly appDatabaseService: AppDatabaseService) {}

  @Get(`/database`)
  getDatabaseSettings(

    res: Response<DatabaseConnectionSettings>,
  ) {
    res.set("Cache-Control", "no-store");
    res.status(200).json(this.appDatabaseService.getDatabaseSettings());
  }

  @Patch(`/database`)
  async updateDatabaseSettings(
    req: Request<Record<string, never>, DatabaseConnectionSettings | ApiErrorResponse, UpdateDatabaseSettingsRequest>,
    res: Response<DatabaseConnectionSettings | ApiErrorResponse>,
  ) {
    const result = await this.appDatabaseService.updateDatabasePath(
      String(req.body?.databasePath || ""),
    );
    res.status(200).json(result);
  }
}
