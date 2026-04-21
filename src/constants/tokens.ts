import { InjectionToken } from "tsyringe";
import { EventService } from "../event/event.service";
import { File, FileRead, FileVersion, FileWrite } from "../entities";
import { Repository } from "typeorm";
import { contextsKey } from "express-validator/src/base";
import { FileManagementService } from "../file-management/file-management.service";
import { FileService } from "../files/file.service";

export const EventServiceToken: InjectionToken<EventService> =
  "EventServiceToken";

export const FileReadRepositoryToken: InjectionToken<Repository<FileRead>> =
  "FileReadRepositoryToken";

export const FileWriteRepositoryToken: InjectionToken<Repository<FileWrite>> =
  "FileWriteRepositoryToken";

export const FileRepositoryToken: InjectionToken<Repository<File>> =
  "FileRepositoryToken";

export const FileVersionRepositoryToken: InjectionToken<Repository<FileVersion>> =
  "FileVersionRepositoryToken";

export const FileManagementServiceToken: InjectionToken<FileManagementService> =
  "FileManagementServiceToken"


const repositoryToken = <T>(entityName: string) => Symbol(`${entityName}Repository`)


export const TOKENS = {
  fileReadRepository: repositoryToken<FileRead>("FileRead"),
  fileWriteRepository: repositoryToken<FileWrite>("FileWrite"),
  fileRepository: repositoryToken<File>("File"),
  fileVersionRepository: repositoryToken<FileVersion>("FileVersion"),
}