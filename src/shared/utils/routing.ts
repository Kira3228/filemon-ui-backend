import 'reflect-metadata';

export const ROUTE_META = Symbol('route');
export const PREFIX_META = Symbol('prefix');

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

export interface RouteInfo {
  path: string;
  method: HttpMethod;
  handler: string;
}

type ControllerClass = new (...args: never[]) => object;
type ControllerPrototype = {
  constructor: ControllerClass;
};

export const Controller = (prefix: string = ''): ClassDecorator =>
  (target) => Reflect.defineMetadata(PREFIX_META, prefix, target);

const routeDecorator = (method: HttpMethod, path: string): MethodDecorator =>
  (target, propertyKey) => {
    const controllerClass = (target as ControllerPrototype).constructor;
    const routes = (Reflect.getMetadata(ROUTE_META, controllerClass) ?? []) as RouteInfo[];
    routes.push({ path, method, handler: String(propertyKey) });
    Reflect.defineMetadata(ROUTE_META, routes, controllerClass);
  };

export const Get = (path: string = '') => routeDecorator('get', path);
export const Post = (path: string = '') => routeDecorator('post', path);
export const Patch = (path: string = '') => routeDecorator('patch', path);
export const Delete = (path: string = '') => routeDecorator('delete', path);
