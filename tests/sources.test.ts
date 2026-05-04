import assert from "assert";
import { AnalysisNormalizerService } from "../src/analysis/analysis-normalizer.service";
import { AnalysisSourcesService } from "../src/analysis/analysis-sources.service";
import { AnalysisFileItem, AnalysisFileVersionRow, AnalysisOperationRow } from "../src/analysis/analysis.types";

const createFileItem = (id: number, sourceIds: number[]): AnalysisFileItem => ({
  id,
  fileId: id,
  name: `file-${id}.txt`,
  path: `/data/file-${id}.txt`,
  pathHistory: [`/data/file-${id}.txt`],
  filesystem: "fs",
  filesystemUuid: "fs-1",
  sizeBytes: null,
  versionCount: 1,
  depth: id === 1 ? 0 : 1,
  parents: [],
  sourceIds,
  sourceLabels: [],
  originProcess: "unknown",
  user: "unknown",
  currentStatusCode: 1,
  currentStatus: "Отслеживается",
  trackingStartedAt: "2026-03-01 10:00:00",
  birthTime: null,
  lastStatusAt: null,
  inode: null,
});

const createReadRow = (processVersionId: number, executablePath: string): AnalysisOperationRow => ({
  file_id: 1,
  file_version_id: 1,
  process_version_id: processVersionId,
  first_at: "2026-03-01 10:01:00",
  last_at: null,
  count: 1,
  file_path: "/data/file-1.txt",
  filesystem_uuid: "fs-1",
  process_version_number: 1,
  process_version_created_at: "2026-03-01 10:00:30",
  process_id: processVersionId,
  executable_path: executablePath,
  pid: 1000 + processVersionId,
  username: "alice",
  uid: 501,
  origin_file_id: 1,
  origin_file_path: "/data/file-1.txt",
  file_version_number: 1,
  file_version_depth: 0,
});

const createVersionRow = (fileId: number, depth: number): AnalysisFileVersionRow => ({
  id: fileId,
  file_id: fileId,
  version_number: 1,
  depth,
  created_at: "2026-03-01 10:00:00",
  origin_process_version_id: null,
  process_version_number: null,
  process_version_created_at: null,
  process_id: null,
  executable_path: null,
  pid: null,
  username: null,
  uid: null,
  origin_file_id: null,
  origin_file_path: null,
});

const runCase = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  console.log(`ok - ${name}`);
};

const testBuildsSourceRoots = () => {
  const sourceService = new AnalysisSourcesService();
  const normalizer = new AnalysisNormalizerService();
  const fileItems = [
    createFileItem(1, [1]),
    createFileItem(2, [1]),
    createFileItem(3, [1]),
  ];
  const fileItemsById = new Map(fileItems.map((item) => [item.fileId, item] as const));
  const versionsByFile = new Map<number, AnalysisFileVersionRow[]>([
    [1, [createVersionRow(1, 0)]],
    [2, [createVersionRow(2, 1)]],
    [3, [createVersionRow(3, 2)]],
  ]);
  const readsByFile = new Map<number, AnalysisOperationRow[]>([
    [1, [
      createReadRow(10, "/usr/bin/report"),
      createReadRow(11, "/usr/bin/report"),
      createReadRow(12, "/usr/bin/export"),
    ]],
  ]);

  const sources = sourceService.buildSourceRoots({
    fileItems,
    fileItemsById,
    normalizer,
    versionsByFile,
    readsByFile,
    resolveDescendants: (fileId) => fileId === 1 ? [2, 3] : [],
  });

  assert.equal(sources.length, 1);
  assert.equal(sources[0].fileId, 1);
  assert.equal(sources[0].stats.producedFiles, 2);
  assert.equal(sources[0].stats.maxDepth, 2);
  assert.equal(sources[0].stats.processes, 3);
  assert.equal(sources[0].stats.readOps, 3);
  assert.deepEqual(sources[0].produced.map((item) => item.fileId), [2, 3]);
  assert.deepEqual(sources[0].readers.map((item) => item.processVersionId), [10, 11, 12]);
};

export const runAnalysisSourcesTests = async () => {
  await runCase(
    "AnalysisSourcesService builds source roots with stats and previews",
    testBuildsSourceRoots,
  );
};
