import { inject, injectable } from "tsyringe";
import { ProcessRepositoryToken } from "../constants/tokens";

@injectable()
export class ProcessReadModel {
  constructor(
    @inject(ProcessRepositoryToken) private readonly
  ) { }
}