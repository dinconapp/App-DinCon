export function truncateText(value: string | null | undefined, maxLength = 18): string {
  if (!value) return "";
  const text = String(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}
