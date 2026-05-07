import { InjectionToken } from "tsyringe"
import { FileEventsRepositoryToken, FileReadRepositoryToken, FileRepositoryToken, FileStatusRepositoryToken, FileVersionRepositoryToken, FileWriteRepositoryToken, ManualFileStatusEventRepositoryToken, ProcessRepositoryToken, ProcessVersionRepositoryToken, } from "./constants/tokens"
import { File, FileEvent, FileRead, FileStatus, FileVersion, FileWrite, ManualFileStatusEvent, Process, ProcessVersion } from "./entities"

interface RepositoryToken {
  token: InjectionToken,
  entity: unknown
}
export const repositoryTokens: RepositoryToken[] = [
  {
    token: FileRepositoryToken,
    entity: File
  },
  {
    token: FileReadRepositoryToken,
    entity: FileRead
  },
  {
    token: FileWriteRepositoryToken,
    entity: FileWrite
  },
  {
    token: FileVersionRepositoryToken,
    entity: FileVersion
  },
  {
    token: FileEventsRepositoryToken,
    entity: FileEvent
  },
  {
    token: FileStatusRepositoryToken,
    entity: FileStatus
  },
  {
    token: ManualFileStatusEventRepositoryToken,
    entity: ManualFileStatusEvent
  },
  {
    token: ProcessVersionRepositoryToken,
    entity: ProcessVersion
  },
  {
    token: ProcessRepositoryToken,
    entity: Process
  }
]