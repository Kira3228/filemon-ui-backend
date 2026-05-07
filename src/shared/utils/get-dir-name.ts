import { Nullable } from "../../analysis/analysis.types";

export const getDirName = (value?: Nullable<string>): string => {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.replace(/[\\/]+$/, "");
  const parts = normalized.split(/[\\/]/);
  parts.pop();
  return parts.join("/");
}