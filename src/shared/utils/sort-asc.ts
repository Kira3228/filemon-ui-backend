import { SortableValue } from "../../analysis/analysis.types";

export const sortAsc = (a: SortableValue, b: SortableValue, fallbackA?: SortableValue, fallbackB?: SortableValue): number => {
  const aValue = a ? String(a) : "";
  const bValue = b ? String(b) : "";
  const fallbackAValue = fallbackA ? String(fallbackA) : "";
  const fallbackBValue = fallbackB ? String(fallbackB) : "";
  if (aValue === bValue) {
    if (fallbackA === fallbackB) {
      if (fallbackAValue === fallbackBValue) {
        return 0
      }
    }
    return fallbackAValue > fallbackBValue ? -1 : 1;
  }
  return aValue > bValue ? 1 : -1;
}