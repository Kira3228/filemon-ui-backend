import { Nullable } from "../../shared/types/nullable.type";

export interface AnalysisManualStatusEvent {
  id: number;
  fileId: number;
  statusHistoryId: Nullable<number>;
  action: string;
  previousStatus: number;
  newStatus: number;
  createdAt: string;
  details: Record<string, unknown>;
}

export interface AnalysisStatusHistoryItem {
  id: number;
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  status: string;
  createdAt: string;
  isManual: boolean;
  changeSource: "MANUAL" | "SYSTEM";
  manualAction: Nullable<string>;
  previousStatus: Nullable<string>;
  nextStatus: string;
  sourceIds: number[];
}
