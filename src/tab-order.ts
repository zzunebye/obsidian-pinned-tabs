export function stablePinnedOrder<T>(
  items: readonly T[],
  isPinned: (item: T) => boolean,
): T[] {
  const pinned = items.filter(isPinned);
  const unpinned = items.filter((item) => !isPinned(item));
  return [...pinned, ...unpinned];
}
