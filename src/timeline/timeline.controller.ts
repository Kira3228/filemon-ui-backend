import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { EventsService } from "./timeline.service";
import { AnalysisTimelineEntry } from "./types/timeline-entry.type";
import { PaginatedResult, PaginationQuery } from "../shared/types/pagination.type";

@Controller(`/events`)
@injectable()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService
  ) { }

  @Get()
  async getEvents(
    req: Request<Record<string, never>, PaginatedResult<AnalysisTimelineEntry>, never, PaginationQuery>,
    res: Response<PaginatedResult<AnalysisTimelineEntry>>,
  ): Promise<void> {
    const events = await this.eventsService.getEvents(req.query);
    res.status(200).json(events);
  }
}
