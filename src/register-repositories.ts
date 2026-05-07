import { container, InjectionToken } from "tsyringe";
import { Connection, EntityTarget } from "typeorm";

type RepositoryRegistration = {
  token: InjectionToken;
  entity: EntityTarget<unknown>;
};

export const registerRepositories = (
  dataSource: Connection,
  repos: RepositoryRegistration[],
): void => {
  for (const { token, entity } of repos) {
    container.register(token, {
      useValue: dataSource.getRepository(entity),
    });
  }
}