// Source-of-truth API contracts mirrored into the frontend repo.

export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export type DatabaseConnectionStatus =
  | "connected"
  | "path-not-set"
  | "file-missing"
  | "structure-error";

export interface DatabaseConnectionSettings {
  databasePath: string;
  configPath: string;
  exists: boolean;
  connected: boolean;
  status: DatabaseConnectionStatus;
  statusMessage: string;
  statusDetails?: unknown;
  updatedAt: string | null;
}

export interface UpdateDatabaseSettingsRequest {
  databasePath?: string;
}

export type MonitoringAction = "untrack" | "resume";

export interface UpdateMonitoringStatusRequest {
  action?: MonitoringAction;
}

export interface UpdateMonitoringStatusResult {
  fileId: number;
  path: string;
  status: number;
  statusLabel: string;
  lastStatusAt: string | null;
}
