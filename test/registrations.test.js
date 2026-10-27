// P2.4a: sign-ups, waitlist, check-in, no-show, retention (rules ported from prototype/js/tests-rules.js) and the public form + roster API over HTTP.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, putSeries } from '../src/db.js';
import { etNow } from '../src/lib/clock.js';
import { seatState } from '../src/lib/seats.js';
import * as R from '../src/lib/registrations.js';

const joinPath = join; // the helpers below use the name `join` for signing someone up

// ---------- rules, on an in-memory database ----------
const FRI = '2026-11-06', at = (hm, ymd = FRI) => etNow(`${ymd}T${hm}`).m;
const occ = (o = {}) => ({ seriesId: 'fnm', slot: FRI, date: FRI, start: '19:00', end: '23:00', title: 'Draft FNM', signup: 'here', capacity: 2, waitlist: true, cutoff: 'start', ...o });
const person = (n, extra = {}) => ({ name: n, email: `${n.toLowerCase().replace(/\W/g, '')}@x.com`, ...extra });
const NOON = { nowM: at('12:00') };
const setup = () => { const db = openDb(':memory:'); return { db, join: (o, n, extra, opts = NOON) => R.register(db, o, person(n, extra), opts) }; };
const names = (db, o, status) => R.roster(db, o.seriesId, o.slot).filter((r) => r.status === status).map((r) => r.name);
const rows = (db) => db.prepare('SELECT COUNT(*) n FROM registrations').get().n;

