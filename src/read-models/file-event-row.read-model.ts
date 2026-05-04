import { inject } from "tsyringe";
import { FileEventsRepositoryToken } from "../constants/tokens";
import { Repository } from "typeorm";
import { FileEvent } from "../entities";


export class FileEventRowReadModel {
  constructor(@inject(FileEventsRepositoryToken) private readonly fileEventRepository: Repository<FileEvent>) { }
  private async findAllFileEvents() {
    const events = await this.fileEventRepository
      .createQueryBuilder("fe")
      .leftJoin("fe.files", "file")
      .select([
        "fe.id as id",
        "file.id as file_id",
        "fe.event as event",
        "fe.created_at as created_at",
        "fe.details as details",
      ])
      .orderBy("fe.created_at", "DESC")
      .addOrderBy("fe.id", "DESC")

    return events
  }

  async findFileEvents() {
    const events = (await this.findAllFileEvents()).getMany()
    return events
  }
}
