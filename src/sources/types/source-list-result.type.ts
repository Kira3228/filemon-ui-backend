import { PaginatedResult } from "../../shared/types/pagination.type";
import { AnalysisSourceItem } from "./source-item.type";

export type SourceListResult = PaginatedResult<AnalysisSourceItem>;
