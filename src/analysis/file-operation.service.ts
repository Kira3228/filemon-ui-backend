import { inject, injectable } from "tsyringe";
import { FileReadRepositoryToken, FileWriteRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileRead, FileWrite } from "../entities";

@injectable()
export class FileOperationService {
  constructor(
    @inject(FileReadRepositoryToken)
    private readonly fileReadRepository: Repository<FileRead>,
    @inject(FileWriteRepositoryToken)
    private readonly fileWriteRepository: Repository<FileWrite>,
  ) { }

  async getFileOperation(operationType: "read" | "write") {
    const repository =
      operationType === "read" ? this.fileReadRepository : this.fileWriteRepository;
    const entity = operationType === "read" ? FileRead : FileWrite;
    const alias: "fr" | "fw" = operationType === "read" ? "fr" : "fw";

    const result = await repository.manager
      .createQueryBuilder(entity, alias)
      .leftJoin(`${alias}.file`, "file")
      .leftJoin("file.filesystem", "fs")
      .leftJoin(`${alias}.processVersion`, "pv")
      .leftJoin("pv.process", "p")
      .leftJoin("p.osUser", "u")
      .leftJoin("pv.originFile", "ofile")
      .leftJoin(`${alias}.fileVersion`, "fv")
      .select([
        `${alias}.file_id as file_id`,
        "fv.id as file_version_id",
        "pv.id as process_version_id",
        `${alias}.created_at as first_at`,
        "NULL as last_at",
        "1 as count",
        "file.full_path as file_path",
        "fs.uuid as filesystem_uuid",
        "pv.version_number as process_version_number",
        "pv.created_at as process_version_created_at",
        "p.id as process_id",
        "p.executable_path as executable_path",
        "p.pid as pid",
        "u.username as username",
        "u.uid as uid",
        "ofile.id as origin_file_id",
        "ofile.full_path as origin_file_path",
        "fv.version_number as file_version_number",
        "fv.depth as file_version_depth",
      ])
      .orderBy(`${alias}.created_at`, "DESC")
      .addOrderBy(`${alias}.file_id`, "DESC")
      .getRawMany();

    return result;
  }
}
