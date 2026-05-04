import assert from "assert";
import { AnalysisNormalizerService } from "../src/analysis/analysis-normalizer.service";
import { AnalysisReportBuilderService } from "../src/analysis/analysis-report-builder.service";
import { AnalysisReportSourceData } from "../src/analysis/analysis.types";

const createBuilder = () => new AnalysisReportBuilderService(new AnalysisNormalizerService());

const createFixture = (): AnalysisReportSourceData => ({
  generatedAt: "2026-03-01T12:00:00.000Z",
  limit: 1,
  files: [
    {
      id: 1,
      full_path: "/data/source.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: null,
      last_status_at: "2026-03-01 10:00:00",
      tracking_started_at: "2026-03-01 10:00:00",
      initial_size_bytes: 10,
      birth_time: "2026-03-01 09:59:00",
      raw_status: 1,
      inode: 101,
    },
    {
      id: 2,
      full_path: "/archive/output-renamed.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: 10,
      last_status_at: "2026-03-01 10:20:00",
      tracking_started_at: "2026-03-01 10:10:00",
      initial_size_bytes: 20,
      birth_time: "2026-03-01 10:12:00",
      raw_status: 3,
      inode: 202,
    },
  ],
  fileVersions: [
    {
      id: 1,
      file_id: 1,
      version_number: 1,
      depth: 0,
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
    },
    {
      id: 2,
      file_id: 2,
      version_number: 1,
      depth: 1,
      created_at: "2026-03-01 10:12:00",
      origin_process_version_id: 10,
      process_version_number: 1,
      process_version_created_at: "2026-03-01 10:11:00",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source.txt",
    },
  ],
  processVersions: [
    {
      id: 10,
      process_id: 100,
      version_number: 1,
      created_at: "2026-03-01 10:11:00",
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source.txt",
    },
  ],
  reads: [
    {
      file_id: 1,
      file_version_id: 1,
      process_version_id: 10,
      first_at: "2026-03-01 10:11:30",
      last_at: null,
      count: 1,
      file_path: "/data/source.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 1,
      process_version_created_at: "2026-03-01 10:11:00",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source.txt",
      file_version_number: 1,
      file_version_depth: 0,
    },
  ],
  writes: [
    {
      file_id: 2,
      file_version_id: 2,
      process_version_id: 10,
      first_at: "2026-03-01 10:12:30",
      last_at: null,
      count: 1,
      file_path: "/archive/output-renamed.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 1,
      process_version_created_at: "2026-03-01 10:11:00",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source.txt",
      file_version_number: 1,
      file_version_depth: 1,
    },
  ],
  statusRows: [
    {
      id: 100,
      file_id: 2,
      status: 3,
      created_at: "2026-03-01 10:20:00",
    },
  ],
  manualStatusRows: [
    {
      id: 200,
      file_id: 2,
      status_history_id: 100,
      action: "untrack",
      previous_status: 1,
      new_status: 3,
      created_at: "2026-03-01 10:20:00",
      details: "{\"actor\":\"analysis_ui\"}",
    },
  ],
  fileEventRows: [
    {
      id: 300,
      file_id: 2,
      event: 0,
      created_at: "2026-03-01 10:15:00",
      details: JSON.stringify({
        old_full_path: "/tmp/output.txt",
        new_full_path: "/archive/output-renamed.txt",
      }),
    },
  ],
});

