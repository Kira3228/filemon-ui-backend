export const getStringDetail = (details: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}