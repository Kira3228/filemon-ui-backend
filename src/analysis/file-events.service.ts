import { inject, injectable } from "tsyringe";
import { FileEventsRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileEvent } from "../entities";

@injectable()
export class FileEventsService {
  constructor(
    @inject(FileEventsRepositoryToken) private readonly fileEventsRepositoryToken: Repository<FileEvent>
  ) { }

  async getFileEvents() {
    const events = await this.fileEventsRepositoryToken
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
      .addOrderBy("fe.id", "DESC")
      .getRawMany();

    return events;
  }
}
