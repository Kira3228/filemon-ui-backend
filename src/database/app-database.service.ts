import fs from "fs";
import path from "path";
import {
  DatabaseConnectionSettings,
  DatabaseConnectionStatus,
} from "../contracts/api-contracts";
import {
  Connection,
  ConnectionOptions,
  EntityTarget,
  ObjectLiteral,
  Repository,
  createConnection,
} from "typeorm";
import {
  File,
  FileEvent,
  FileRead,
  FileStatus,
  FileVersion,
  FileWrite,
  Filesystem,
  ManualFileStatusEvent,
  OSUser,
  Process,
  ProcessVersion,
} from "../entities";
import { HttpError, ValidationError } from "../errors/http-errors";
import { ensureManualFileStatusEventsTable, validateSchemaSql } from "./schema";

type PersistedDatabaseConfig = {
  databasePath: string;
  updatedAt?: string;
};

const DEFAULT_DATABASE_PATH = "filemon.db";
const DATABASE_CONFIG_FILE_NAME = "config.json";

const DATABASE_ENTITIES = [
  File,
  FileEvent,
  FileRead,
  FileStatus,
  FileVersion,
  FileWrite,
  Filesystem,
  ManualFileStatusEvent,
  OSUser,
  Process,
  ProcessVersion,
];

export class AppDatabaseService {
  private connection: Connection | null = null;
  private currentDatabasePath = path.resolve(process.cwd(), DEFAULT_DATABASE_PATH);
  private updatedAt: string | null = null;
  private readonly configPath = path.resolve(process.cwd(), DATABASE_CONFIG_FILE_NAME);
  private connectionStatus: DatabaseConnectionStatus = "path-not-set";
  private connectionStatusMessage = "Путь к базе данных не задан";
  private connectionStatusDetails: unknown;

  async initialize(): Promise<void> {
    const storedConfig = this.ensurePersistedConfig();
    const initialDatabasePath = storedConfig?.databasePath || this.currentDatabasePath;

    try {
      await this.openConnection(initialDatabasePath, Boolean(storedConfig), true);
    } catch (error) {
      await this.closeConnection(this.connection);
      this.connection = null;
      this.currentDatabasePath = this.resolveStoredDatabasePath(initialDatabasePath);
      this.updatedAt = storedConfig?.updatedAt || null;
      const disconnectedState = this.describeConnectionFailure(error);
      this.applyDisconnectedState(disconnectedState);
      console.warn(
        `Database is unavailable at startup: ${disconnectedState.message}`,
        disconnectedState.details || "",
      );
    }

    if (!storedConfig && this.connectionStatus === "connected") {
      this.persistConfig(this.currentDatabasePath, this.updatedAt);
    }
  }

  getDatabaseSettings(): DatabaseConnectionSettings {
    const exists = fs.existsSync(this.currentDatabasePath);
    const connected = Boolean(exists && this.connection && this.connection.isConnected);

    if (connected && this.connectionStatus !== "connected") {
      this.applyConnectedState();
    }

    return {
      databasePath: this.currentDatabasePath,
      configPath: this.configPath,
      exists,
      connected,
      status: this.resolveConnectionStatus(exists, connected),
      statusMessage: this.resolveConnectionStatusMessage(exists, connected),
      statusDetails: this.resolveConnectionStatusDetails(exists, connected),
      updatedAt: this.updatedAt,
    };
  }

  async updateDatabasePath(nextDatabasePath: string): Promise<DatabaseConnectionSettings> {
    return this.openConnection(nextDatabasePath, true, true);
  }

  async getConnection(): Promise<Connection> {
    if (!this.connection) {
      throw new HttpError(
        503,
        this.connectionStatusMessage || "База данных не подключена",
        "DATABASE_UNAVAILABLE",
        this.connectionStatusDetails,
      );
    }

    return this.connection;
  }

