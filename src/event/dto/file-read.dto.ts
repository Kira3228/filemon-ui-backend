export interface FileReadDto {
  fileId: number;
  processVersionId: number;
  firstAt: Date;
  lastAt: Date | null;
  count: number;

  file: {
    id: number;
    fullPath: string;
    initialSizeBytes: number;
    birthTime: Date;
    trackingStartedAt: Date;
    deletedAt: Date | null;
    filesystem: {
      id: number;
      uuid: string;
    } | null;
  };

  fileVersion: {
    id: number;
    versionNumber: number;
    depth: number | null;
  } | null;

  processVersion: {
    id: number;
    versionNumber: number;
    workingDirectory: string | null;
    process: {
      id: number;
      pid: number;
      executablePath: string;
      arguments: string | null;
      osUser: {
        uid: number;
        username: string | null;
      } | null;
    } | null;
    originFile: {
      id: number;
      fullPath: string;
    } | null;
  };
}