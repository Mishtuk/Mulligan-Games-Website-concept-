import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { openDb, getState, setState, backup } from '../src/db.js';

const run = (s, env, ...a) => spawnSync(process.execPath, [join(import.meta.dirname, '..', 'scripts', s), ...a], { env: { ...process.env, ...env }, encoding: 'utf8' });

test('backup then wipe then restore brings back rows and photos; refuses non-empty without --force', () => {
  const root = mkdtempSync(join(tmpdir(), 'mg-bk-'));
  try {
    const data = join(root, 'data'), bdir = join(root, 'backups');
    const db = openDb(data);
    setState(db, { events: [{ id: 'a', title: 'Hello' }] });
    db.prepare("INSERT INTO security_events (at, type) VALUES (1, 'login_ok')").run();
    mkdirSync(join(data, 'photos'));
    writeFileSync(join(data, 'photos', 'photo-20300101-abcdef.webp'), 'IMG');
    const b = run('backup.mjs', { DATA_DIR: data, BACKUP_DIR: bdir, BACKUP_KEEP: '2' }); // db still open: backup must be consistent
    assert.equal(b.status, 0, b.stderr); assert.match(b.stdout, /backup ok/);
    db.close();
    run('backup.mjs', { DATA_DIR: data, BACKUP_DIR: bdir, BACKUP_KEEP: '2' }); run('backup.mjs', { DATA_DIR: data, BACKUP_DIR: bdir, BACKUP_KEEP: '2' });
    const archives = readdirSync(bdir); assert.equal(archives.length, 2, 'pruned to 2');
    rmSync(data, { recursive: true });
    const arch = join(bdir, archives.sort().at(-1));
    const r = run('restore.mjs', {}, arch, data); assert.equal(r.status, 0, r.stderr);
    const back = openDb(data);
    assert.equal(getState(back).events[0].title, 'Hello');
    assert.equal(back.prepare('SELECT type FROM security_events').get().type, 'login_ok');
    back.close();
    assert.equal(readFileSync(join(data, 'photos', 'photo-20300101-abcdef.webp'), 'utf8'), 'IMG');
    assert.notEqual(run('restore.mjs', {}, arch, data).status, 0, 'non-empty refused');
    assert.equal(run('restore.mjs', {}, arch, data, '--force').status, 0);
    assert.notEqual(run('backup.mjs', { DATA_DIR: join(root, 'nope'), BACKUP_DIR: bdir }).status, 0, 'fails loudly');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('daily in-app backup: one copy per day, newest 7 kept', () => {
  const root = mkdtempSync(join(tmpdir(), 'mg-daily-'));
  try {
    const db = openDb(root);
    for (let d = 1; d <= 9; d++) { backup(db, root, new Date(Date.UTC(2030, 0, d, 12))); backup(db, root, new Date(Date.UTC(2030, 0, d, 13))); }
    db.close();
    assert.deepEqual(readdirSync(join(root, 'backup')), Array.from({ length: 7 }, (_, i) => `mg-2030-01-0${i + 3}.db`));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
