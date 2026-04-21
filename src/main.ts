import "reflect-metadata";
import express, { Router } from 'express';
import { EventEmitter } from 'events';
import cors from 'cors'
import { container } from 'tsyringe'
import { NotFoundError } from "./errors/http-errors";
import { errorHandler } from "./middleware/error-handler";
import { PREFIX_META, ROUTE_META, RouteInfo } from "./shared/utils/routing";
import { asyncHandler, RouteHandler } from "./shared/utils/async-handler";
import { FileController } from "./event/event.controller";
import { EventServiceToken, FileManagementServiceToken, TOKENS } from "./constants/tokens";
import { EventService } from "./event/event.service";
import { FileMamagementContoller } from "./file-management/file-management.controller";
import { FileManagementService } from "./file-management/file-management.service";
import { AnalysisController } from "./analysis/analysis.controller";
import { AppDatabaseService } from "./database/app-database.service";
import { DatabaseSettingsController } from "./database/database-settings.controller";
import { Connection } from "typeorm";
import { FileRead, FileVersion, FileWrite } from "./entities";
EventEmitter.defaultMaxListeners = 15;

type ControllerClass = new (...args: never[]) => object;
type ProviderClass<T = unknown> = new (...args: any[]) => T;

type ControllerInstance = Record<string, unknown>;


const registerRoute = (
    router: Router,
    route: RouteInfo,
    instance: ControllerInstance,
) => {
    const routeHandler = instance[route.handler];

    if (typeof routeHandler !== "function") {
        throw new Error(`Route handler "${route.handler}" is not defined`);
    }

    const handler = asyncHandler(routeHandler.bind(instance) as RouteHandler);

    switch (route.method) {
        case "get":
            router.get(route.path, handler);
            break;
        case "post":
            router.post(route.path, handler);
            break;
        case "patch":
            router.patch(route.path, handler);
            break;
        case "delete":
            router.delete(route.path, handler);
            break;
    }
};

function registerRepositories(
    dataSource: Connection,
    repos: { token: symbol; entity: any }[]
) {
    for (const { token, entity } of repos) {
        container.register(token, {
            useValue: dataSource.getRepository(entity),
        });
    }
}

async function bootstrap() {
    const databaseService = new AppDatabaseService();
    container.registerInstance(AppDatabaseService, databaseService);

    await databaseService.initialize();
    const app = express();
    const PORT = Number(process.env.PORT) || 5000;

    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    app.use(cors())

    registerRepositories(databaseService., [
        { token: TOKENS.fileRepository, entity: File },
        { token: TOKENS.fileReadRepository, entity: FileRead },
        { token: TOKENS.fileWriteRepository, entity: FileWrite },
        { token: TOKENS.fileVersionRepository, entity: FileVersion },
    ]);

    const providers: ProviderClass[] = [
        EventService,
        FileManagementService,
    ];
    providers.forEach((provider) => {
        container.registerSingleton(provider);
    });

    const controllers: ControllerClass[] = [
        FileController,
        FileMamagementContoller,
        AnalysisController,
        DatabaseSettingsController,
    ]

    for (const ControllerClass of controllers) {
        const prefix = Reflect.getMetadata(PREFIX_META, ControllerClass) || '';
        const instance = container.resolve(ControllerClass) as ControllerInstance;
        const routes: RouteInfo[] = Reflect.getMetadata(ROUTE_META, ControllerClass) || [];

        const router = Router();
        for (const route of routes) {
            registerRoute(router, route, instance);
        }
        app.use(prefix, router);
    }

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
    process.exit(1);
});
