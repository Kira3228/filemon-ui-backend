import { SortableValue } from "../../analysis/analysis.types";

export const sortAsc = (a: SortableValue, b: SortableValue, fallbackA?: SortableValue, fallbackB?: SortableValue) => {
  const aValue = a ? String(a) : "";
  const bValue = b ? String(b) : "";
  if (aValue === bValue) {
    if (fallbackA === fallbackB) {
      return 0
    };
    return fallbackA > fallbackB ? 1 : -1;
  }
  return aValue > bValue ? 1 : -1;
}