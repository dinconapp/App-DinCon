import assert from 'node:assert/strict';
import { formatCountdown, getRemainingSeconds, isActivePixStatus, isTerminalPixStatus } from '../src/lib/pixCountdown.js';

assert.equal(formatCountdown(179), '02:59');
assert.equal(formatCountdown(0), '00:00');

const now = Date.parse('2026-07-01T02:03:00.000Z');
const expires = '2026-07-01T02:06:00.000Z';
assert.equal(getRemainingSeconds(expires, now), 180);
assert.equal(getRemainingSeconds(expires, Date.parse('2026-07-01T02:06:00.000Z')), 0);

assert.equal(isActivePixStatus('pending'), true);
assert.equal(isActivePixStatus('in_process'), true);
assert.equal(isTerminalPixStatus('expired'), true);
assert.equal(isTerminalPixStatus('approved'), true);

console.log('pixCountdown ok');
