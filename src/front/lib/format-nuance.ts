export function formatNuance(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("「") && trimmed.endsWith("」")) return trimmed;
  return `「${trimmed}」`;
}
