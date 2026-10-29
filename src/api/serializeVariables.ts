export function serializeVariables(value: unknown): string | undefined {
  return JSON.stringify(value, (_, item) => {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(
        Object.entries(item).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      );
    }

    return item;
  });
}
