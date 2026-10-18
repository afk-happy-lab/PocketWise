import { test } from 'node:test';
import assert from 'node:assert/strict';
import { equalSplit, exactSplit, percentSplit, parseRupees, formatINR, SplitError } from '../src/lib/money.ts';
import { computeBalances, suggestSettlements, canSettle } from '../src/lib/balances.ts';

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const P = 'purav', H = 'happy', T = 'tejas', A = 'abhinav';

test('equal split: spec example ₹1200 / 4', () => {
  assert.deepEqual(Object.values(equalSplit(120000, [P, H, T, A])), [30000, 30000, 30000, 30000]);
});
test('equal split remainder is deterministic and reconciles', () => {
  const s = equalSplit(1000, [T, P, H]);
  assert.equal(sum(s), 1000);
  assert.deepEqual(s, { happy: 334, purav: 333, tejas: 333 });
  assert.deepEqual(equalSplit(1000, [H, T, P]), s);
});
test('exact split validates sum and sign', () => {
  assert.throws(() => exactSplit(1000, { a: 400, b: 500 }), SplitError);
  assert.throws(() => exactSplit(1000, { a: 1500, b: -500 }), SplitError);
  assert.deepEqual(exactSplit(1000, { a: 400, b: 600 }), { a: 400, b: 600 });
});
test('percent split reconciles with largest remainder', () => {
  assert.equal(sum(percentSplit(10000, { a: 3333, b: 3333, c: 3334 })), 10000);
  assert.throws(() => percentSplit(1000, { a: 5000, b: 4000 }), SplitError);
  assert.equal(sum(percentSplit(1, { a: 5000, b: 5000 })), 1);
});
test('invalid amounts rejected', () => {
  assert.throws(() => equalSplit(0, [P]), SplitError);
  assert.throws(() => equalSplit(-5, [P]), SplitError);
  assert.throws(() => equalSplit(10.5, [P]), SplitError);
  assert.throws(() => equalSplit(100, []), SplitError);
});
test('parse/format rupees', () => {
  assert.equal(parseRupees('12.5'), 1250);
  assert.equal(parseRupees('-3'), null);
  assert.equal(parseRupees('abc'), null);
  assert.equal(formatINR(123456789), '₹12,34,567.89');
  assert.equal(formatINR(30000), '₹300');
  assert.equal(formatINR(-45000), '-₹450');
});
test('spec example: Purav is owed ₹900', () => {
  const b = computeBalances([P, H, T, A], [{ paidBy: P, amount: 120000, shares: equalSplit(120000, [P, H, T, A]) }], []);
  assert.deepEqual(Object.fromEntries(b.map((x) => [x.userId, x.net])),
    { abhinav: -30000, happy: -30000, purav: 90000, tejas: -30000 });
});
test('multiple payers net correctly and sum to zero', () => {
  const ex = [
    { paidBy: P, amount: 120000, shares: equalSplit(120000, [P, H, T, A]) },
    { paidBy: H, amount: 40000, shares: equalSplit(40000, [P, H]) },
  ];
  const b = computeBalances([P, H, T, A], ex, []);
  assert.equal(b.reduce((a, x) => a + x.net, 0), 0);
  assert.equal(b.find((x) => x.userId === H)!.net, 40000 - 30000 - 20000);
});
test('partial then full settlement', () => {
  const ex = [{ paidBy: P, amount: 120000, shares: equalSplit(120000, [P, H, T, A]) }];
  let b = computeBalances([P, H, T, A], ex, [{ from: H, to: P, amount: 10000 }]);
  assert.equal(b.find((x) => x.userId === H)!.net, -20000);
  b = computeBalances([P, H, T, A], ex, [{ from: H, to: P, amount: 30000 }]);
  assert.equal(b.find((x) => x.userId === H)!.net, 0);
  assert.equal(b.find((x) => x.userId === P)!.net, 60000);
});
test('settlement validation', () => {
  const b = computeBalances([P, H], [{ paidBy: P, amount: 1000, shares: equalSplit(1000, [P, H]) }], []);
  assert.equal(canSettle(b, H, P, 500), null);
  assert.ok(canSettle(b, H, P, 501));
  assert.ok(canSettle(b, P, H, 100));
  assert.ok(canSettle(b, H, H, 100));
  assert.ok(canSettle(b, H, P, -1));
  assert.ok(canSettle(b, H, 'stranger', 100));
});
test('simplified suggestions preserve net balances', () => {
  const ex = [
    { paidBy: P, amount: 90000, shares: equalSplit(90000, [P, H, T]) },
    { paidBy: H, amount: 30000, shares: equalSplit(30000, [P, H, T]) },
  ];
  const b = computeBalances([P, H, T], ex, []);
  const after = new Map(b.map((x) => [x.userId, x.net]));
  for (const t of suggestSettlements(b)) {
    after.set(t.from, after.get(t.from)! + t.amount);
    after.set(t.to, after.get(t.to)! - t.amount);
  }
  assert.ok([...after.values()].every((v) => v === 0));
});
test('removed member keeps historical obligations', () => {
  const b = computeBalances([P], [{ paidBy: P, amount: 1000, shares: equalSplit(1000, [P, 'gone']) }], []);
  assert.equal(b.find((x) => x.userId === 'gone')!.net, -500);
});
test('unreconciled expense rejected', () => {
  assert.throws(() => computeBalances([P], [{ paidBy: P, amount: 1000, shares: { purav: 999 } }]));
});
