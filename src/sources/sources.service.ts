import { injectable } from "tsyringe";
import { AnalysisOperationRow, AnalysisSourceItem } from "../analysis/analysis.types";
import { FilesReadModel } from "../read-models/files.read-model";
import { splitLast } from "../shared/utils/get-file-name";
import { utils } from "xlsx";
import { FileOperationReadModel } from "../read-models/file-operation.read-model";

@injectable()
export class SourcesService {
  constructor(
    private readonly filesReadModel: FilesReadModel,
    private readonly fileOperationModel: FileOperationReadModel
  ) { }

  async getSources(): Promise<AnalysisSourceItem[]> {
    const files = await this.filesReadModel.findRootFiles()
    const reads = await this.fileOperationModel.findFileOperation("read")
    const readsByFile = new Map<number, AnalysisOperationRow[]>();

    for (const file of items) {

    }

    for (const row of reads) {
      readsByFile.get(row.file_id)?.push(row);
    }

    const sources = items.map((item): AnalysisSourceItem => {
      const processLabels = new Set<string>();

      const readers = readsByFile.get(item.id) || [];
      for (const row of readers) {
        processLabels.add(normalizer.buildProcessLabel(row));
      }

      return {
        id: item.id,
        fileId: item.id,
        name: splitLast(item.full_path),
        path: item.full_path,
        filesystemUuid: item.filesystem.uuid,
        trackingStartedAt: String(item.tracking_started_at),
        sourceIds: [item.id],
        stats: {
          processes: 
        }
      }
    })

    return []
  }
}