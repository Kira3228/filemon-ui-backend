import { Nullable } from "../../shared/types/nullable.type";

export interface AnalysisProcessReadFile {
  fileId: number;
  fileName: string;
  path: string;
  filesystemUuid: Nullable<string>;
  versionNumber: Nullable<number>;
  count: number;
  firstAt: string;
  lastAt: Nullable<string>;
}

export interface AnalysisProcessReadGroup {
  processVersionId: Nullable<number>;
  label: string;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  user: Nullable<string>;
  uid: Nullable<number>;
  createdAt: string;
  sourceIds: number[];
  files: AnalysisProcessReadFile[];
}
