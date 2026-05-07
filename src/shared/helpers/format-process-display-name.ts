import { Nullable } from "../../analysis/analysis.types";
import { splitLast } from "../utils/split-last";

export const formatProcessDisplayName = (executablePath?: Nullable<string>, pid?: Nullable<number>, fallback = "proc"): string => {
  const executable = splitLast(executablePath || fallback);
  if (pid !== null && pid !== undefined) {
    return `${executable} (PID ${pid})`;
  }
  return executable;
}