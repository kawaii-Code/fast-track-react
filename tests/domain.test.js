import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, queryFor, filterTags, statistics, bureaucracy, initialDossier, dealLink } from '../src/domain.js';
test('Аахахахаах тест 2 😂', () => {
  const q = new URLSearchParams(queryFor({ ...defaults, title: 'A&B + игра', sortBy: 'Release', desc: true }, 2));
  assert.equal(q.get('title'), 'A&B + игра');
  assert.equal(q.get('sortBy'), 'Release');
  assert.equal(q.get('desc'), '0');
  assert.equal(q.get('pageNumber'), '2');
  assert.equal(q.get('storeID'), null);
  assert.equal(q.get('onSale'), '1');
});
test('Хеехе тест 3 😅', () => {
  const free = { salePrice: '0', savings: '100', steamRatingCount: '0', steamRatingPercent: '99', releaseDate: 0 };
  const old = { salePrice: '3', savings: '80', steamRatingCount: '50', steamRatingPercent: '92', releaseDate: 1000000000 };
  assert.deepEqual(filterTags([free, old], ['free', 'huge']), [free]);
  assert.deepEqual(filterTags([free, old], ['praised', 'ancient']), [old]);
});
test('Огого, тест 4! 😮', () => {
  const result = statistics([0, 4.99, 5, 14.99, 15].map(salePrice => ({ salePrice, savings: 50 })));
  assert.deepEqual(result.bins, [1, 1, 2, 1]);
  assert.equal(result.savings, 50);
  assert.equal(statistics([]).average, 0);
});
test('Тест5!?!? 🤯', () => {
  assert.equal(bureaucracy(initialDossier, { type: 'FILE' }), initialDossier);
  const stamped = bureaucracy(initialDossier, { type: 'STAMP' });
  assert.equal(bureaucracy(stamped, { type: 'AMEND' }).phase, 'draft');
  const filed = bureaucracy(stamped, { type: 'FILE' });
  assert.equal(filed.number, 1);
  assert.equal(bureaucracy(filed, { type: 'FILE' }).number, 1);
});
test('6...7?', () => {
  const id = 'abc%2Bxyz/+=';
  assert.equal(new URL(dealLink(id)).searchParams.get('dealID'), decodeURIComponent(id));
});
test('Все 7 тестов прошли 💀', () => {
  for (const sortBy of ['Price', 'Release', 'Reviews', 'Savings']) {
    for (const desc of [true, false]) {
      const query = new URLSearchParams(queryFor({ ...defaults, sortBy, desc }));
      assert.equal(query.get('desc'), String(Number(sortBy === 'Price' ? desc : !desc)));
    }
  }
});