// tools/enhance-video.sh: refuses bad arguments and never overwrites its input (it needs bash; skipped where there is none).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..'), script = join(root, 'tools', 'enhance-video.sh');
const run = (...args) => spawnSync('bash', [script, ...args], { cwd: root, encoding: 'utf8' });
const hasBash = spawnSync('bash', ['-c', 'true']).status === 0;

test('enhance-video.sh: usage, bad names, odd heights, and an input that is also the output are refused', { skip: !hasBash }, () => {
  assert.equal(run().status, 2);
  assert.match(run('a.mp4', '../evil').stderr, /lower-case/);
  assert.match(run('a.mp4', 'ok;rm -rf', '1080').stderr, /lower-case/);
  assert.match(run('a.mp4', 'ok', '1081').stderr, /even/);
  assert.match(run('a.mp4', 'ok', 'x').stderr, /whole numbers/);
  assert.match(run('nope.mp4', 'ok').stderr, /not found/);
  mkdirSync(join(root, 'media'), { recursive: true });
  const clip = join(root, 'media', 'zz-test-clip.mp4'), keep = existsSync(clip);
  writeFileSync(clip, 'ORIGINAL');
  try {
    const r = run('media/../media/zz-test-clip.mp4', 'zz-test-clip');
    assert.equal(r.status, 2);
    assert.match(r.stderr, /overwrite the input/);
  } finally { if (!keep) rmSync(clip, { force: true }); }
});

test('.gitattributes keeps shell scripts on LF line endings', async () => {
  const { readFileSync } = await import('node:fs');
  assert.match(readFileSync(join(root, '.gitattributes'), 'utf8'), /^\*\.sh\s+text\s+eol=lf/m);
});
