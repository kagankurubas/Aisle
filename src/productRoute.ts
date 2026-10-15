export function productRoute(hash: string): { id: number | null } | null {
  if (!hash.startsWith("#product/")) return null;
  const match = hash.match(/^#product\/(\d+)(?:\/reviews)?$/);
  return { id: match ? Number(match[1]) : null };
}
