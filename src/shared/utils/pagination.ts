import { PaginatedResult, PaginationQuery } from "../types/pagination.type";

export interface NormalizedPagination {
  page: number;
  limit: number;
  offset: number;
}

export const normalizePagination = (
  query: PaginationQuery = {},
  options: { defaultLimit?: number; maxLimit?: number } = {},
): NormalizedPagination => {
  const defaultLimit = options.defaultLimit ?? 50;
  const maxLimit = options.maxLimit ?? 1000;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(Number(query.limit) || defaultLimit, maxLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginatedResult = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> => ({
  items,
  page,
  limit,
  total,
  pages: total > 0 ? Math.ceil(total / limit) : 0,
});

export const paginateItems = <T>(
  items: T[],
  query: PaginationQuery = {},
  options: { defaultLimit?: number; maxLimit?: number } = {},
): PaginatedResult<T> => {
  const { page, limit, offset } = normalizePagination(query, options);
  const total = items.length;
  const pagedItems = items.slice(offset, offset + limit);

  return buildPaginatedResult(pagedItems, page, limit, total);
};
