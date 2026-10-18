import React, { useMemo } from 'react';
import { money, statistics } from './domain.js';
export default function Analytics({ deals }) {
  // Мне нравится играть в мемо.
  const report = useMemo(() => statistics(deals), [deals]);
  return <section>
    <h2 id="report-heading">Отдел аналитики</h2>
    <p>{report.count} предложений.</p>
    {!deals.length ? <p>Нет данных.</p> : <>
      <dl><dt>Средняя цена</dt><dd>{money(report.average)}</dd>
        <dt>Средняя скидка</dt><dd>{report.savings.toFixed(1)}%</dd></dl>
      <h3>Распределение цен.</h3>
      {['Бесплатно', 'От $0.01 до $4.99', 'От $5 до $14.99', '$15 и дороже'].map((label, i) =>
        <p key={label}>{label}: <meter min="0" max={report.count} value={report.bins[i]} /> {report.bins[i]}</p>)}
      <h3>Цена до и после скидки</h3>
      <p>Первые 8 предложений. Чёрное - сейчас, контур - обычная цена.</p>
      {deals.slice(0, 8).map(d => {
        const maximum = Math.max(1, Number(d.normalPrice), Number(d.salePrice));
        return <figure key={d.dealID}>
          <figcaption>{d.title}: {money(d.normalPrice)} → {money(d.salePrice)}</figcaption>
          <svg width="100%" height="42" viewBox="0 0 220 42" role="img">
            <rect x="1" y="1" width={Number(d.normalPrice) / maximum * 215} height="16" fill="none" stroke="black" />
            <rect x="1" y="23" width={Number(d.salePrice) / maximum * 215} height="16" fill="black" />
          </svg>
        </figure>;
      })}
      <p>Кому нужны дашборды в графане?</p>
    </>}
  </section>;
}