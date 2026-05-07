import { inject, injectable } from "tsyringe";
import { Repository } from "typeorm";
import { ProcessVersion } from "../entities";
import { AnalysisProcessVersionRow } from "../analysis/analysis.types";
import { ProcessVersionRepositoryToken } from "../constants/tokens";

@injectable()
export class ProcessVersionReadModel {
  constructor(
    @inject(ProcessVersionRepositoryToken) private readonly processVersionRepository: Repository<ProcessVersion>
  ) { }


  private async buildProcessVersionQuery() {
    const query = await this.processVersionRepository
      .createQueryBuilder("pv")
      .leftJoin("pv.process", "p")
      .leftJoin("p.osUser", "u")
      .leftJoin("pv.originFile", "ofile")
      .select([
        "pv.id as id",
        "p.id as process_id",
        "pv.version_number as version_number",
        "pv.created_at as created_at",
        "p.executable_path as executable_path",
        "p.pid as pid",
        "u.username as username",
        "u.uid as uid",
        "ofile.id as origin_file_id",
        "ofile.full_path as origin_file_path",
      ])
      .orderBy("pv.created_at", "DESC")
      .addOrderBy("pv.id", "DESC")

    return query
  }

  async findProcessVersionByProcessVersionIds(processVersionIds: number[]) {
    const processVersions = (await this.buildProcessVersionQuery())
      .where("pv.id IN (:...processVersionIds)", { processVersionIds })
      .getRawMany()


    return processVersions
  }
}