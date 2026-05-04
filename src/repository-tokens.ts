import { InjectionToken } from "tsyringe"
import { FileEventsRepositoryToken, FileManagementServiceToken, FileReadRepositoryToken, FileRepositoryToken, FileVersionRepositoryToken, FileWriteRepositoryToken } from "./constants/tokens"
import { File, FileEvent, FileRead, FileVersion, FileWrite } from "./entities"

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

]