import assert from "assert";
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { AppDatabaseService } from "../src/database/app-database.service";
import { loadSchemaSql, splitSqlScript } from "../src/database/schema";
import { cleanupTestTempDirectory, createTestTempDirectory } from "./test-temp-dir";

class SqliteExecutor {
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

const runCase = async (name: string, fn: () => Promise<void>) => {
  await fn();
  console.log(`ok - ${name}`);
};

const createLegacySchemaDatabase = async (databasePath: string) => {
  const executor = new SqliteExecutor(new sqlite3.Database(databasePath));

  try {
    const statements = splitSqlScript(loadSchemaSql()).filter((statement) => {
      const normalized = statement.replace(/\s+/g, " ").trim();
      if (/^CREATE TABLE IF NOT EXISTS manual_file_status_events\b/i.test(normalized)) {
        return false;
      }

      return !/\bON\s+manual_file_status_events\b/i.test(normalized);
    });

    for (const statement of statements) {
      await executor.query(statement);
    }
  } finally {
    await executor.close();
  }
};

const testAppDatabaseServiceCreatesOptionalTableOnConnect = async () => {
  const tempDirectory = createTestTempDirectory("filemon-db-test");
  const databasePath = path.join(tempDirectory, "legacy.db");
  const configPath = path.join(tempDirectory, "config.json");
  const service = new AppDatabaseService();
  const serviceWithInternals = service as any;

  serviceWithInternals.configPath = configPath;
  serviceWithInternals.currentDatabasePath = databasePath;

  try {
    await createLegacySchemaDatabase(databasePath);

    await service.updateDatabasePath(databasePath);

    const connection = await service.getConnection();
    const rows = await connection.manager.query(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
      ["manual_file_status_events"],
    ) as Array<{ name: string }>;

    assert.equal(rows.length, 1);
  } finally {
    const connection = await service.getConnection().catch(() => null);
    if (connection && connection.isConnected) {
      await connection.close();
    }

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    if (fs.existsSync(databasePath)) {
      fs.unlinkSync(databasePath);
    }
    cleanupTestTempDirectory(tempDirectory);
  }
};

const testAppDatabaseServiceCreatesConfigFileWhenItIsMissing = async () => {
  const tempDirectory = createTestTempDirectory("filemon-db-config-create-test");
  const databasePath = path.join(tempDirectory, "filemon.db");
  const configPath = path.join(tempDirectory, "config.json");
  const service = new AppDatabaseService();
  const serviceWithInternals = service as any;

  serviceWithInternals.configPath = configPath;
  serviceWithInternals.currentDatabasePath = databasePath;

  try {
    await createLegacySchemaDatabase(databasePath);

    await service.initialize();

    const settings = service.getDatabaseSettings();
    assert.equal(settings.connected, true);
    assert.equal(settings.configPath, configPath);
    assert.equal(fs.existsSync(configPath), true);

    const persisted = JSON.parse(fs.readFileSync(configPath, "utf8")) as { databasePath?: string; updatedAt?: string };
    assert.equal(persisted.databasePath, databasePath);
    assert.equal(typeof persisted.updatedAt, "string");
  } finally {
    const connection = await service.getConnection().catch(() => null);
    if (connection && connection.isConnected) {
      await connection.close();
    }

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    if (fs.existsSync(databasePath)) {
      fs.unlinkSync(databasePath);
    }
    cleanupTestTempDirectory(tempDirectory);
  }
};

const testAppDatabaseServiceBacksUpInvalidConfigAndCreatesNewOne = async () => {
  const tempDirectory = createTestTempDirectory("filemon-db-invalid-config-test");
  const databasePath = path.join(tempDirectory, "filemon.db");
  const configPath = path.join(tempDirectory, "config.json");
  const service = new AppDatabaseService();
  const serviceWithInternals = service as any;

  serviceWithInternals.configPath = configPath;
  serviceWithInternals.currentDatabasePath = databasePath;

  try {
    await createLegacySchemaDatabase(databasePath);
    fs.writeFileSync(configPath, JSON.stringify({ wrong: true }, null, 2), "utf8");

    await service.initialize();

    const settings = service.getDatabaseSettings();
    assert.equal(settings.connected, true);
    assert.equal(settings.databasePath, databasePath);
    assert.equal(fs.existsSync(configPath), true);

    const persisted = JSON.parse(fs.readFileSync(configPath, "utf8")) as { databasePath?: string; updatedAt?: string };
    assert.equal(persisted.databasePath, databasePath);
    assert.equal(typeof persisted.updatedAt, "string");

    const backupFiles = fs.readdirSync(tempDirectory).filter((fileName) =>
      /^config\.json\.backup-\d{4}-\d{2}-\d{2}T/.test(fileName),
    );
    assert.equal(backupFiles.length, 1);

    const backupPayload = JSON.parse(fs.readFileSync(path.join(tempDirectory, backupFiles[0]), "utf8")) as { wrong?: boolean };
    assert.equal(backupPayload.wrong, true);
  } finally {
    const connection = await service.getConnection().catch(() => null);
    if (connection && connection.isConnected) {
      await connection.close();
    }

    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    const backupFiles = fs.existsSync(tempDirectory)
      ? fs.readdirSync(tempDirectory).filter((fileName) => fileName.startsWith("config.json.backup-"))
      : [];
    for (const backupFile of backupFiles) {
      fs.unlinkSync(path.join(tempDirectory, backupFile));
    }
    if (fs.existsSync(databasePath)) {
      fs.unlinkSync(databasePath);
    }
    cleanupTestTempDirectory(tempDirectory);
  }
};

export const runAppDatabaseServiceTests = async () => {
  await runCase(
    "AppDatabaseService creates manual_file_status_events when connecting to the database if it is missing",
    testAppDatabaseServiceCreatesOptionalTableOnConnect,
  );
  await runCase(
    "AppDatabaseService creates config.json when it is missing",
    testAppDatabaseServiceCreatesConfigFileWhenItIsMissing,
  );
  await runCase(
    "AppDatabaseService backs up an invalid config.json and creates a new one",
    testAppDatabaseServiceBacksUpInvalidConfigAndCreatesNewOne,
  );
};
