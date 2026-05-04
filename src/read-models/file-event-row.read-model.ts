import { inject, injectable } from "tsyringe";
import { FileEventsRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileEvent } from "../entities";
import { AnalysisFileEventRow } from "../analysis/analysis.types";

@injectable()
export class FileEventRowReadModel {
  constructor(
    @inject(FileEventsRepositoryToken)
    private readonly fileEventRepository: Repository<FileEvent>,
  ) { }

  private buildFileEventsQuery() {
    return this.fileEventRepository
      .createQueryBuilder("fe")
      .leftJoin("fe.file", "file")
      .select([
        "fe.id as id",
        "file.id as file_id",
        "fe.event as event",
        "fe.created_at as created_at",
        "fe.details as details",
      ])
      .orderBy("fe.created_at", "DESC")
      .addOrderBy("fe.id", "DESC");
  }

  async findFileEventsByFileIds(fileIds: number[]): Promise<AnalysisFileEventRow[]> {
    if (!fileIds.length) {
      return [];
    }

    return this.buildFileEventsQuery()
      .where("file.id IN (:...fileIds)", { fileIds })
      .getRawMany() as Promise<AnalysisFileEventRow[]>;
  }
}