test('last seat: the cap-th person is in, the next is waitlisted #1, then #2, #3 in sign-up order', () => {
  const { db, join } = setup(), o = occ();
  assert.deepEqual(['A', 'B'].map((n) => join(o, n).status), ['in', 'in']);
  const c = join(o, 'C'), d = join(o, 'D'), e = join(o, 'E');
  assert.deepEqual([c.status, c.position, d.position, e.position], ['waitlist', 1, 2, 3]);
  assert.equal(R.counts(db, 'fnm', FRI).in, 2);
  const st = seatState(o, at('12:00'), R.countsMap(db).get(`fnm|${FRI}`));
  assert.equal(st.state, 'waitlist'); assert.equal(st.waiting, 3);
});
test('full with the waitlist off refuses and stores nothing; no cap means no limit and never a waitlist', () => {
  const { db, join } = setup(), o = occ({ capacity: 1, waitlist: false });
  join(o, 'A');
  assert.deepEqual(join(o, 'B'), { ok: false, error: 'full' });
  assert.equal(rows(db), 1);
  const free = occ({ capacity: undefined });
  for (const n of 'ABCDEFGHIJ') assert.equal(join(free, `P${n}`).status, 'in');
  assert.equal(R.counts(db, 'fnm', FRI).waitlist, 0);
});
test('field checks: name, email or phone, shapes, lengths, player ID', () => {
  const { db } = setup(), o = occ(), go = (f) => R.register(db, o, f, NOON);
  assert.equal(go({ name: '', email: 'a@b.co' }).errors.name, 'Enter your name so we can find you at the counter.');
  assert.equal(go({ name: 'Al' }).errors.email, 'Add an email or a phone number.');
  assert.equal(go({ name: 'Al', email: 'nope' }).errors.email, 'That email doesn’t look right.');
  assert.equal(go({ name: 'Al', phone: '12345' }).errors.phone, 'That phone number looks short.');
  assert.ok(go({ name: 'x'.repeat(81), email: 'a@b.co' }).errors.name);
  assert.ok(go({ name: 'Al', email: 'a@b.co', playerId: '<b>' }).errors.playerId);
  assert.equal(rows(db), 0);
  assert.equal(go({ name: 'Al', phone: '(215) 789-3299', playerId: '1234-ab' }).ok, true);
});
test('double sign-up (G3, D30): the same name AND the same email or phone is refused (exact match); a cancelled sign-up does not block; other dates do not count', () => {
  const { db, join } = setup(), o = occ({ capacity: 9 });
  const a = join(o, 'Sam Baker', { email: 'sam@x.com', phone: '215 789 3299' });
  assert.equal(join(o, 'sam  BAKER', { email: 'SAM@x.com' }).error, 'dup');
  assert.equal(join(o, 'Sam Baker', { email: '', phone: '(215)789-3299' }).error, 'dup');
  assert.equal(join(o, 'Sam Baker', { email: 'sam@x.com' }).existing, 'Sam B.', 'the message shows a short name only');
  assert.equal(join(o, 'Sam Baker', { email: 'other@x.com' }).ok, true, 'a second Sam Baker with other contact details');
  assert.equal(join(o, 'Kid Baker', { email: 'sam@x.com' }).ok, true, 'a parent signing up a second child with the same email');
  assert.equal(join(o, 'Sam Baker', { email: 'OTHER@x.com' }).error, 'dup', 'the second Sam Baker is caught on his own contact');
  assert.equal(join(o, 'Sam Baker', { email: 'am@x.com' }).ok, true, 'a piece of an address is not a match');
  R.cancel(db, o, a.id);
  assert.equal(join(o, 'Sam Baker', { email: 'sam@x.com' }).ok, true);
  assert.equal(join(occ({ slot: '2026-11-13', date: '2026-11-13' }), 'Sam Baker', { email: 'sam@x.com' }, { nowM: at('12:00', '2026-11-13') }).ok, true);
});
test('cancel promotes the first on the waitlist and the rest move up; cancelling a waiting person promotes nobody', () => {
  const { db, join } = setup(), o = occ();
  const [a, b] = [join(o, 'A'), join(o, 'B')]; const c = join(o, 'C'), d = join(o, 'D'), e = join(o, 'E');
  assert.deepEqual(R.cancel(db, o, a.id).promoted, [c.id]);
  assert.deepEqual(names(db, o, 'in'), ['B', 'C']);
  assert.deepEqual(R.roster(db, 'fnm', FRI).filter((r) => r.status === 'waitlist').map((r) => [r.name, r.waitlistPos]), [['D', 1], ['E', 2]]);
  const r = R.cancel(db, o, d.id);
  assert.deepEqual(r.promoted, []);
  assert.deepEqual(R.roster(db, 'fnm', FRI).filter((x) => x.status === 'waitlist').map((x) => [x.name, x.waitlistPos]), [['E', 1]]);
  R.cancel(db, o, b.id); // two seats free up in a row: two people move in, in order
  assert.deepEqual(names(db, o, 'in'), ['C', 'E']);
  assert.equal(R.cancel(db, o, a.id).ok, false, 'already cancelled');
});
test('cancel after check-in frees the seat, clears the check-in and says a refund is due (comped: none)', () => {
  const { db, join } = setup(), o = occ(), a = join(o, 'A'), b = join(o, 'B'), c = join(o, 'C');
  R.checkIn(db, o, a.id); R.setPayment(db, o, a.id, 'door'); R.checkIn(db, o, b.id); R.setPayment(db, o, b.id, 'comped');
  const ra = R.cancel(db, o, a.id), rb = R.cancel(db, o, b.id);
  assert.deepEqual([ra.refundDue, rb.refundDue], [true, false]);
  assert.equal(R.roster(db, 'fnm', FRI).find((r) => r.id === a.id).checkedIn, false);
  assert.equal(R.roster(db, 'fnm', FRI).find((r) => r.id === c.id).status, 'in');
});
test('check-in and payment: only seated people check in; no payment on a cancelled row; counts only count seated people', () => {
  const { db, join } = setup(), o = occ(), a = join(o, 'A'), b = join(o, 'B'), c = join(o, 'C');
  assert.equal(R.checkIn(db, o, c.id).ok, false, 'waitlisted');
  assert.equal(R.setPayment(db, o, a.id, 'bitcoin').ok, false);
  R.checkIn(db, o, a.id); R.setPayment(db, o, a.id, 'online'); R.setPayment(db, o, c.id, 'door');
  assert.deepEqual(R.counts(db, 'fnm', FRI), { in: 2, waitlist: 1, cancelled: 0, noshow: 0, checkedIn: 1, paid: 1 });
  R.checkIn(db, o, a.id, false);
  assert.equal(R.counts(db, 'fnm', FRI).checkedIn, 0);
  R.cancel(db, o, b.id);
  assert.equal(R.setPayment(db, o, b.id, 'door').ok, false);
});
test('over the cap: staff seat-anyway stops auto-promotion until under the cap; a bigger cap or no cap fills from the waitlist', () => {
  const { db, join } = setup(), o = occ();
  const a = join(o, 'A'); join(o, 'B'); const c = join(o, 'C'), d = join(o, 'D'), e = join(o, 'E');
  assert.equal(R.moveIn(db, o, c.id).over, true); // 3 of 2
  assert.equal(R.cancel(db, o, a.id).promoted.length, 0, '2 of 2 again: nobody promoted');
  assert.deepEqual(R.promoteSlot(db, occ({ capacity: 3 })).length, 1);
  assert.deepEqual(names(db, o, 'in').length, 3);
  assert.deepEqual(R.promoteSlot(db, occ({ capacity: undefined })).length, 1);
  assert.deepEqual([names(db, o, 'waitlist').length, d.status, e.status], [0, 'waitlist', 'waitlist']);
  assert.deepEqual(R.promoteSlot(db, occ({ capacity: 1 })), [], 'lowering the seats bumps nobody');
  assert.equal(R.counts(db, 'fnm', FRI).in, 4);
});
test('staff move people up and down the waitlist; refused at either end', () => {
  const { db, join } = setup(), o = occ({ capacity: 1 }); join(o, 'A');
  const [b, c, d] = ['B', 'C', 'D'].map((n) => join(o, n));
  assert.equal(R.moveWaitlist(db, o, b.id, -1).ok, false);
  assert.equal(R.moveWaitlist(db, o, d.id, 1).ok, false);
  assert.equal(R.moveWaitlist(db, o, d.id, -1).position, 2);
  assert.deepEqual(R.roster(db, 'fnm', FRI).filter((r) => r.status === 'waitlist').map((r) => r.name), ['B', 'D', 'C']);
  R.cancel(db, o, R.roster(db, 'fnm', FRI)[0].id);
  assert.deepEqual(names(db, o, 'in'), ['B']);
  assert.ok(c.id && d.id);
});
test('cutoff: sign-ups close at the start, or N hours before; closed sign-ups store nothing', () => {
  const { db, join } = setup(), o = occ({ capacity: 9 });
  assert.equal(join(o, 'A', {}, { nowM: at('18:59') }).ok, true);
  const late = join(o, 'B', {}, { nowM: at('19:00') });
  assert.deepEqual([late.error, late.cutoffHm], ['closed', '19:00']);
  const before = occ({ capacity: 9, cutoff: 'before', cutoffHours: 2 });
  assert.equal(join(before, 'C', {}, { nowM: at('16:59') }).ok, true);
  assert.deepEqual([join(before, 'D', {}, { nowM: at('17:00') }).error, join(before, 'D', {}, { nowM: at('17:00') }).cutoffHm], ['closed', '17:00']);
  assert.equal(join(o, 'E', {}, { nowM: at('23:30') }).error, 'past');
  assert.equal(rows(db), 2);
  assert.equal(R.register(db, occ({ signup: 'walkin' }), person('Z'), NOON).error, 'nosignup');
  assert.equal(R.register(db, occ({ cancelled: true }), person('Z'), NOON).error, 'nosignup');
});
test('last-seat race: shown an open seat, it went, so waitlisted and told', () => {
  const { db, join } = setup(), o = occ({ capacity: 1 });
  const first = join(o, 'A', { expected: 'in' }), second = join(o, 'B', { expected: 'in' }), known = join(o, 'C', { expected: 'waitlist' });
  assert.deepEqual([first.raced, second.raced, second.position, known.raced], [false, true, 1, false]);
  assert.ok(db);
});
test('honeypot: a filled hidden field is a silent no-op', () => {
  const { db } = setup();
  assert.deepEqual(R.register(db, occ(), { ...person('Bot'), website: 'http://spam.example' }, NOON), { ok: true, bot: true });
  assert.equal(rows(db), 0);
});
test('two slots on one date stay apart (D23)', () => {
  const { db, join } = setup(), three = occ({ slot: `${FRI}T15:00`, start: '15:00', capacity: 1 }), five = occ({ slot: `${FRI}T17:00`, start: '17:00', capacity: 1 });
  assert.equal(join(three, 'A', {}, { nowM: at('10:00') }).status, 'in');
  assert.equal(join(five, 'A', {}, { nowM: at('10:00') }).status, 'in', 'same person, other slot');
  assert.equal(join(three, 'B', {}, { nowM: at('10:00') }).status, 'waitlist');
  assert.deepEqual([R.counts(db, 'fnm', `${FRI}T15:00`).in, R.counts(db, 'fnm', `${FRI}T17:00`).in, R.counts(db, 'fnm', `${FRI}T17:00`).waitlist], [1, 1, 0]);
});
test('walk-ins: checked in and paid at the door; full offers waitlist or seat-anyway; duplicates are caught', () => {
  const { db, join } = setup(), o = occ(); join(o, 'A');
  assert.equal(R.walkIn(db, o, { name: '  ' }).error, 'name');
  const w = R.walkIn(db, o, { name: 'Walk In' });
  assert.deepEqual([w.ok, w.status], [true, 'in']);
  assert.deepEqual(R.roster(db, 'fnm', FRI).find((r) => r.id === w.id), { ...R.roster(db, 'fnm', FRI).find((r) => r.id === w.id), checkedIn: true, payment: 'door', walkIn: true, status: 'in' });
  assert.equal(R.walkIn(db, o, { name: 'walk in' }).error, 'dup');
  assert.deepEqual(R.walkIn(db, o, { name: 'Late' }), { ok: false, error: 'full', full: true });
  const q = R.walkIn(db, o, { name: 'Late', mode: 'waitlist' });
  assert.deepEqual([q.status, q.position, R.roster(db, 'fnm', FRI).find((r) => r.id === q.id).checkedIn], ['waitlist', 1, false]);
  const over = R.walkIn(db, o, { name: 'Pushy', mode: 'over', payment: 'comped' });
  assert.deepEqual([over.status, over.over], ['in', true]);
  assert.equal(R.counts(db, 'fnm', FRI).in, 3);
  assert.equal(R.walkIn(db, o, { name: 'Z', mode: 'weird' }).error, 'bad_input');
});
test('G6 cancel Undo: waitlist place, seat with the promoted person bumped back, checked-in promoted person keeps seat, window, dup', () => {
  const { db, join } = setup(), o = occ(), T = 1e6;
  const [a, b, c, d] = ['A', 'B', 'C', 'D', 'E'].map((n) => join(o, n));
  R.cancel(db, o, d.id, { now: T }); // waitlisted D (#2) cancels
  assert.deepEqual(names(db, o, 'waitlist'), ['C', 'E']);
  assert.deepEqual(R.undoCancel(db, o, d.id, { now: T + 1 }), { ok: true, bumped: null, promoted: [], status: 'waitlist', over: false });
  const wl = () => R.roster(db, 'fnm', FRI).filter((r) => r.status === 'waitlist').map((r) => [r.name, r.waitlistPos]);
  assert.deepEqual(wl(), [['C', 1], ['D', 2], ['E', 3]]);
  assert.equal(R.undoCancel(db, o, d.id).error, 'state', 'second Undo does nothing');
  // seated A cancels, C moves in; Undo: A back as they were, C back to #1, D and E keep their places behind C
  R.checkIn(db, o, a.id); R.setPayment(db, o, a.id, 'door');
  R.cancel(db, o, a.id, { now: T });
  assert.deepEqual([names(db, o, 'in'), names(db, o, 'waitlist')], [['B', 'C'], ['D', 'E']]);
  const u = R.undoCancel(db, o, a.id, { now: T + 1000 });
  assert.deepEqual([u.ok, u.bumped, u.over], [true, c.id, false]);
  assert.deepEqual([names(db, o, 'in'), wl()], [['A', 'B'], [['C', 1], ['D', 2], ['E', 3]]]);
  const ra = R.roster(db, 'fnm', FRI).find((r) => r.id === a.id);
  assert.deepEqual([ra.checkedIn, ra.payment, ra.promotedAt], [true, 'door', null]);
  // promoted person already checked in: both keep seats, 3 of 2
  R.cancel(db, o, b.id, { now: T }); R.checkIn(db, o, c.id);
  const u2 = R.undoCancel(db, o, b.id, { now: T + 1 });
  assert.deepEqual([u2.ok, u2.bumped, u2.over, R.counts(db, 'fnm', FRI).in], [true, null, true, 3]);
  // auto-promotion stays paused over the cap; Undo is refused after the window or when the same name signed up again
  R.cancel(db, o, a.id, { now: T });
  assert.equal(R.undoCancel(db, o, a.id, { now: T + 1, self: true }).error, 'state', "a player's link can't take back a staff removal (D31 (2))");
  assert.equal(R.undoCancel(db, o, a.id, { now: T + R.UNDO_MS + 1 }).error, 'expired');
  assert.equal(join(o, 'A').status, 'waitlist');
  assert.equal(R.undoCancel(db, o, a.id, { now: T + 1 }).error, 'dup');
});
test('G6 cancel Undo after other changes: no free seat while someone waits, nobody behind in line keeps a seat, a namesake does not block', () => {
  const st = (db, o) => R.roster(db, o.seriesId, o.slot).filter((r) => ['in', 'waitlist'].includes(r.status)).map((r) => `${r.name}:${r.status}${r.waitlistPos ?? ''}`);
  for (const free of [true, false]) {
    const { db, join } = setup(), o = occ(), T = 1e6, [a, b, , d] = ['A', 'B', 'C', 'D'].map((n) => join(o, n));
    R.cancel(db, o, a.id, { now: T }); // C moves in
    if (free) { R.cancel(db, o, d.id, { now: T }); R.cancel(db, o, b.id, { now: T }); } // a seat frees up, nobody waiting
    else R.cancel(db, o, b.id, { now: T + 1 }); // D moves in for B
    R.undoCancel(db, o, a.id, { now: T + 10 });
    assert.deepEqual(st(db, o), free ? ['A:in', 'C:in'] : ['A:in', 'C:in', 'D:waitlist1'], free ? 'C keeps the free seat' : 'D (behind C) goes back, not C');
  }
  const { db, join } = setup(), o = occ(), a = join(o, 'Chris'); join(o, 'B');
  R.cancel(db, o, a.id, { now: 1e6 }); join(o, 'Chris', { email: 'other@x.com' }); // a different Chris takes the seat
  assert.deepEqual([R.undoCancel(db, o, a.id, { now: 1e6 + 1 }).over, R.counts(db, 'fnm', FRI).in], [true, 3]);
});
test('migration: a database made before cancel Undo gets the undo column, keeps its rows, and opening it again is harmless', () => {
  const dir = mkdtempSync(joinPath(tmpdir(), 'mg-mig-')), old = openDb(dir);
  old.exec('ALTER TABLE registrations DROP COLUMN undo; DROP TABLE headcount');
  old.prepare("INSERT INTO registrations (series, slot, event_day, name, status, created_at) VALUES ('fnm', ?, ?, 'Old', 'in', 1)").run(FRI, FRI);
  old.close();
  for (let i = 0; i < 2; i++) { const db = openDb(dir); assert.ok(db.prepare('PRAGMA table_info(registrations)').all().some((c) => c.name === 'undo')); assert.equal(R.roster(db, 'fnm', FRI)[0].name, 'Old'); assert.equal(R.getHeadcount(db, 'fnm', FRI), 0); db.close(); }
  rmSync(dir, { recursive: true, force: true });
});
test('G1 pre-registration: not checked in, contact optional, capacity and waitlist rules, only counter / here events, hostile input inert', () => {
  const { db } = setup(), o = occ({ signup: 'counter', capacity: 1 });
  const p = R.addPreReg(db, o, { name: ' Pat  Lee ', payment: 'online' });
  assert.deepEqual([p.ok, p.status], [true, 'in']);
  const row = R.roster(db, 'fnm', FRI)[0];
  assert.deepEqual([row.name, row.checkedIn, row.payment, row.walkIn, row.email], ['Pat Lee', false, 'online', false, '']);
  const w = R.addPreReg(db, o, { name: 'Quinn', email: 'q@x.com', payment: 'online' });
  assert.deepEqual([w.status, w.position, R.roster(db, 'fnm', FRI).find((r) => r.id === w.id).payment], ['waitlist', 1, 'unpaid']);
  assert.equal(R.addPreReg(db, o, { name: 'pat lee' }).error, 'dup');
  assert.equal(R.addPreReg(db, o, { name: 'pat lee', anyway: true }).status, 'waitlist');
  assert.equal(R.addPreReg(db, { ...o, waitlist: false }, { name: 'Z' }).error, 'full');
  assert.equal(R.addPreReg(db, o, { name: '' }).errors.name, 'Type a name first.');
  assert.ok(R.addPreReg(db, o, { name: 'Z', email: 'nope' }).errors.email && R.addPreReg(db, o, { name: 'Z', phone: '12' }).errors.phone && R.addPreReg(db, o, { name: 'Z', payment: 'wire' }).errors.payment);
  assert.equal(R.addPreReg(db, occ({ signup: 'walkin' }), { name: 'Z' }).error, 'nosignup');
  assert.equal(R.addPreReg(db, { ...o, cancelled: true }, { name: 'Z' }).error, 'nosignup');
  R.cancel(db, o, p.id); assert.equal(names(db, o, 'in')[0], 'Quinn', 'a pre-registration promotes like any other');
  const big = occ({ signup: 'counter', capacity: 9, slot: 'x' });
  assert.equal(R.addPreReg(db, big, { name: 'Z', email: "' OR 1=1 --@x.co" }).ok, false);
  assert.equal(R.addPreReg(db, big, { name: "<script>' OR 1=1 --" }).ok, true);
  assert.equal(R.roster(db, 'fnm', 'x')[0].name, "<script>' OR 1=1 --");
  assert.ok(db.prepare('SELECT COUNT(*) n FROM registrations').get().n >= 4, 'tables intact');
});
test('G10 headcount: per slot, +/- and set, never below 0 or above the max, walk-in-only events only', () => {
  const db = openDb(':memory:'), o = occ({ signup: 'walkin' }), o2 = occ({ signup: 'walkin', slot: 'late' });
  assert.equal(R.getHeadcount(db, 'fnm', FRI), 0);
  assert.equal(R.setHeadcount(db, o, { delta: 1 }).n, 1); R.setHeadcount(db, o, { delta: 1 });
  assert.equal(R.setHeadcount(db, o, { delta: -5 }).n, 0);
  assert.equal(R.setHeadcount(db, o, { n: 17 }).n, 17);
  assert.equal(R.setHeadcount(db, o2, { delta: 1 }).n, 1);
  assert.deepEqual([R.getHeadcount(db, 'fnm', FRI), R.getHeadcount(db, 'fnm', 'late')], [17, 1], 'one number per slot');
  for (const bad of [{}, { delta: 1.5 }, { delta: '1' }, { n: -1 }, { delta: 99999 }, { n: '1; DROP TABLE headcount' }]) assert.equal(R.setHeadcount(db, o, bad).error, 'bad_input');
  assert.equal(R.setHeadcount(db, occ({ signup: 'here' }), { delta: 1 }).error, 'nosignup');
  assert.equal(R.getHeadcount(db, 'fnm', FRI), 17);
});
test('walk-in Seat anyway: over the cap pauses promotion until under cap again; a name match can be seated anyway', () => {
  const { db, join } = setup(), o = occ(); join(o, 'A'); join(o, 'B'); join(o, 'W');
  const over = R.walkIn(db, o, { name: 'Pushy', mode: 'over' });
  assert.deepEqual([over.over, R.counts(db, 'fnm', FRI).in], [true, 3]);
  R.cancel(db, o, R.roster(db, 'fnm', FRI)[0].id);
  assert.deepEqual([names(db, o, 'waitlist'), R.counts(db, 'fnm', FRI).in], [['W'], 2], '3 of 2 -> 2 of 2: still no promotion');
  R.cancel(db, o, R.roster(db, 'fnm', FRI)[0].id);
  assert.deepEqual([names(db, o, 'waitlist'), names(db, o, 'in').includes('W')], [[], true], 'under cap: W moves in');
  assert.equal(R.walkIn(db, o, { name: 'pushy', mode: 'over' }).error, 'dup');
  assert.equal(R.walkIn(db, o, { name: 'pushy', mode: 'over', anyway: true }).ok, true);
});
test('no-show: frees the seat and promotes #1; not for a checked-in person; Undo', () => {
  const { db, join } = setup(), o = occ(), a = join(o, 'A'), b = join(o, 'B'), c = join(o, 'C');
  R.checkIn(db, o, b.id);
  assert.equal(R.noShow(db, o, b.id).ok, false, 'checked in');
  assert.equal(R.noShow(db, o, c.id).ok, false, 'waitlisted');
  assert.deepEqual(R.noShow(db, o, a.id).promoted, [c.id]);
  assert.deepEqual(R.counts(db, 'fnm', FRI), { in: 2, waitlist: 0, cancelled: 0, noshow: 1, checkedIn: 1, paid: 0 });
  // Undo while full and the promoted person has not checked in: they go back to waitlist #1
  const u = R.undoNoShow(db, o, a.id);
  assert.deepEqual([u.ok, u.bumped, u.over], [true, c.id, false]);
  assert.deepEqual([names(db, o, 'in'), names(db, o, 'waitlist')], [['A', 'B'], ['C']]);
  // Undo after the promoted person checked in: both keep their seats (3 of 2)
  R.noShow(db, o, a.id); R.checkIn(db, o, c.id);
  const u2 = R.undoNoShow(db, o, a.id);
  assert.deepEqual([u2.ok, u2.bumped, u2.over], [true, null, true]);
  assert.equal(R.counts(db, 'fnm', FRI).in, 3);
  assert.equal(R.undoNoShow(db, o, a.id).ok, false);
  // Undo with a free seat: simply back in
  const x = setup(), p = x.join(o, 'P'); R.noShow(x.db, o, p.id);
  assert.deepEqual([R.undoNoShow(x.db, o, p.id).bumped, R.counts(x.db, 'fnm', FRI).in], [null, 1]);
});
test('concurrent cancels do not double-promote or overbook (same row twice, two rows at once, two connections)', () => {
  const { db, join } = setup(), o = occ(), a = join(o, 'A'), b = join(o, 'B'), c = join(o, 'C');
  const twice = [R.cancel(db, o, a.id), R.cancel(db, o, a.id)];
  assert.deepEqual(twice.map((r) => r.ok), [true, false]);
  assert.equal(R.counts(db, 'fnm', FRI).in, 2);
  const d = join(o, 'D'), e = join(o, 'E');
  const both = [R.cancel(db, o, b.id), R.cancel(db, o, c.id)];
  assert.deepEqual(both.flatMap((r) => r.promoted).sort(), [d.id, e.id].sort());
  assert.deepEqual(names(db, o, 'in'), ['D', 'E']);
  // two connections to one file
  const dir = mkdtempSync(joinPath(tmpdir(), 'mg-reg-')), d1 = openDb(dir), d2 = openDb(dir);
  try {
    const mk = (n) => R.register(d1, o, person(n), NOON);
    const [p, q] = [mk('P'), mk('Q')]; mk('W');
    const out = [R.cancel(d1, o, p.id), R.cancel(d2, o, q.id), R.cancel(d2, o, p.id)];
    assert.deepEqual(out.map((r) => r.ok), [true, true, false]);
    assert.deepEqual(R.counts(d2, 'fnm', FRI), { in: 1, waitlist: 0, cancelled: 2, noshow: 0, checkedIn: 0, paid: 0 });
  } finally { d1.close(); d2.close(); rmSync(dir, { recursive: true, force: true }); }
});
test('a failing step rolls the whole change back', () => {
  const { db, join } = setup(), o = occ(); join(o, 'A');
  db.exec("CREATE TRIGGER boom BEFORE INSERT ON registrations WHEN NEW.name = 'Boom' BEGIN SELECT RAISE(ABORT, 'boom'); END");
  assert.throws(() => join(o, 'Boom'));
  assert.equal(rows(db), 1);
  assert.equal(join(o, 'B').ok, true, 'the connection is not stuck in a transaction');
});
test('hostile text and SQL stay plain text; the table survives', () => {
  const { db, join } = setup(), o = occ({ capacity: 9 });
  const evil = ['<script>alert(1)</script>', "'; DROP TABLE registrations; --", "x' OR 1=1 --"];
  for (const n of evil) assert.equal(join(o, n, { email: 'e@x.com'.replace('e', String(evil.indexOf(n))) }).ok, true);
  assert.deepEqual(names(db, o, 'in'), evil);
  assert.equal(rows(db), 3);
  assert.equal(R.walkIn(db, o, { name: "O'Brien; DELETE FROM kv" }).ok, true);
  assert.equal(R.byToken(db, "' OR 1=1 --"), null);
});
test('personal token: 192 random bits, only the hash is stored, one token reaches one registration', () => {
  const { db, join } = setup(), o = occ(), a = join(o, 'A'), b = join(o, 'B');
  assert.ok(a.token.length >= 32 && a.token !== b.token);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM registrations WHERE token_hash = ?').get(a.token).n, 0, 'the raw token is not stored');
  assert.equal(R.byToken(db, a.token).id, a.id);
  for (const bad of ['', 'abc', null, undefined, a.token + '!', a.token.slice(1), `${a.token}x`, 'A'.repeat(30)]) assert.equal(R.byToken(db, bad), null);
  R.cancel(db, o, R.byToken(db, b.token).id); // B's own link cancels B and nobody else
  assert.deepEqual([R.byToken(db, a.token).status, R.byToken(db, b.token).status], ['in', 'cancelled']);
  assert.equal(R.cancel(db, occ({ slot: '2026-11-13' }), a.id).ok, false, 'an id from another slot is not found');
});
test('retention: contacts and links are wiped N days after the event; names shrink to initials; counts, statuses and payment stay', () => {
  const { db, join } = setup(), o = occ({ capacity: 9 });
  const a = join(o, 'Sam Baker', { phone: '215-789-3299', playerId: '123456' }), b = join(o, 'Chris');
  R.checkIn(db, o, a.id); R.setPayment(db, o, a.id, 'door'); R.cancel(db, o, b.id);
  assert.equal(R.RETENTION_DAYS, 30);
  assert.equal(R.purgeContacts(db, '2026-12-05'), 0, 'day 29: not yet');
  assert.equal(R.purgeContacts(db, '2026-12-06'), 2, 'day 30');
  const [x, y] = R.roster(db, 'fnm', FRI);
  assert.deepEqual([x.name, x.email, x.phone, x.playerId, x.status, x.checkedIn, x.payment], ['S. B.', '', '', '', 'in', true, 'door']);
  assert.deepEqual([y.name, y.status], ['C.', 'cancelled']);
  assert.equal(R.byToken(db, a.token), null, 'the private link is dead');
  assert.equal(R.counts(db, 'fnm', FRI).in, 1);
  assert.equal(R.purgeContacts(db, '2027-01-01'), 0, 'safe to run again');
  // a date moved later keeps its sign-ups until N days after the day it really happens
  const m = occ({ slot: '2026-11-13', date: '2026-11-13' }), mv = R.register(db, m, person('Mover'), { nowM: at('12:00', '2026-11-13') });
  R.setEventDay(db, 'fnm', '2026-11-13', '2026-12-20');
  assert.equal(R.purgeContacts(db, '2026-12-30'), 0);
  assert.equal(R.purgeContacts(db, '2027-01-19'), 1);
  assert.ok(mv.ok);
  // a date moved earlier is wiped N days after the new, earlier day (not kept until the old one)
  const e = occ({ slot: '2026-11-27', date: '2026-11-27' }), ev = R.register(db, e, person('Early'), { nowM: at('12:00', '2026-11-20') });
  R.setEventDay(db, 'fnm', '2026-11-27', '2026-11-20');
  assert.equal(R.purgeContacts(db, '2026-12-19'), 0);
  assert.equal(R.purgeContacts(db, '2026-12-20'), 1);
  assert.equal(R.byToken(db, ev.token), null);
  const c = R.register(db, o, person('Later'), NOON); // erase: "remove my details" at the counter
  assert.equal(R.erase(db, o, c.id).ok, true);
  assert.deepEqual([R.byToken(db, c.token), R.roster(db, 'fnm', FRI).find((r) => r.id === c.id).email], [null, '']);
});
test('the privacy page prints N and the form links to it', () => {
  const page = readFileSync(new URL('../src/pages/privacy.astro', import.meta.url), 'utf8');
  assert.ok(page.includes('{RETENTION_DAYS} days') && page.includes('7 daily backup') && page.includes('private link'));
  assert.ok(readFileSync(new URL('../src/components/Base.astro', import.meta.url), 'utf8').includes('href="/privacy/"'));
  const built = new URL('../dist/privacy/index.html', import.meta.url);
  if (existsSync(built)) assert.ok(readFileSync(built, 'utf8').includes('30 days after the event'));
});

