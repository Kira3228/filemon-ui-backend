import { AnalysisFileItem } from "../files/types/file-item.type";
import { AnalysisSourceItem } from "../sources/types/source-item.type";
import type {
  AnalysisChainEntry,
  AnalysisDiagramData,
  AnalysisProcessReadGroup,
  AnalysisRenameHistoryItem,
  AnalysisReportOverview,
  AnalysisReportResult,
  AnalysisStatusHistoryItem,
  AnalysisTimelineEntry,
  AnalysisOperationItem,
} from "./analysis.types";

interface BuildAnalysisReportResultOptions {
  generatedAt: string;
  overview: AnalysisReportOverview;
  sources: AnalysisSourceItem[];
  timeline: AnalysisTimelineEntry[];
  files: AnalysisFileItem[];
  statusHistory: AnalysisStatusHistoryItem[];
  renameHistory: AnalysisRenameHistoryItem[];
  processReads: AnalysisProcessReadGroup[];
  operations: AnalysisOperationItem[];
  diagramData: AnalysisDiagramData;
  chains: Record<string, AnalysisChainEntry>;
}

export const buildAnalysisReportResult = ({
  generatedAt,
  overview,
  sources,
  timeline,
  files,
  statusHistory,
  renameHistory,
  processReads,
  operations,
  diagramData,
  chains,
}: BuildAnalysisReportResultOptions): AnalysisReportResult => ({
  generatedAt,
  capabilities: {
    hasFileEvents: true,
    hasFileStatuses: true,
    hasDiagram: false,
  },
  overview,
  sources,
  timeline,
  files,
  statusHistory,
  renameHistory,
  processReads,
  operations,
  diagramData,
  chains,
  notices: [],
});
