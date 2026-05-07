import { InjectionToken } from "tsyringe";
import { EventService } from "../event/event.service";
import { File, FileEvent, FileRead, FileStatus, FileVersion, FileWrite, ManualFileStatusEvent, Process, ProcessVersion } from "../entities";
import { Repository } from "typeorm";

export const EventServiceToken: InjectionToken<EventService> =
  "EventServiceToken";

export const FileRepositoryToken: InjectionToken<Repository<File>> =
  "FileRepositoryToken";

export const FileReadRepositoryToken: InjectionToken<Repository<FileRead>> =
  "FileReadRepositoryToken";

export const FileWriteRepositoryToken: InjectionToken<Repository<FileWrite>> =
  "FileWriteRepositoryToken";

export const FileVersionRepositoryToken: InjectionToken<Repository<FileVersion>> =
  "FileVersionRepositoryToken";

export const FileEventsRepositoryToken: InjectionToken<Repository<FileEvent>> =
  "FileEventsRepositoryToken";

export const FileStatusRepositoryToken: InjectionToken<Repository<FileStatus>> =
  "FileStatusRepositoryToken"

export const ManualFileStatusEventRepositoryToken: InjectionToken<Repository<ManualFileStatusEvent>> =
  "ManualFileStatusEventRepositoryToken"

export const ProcessVersionRepositoryToken: InjectionToken<Repository<ProcessVersion>> = "ProcessVersionRepositoryToken"

export const ProcessRepositoryToken: InjectionToken<Repository<Process>> = "ProcessRepositoryToken"


