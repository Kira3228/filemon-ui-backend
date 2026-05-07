import { Router } from "express";
import { RouteInfo } from "./shared/utils/routing";
import { asyncHandler, RouteHandler } from "./shared/utils/async-handler";

type ControllerInstance = Record<string, unknown>;

export const registerRoute = (
  router: Router,
  route: RouteInfo,
  instance: ControllerInstance,
): void => {
  const routeHandler = (instance as Record<string, unknown>)[route.handler];

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