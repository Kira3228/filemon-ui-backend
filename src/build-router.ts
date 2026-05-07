import { Router } from "express";
import { PREFIX_META, ROUTE_META, RouteInfo } from "./shared/utils/routing";
import { container } from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";
import { registerRoute } from "./register-route";

type ControllerInstance = Record<string, unknown>;
export type ControllerClass = constructor<unknown>;

export const buildRouter = (controllers: ControllerClass[]): Router => {
  const versionRouter = Router();

  for (const ControllerClass of controllers) {
    const prefix = Reflect.getMetadata(PREFIX_META, ControllerClass) || "";
    const instance = container.resolve(ControllerClass) as ControllerInstance;
    const routes: RouteInfo[] = Reflect.getMetadata(ROUTE_META, ControllerClass) || [];

    const router = Router();

    for (const route of routes) {
      registerRoute(router, route, instance);
    }

    versionRouter.use(prefix, router);
  }

  return versionRouter;
}