  async getRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
  ): Promise<Repository<Entity>> {
    const connection = await this.getConnection();
    return connection.getRepository(entity);
  }

  private async openConnection(
    databasePath: string,
    persistAfterConnect: boolean,
    requireExistingFile = false,
  ) {
    const normalizedDatabasePath = this.normalizeDatabasePath(databasePath, requireExistingFile);
    const nextConnection = await this.createDatabaseConnection(normalizedDatabasePath);

    try {
      await validateSchemaSql(nextConnection.manager);
      await ensureManualFileStatusEventsTable(nextConnection.manager);
    } catch (error) {
      await nextConnection.close();
      throw error;
    }

    const previousConnection = this.connection;

    this.connection = nextConnection;
    this.currentDatabasePath = normalizedDatabasePath;
    this.updatedAt = new Date().toISOString();
    this.applyConnectedState();

    if (persistAfterConnect) {
      this.persistConfig(this.currentDatabasePath, this.updatedAt);
    }

    await this.closeConnection(previousConnection);

    return this.getDatabaseSettings();
  }

  private applyConnectedState() {
    this.connectionStatus = "connected";
    this.connectionStatusMessage = "Подключено к БД";
    this.connectionStatusDetails = undefined;
  }

  private applyDisconnectedState(state: {
    status: DatabaseConnectionStatus;
    message: string;
    details?: unknown;
  }) {
    this.connectionStatus = state.status;
    this.connectionStatusMessage = state.message;
    this.connectionStatusDetails = state.details;
  }

  private resolveConnectionStatus(exists: boolean, connected: boolean): DatabaseConnectionStatus {
    if (connected) {
      return "connected";
    }

    if (!this.currentDatabasePath.trim()) {
      return "path-not-set";
    }

    if (this.connectionStatus && this.connectionStatus !== "connected") {
      return this.connectionStatus;
    }

    return exists ? "structure-error" : "file-missing";
  }

  private resolveConnectionStatusMessage(exists: boolean, connected: boolean) {
    if (connected) {
      return "Подключено к БД";
    }

    if (!this.currentDatabasePath.trim()) {
      return "Путь к базе данных не задан";
    }

    if (this.connectionStatusMessage) {
      return this.connectionStatusMessage;
    }

    return exists
      ? "Структура базы данных не соответствует ожидаемой схеме"
      : "Файл базы данных не найден";
  }

  private resolveConnectionStatusDetails(exists: boolean, connected: boolean) {
    if (connected) {
      return undefined;
    }

    if (typeof this.connectionStatusDetails !== "undefined") {
      return this.connectionStatusDetails;
    }

    if (!this.currentDatabasePath.trim()) {
      return undefined;
    }

    return exists
      ? { databasePath: this.currentDatabasePath }
      : { databasePath: this.currentDatabasePath };
  }

  private describeConnectionFailure(error: unknown): {
    status: DatabaseConnectionStatus;
    message: string;
    details?: unknown;
  } {
    if (error instanceof ValidationError) {
      if (error.message === "Укажите путь к базе данных") {
        return {
          status: "path-not-set",
          message: error.message,
          details: error.details,
        };
      }

      if (error.message === "Структура базы данных не соответствует ожидаемой схеме") {
        return {
          status: "structure-error",
          message: error.message,
          details: error.details,
        };
      }

      return {
        status: "file-missing",
        message: error.message,
        details: error.details,
      };
    }

    if (error instanceof Error) {
      return {
        status: "structure-error",
        message: error.message || "Не удалось подключиться к базе данных",
      };
    }

    return {
      status: "structure-error",
      message: "Не удалось подключиться к базе данных",
    };
  }

  private resolveStoredDatabasePath(databasePath: string) {
    const trimmedPath = String(databasePath || "").trim();
    if (!trimmedPath) {
      return "";
    }

    return path.resolve(process.cwd(), trimmedPath);
  }

  private async closeConnection(connection: Connection | null) {
    if (!connection || !connection.isConnected) {
      return;
    }

    await connection.close();
  }

  private async createDatabaseConnection(databasePath: string) {
    const connectionName = `database-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const options: ConnectionOptions = {
      name: connectionName,
      type: "sqlite",
      database: databasePath,
      synchronize: false,
      entities: DATABASE_ENTITIES,
    };

    return createConnection(options);
  }

  private normalizeDatabasePath(databasePath: string, requireExistingFile = false) {
    const trimmedPath = String(databasePath || "").trim();
    if (!trimmedPath) {
      throw new ValidationError("Укажите путь к базе данных");
    }

    const resolvedPath = path.resolve(process.cwd(), trimmedPath);
    const parentDirectory = path.dirname(resolvedPath);

    if (!fs.existsSync(parentDirectory)) {
      throw new ValidationError("Каталог для базы данных не найден", {
        directory: parentDirectory,
      });
    }

    if (requireExistingFile && !fs.existsSync(resolvedPath)) {
      throw new ValidationError("Файл базы данных не найден", {
        databasePath: resolvedPath,
      });
    }

    return resolvedPath;
  }

  private readPersistedConfig(): PersistedDatabaseConfig | null {
    return this.tryReadPersistedConfig(this.configPath);
  }

  private ensurePersistedConfig(): PersistedDatabaseConfig {
    const currentConfig = this.readPersistedConfig();
    if (currentConfig) {
      return currentConfig;
    }

    if (fs.existsSync(this.configPath)) {
      this.backupInvalidConfig(this.configPath);
    }

    return this.createDefaultPersistedConfig();
  }

  private tryReadPersistedConfig(configPath: string) {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const fileContent = fs.readFileSync(configPath, "utf8");
      const parsed = JSON.parse(fileContent) as PersistedDatabaseConfig;

      if (!parsed || typeof parsed.databasePath !== "string") {
        console.warn(`Database config at ${configPath} has an invalid structure and will be replaced.`);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error(`Failed to read database config at ${configPath}; the file will be replaced.`, error);
      return null;
    }
  }

  private backupInvalidConfig(configPath: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let backupPath = `${configPath}.backup-${timestamp}`;
    let suffix = 1;

    while (fs.existsSync(backupPath)) {
      backupPath = `${configPath}.backup-${timestamp}-${suffix}`;
      suffix += 1;
    }

    fs.renameSync(configPath, backupPath);
  }

  private createDefaultPersistedConfig(): PersistedDatabaseConfig {
    const payload: PersistedDatabaseConfig = {
      databasePath: this.currentDatabasePath,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(this.configPath, JSON.stringify(payload, null, 2), "utf8");
    return payload;
  }

  private persistConfig(databasePath: string, updatedAt: string | null) {
    const payload: PersistedDatabaseConfig = {
      databasePath,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    fs.writeFileSync(this.configPath, JSON.stringify(payload, null, 2), "utf8");
  }
}