const createProcessHistoryFixture = (): AnalysisReportSourceData => ({
  generatedAt: "2026-03-01T12:30:00.000Z",
  limit: 1,
  files: [
    {
      id: 1,
      full_path: "/data/source1.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: null,
      last_status_at: "2026-03-01 10:00:00",
      tracking_started_at: "2026-03-01 10:00:00",
      initial_size_bytes: 10,
      birth_time: "2026-03-01 09:59:00",
      raw_status: 1,
      inode: 101,
    },
    {
      id: 2,
      full_path: "/data/source2.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: null,
      last_status_at: "2026-03-01 10:01:00",
      tracking_started_at: "2026-03-01 10:01:00",
      initial_size_bytes: 11,
      birth_time: "2026-03-01 10:00:30",
      raw_status: 1,
      inode: 102,
    },
    {
      id: 3,
      full_path: "/data/source3.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: null,
      last_status_at: "2026-03-01 10:02:00",
      tracking_started_at: "2026-03-01 10:02:00",
      initial_size_bytes: 12,
      birth_time: "2026-03-01 10:01:30",
      raw_status: 1,
      inode: 103,
    },
    {
      id: 4,
      full_path: "/out/newfile1.txt",
      filesystem_uuid: "fs-1",
      origin_process_version_id: 3,
      last_status_at: "2026-03-01 10:05:00",
      tracking_started_at: "2026-03-01 10:05:00",
      initial_size_bytes: 20,
      birth_time: "2026-03-01 10:04:00",
      raw_status: 1,
      inode: 104,
    },
  ],
  fileVersions: [
    {
      id: 1,
      file_id: 1,
      version_number: 1,
      depth: 0,
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
    },
    {
      id: 2,
      file_id: 2,
      version_number: 1,
      depth: 0,
      created_at: "2026-03-01 10:01:00",
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
    },
    {
      id: 3,
      file_id: 3,
      version_number: 1,
      depth: 0,
      created_at: "2026-03-01 10:02:00",
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
    },
    {
      id: 4,
      file_id: 4,
      version_number: 1,
      depth: 1,
      created_at: "2026-03-01 10:05:00",
      origin_process_version_id: 3,
      process_version_number: 3,
      process_version_created_at: "2026-03-01 10:04:30",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 3,
      origin_file_path: "/data/source3.txt",
    },
  ],
  processVersions: [
    {
      id: 1,
      process_id: 100,
      version_number: 1,
      created_at: "2026-03-01 10:03:00",
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source1.txt",
    },
    {
      id: 2,
      process_id: 100,
      version_number: 2,
      created_at: "2026-03-01 10:03:30",
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 2,
      origin_file_path: "/data/source2.txt",
    },
    {
      id: 3,
      process_id: 100,
      version_number: 3,
      created_at: "2026-03-01 10:04:30",
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 3,
      origin_file_path: "/data/source3.txt",
    },
  ],
  reads: [
    {
      file_id: 1,
      file_version_id: 1,
      process_version_id: 1,
      first_at: "2026-03-01 10:03:05",
      last_at: null,
      count: 1,
      file_path: "/data/source1.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 1,
      process_version_created_at: "2026-03-01 10:03:00",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 1,
      origin_file_path: "/data/source1.txt",
      file_version_number: 1,
      file_version_depth: 0,
    },
    {
      file_id: 2,
      file_version_id: 2,
      process_version_id: 2,
      first_at: "2026-03-01 10:03:35",
      last_at: null,
      count: 1,
      file_path: "/data/source2.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 2,
      process_version_created_at: "2026-03-01 10:03:30",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 2,
      origin_file_path: "/data/source2.txt",
      file_version_number: 1,
      file_version_depth: 0,
    },
    {
      file_id: 3,
      file_version_id: 3,
      process_version_id: 3,
      first_at: "2026-03-01 10:04:35",
      last_at: null,
      count: 1,
      file_path: "/data/source3.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 3,
      process_version_created_at: "2026-03-01 10:04:30",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 3,
      origin_file_path: "/data/source3.txt",
      file_version_number: 1,
      file_version_depth: 0,
    },
  ],
  writes: [
    {
      file_id: 4,
      file_version_id: 4,
      process_version_id: 3,
      first_at: "2026-03-01 10:05:05",
      last_at: null,
      count: 1,
      file_path: "/out/newfile1.txt",
      filesystem_uuid: "fs-1",
      process_version_number: 3,
      process_version_created_at: "2026-03-01 10:04:30",
      process_id: 100,
      executable_path: "/usr/bin/reporter",
      pid: 9001,
      username: "alice",
      uid: 501,
      origin_file_id: 3,
      origin_file_path: "/data/source3.txt",
      file_version_number: 1,
      file_version_depth: 1,
    },
  ],
  statusRows: [],
  manualStatusRows: [],
  fileEventRows: [],
});

