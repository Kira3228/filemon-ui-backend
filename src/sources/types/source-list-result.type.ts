import { PaginatedResult } from "../../shared/types/pagination.type";
import { AnalysisSourceItem } from "./source-item.type";

export interface SourceListResult extends PaginatedResult<AnalysisSourceItem> {}
