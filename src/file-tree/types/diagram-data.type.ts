import { Nullable } from "../../shared/types/nullable.type";

export interface AnalysisDiagramFileVersion {
  id: number;
  fileVersionId: number;
  fileId: number;
  versionNumber: number;
  depth: number;
  createdAt: string;
  originProcessVersionId: Nullable<number>;
  processId: Nullable<number>;
  processVersionNumber: Nullable<number>;
  processVersionCreatedAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramProcessVersion {
  id: number;
  processVersionId: number;
  processId: Nullable<number>;
  versionNumber: Nullable<number>;
  createdAt: Nullable<string>;
  executablePath: Nullable<string>;
  pid: Nullable<number>;
  username: Nullable<string>;
  uid: Nullable<number>;
  originFileId: Nullable<number>;
  originFilePath: Nullable<string>;
}

export interface AnalysisDiagramOperation {
  fileId: number;
  fileVersionId: Nullable<number>;
  processVersionId: Nullable<number>;
  processId: Nullable<number>;
  firstAt: string;
  lastAt: Nullable<string>;
  count: number;
}

export interface AnalysisDiagramData {
  fileVersions: AnalysisDiagramFileVersion[];
  processVersions: AnalysisDiagramProcessVersion[];
  reads: AnalysisDiagramOperation[];
  writes: AnalysisDiagramOperation[];
}