const runCase = async (name: string, fn: () => void | Promise<void>) => {
  await fn();
  console.log(`ok - ${name}`);
};

const testBuildsConsistentReport = () => {
  const builder = createBuilder();
  const report = builder.buildReport(createFixture());

  assert.equal(report.overview.files, 2);
  assert.equal(report.overview.fileVersions, 2);
  assert.equal(report.overview.sources, 1);
  assert.equal(report.sources.length, 1);
  assert.equal(report.sources[0].fileId, 1);
  assert.equal(report.sources[0].stats.producedFiles, 1);

  const childFile = report.files.find((item) => item.fileId === 2);
  assert.ok(childFile);
  assert.deepEqual(childFile?.sourceIds, [1]);
  assert.deepEqual(childFile?.pathHistory, [
    "/tmp/output.txt",
    "/archive/output-renamed.txt",
  ]);

  const statusEntry = report.statusHistory.find((item) => item.fileId === 2);
  assert.ok(statusEntry);
  assert.equal(statusEntry?.isManual, true);
  assert.equal(statusEntry?.changeSource, "MANUAL");
  assert.equal(statusEntry?.previousStatus, "Отслеживается");
  assert.equal(statusEntry?.nextStatus, "Снят с наблюдения");

  assert.equal(report.processReads.length, 1);
  assert.equal(report.processReads[0].processVersionId, 10);
  assert.equal(report.processReads[0].files[0].fileId, 1);

  assert.equal(report.operations.length, 1);
  assert.equal(report.operations[0].type, "WRITE");
  assert.equal(report.operations[0].fileId, 2);

  assert.equal(report.chains["2"].parents[0].fileId, 1);
  assert.ok(report.renameHistory.some((item) => item.eventType === "MOVE_RENAME"));
  assert.ok(report.timeline.some((item) => item.type === "MOVE_RENAME"));
};

const testUsesAllPreviousProcessVersionsAsSources = () => {
  const builder = createBuilder();
  const report = builder.buildReport(createProcessHistoryFixture());

  const childFile = report.files.find((item) => item.fileId === 4);
  assert.ok(childFile);
  assert.deepEqual(childFile?.sourceIds, [1, 2, 3]);
  assert.deepEqual(childFile?.parents.map((item) => item.fileId), [1, 2, 3]);

  assert.equal(report.overview.sources, 3);
  assert.deepEqual(
    report.sources.map((item) => item.fileId).sort((a, b) => a - b),
    [1, 2, 3],
  );

  const processRead = report.processReads.find((item) => item.processVersionId === 3);
  assert.ok(processRead);
  assert.deepEqual(processRead?.sourceIds, [1, 2, 3]);

  assert.deepEqual(report.chains["4"].sourceIds, [1, 2, 3]);
};

const testBuildsReportSectionsConsistently = () => {
  const builder = createBuilder();
  const fixture = createFixture();
  const report = builder.buildReport(fixture);

  assert.deepEqual(builder.buildReportSection(fixture, "overview"), report.overview);
  assert.deepEqual(builder.buildReportSection(fixture, "files"), report.files);
  assert.deepEqual(builder.buildReportSection(fixture, "timeline"), report.timeline);
  assert.deepEqual(builder.buildReportSection(fixture, "operations"), report.operations);
  assert.deepEqual(builder.buildReportSection(fixture, "chains"), report.chains);
  assert.deepEqual(builder.buildReportSummary(fixture), {
    generatedAt: report.generatedAt,
    capabilities: report.capabilities,
    overview: report.overview,
    notices: report.notices,
  });
};

export const runAnalysisReportBuilderTests = async () => {
  await runCase(
    "AnalysisReportBuilderService builds a consistent report from source rows",
    testBuildsConsistentReport,
  );
  await runCase(
    "AnalysisReportBuilderService expands sources through the full process version history",
    testUsesAllPreviousProcessVersionsAsSources,
  );
  await runCase(
    "AnalysisReportBuilderService builds report sections consistently",
    testBuildsReportSectionsConsistently,
  );
};
