export const getStringDetail = (details: Record<string, unknown>, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}