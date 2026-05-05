import { inject, injectable } from "tsyringe";
import { FileStatusRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileStatus } from "../entities";
import { AnalysisStatusRow } from "../analysis/analysis.types";

@injectable()
export class FileStatusRowsReadMode {
  constructor(
    @inject(FileStatusRepositoryToken) private readonly fileStatusRepository: Repository<FileStatus>
  ) { }

  private async buildStatisFilesQuery() {
    const statusRows = await this.fileStatusRepository
      .createQueryBuilder("fs")
      .leftJoin("fs.file", "file")
      .select([
        "fs.id as id",
        "file.id as file_id",
        "fs.status as status",
        "fs.created_at as created_at",
      ])
      .orderBy("fs.created_at", "DESC")
      .addOrderBy("fs.id", "DESC")

    return statusRows
  }

  async findStatusRowsByFileIds(fileIds: number[]): Promise<AnalysisStatusRow[]> {
    if (!fileIds.length) {
      return []
    }

    const statusRows = (await this.buildStatisFilesQuery())
      .where("file.id IN (:...fileIds)", { fileIds })
      .getRawMany() as Promise<AnalysisStatusRow[]>

    return statusRows
  }
}
