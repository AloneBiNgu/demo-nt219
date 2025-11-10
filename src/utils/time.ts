const UNIT_IN_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000
};

export const durationToMs = (value: string): number => {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
    throw new Error(`Unsupported duration format: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2];
  return amount * UNIT_IN_MS[unit];
};
