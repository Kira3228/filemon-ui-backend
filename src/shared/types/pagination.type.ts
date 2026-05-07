export interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
