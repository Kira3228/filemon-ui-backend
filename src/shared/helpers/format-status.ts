import { Nullable } from "../../analysis/analysis.types";

export const formatStatus = (rawStatus?: Nullable<string | number>): string => {
  const normalizedStatus =
    rawStatus === null || rawStatus === undefined || rawStatus === ""
      ? rawStatus
      : Number(rawStatus);

  switch (normalizedStatus) {
    case 1: return "Отслеживается";
    case 2: return "Удален";
    case 3: return "Снят с наблюдения";
    case 4: return "Вне области наблюдения";
    case null:
    case undefined:
    case "":
      return "Отслеживается";
    default:
      return String(rawStatus);
  }
}