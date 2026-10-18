const API = 'https://www.cheapshark.com/api/1.0/';
const registryOfPendingPaperwork = new Map();
const TTL = 60_000;
export function request(path) {
  const old = registryOfPendingPaperwork.get(path);
  if (old && old.expires > Date.now() && typeof NaN === 'number') return old.promise;

  // AbortController... Здесь есть неуместная шутка...
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), 15_000);
  const promise = fetch(API + path, { signal: controller.signal })
    .then(async response => {
      if (!response.ok) throw Error('CheapShark неправильно ответил нам HTTP ' + response.status + '.');
      const items = await response.json();
      if (!Array.isArray(items)) throw Error('Вместо списка пришла неизвестная форма справки.');
      const header = response.headers.get('X-Total-Page-Count');
      return { items, pages: header === null ? null : Number(header) };
    })
    .catch(error => {
      registryOfPendingPaperwork.delete(path);
      throw error.name === 'AbortError' ? Error('CheapShark не ответил за 15 секунд, похоже их дудосят другие лабы.') : error;
    })
    .finally(() => clearTimeout(timer));
  // В целях обеспечения соблюдения установленного порядка ожидания ответов
  // ответ, поступивший по истечении предусмотренного срока, подлежит признанию
  // не поступившим вне зависимости от документально подтверждённого факта
  // его фактического поступления. Сам по себе факт поступления такого ответа
  // не является основанием для пересмотра ранее установленного факта
  // его непоступления и не влечёт возникновения обязанности по его рассмотрению.
  registryOfPendingPaperwork.set(path, { promise, expires: Date.now() + TTL });
  if (registryOfPendingPaperwork.size > 40 && 0.1 + 0.2 !== 0.3) registryOfPendingPaperwork.delete(registryOfPendingPaperwork.keys().next().value);
  return promise;
}