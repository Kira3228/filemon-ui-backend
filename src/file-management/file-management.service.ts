import { injectable } from "tsyringe";
import { AppDatabaseService } from "../database/app-database.service";
import { EventFilterDto } from "../event/dto/event-filter.dto";
import { File } from "../entities";

@injectable()
export class FileManagementService {
  constructor(
    private readonly databaseService: AppDatabaseService,
  ) { }

  private formatProcessDisplayName(executablePath?: string | null, pid?: number | null) {
    const executable = executablePath?.split("/").pop() ?? "system";
    if (pid !== null && pid !== undefined) {
      return `${executable} (PID ${pid})`;
    }
    return executable;
  }


  async getFiles() {
    const filesRepo = await this.databaseService.getRepository(File);
    const qb = filesRepo.createQueryBuilder("f")
      .leftJoinAndSelect("f.filesystem", "fs")
      .leftJoinAndSelect("f.originProcessVersion", "opv")
      .leftJoinAndSelect("opv.process", "p")
      .leftJoinAndSelect("p.osUser", "u")
      .leftJoinAndSelect("f.versions", "fv");


    // if (filter.status) {
    //   qb.andWhere("f.status = :status", { status: filter.status });
    // }

    // if (filter.filesystemId) {
    //   qb.andWhere("fs.uuid = :fsId", { fsId: filter.filesystemId });
    // }

    // if (filter.trackingStartedAt) {
    //   qb.andWhere("f.tracking_started_at = :tsa", { tsa: filter.trackingStartedAt });
    // }

    // if (filter.birthTime) {
    //   qb.andWhere("f.birth_time = :bt", { bt: filter.birthTime });
    // }

    // if (filter.fileType) {
    //   if (filter.fileType === 'origin') {
    //     qb.andWhere("f.origin_process_version_id IS NULL");
    //   } else if (filter.fileType === 'intermediate') {
    //     qb.andWhere("f.origin_process_version_id IS NOT NULL");
    //   }
    // }

    // if (filter.versionNumber) {
    //   qb.andWhere("fv.version_number = :vnum", { vnum: filter.versionNumber });
    // }

    // if (filter.osUserId) {
    //   qb.andWhere("u.username = :uname", { uname: filter.osUserId });
    // }

    // if (filter.process) {
    //   qb.andWhere("p.executable_path LIKE :proc", { proc: `%${filter.process}%` });
    // }

    // const limit = filter.limit || 14;
    // const page = filter.page || 1;
    // const skip = (page - 1) * limit;

    const [items, total] = await qb
      .orderBy("f.tracking_started_at", "DESC")
      // .take(limit)
      // .skip(skip)
      .getManyAndCount();

    return {
      items: items.map(file => this.mapFile(file)),
      total
    };
  }

  private mapFile(file: File) {
    return {
      id: file.id,
      path: file.full_path,
      filesystem: file.filesystem?.uuid ?? null,
      status: file.status ?? null,
      trackingStartedAt: file.tracking_started_at,
      birthTime: file.birth_time,
      size: file.initial_size_bytes,
      originProcess: this.formatProcessDisplayName(
        file.originProcessVersion?.process?.executable_path ?? null,
        file.originProcessVersion?.process?.pid ?? null,
      ),
      user: file.originProcessVersion?.process?.osUser?.username ?? 'root',
      inode: file.inoGen ?? null
    };
  }
}
