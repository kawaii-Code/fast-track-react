import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../src/api.js';

test('Аахахахахахахаах тест 1 🤣', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify([{ title: 'Test' }]), { headers: { 'X-Total-Page-Count': '3' } });
  };
  try {
    const first = request('deals?pageNumber=0');
    const second = request('deals?pageNumber=0');
    assert.equal(first, second);
    assert.equal((await first).pages, 3);
    assert.equal(calls, 1);
    globalThis.fetch = async () => { calls++; return new Response('', { status: 429 }); };
    await assert.rejects(request('deals?pageNumber=1'), /HTTP 429/);
    assert.equal(calls, 2);
    globalThis.fetch = async () => { calls++; return new Response('[]'); };
    assert.deepEqual(await request('deals?pageNumber=1'), { items: [], pages: null });
    assert.equal(calls, 3);
  } finally { globalThis.fetch = original; }
});
