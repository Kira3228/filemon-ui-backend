import { inject, injectable } from "tsyringe";
import { Repository } from "typeorm";
import { ProcessVersion } from "../entities";
import { ProcessVersionRepositoryToken } from "../constants/tokens";

@injectable()
export class ProcessVersionReadModel {
  constructor(
    @inject(ProcessVersionRepositoryToken) private readonly processVersionRepository: Repository<ProcessVersion>
  ) { }



}