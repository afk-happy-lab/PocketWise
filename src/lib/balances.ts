/**
 * Group accounting model
 *   net = paid - share + settlementsSent - settlementsReceived
 *   net > 0  => the group owes this member
 *   net < 0  => this member owes the group
 * A settlement is a RECORD of repayment from `from` to `to`; it moves no money.
 * Sum of all nets is always 0.
 */
export interface ExpenseRecord { paidBy: string; amount: number; shares: Record<string, number> }
export interface SettlementRecord { from: string; to: string; amount: number }
export interface MemberBalance { userId: string; paid: number; share: number; sent: number; received: number; net: number }
export interface Transfer { from: string; to: string; amount: number }

export function computeBalances(
  memberIds: string[], expenses: ExpenseRecord[], settlements: SettlementRecord[],
): MemberBalance[] {
  const m = new Map<string, MemberBalance>();
  const get = (id: string) => {
    if (!m.has(id)) m.set(id, { userId: id, paid: 0, share: 0, sent: 0, received: 0, net: 0 });
    return m.get(id)!;
  };
  memberIds.forEach(get); // former members with history are added below, never dropped
  for (const e of expenses) {
    const total = Object.values(e.shares).reduce((a, b) => a + b, 0);
    if (total !== e.amount) throw new Error('Expense shares do not reconcile to the amount');
    get(e.paidBy).paid += e.amount;
    for (const [id, s] of Object.entries(e.shares)) get(id).share += s;
  }
  for (const s of settlements) {
    if (!Number.isInteger(s.amount) || s.amount <= 0 || s.from === s.to) throw new Error('Invalid settlement');
    get(s.from).sent += s.amount;
    get(s.to).received += s.amount;
  }
  const out = [...m.values()];
  out.forEach((b) => (b.net = b.paid - b.share + b.sent - b.received));
  return out.sort((a, b) => (a.userId < b.userId ? -1 : 1));
}

/** Suggestion only: fewer repayments, same net balances. Never written to the ledger. */
export function suggestSettlements(balances: MemberBalance[]): Transfer[] {
  const cred = balances.filter((b) => b.net > 0).map((b) => ({ id: b.userId, v: b.net }));
  const debt = balances.filter((b) => b.net < 0).map((b) => ({ id: b.userId, v: -b.net }));
  const byVal = (a: { id: string; v: number }, b: { id: string; v: number }) => b.v - a.v || (a.id < b.id ? -1 : 1);
  const out: Transfer[] = [];
  while (cred.length && debt.length) {
    cred.sort(byVal); debt.sort(byVal);
    const amt = Math.min(cred[0].v, debt[0].v);
    out.push({ from: debt[0].id, to: cred[0].id, amount: amt });
    cred[0].v -= amt; debt[0].v -= amt;
    if (cred[0].v === 0) cred.shift();
    if (debt[0].v === 0) debt.shift();
  }
  return out;
}

/** Returns an error message, or null if the settlement is valid against current balances. */
export function canSettle(balances: MemberBalance[], from: string, to: string, amount: number): string | null {
  if (!Number.isInteger(amount) || amount <= 0) return 'Enter a valid amount';
  if (from === to) return 'Payer and receiver must differ';
  const f = balances.find((b) => b.userId === from), t = balances.find((b) => b.userId === to);
  if (!f || !t) return 'Both people must be in this group';
  if (f.net >= 0) return 'The payer does not owe anything';
  if (t.net <= 0) return 'The receiver is not owed anything';
  if (amount > Math.min(-f.net, t.net)) return 'Amount is more than is owed';
  return null;
}
