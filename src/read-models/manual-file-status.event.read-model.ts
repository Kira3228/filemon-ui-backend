import { inject, injectable } from "tsyringe";
import { ManualFileStatusEventRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { ManualFileStatusEvent } from "../entities";
import { AnalysisManualStatusRow } from "../analysis/analysis.types";

@injectable()
export class ManualFileStatusEventReadModel {
  constructor(
    @inject(ManualFileStatusEventRepositoryToken) private readonly manualFileStatusEventRepository: Repository<ManualFileStatusEvent>
  ) { }


  private async buildManualFileStatusEvent() {
    const query = await this.manualFileStatusEventRepository
      .createQueryBuilder("mse")
      .leftJoin("mse.file", "file")
      .leftJoin("mse.statusHistory", "statusHistory")
      .select([
        "mse.id as id",
        "file.id as file_id",
        "statusHistory.id as status_history_id",
        "mse.action as action",
        "mse.previous_status as previous_status",
        "mse.new_status as new_status",
        "mse.created_at as created_at",
        "mse.details as details",
      ])
      .orderBy("mse.created_at", "DESC")
      .addOrderBy("mse.id", "DESC")

    return query
  }

  async findManualFileStatusEventByFileIds(fileIds: number[]): Promise<AnalysisManualStatusRow[]> {
    if (!fileIds.length) {
      return []
    }

    const statuses = (await this.buildManualFileStatusEvent())
      .where("file.id IN (:...fileIds)", { fileIds })
      .getRawMany() as Promise<AnalysisManualStatusRow[]>

    return statuses
  }
}
