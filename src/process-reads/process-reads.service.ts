import { injectable } from "tsyringe";
import {
  AnalysisFileVersionRow,
  AnalysisOperationRow,
} from "../shared/types/read-model-row.type";
import { AnalysisNormalizerService } from "../analysis/analysis-normalizer.service";
import { buildProcessReads } from "../analysis/analysis-report-builder.collections";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";
import { FileVersionReadModel } from "../read-models/file-version.read-model";
import { FilesReadModel } from "../read-models/files.read-model";
import { buildParentsByFile, createRootSourceResolver } from "../sources/sources.graph";
import { AnalysisProcessReadGroup } from "./types/process-read-group.type";
import { Nullable } from "../shared/types/nullable.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";
import { paginateItems } from "../shared/utils/pagination";

interface ProcessVersionSeed {
  processId: Nullable<number>;
  versionNumber: Nullable<number>;
  createdAt: Nullable<string>;
  originFileId: Nullable<number>;
}

@injectable()
export class ProcessReadsService {
  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileVersionReadModel: FileVersionReadModel,
    private readonly fileOperationReadModel: FileOperationReadModel,
    private readonly normalizer: AnalysisNormalizerService,
  ) { }

  async getProcessReads(filters: PaginationQuery = {}): Promise<PaginatedResult<AnalysisProcessReadGroup>> {
    const allFiles = await this.filesReadModel.findAllFiles();
    const allFileIds = allFiles.map((file) => file.id);

    const [versions, reads] = await Promise.all([
      this.fileVersionReadModel.findFileVersionsByFileIds(allFileIds),
      this.fileOperationReadModel.findFileOperation("read"),
    ]);

    const parentsByFile = buildParentsByFile(versions, allFileIds);
    const resolveRootSourceIds = createRootSourceResolver(parentsByFile);
    const resolveProcessHistoryOriginFileIds = this.createProcessHistoryOriginResolver(versions, reads);

    const items = buildProcessReads(
      reads,
      this.normalizer,
      resolveProcessHistoryOriginFileIds,
      resolveRootSourceIds,
    );

    return paginateItems(items, filters, { defaultLimit: 250, maxLimit: 1000 });
  }

  private createProcessHistoryOriginResolver(
    versions: AnalysisFileVersionRow[],
    reads: AnalysisOperationRow[],
  ) {
    const processVersionsByProcess = new Map<number, ProcessVersionSeed[]>();
    const memo = new Map<string, number[]>();

    const registerProcessVersion = (
      processId: Nullable<number>,
      versionNumber: Nullable<number>,
      createdAt: Nullable<string>,
      originFileId: Nullable<number>,
    ) => {
      if (processId === null || processId === undefined) {
        return;
      }

      const rows = processVersionsByProcess.get(processId) || [];
      rows.push({ processId, versionNumber, createdAt, originFileId });
      processVersionsByProcess.set(processId, rows);
    };

    for (const version of versions) {
      registerProcessVersion(
        version.process_id,
        version.process_version_number,
        version.process_version_created_at,
        version.origin_file_id,
      );
    }

    for (const row of reads) {
      registerProcessVersion(
        row.process_id,
        row.process_version_number,
        row.process_version_created_at,
        row.origin_file_id,
      );
    }

    for (const rows of processVersionsByProcess.values()) {
      rows.sort((a, b) => this.normalizer.sortAsc(a.createdAt, b.createdAt, a.versionNumber, b.versionNumber));
    }

    return (context: {
      processVersionId?: Nullable<number>;
      processId?: Nullable<number>;
      processVersionNumber?: Nullable<number>;
      directOriginFileId?: Nullable<number>;
    }): number[] => {
      const processId = context.processId ?? null;
      const processVersionNumber = context.processVersionNumber ?? null;
      const directOriginFileId = context.directOriginFileId ?? null;
      const memoKey = [
        context.processVersionId ?? "null",
        processId ?? "null",
        processVersionNumber ?? "null",
        directOriginFileId ?? "null",
      ].join(":");

      if (memo.has(memoKey)) {
        return memo.get(memoKey)!;
      }

      const result = new Set<number>();
      if (processId !== null && processId !== undefined) {
        for (const row of processVersionsByProcess.get(processId) || []) {
          const candidateVersionNumber = Number(row.versionNumber);
          if (!Number.isFinite(candidateVersionNumber)) {
            continue;
          }
          if (
            processVersionNumber !== null
            && processVersionNumber !== undefined
            && candidateVersionNumber > Number(processVersionNumber)
          ) {
            continue;
          }
          if (row.originFileId) {
            result.add(row.originFileId);
          }
        }
      }

      if (!result.size && directOriginFileId) {
        result.add(directOriginFileId);
      }

      const value = Array.from(result).sort((a, b) => a - b);
      memo.set(memoKey, value);
      return value;
    };
  }
}
