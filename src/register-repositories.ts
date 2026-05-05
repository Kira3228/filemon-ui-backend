import { container, InjectionToken } from "tsyringe";
import { Connection } from "typeorm";

export const registerRepositories = (
  dataSource: Connection,
  repos: { token: InjectionToken<any>; entity: any }[],
) => {
  for (const { token, entity } of repos) {
    container.register(token, {
      useValue: dataSource.getRepository(entity),
    });
  }
}