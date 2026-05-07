import { PaginationQuery } from "../../shared/types/pagination.type";

export class SourceDto implements PaginationQuery {
  page?: number | string
  limit?: number | string
}
