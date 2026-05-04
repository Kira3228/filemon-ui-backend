import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";

@Controller(`/sources`)
@injectable()
export class SourcesController {
  constructor() {

  }

  @Get()
  async getSources() {
    
  }
}