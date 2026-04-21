import assert from "assert";
import sqlite3 from "sqlite3";
import {
  ensureSchemaSqlApplied,
  ensureManualFileStatusEventsTable,
  hasTable,
  SqlExecutor,
  validateSchemaSql,
} from "../src/database/schema";
import { ValidationError } from "../src/errors/http-errors";

class SqliteExecutor implements SqlExecutor {
  constructor(private readonly database: sqlite3.Database) {}

  query(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const normalized = sql.trim().toUpperCase();

      if (normalized.startsWith("SELECT") || normalized.startsWith("PRAGMA")) {
        this.database.all(sql, params, (error, rows) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(rows);
        });
        return;
      }

      this.database.run(sql, params, function onRun(error) {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

const createExecutor = () => new SqliteExecutor(new sqlite3.Database(":memory:"));

const runCase = async (name: string, fn: () => Promise<void>) => {
  await fn();
  console.log(`ok - ${name}`);
};

const testEnsureSchemaSqlApplied = async () => {
  const executor = createExecutor();

  try {
    await ensureSchemaSqlApplied(executor);
    await validateSchemaSql(executor);
  } finally {
    await executor.close();
  }
};

const testValidateSchemaSqlReportsMissingStructure = async () => {
  const executor = createExecutor();

  try {
    await executor.query("CREATE TABLE files (id INTEGER PRIMARY KEY)");

    let thrownError: ValidationError | null = null;
    try {
      await validateSchemaSql(executor);
    } catch (error) {
      thrownError = error as ValidationError;
    }

    assert.ok(thrownError instanceof ValidationError);
    assert.equal(thrownError.message, "Структура базы данных не соответствует ожидаемой схеме");

    const details = thrownError.details as {
      missingTables?: string[];
      missingColumns?: Array<{ table: string; columns: string[] }>;
    };

    assert.ok(details.missingTables?.includes("file_versions"));
    assert.ok(!details.missingTables?.includes("manual_file_status_events"));
    const filesEntry = details.missingColumns?.find((entry) => entry.table === "files");
    assert.ok(filesEntry);
    assert.ok(filesEntry?.columns.includes("full_path"));
  } finally {
    await executor.close();
  }
};

const testEnsureManualFileStatusEventsTableCreatesOptionalTableOnDemand = async () => {
  const executor = createExecutor();

  try {
    await executor.query("CREATE TABLE files (id INTEGER PRIMARY KEY)");
    await executor.query("CREATE TABLE file_statuses (id INTEGER PRIMARY KEY, file_id INTEGER, status INTEGER, created_at DATETIME)");

    assert.equal(await hasTable(executor, "manual_file_status_events"), false);

    await ensureManualFileStatusEventsTable(executor);

    assert.equal(await hasTable(executor, "manual_file_status_events"), true);

    const pragmaRows = await executor.query("PRAGMA table_info(manual_file_status_events)") as Array<{ name: string }>;
    const columnNames = pragmaRows.map((row) => row.name);
    assert.ok(columnNames.includes("action"));
    assert.ok(columnNames.includes("details"));
  } finally {
    await executor.close();
  }
};

export const runSchemaTests = async () => {
  await runCase(
    "ensureSchemaSqlApplied applies the bundled schema and validateSchemaSql accepts it",
    testEnsureSchemaSqlApplied,
  );
  await runCase(
    "validateSchemaSql reports missing tables and columns",
    testValidateSchemaSqlReportsMissingStructure,
  );
  await runCase(
    "ensureManualFileStatusEventsTable creates the optional table on demand",
    testEnsureManualFileStatusEventsTableCreatesOptionalTableOnDemand,
  );
};
