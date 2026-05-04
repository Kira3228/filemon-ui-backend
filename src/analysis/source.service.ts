import { injectable } from "tsyringe";
import { FileEventsService } from "./file-events.service";
import { FileOperationService } from "./file-operation.service";
import { FileVersionService } from "./file-version.service";

@injectable()
export class SourceService {
  constructor(
    private readonly fileEventsService: FileEventsService,
    private readonly fileOperationService: FileOperationService,
    private readonly fileVersionService: FileVersionService,
  ) { }

  private async buildSourceData() {
    const fileEvents = await this.fileEventsService.getFileEvents()

    const fileOperation = await this.fileOperationService.getFileOperation(`read`)

    const fileVersion = await this.fileVersionService.getFileVersion()

    return {

    }
  }



}