import { injectable } from "tsyringe";
import { Controller, Get } from "../shared/utils/routing";
import { Request, Response } from "express";
import { EventsService } from "./timeline.service";

@Controller(`/events`)
@injectable()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService
  ) { }

  @Get()
  async getEvents(req: Request, res: Response) {
    const events = await this.eventsService.getEvents();
    res.status(200).json(events);
  }
}
