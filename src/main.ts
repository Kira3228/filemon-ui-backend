import "reflect-metadata";
import express from 'express';
import { EventEmitter } from 'events';
import cors from 'cors'
import { container } from 'tsyringe'
import { NotFoundError } from "./errors/http-errors";
import { errorHandler } from "./middleware/error-handler";
import { AnalysisController } from "./analysis/analysis.controller";
import { AppDatabaseService } from "./database/app-database.service";
import { DatabaseSettingsController } from "./database/database-settings.controller";
import { repositoryTokens } from "./repository-tokens";
import { SourcesController } from "./sources/sources.controller";
import { registerRepositories } from "./register-repositories";
import { buildRouter, ControllerClass } from "./build-router";
import { FilesController } from "./files/files.controller";
import { OperationController } from "./operation/operation.controller";
import { EventsController } from "./timeline/timeline.controller";
import { StatusHistoryController } from "./status-history/status-history.controller";
import { RenameHistoryController } from "./rename-history/rename-history.controller";
import { ProcessReadsController } from "./process-reads/process-reads.controller";
import { DiagramDatasetService } from "./file-tree/file-tree.service";

EventEmitter.defaultMaxListeners = 15;




async function bootstrap() {
    const databaseService = new AppDatabaseService();
    container.registerInstance(AppDatabaseService, databaseService);

    await databaseService.initialize();

    const app = express();
    const PORT = Number(process.env.PORT) || 5000;

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    app.use(cors())

    const connection = await databaseService.getConnection();
    registerRepositories(connection, repositoryTokens);

    const controllers: ControllerClass[] = [
        AnalysisController,
        DatabaseSettingsController,
        SourcesController
    ]

    const v2conrollers: ControllerClass[] = [
        SourcesController,
        FilesController,
        OperationController,
        EventsController,
        StatusHistoryController,
        RenameHistoryController,
        ProcessReadsController,
        DiagramDatasetService
    ]

    const v1Router = buildRouter(controllers)
    const v2Router = buildRouter(v2conrollers)

    app.use("/api/v1", v1Router)
    app.use("/api/v2", v2Router)

    app.use((_req, _res, next) => {
        next(new NotFoundError("Маршрут не найден"));
    });
    app.use(errorHandler);

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

bootstrap().catch(error => {
    console.error("Application startup failed:", error);
});
