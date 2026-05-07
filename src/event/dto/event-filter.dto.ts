import { PaginationQuery } from "../../shared/types/pagination.type";

export interface EventFilterDto extends PaginationQuery {
  status?: string
  filesystemId?: string
  trackingStartedAt?: string
  birthTime?: string
  fileType?: string
  versionNumber?: number
  osUserId?: string
  executablePath?: string
  operationType?: string
  firstAt?: string
  process?: string
}
