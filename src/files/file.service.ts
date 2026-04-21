import { inject } from "tsyringe";
import { AnalysisNormalizerService } from "../analysis/analysis-normalizer.service";
import { toFileLinks } from "../analysis/analysis-report-builder.mappers";
import { AnalysisFileItem, AnalysisFilePathRef, AnalysisFileRow, AnalysisFileVersionRow, AnalysisNormalizedFileEvent } from "../analysis/analysis.types";
import { Repository } from "typeorm";
import { File } from "../entities";

interface BuildFileGraphOptions {
  files: AnalysisFileRow[];
  filesById: Map<number, AnalysisFileRow>;
  normalizer: AnalysisNormalizerService;
  parentsByFile: Map<number, Set<number>>;
  childrenByFile: Map<number, Set<number>>;
  renameRowsByFile: Map<number, AnalysisNormalizedFileEvent[]>;
  trackingStatus: number;
  versionsByFile: Map<number, AnalysisFileVersionRow[]>;
}



export class FileService {
  constructor(
    @inject(``) private readonly fileRepo: Repository<File>
  ) { }


  async getFiles() {
    const files = await this.fileRepo
      .createQueryBuilder(`f`)
      .leftJoin(`filesystem`, 'fs', `fs.id=f.filesystem_id`)
      .select([
        'f.id AS id',
        'f.full_path AS full_path',
        'fs.uuid AS filesystem_uuid',
        'f.origin_process_version_id AS origin_process_version_id',
        'f.last_status_at AS last_status_at',
        'f.tracking_started_at AS tracking_started_at',
        'f.initial_size_bytes AS initial_size_bytes',
        'f.birth_time AS birth_time',
        'f.last_status AS raw_status',
        'f.ino_gen AS inode',
      ])
      .orderBy('f.tracking_started_at', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .getRawMany<AnalysisFileRow>();
  }


  private buildFileItems = ({
    files,
    filesById,
    normalizer,
    parentsByFile,
    renameRowsByFile,
    resolveRootSourceIds,
    trackingStatus,
    versionsByFile,
  }: BuildFileGraphOptions & {
    resolveRootSourceIds: (fileId: number) => number[];
  }): AnalysisFileItem[] =>
    files.map((file) => {
      const fileVersions = [...(versionsByFile.get(file.id) || [])].sort((a, b) =>
        normalizer.sortDesc(a.created_at, b.created_at, a.version_number, b.version_number),
      );
      const primaryVersion = [...fileVersions].sort((a, b) =>
        normalizer.sortAsc(a.created_at, b.created_at, a.version_number, b.version_number),
      )[0] || null;
      const sourceIds = resolveRootSourceIds(file.id);
      const parentIds = Array.from(parentsByFile.get(file.id) || []);
      return {
        id: file.id,
        fileId: file.id,
        name: normalizer.getFileName(file.full_path),
        path: file.full_path,
        pathHistory: normalizer.buildPathHistory(file.full_path, renameRowsByFile.get(file.id) || []),
        filesystem: file.filesystem_uuid,
        filesystemUuid: file.filesystem_uuid,
        sizeBytes: file.initial_size_bytes,
        versionCount: fileVersions.length,
        depth: fileVersions.reduce((max, row) => Math.max(max, Number(row.depth) || 0), 0),
        parents: toFileLinks(normalizer, parentIds, filesById as Map<number, AnalysisFilePathRef>),
        sourceIds,
        sourceLabels: toFileLinks(normalizer, sourceIds, filesById as Map<number, AnalysisFilePathRef>),
        originProcess: normalizer.getOriginProcess(primaryVersion),
        user: normalizer.getOriginUser(primaryVersion),
        currentStatusCode: Number(file.raw_status) || trackingStatus,
        currentStatus: normalizer.formatStatus(file.raw_status),
        trackingStartedAt: file.tracking_started_at,
        birthTime: file.birth_time,
        lastStatusAt: file.last_status_at,
        inode: file.inode,
      };
    }).sort((a, b) => normalizer.sortDesc(a.trackingStartedAt, b.trackingStartedAt, a.id, b.id));


}