import fs from "fs";
import path from "path";
import { ValidationError } from "../errors/http-errors";

export interface SqlExecutor {
  query(sql: string, params?: unknown[]): Promise<unknown>;
}

const SCHEMA_FILE_PATH = path.resolve(__dirname, "..", "..", "schema.sql");
const OPTIONAL_TABLES = new Set(["manual_file_status_events"]);

const stripSqlComments = (script: string) =>
  script
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

export const splitSqlScript = (script: string): string[] =>
  stripSqlComments(script)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

export const loadSchemaSql = (): string => fs.readFileSync(SCHEMA_FILE_PATH, "utf8");

export const executeSqlScript = async (executor: SqlExecutor, script: string): Promise<void> => {
  for (const statement of splitSqlScript(script)) {
    await executor.query(statement);
  }
};

export const ensureSchemaSqlApplied = async (executor: SqlExecutor): Promise<void> => {
  await executeSqlScript(executor, loadSchemaSql());
};

type ExpectedSchema = Record<string, string[]>;

const stripInlineComment = (line: string) => line.replace(/\s*--.*$/, "").trim();

const extractExpectedSchema = (script: string): ExpectedSchema => {
  const lines = script.split(/\r?\n/);
  const result: ExpectedSchema = {};
  let currentTableName = "";
  let currentColumns: string[] = [];
  let insideCreateTable = false;

  for (const rawLine of lines) {
    const line = stripInlineComment(rawLine);
    if (!line) {
      continue;
    }

    if (!insideCreateTable) {
      const match = line.match(/^CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([A-Za-z_][A-Za-z0-9_]*)\s*\($/i);
      if (!match) {
        continue;
      }

      currentTableName = match[1];
      currentColumns = [];
      insideCreateTable = true;
      continue;
    }

    if (line === ");") {
      result[currentTableName] = currentColumns;
      currentTableName = "";
      currentColumns = [];
      insideCreateTable = false;
      continue;
    }

    const normalizedLine = line.replace(/,$/, "").trim();
    if (!normalizedLine) {
      continue;
    }

    if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(normalizedLine)) {
      continue;
    }

    const columnMatch = normalizedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (columnMatch) {
      currentColumns.push(columnMatch[1]);
    }
  }

  return result;
};

const loadExpectedSchema = (): ExpectedSchema => extractExpectedSchema(loadSchemaSql());

export const hasTable = async (executor: SqlExecutor, tableName: string): Promise<boolean> => {
  const tableRows = await executor.query(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
    [tableName],
  );

  return Array.isArray(tableRows) && tableRows.length > 0;
};

const extractStatementsForTable = (script: string, tableName: string) =>
  splitSqlScript(script).filter((statement) => {
    const normalized = statement.replace(/\s+/g, " ").trim();

    if (new RegExp(`^CREATE TABLE IF NOT EXISTS ${tableName}\\b`, "i").test(normalized)) {
      return true;
    }

    return new RegExp(`\\bON\\s+${tableName}\\b`, "i").test(normalized);
  });

export const ensureManualFileStatusEventsTable = async (executor: SqlExecutor): Promise<void> => {
  const tableName = "manual_file_status_events";
  if (await hasTable(executor, tableName)) {
    return;
  }

  const statements = extractStatementsForTable(loadSchemaSql(), tableName);
  for (const statement of statements) {
    await executor.query(statement);
  }
};

export const validateSchemaSql = async (executor: SqlExecutor): Promise<void> => {
  const expectedSchema = loadExpectedSchema();
  const missingTables: string[] = [];
  const missingColumns: Array<{ table: string; columns: string[] }> = [];

  for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
    if (!(await hasTable(executor, tableName))) {
      if (OPTIONAL_TABLES.has(tableName)) {
        continue;
      }

      missingTables.push(tableName);
      continue;
    }

    const pragmaRows = await executor.query(`PRAGMA table_info(${tableName})`);
    const actualColumns = new Set(
      Array.isArray(pragmaRows)
        ? pragmaRows.map((row: { name?: string }) => String(row?.name || "")).filter(Boolean)
        : [],
    );
    const absentColumns = expectedColumns.filter((column) => !actualColumns.has(column));

    if (absentColumns.length) {
      missingColumns.push({
        table: tableName,
        columns: absentColumns,
      });
    }
  }

  if (!missingTables.length && !missingColumns.length) {
    return;
  }

  throw new ValidationError("Структура базы данных не соответствует ожидаемой схеме", {
    missingTables,
    missingColumns,
  });
};
