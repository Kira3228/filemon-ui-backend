import { Nullable } from "../../analysis/analysis.types";

export const splitLast = (value?: Nullable<string>) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  const parts = text.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || text;
}