// ---------- over HTTP: the public form, the player's page, the roster API ----------
const tmp = mkdtempSync(join(tmpdir(), 'mg-signups-')), dist = join(tmp, 'dist'), data = join(tmp, 'data');
const put = (path, body) => { mkdirSync(join(dist, path), { recursive: true }); writeFileSync(join(dist, path, 'index.html'), body); };
const frame = (inner) => `<!doctype html><html><head><!--mg:head--><title>t</title></head><body><!--mg:strip--><p>baked</p><!--/mg:strip-->${inner}<footer><a href="/privacy/">Privacy</a></footer></body></html>`;
put('event-page', frame('<main><!--mg:event--><!--/mg:event--></main>'));
put('events', frame('<main><!--mg:events-->x<!--/mg:events--></main>'));
const WK = (id, title, over = {}) => ({ id, title, game: 'magic', kind: 'weekly', recurrence: { type: 'weekly', day: 5 }, start: '19:00', end: '23:00', fee: 20, signup: 'here', capacity: 2, waitlist: true, arriveByMins: 10, tool: { name: 'Wizards EventLink' }, ...over });
const NOW = `${FRI}T12:00`;
let proc, origin, cookie = '';
before(async () => {
  const db = openDb(data);
  db.prepare("INSERT INTO kv (key, value) VALUES ('series_seeded', '1')").run();
  for (const s of [WK('fnm', 'Draft FNM'), WK('duo', 'Duo Night', { capacity: 1 }), WK('adm', 'Admin Night'), WK('nowl', 'No Waitlist', { capacity: 1, waitlist: false }), WK('hostile', 'Hostile Night', { capacity: 9 }),
    WK('late', 'Late Night', { cutoff: 'before', cutoffHours: 2 }), WK('ctr', 'Prerelease', { signup: 'counter' }), WK('wlk', 'Casual Night', { signup: 'walkin', capacity: undefined })]) putSeries(db, s);
  db.close();
  proc = spawn(process.execPath, ['server.js'], { cwd: join(import.meta.dirname, '..'), env: { ...process.env, PORT: '0', DATA_DIR: data, DIST_DIR: dist, ALLOW_DEFAULT_ADMIN: '1', NODE_ENV: 'test', PUBLIC_URL: 'https://mg.example' } });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  const port = await new Promise((ok, no) => { proc.stdout.on('data', (d) => { const m = /\(port (\d+),/.exec(String(d)); if (m) ok(+m[1]); }); proc.on('exit', (c) => no(new Error(`server exited ${c}`))); });
  origin = `http://localhost:${port}`;
  const r = await fetch(`${origin}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ username: 'admin', password: 'admin' }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
});
after(() => { proc?.kill(); try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

const pageUrl = (id, now = NOW) => `/events/${id}?date=${FRI}&now=${now}`;
const html = async (path) => { const r = await fetch(origin + path); return { r, t: await r.text() }; };
const form = (id, f, { now = NOW, headers = {}, json = false } = {}) => fetch(`${origin}/api/signup?now=${now}`, {
  method: 'POST', redirect: 'manual', headers: { Origin: origin, ...(json ? { 'Content-Type': 'application/json', Accept: 'application/json' } : {}), ...headers },
  body: json ? JSON.stringify({ series: id, slot: FRI, ...f }) : new URLSearchParams({ series: id, slot: FRI, expected: 'in', _page: '/events/', ...f }),
});
const tokenOf = (r) => /\/signup\/([A-Za-z0-9_-]+)/.exec(r.headers.get('location'))[1];
const mine = (token, now = NOW) => html(`/signup/${token}?now=${now}`);
const cancelPost = (token) => fetch(`${origin}/api/signup/cancel?now=${NOW}`, { method: 'POST', redirect: 'manual', headers: { Origin: origin }, body: new URLSearchParams({ token }) });
const adm = (method, path, body, headers = { Origin: origin, Cookie: cookie }) => fetch(`${origin}/api/admin/roster/${path}?now=${NOW}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
const jn = (n, extra = {}) => ({ name: n, email: `${n.toLowerCase().replace(/\W/g, '')}@x.com`, ...extra });

test('HTTP: the date page has a working form with no JavaScript, and seats left come from real sign-ups', async () => {
  const { r, t } = await html(pageUrl('fnm'));
  assert.equal(r.status, 200);
  assert.ok(t.includes('<form class="su" id="signup" method="post" action="/api/signup?now=2026-11-06T12%3A00">') && t.includes('name="website"') && t.includes('Hold my seat') && t.includes('href="/privacy/"'));
  assert.ok(t.includes('Wizards ID (Companion) (optional)'));
  assert.ok(t.includes('Arrive by 6:50') && t.includes('Pay $20 at the store when you arrive.'));
  assert.ok(t.includes('2</span><span class="ev-stat-unit">seats left'), 'two of two seats are free');
});
test('HTTP: sign up until the waitlist, see the reply, cancel by link, watch the promotion', async () => {
  const a = await form('fnm', jn('Ann'));
  assert.equal(a.status, 303);
  const ta = tokenOf(a), pa = await html(a.headers.get('location')); // the redirect lands on the reply page (?new=1)
  assert.equal(pa.r.status, 200);
  assert.equal(pa.r.headers.get('x-robots-tag'), 'noindex');
  assert.equal(pa.r.headers.get('referrer-policy'), 'no-referrer');
  assert.ok(pa.t.includes('<meta name="robots" content="noindex">'));
  assert.ok(/You.re in\.<\/strong> 1 of 2 seats are taken for Draft FNM, Friday, November 6 at 7.PM\. Pay \$20 at the store when you arrive\./.test(pa.t));
  assert.ok(/Arrive by 6:50.PM or your seat goes to the next person on the waitlist\./.test(pa.t));
  assert.equal(pa.t.split('at the store when you arrive').length - 1, 1, 'R17: exactly one payment phrase');
  assert.ok(pa.t.includes('Keep this link') && pa.t.includes(`https://mg.example/signup/${ta}`) && pa.t.includes('Cancel my seat'));
  const b = tokenOf(await form('fnm', jn('Bob'))), c = await form('fnm', jn('Cat'), { now: NOW }), tc = tokenOf(c), d = tokenOf(await form('fnm', jn('Dee')));
  const pc = await mine(tc);
  assert.ok(/on the waitlist \(#1\)/.test(pc.t) && /If a seat opens, you move in automatically/.test(pc.t) && !pc.t.includes('Arrive by'));
  assert.ok(/on the waitlist \(#2\)/.test((await mine(d)).t));
  const card = (await html(pageUrl('fnm'))).t;
  assert.ok(card.includes('Join the waitlist') && card.includes('2 waiting'), 'the page now says full with a waitlist');
  // Ann cancels with her own link: Cat moves in, Dee becomes #1
  const x = await cancelPost(ta);
  assert.equal(x.status, 303);
  assert.ok(x.headers.get('location').startsWith(`/signup/${ta}`));
  assert.ok((await mine(ta)).t.includes('Your sign-up is cancelled'));
  assert.ok(/You.re in\./.test((await mine(tc)).t));
  assert.ok(/on the waitlist \(#1\)/.test((await mine(d)).t));
  assert.ok((await mine(b)).t.includes('Cancel my seat'), 'Bob was not touched');
  assert.equal((await cancelPost(ta)).status, 303, 'cancelling twice changes nothing');
  assert.ok(/You.re in\./.test((await mine(tc)).t) && /\(#1\)/.test((await mine(d)).t));
});
test('HTTP: a wrong link, a finished event and a stranger cannot reach or touch anyone', async () => {
  const t1 = tokenOf(await form('hostile', jn('Tess')));
  const t2 = tokenOf(await form('hostile', jn('Uma')));
  assert.equal((await mine('A'.repeat(32))).r.status, 404);
  assert.equal((await mine(t1.slice(0, -1) + (t1.endsWith('A') ? 'B' : 'A'))).r.status, 404);
  const end = await mine(t1, `${FRI}T23:30`);
  assert.equal(end.r.status, 404);
  assert.equal((await cancelPost('Z'.repeat(32))).status, 303); // unknown token: back to /events/?error
  assert.ok((await mine(t1)).t.includes('Cancel my seat') && (await mine(t2)).t.includes('Cancel my seat'));
  await cancelPost(t1);
  assert.ok((await mine(t1)).t.includes('cancelled') && (await mine(t2)).t.includes('Cancel my seat'), 'only the owner of the link was cancelled');
  const wrongOrigin = await fetch(`${origin}/api/signup/cancel`, { method: 'POST', redirect: 'manual', headers: { Origin: 'http://evil.example' }, body: new URLSearchParams({ token: t2 }) });
  assert.equal(wrongOrigin.status, 403);
});
test('HTTP: refused posts show the form again with the error under the field and store nothing', async () => {
  const before = await (await adm('GET', `fnm/${FRI}`)).json();
  const blank = await form('fnm', { name: '', email: 'x@y.co' });
  const t = await blank.text();
  assert.equal(blank.status, 422);
  assert.ok(t.includes('Enter your name so we can find you at the counter.') && t.includes('value="x@y.co"') && t.includes('aria-invalid="true"'));
  assert.equal(blank.headers.get('content-security-policy'), (await html(pageUrl('fnm'))).r.headers.get('content-security-policy'), 'CSP hashes come from the built page, not the filled one (D24 (2))');
  assert.ok((await (await form('fnm', jn('Eve', { email: 'nope' }))).text()).includes('That email doesn’t look right.'));
  const dup = await form('fnm', jn('cat'));
  assert.equal(dup.status, 409);
  assert.ok((await dup.text()).includes('You’re already signed up for this one, as Cat.'));
  const closed = await form('fnm', jn('Fay'), { now: `${FRI}T19:30` });
  assert.equal(closed.status, 409);
  assert.ok(/Sign-ups closed at 7.PM. Walk in if seats are left./.test(await closed.text()));
  const early = await form('late', jn('Gus'), { now: `${FRI}T17:00` });
  assert.ok(/Sign-ups closed at 5.PM./.test(await early.text()), 'cutoff N hours before the start');
  assert.equal((await form('nowl', jn('Hal'))).status, 303);
  const full = await form('nowl', jn('Ivy'));
  assert.equal(full.status, 409);
  assert.ok((await full.text()).includes('This one is full. Ask at the counter about open seats.'));
  assert.equal((await form('ghost', jn('Joe'))).status, 404);
  const after = await (await adm('GET', `fnm/${FRI}`)).json();
  assert.equal(after.regs.length, before.regs.length);
});
test('HTTP: foreign origin refused, honeypot looks like success but stores nothing, JSON replies, body cap', async () => {
  const n0 = (await (await adm('GET', `duo/${FRI}`)).json()).regs.length;
  assert.equal((await form('duo', jn('Kim'), { headers: { Origin: 'http://evil.example' } })).status, 403);
  const bot = await form('duo', { ...jn('Bot'), website: 'http://spam.example' });
  assert.equal(bot.status, 303);
  assert.ok(bot.headers.get('location').startsWith('/events/'));
  assert.equal((await (await adm('GET', `duo/${FRI}`)).json()).regs.length, n0);
  const j = await form('duo', jn('Lee'), { json: true });
  const body = await j.json();
  assert.deepEqual([j.status, body.ok, body.status, body.position, body.raced], [200, true, 'in', null, false]);
  assert.ok(body.link.startsWith('https://mg.example/signup/'));
  const bad = await form('duo', { name: '', email: '' }, { json: true });
  assert.equal(bad.status, 422);
  assert.ok((await bad.json()).errors.name);
  const big = await fetch(`${origin}/api/signup`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ series: 'duo', slot: FRI, name: 'x'.repeat(20000) }) });
  assert.equal(big.status, 413);
});
test('HTTP: two sign-ups for the last seat at the same moment: one in, one waitlisted and told', async () => {
  const [p, q] = await Promise.all([form('adm', jn('Pat'), { json: true }), form('adm', jn('Quin'), { json: true })]);
  const [r1, r2] = await Promise.all([form('adm', jn('Ray'), { json: true }), form('adm', jn('Sue'), { json: true })]);
  const all = [await p.json(), await q.json(), await r1.json(), await r2.json()];
  assert.deepEqual(all.map((x) => x.status).sort(), ['in', 'in', 'waitlist', 'waitlist']);
  assert.deepEqual(all.filter((x) => x.status === 'waitlist').map((x) => x.position).sort(), [1, 2]);
  const duo = await Promise.all([form('duo', jn('Tom'), { json: true }), form('duo', jn('Una'), { json: true })]);
  const got = await Promise.all(duo.map((x) => x.json()));
  assert.equal(got.every((x) => x.status === 'waitlist'), true, 'duo already had Lee');
  const raced = await form('nowl', { ...jn('Vic'), expected: 'in' }, { json: true });
  assert.equal(raced.status, 409);
  const cap1 = await form('hostile', jn('Wes'), { json: true });
  assert.equal((await cap1.json()).status, 'in');
});
test('HTTP: roster API: session, origin check, list, check in, payment, move, no-show, cancel promotes, walk-in, erase', async () => {
  assert.equal((await adm('GET', `adm/${FRI}`, null, {})).status, 401);
  assert.equal((await adm('POST', `adm/${FRI}/walkin`, { name: 'x' }, { Cookie: cookie })).status, 403, 'no Origin: CSRF');
  assert.equal((await adm('POST', `adm/${FRI}/walkin`, { name: 'x' }, { Cookie: cookie, Origin: 'http://evil.example' })).status, 403);
  assert.equal((await adm('GET', `nope/${FRI}`)).status, 404);
  assert.equal((await adm('GET', `adm/2026-11-07`)).status, 404, 'a date the series does not have');
  const view = async () => (await adm('GET', `adm/${FRI}`)).json();
  let v = await view();
  assert.deepEqual([v.event.title, v.event.capacity, v.event.arriveBy, v.counts.in, v.counts.waitlist], ['Admin Night', 2, '18:50', 2, 2]);
  const [r1, r2, w1, w2] = v.regs;
  assert.deepEqual([r1.status, w1.status, w1.waitlistPos, w2.waitlistPos], ['in', 'waitlist', 1, 2]);
  const act = (id, action, body) => adm('POST', `adm/${FRI}/${id}/${action}`, body ?? {});
  assert.equal((await act(w1.id, 'checkin')).status, 409, 'waitlisted people cannot check in');
  v = await (await act(r1.id, 'checkin')).json();
  assert.equal(v.regs[0].checkedIn, true);
  v = await (await act(r1.id, 'checkin', { on: false })).json();
  assert.equal(v.regs[0].checkedIn, false);
  assert.equal((await act(r1.id, 'payment', { payment: 'wire' })).status, 409);
  v = await (await act(r1.id, 'payment', { payment: 'credit' })).json();
  assert.deepEqual([v.regs[0].payment, v.counts.paid], ['credit', 1]);
  v = await (await act(w2.id, 'move', { dir: -1 })).json();
  assert.deepEqual(v.regs.filter((x) => x.status === 'waitlist').map((x) => x.name), [w2.name, w1.name]);
  assert.equal((await act(w2.id, 'move', { dir: -1 })).status, 409);
  // No-show frees the seat and promotes #1 (w2 now); Undo puts the person back and w2 returns to the front of the waitlist
  v = await (await act(r2.id, 'noshow')).json();
  assert.deepEqual([v.result.promoted, v.counts.noshow, v.regs.find((x) => x.id === w2.id).status], [[w2.id], 1, 'in']);
  v = await (await act(r2.id, 'noshow', { on: false })).json();
  assert.deepEqual([v.result.bumped, v.counts.noshow, v.regs.find((x) => x.id === r2.id).status], [w2.id, 0, 'in']);
  // Removing a seated person promotes in order, and the same removal sent twice at once promotes only once
  const [c1, c2] = await Promise.all([act(r1.id, 'cancel'), act(r1.id, 'cancel')]);
  assert.deepEqual([c1.status, c2.status].sort(), [200, 409]);
  v = await view();
  assert.deepEqual([v.counts.in, v.counts.waitlist, v.counts.cancelled], [2, 1, 1]);
  assert.equal(v.regs[0].status, 'in');
  // G6 over HTTP: Undo of the removal above (r1 was cancelled)
  v = await (await act(r1.id, 'cancel', { undo: true })).json();
  assert.deepEqual([v.result.ok, v.regs.find((x) => x.id === r1.id).status], [true, 'in']);
  assert.equal((await act(r1.id, 'cancel', { undo: true })).status, 409);
  await act(r1.id, 'cancel');
  // walk-ins
  const full = await adm('POST', `adm/${FRI}/walkin`, { name: 'Walker' });
  assert.deepEqual([full.status, (await full.json()).error], [409, 'full']);
  v = await (await adm('POST', `adm/${FRI}/walkin`, { name: 'Walker', mode: 'over', payment: 'door' })).json();
  assert.deepEqual([v.counts.in, v.result.over], [3, true]);
  assert.equal((await adm('POST', `adm/${FRI}/walkin`, { name: '' })).status, 422);
  assert.equal((await adm('POST', `adm/${FRI}/walkin`, { name: 'walker', mode: 'over' })).status, 409, 'duplicate name');
  const wl = v.regs.find((x) => x.status === 'waitlist');
  v = await (await act(wl.id, 'movein')).json();
  assert.equal(v.counts.in, 4);
  // erase: the player's details go now
  const era = await (await act(wl.id, 'erase')).json();
  assert.deepEqual([era.regs.find((x) => x.id === wl.id).email, era.regs.find((x) => x.id === wl.id).name.endsWith('.')], ['', true]);
  assert.equal((await act('abc', 'cancel')).status, 404);
  assert.equal((await act(99999, 'cancel')).status, 409);
  assert.equal((await act(r2.id, 'bogus')).status, 404);
  assert.equal((await adm('POST', `adm/${FRI}/${r2.id}/payment`, { payment: 'x'.repeat(20000) })).status, 413, 'body cap');
});
test('HTTP: pre-registration, headcount, seat anyway and the player own Undo: session, CSRF, validation', async () => {
  const P = (path, body, h) => adm('POST', path, body, h);
  assert.equal((await P(`ctr/${FRI}/prereg`, { name: 'x' }, { Cookie: cookie })).status, 403, 'no Origin');
  assert.equal((await P(`ctr/${FRI}/prereg`, { name: 'x' }, { Origin: origin })).status, 401, 'no session');
  assert.equal((await P(`wlk/${FRI}/headcount`, { delta: 1 }, { Origin: origin })).status, 401);
  assert.equal((await P(`wlk/${FRI}/headcount`, { delta: 1 }, { Cookie: cookie, Origin: 'http://evil.example' })).status, 403);
  let v = await (await P(`ctr/${FRI}/prereg`, { name: '<b>Pre</b>', email: "' OR 1=1 --@x.co", payment: 'online' })).json();
  assert.equal(v.error, 'invalid');
  v = await (await P(`ctr/${FRI}/prereg`, { name: '<script>alert(1)</script>', phone: '215-555-0100', payment: 'online' })).json();
  assert.deepEqual([v.result.ok, v.regs[0].name, v.regs[0].checkedIn, v.regs[0].payment, v.counts.in], [true, '<script>alert(1)</script>', false, 'online', 1]);
  assert.equal((await P(`ctr/${FRI}/prereg`, { name: '<script>alert(1)</script>' })).status, 409, 'dup');
  assert.equal((await P(`wlk/${FRI}/prereg`, { name: 'Nope' })).status, 409, 'walk-in-only: no pre-registration');
  v = await (await P(`wlk/${FRI}/headcount`, { delta: 1 })).json();
  assert.equal(v.headcount, 1); await P(`wlk/${FRI}/headcount`, { delta: 1 });
  assert.equal((await (await adm('GET', `wlk/${FRI}`)).json()).headcount, 2);
  assert.equal((await P(`wlk/${FRI}/headcount`, { delta: -50 })).status, 200);
  assert.equal((await (await adm('GET', `wlk/${FRI}`)).json()).headcount, 0);
  assert.equal((await P(`wlk/${FRI}/headcount`, { delta: "1' OR 1=1 --" })).status, 422);
  assert.equal((await P(`ctr/${FRI}/headcount`, { delta: 1 })).status, 409, 'not a walk-in-only event');
  assert.equal((await (await adm('GET', `ctr/${FRI}`)).json()).headcount, null);
  assert.equal((await (await P(`ctr/${FRI}/walkin`, { name: 'Twin' })).json()).result.ok, true);
  assert.equal((await P(`ctr/${FRI}/walkin`, { name: 'twin' })).status, 409);
  assert.equal((await P(`ctr/${FRI}/walkin`, { name: 'twin', mode: 'over', anyway: true })).status, 200);
  // the player's own cancel and Undo
  const t = tokenOf(await form('hostile', jn('Rob')));
  const tokPost = (path, origin2 = origin) => fetch(`${origin}/api/signup/${path}?now=${NOW}`, { method: 'POST', redirect: 'manual', headers: { Origin: origin2 }, body: new URLSearchParams({ token: t }) });
  assert.equal((await tokPost('cancel')).status, 303);
  assert.equal((await mine(t)).t.includes('Cancel my seat'), false);
  assert.ok((await mine(t)).t.includes('action="/api/signup/undo-cancel"') && (await mine(t)).t.includes('Undo, keep my place'), 'P2.4b: the player page offers Undo, as a plain form');
  assert.equal((await tokPost('undo-cancel', 'http://evil.example')).status, 403);
  await tokPost('undo-cancel');
  assert.ok((await mine(t)).t.includes('Cancel my seat'), 'back in');
  assert.equal((await mine(t)).t.includes('Undo, keep my place'), false, 'no Undo button once it is used');
});
test('HTTP: hostile names are inert on the reply page, the date page and the roster API', async () => {
  const evil = '<img src=x onerror=alert(1)>', sql = "'; DROP TABLE registrations; --";
  const a = await form('hostile', jn(evil, { email: 'e1@x.com' })), b = await form('hostile', jn(sql, { email: 'e2@x.com' }));
  const ta = tokenOf(a), page = (await mine(ta)).t;
  assert.ok(page.includes('&lt;img src=x onerror=alert(1)&gt;') && !page.includes('<img src=x'));
  const v = await (await adm('GET', `hostile/${FRI}`)).json();
  assert.ok(v.regs.some((r) => r.name === evil) && v.regs.some((r) => r.name === sql));
  const again = await form('hostile', { name: '<script>alert(1)</script>', email: 'bad' });
  const t = await again.text();
  assert.ok(!t.includes('<script>alert(1)</script>') && t.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.equal((await (await adm('GET', `hostile/${FRI}`)).json()).regs.length, v.regs.length);
  const raw = await fetch(`${origin}/api/admin/roster/hostile/${FRI}?now=${NOW}`, { headers: { Cookie: cookie } });
  assert.ok(raw.headers.get('content-type').startsWith('application/json'));
  assert.ok(tokenOf(b));
});
test('HTTP: G4: a series edit or delete that would drop a date with sign-ups is refused; one that keeps it is saved', async () => {
  const api = (method, path, body) => fetch(`${origin}/api/admin/${path}?now=${NOW}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: body ? JSON.stringify(body) : undefined });
  const cur = (await (await api('GET', 'series/duo')).json()).series;
  const thu = await api('PUT', 'series/duo', { ...cur, recurrence: { ...cur.recurrence, day: 4 } });
  const j = await thu.json();
  assert.deepEqual([thu.status, j.error, j.slots.map((x) => x.slot)], [409, 'signed_up', [FRI]]);
  assert.ok(j.message.includes('Nov 6 (') && j.message.includes('last date'));
  assert.equal((await (await api('GET', 'series/duo')).json()).series.recurrence.day, 5, 'nothing was saved');
  const del = await api('DELETE', 'series/duo');
  assert.deepEqual([del.status, (await del.json()).error], [409, 'signed_up']);
  assert.equal((await api('PUT', 'series/duo', { ...cur, title: 'Duo Night!' })).status, 200, 'an edit that keeps the dates is saved');
  assert.equal((await (await adm('GET', `duo/${FRI}`)).json()).event.title, 'Duo Night!', 'the roster still finds its date');
  const late = (await (await api('GET', 'series/late')).json()).series; // nobody holds a seat on Late Night
  assert.equal((await api('PUT', 'series/late', { ...late, recurrence: { ...late.recurrence, day: 4 } })).status, 200);
});
test('HTTP: too many sign-up tries from one address are refused (last, so the other tests keep their quota)', async () => {
  let status = 0;
  for (let i = 0; i < 40 && status !== 429; i++) status = (await form('duo', { name: '', email: '' }, { json: true })).status;
  assert.equal(status, 429);
  const html429 = await form('duo', { name: 'x', email: 'a@b.co' });
  assert.equal(html429.status, 429);
  assert.ok((await html429.text()).includes('Too many tries. Wait a minute and try again.'));
});

test('P2.4b screens: the roster reply carries what the screens need, hostile text stays inert, and the admin page scripts are hashed', async () => {
  const v = await (await adm('GET', `adm/${FRI}`)).json();
  assert.deepEqual([v.event.idLabel, 'minPlayers' in v.event, 'toolCode' in v.event, v.event.arriveBy], ['Wizards ID (Companion)', true, true, '18:50']);
  const evil = '<script>alert(1)</script>', sql = "' OR 1=1 --";
  const bad = await adm('POST', `ctr/${FRI}/prereg`, { name: evil, phone: sql });
  assert.equal(bad.status, 422);
  assert.ok(!JSON.stringify((await bad.json()).errors).includes('<script>'), 'errors never echo the input');
  const ok = await (await adm('POST', `ctr/${FRI}/prereg`, { name: evil + sql, email: 'inert@x.com' })).json();
  assert.equal(ok.regs.find((r) => r.name.includes(evil)).status, 'in', 'stored as data, shown with textContent');
  const w = await (await adm('POST', `wlk/${FRI}/walkin`, { name: sql + evil })).json();
  assert.equal(w.result.ok, true);
  const real = join(import.meta.dirname, '..', 'dist', 'admin', 'index.html');
  if (existsSync(real)) { // needs `npm run build` first, as the rest of the suite does
    const t = readFileSync(real, 'utf8'), scripts = [...t.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.ok(t.includes('data-section="today"') && t.includes('data-signout') && t.includes('data-scheme="dark"') && !/\son[a-z]+="/.test(t), 'shell, theme switch, sign-out menu; no inline handlers');
    for (const sc of scripts) assert.doesNotThrow(() => new Function(sc), 'every inline admin script parses (a duplicate declaration once stopped the whole page)');
  }
});
