export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
/** Returns a list of unmet password rules (empty = valid). */
export const passwordProblems = (p: string) => {
  const out: string[] = [];
  if (p.length < 8) out.push('At least 8 characters');
  if (!/[A-Za-z]/.test(p)) out.push('One letter');
  if (!/\d/.test(p)) out.push('One number');
  return out;
};
