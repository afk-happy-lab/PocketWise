/** All money is integer paise (1 INR = 100 paise). Never use floats for amounts. */
export type Shares = Record<string, number>;

export class SplitError extends Error {}

const assertAmount = (n: number) => {
  if (!Number.isInteger(n) || n <= 0) throw new SplitError('Amount must be a positive whole number of paise');
};

/** Parse "12.50" -> 1250. Returns null if invalid. */
export function parseRupees(input: string): number | null {
  const t = input.trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(t)) return null;
  const [r, p = ''] = t.split('.');
  const paise = Number(r) * 100 + Number(p.padEnd(2, '0'));
  return paise > 0 ? paise : null;
}

/** Indian digit grouping: 1234567.89 -> ₹12,34,567.89 */
export const formatINR = (paise: number) => {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const whole = String(Math.floor(abs / 100));
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  const p = abs % 100;
  return `${sign}₹${grouped}${p ? '.' + String(p).padStart(2, '0') : ''}`;
};

const uniqSorted = (ids: string[]) => {
  const s = [...new Set(ids)].sort();
  if (s.length === 0) throw new SplitError('Select at least one participant');
  return s;
};

/** Equal split. Remainder paise go one each to participants in sorted-id order (deterministic). */
export function equalSplit(total: number, ids: string[]): Shares {
  assertAmount(total);
  const p = uniqSorted(ids);
  const base = Math.floor(total / p.length);
  const rem = total - base * p.length;
  return Object.fromEntries(p.map((id, i) => [id, base + (i < rem ? 1 : 0)]));
}

/** Exact split: shares (paise) must sum to total. */
export function exactSplit(total: number, shares: Shares): Shares {
  assertAmount(total);
  const entries = Object.entries(shares);
  if (!entries.length) throw new SplitError('Select at least one participant');
  for (const [, v] of entries) if (!Number.isInteger(v) || v < 0) throw new SplitError('Shares must be non-negative paise');
  const sum = entries.reduce((a, [, v]) => a + v, 0);
  if (sum !== total) throw new SplitError(`Shares add up to ${sum} paise but total is ${total}`);
  return { ...shares };
}

/**
 * Percentage split. Percentages are basis points (25% = 2500) and must total 10000.
 * Largest-remainder method; ties broken by sorted id, so results always reconcile exactly.
 */
export function percentSplit(total: number, bps: Shares): Shares {
  assertAmount(total);
  const ids = Object.keys(bps).sort();
  if (!ids.length) throw new SplitError('Select at least one participant');
  for (const id of ids) if (!Number.isInteger(bps[id]) || bps[id] < 0) throw new SplitError('Percentages must be non-negative');
  if (ids.reduce((a, id) => a + bps[id], 0) !== 10000) throw new SplitError('Percentages must total 100%');
  const out: Shares = {};
  const frac: { id: string; r: number }[] = [];
  let used = 0;
  for (const id of ids) {
    const exact = total * bps[id];
    out[id] = Math.floor(exact / 10000);
    used += out[id];
    frac.push({ id, r: exact % 10000 });
  }
  frac.sort((a, b) => b.r - a.r || (a.id < b.id ? -1 : 1));
  for (let i = 0; i < total - used; i++) out[frac[i].id] += 1;
  return out;
}
