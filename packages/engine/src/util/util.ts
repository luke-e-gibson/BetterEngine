export function makeRecordIterable<T>(record: Record<string, T>): T[] {
  return Object.values(record);
}