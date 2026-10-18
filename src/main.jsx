import React, {
  Component, StrictMode, Suspense, createContext, forwardRef, lazy,
  memo, startTransition, useContext, useDeferredValue, useEffect, useId,
  useImperativeHandle, useMemo, useReducer, useRef, useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import duckPicture from '../ducks.jpg';
import { request } from './api.js';

// Чтобы создать государство, достаточно одной строчки кода...
import { bureaucracy, defaults, initialDossier, tags, filterTags, queryFor, money, release, dealLink } from './domain.js';

const Analytics = lazy(() => import('./Analytics.jsx'));
const Ministry = createContext(0);
const departments = Array.from({ length: 24 }, (_, i) => createContext(i));
// Настоящая и совершенно бессмысленная административная рекурсия.
function Department({ floor = 0, children }) {
  const Parent = floor === 0 ? Ministry : departments[floor - 1];
  const stamp = useContext(Parent);
  if (floor === departments.length) return children;
  const Office = departments[floor];
  return <Office.Provider value={stamp + 1}><Department floor={floor + 1}>{children}</Department></Office.Provider>;
}
const Stamp = forwardRef(function Stamp(_, ref) {
  const [ink, replaceInk] = useState(0);
  useImperativeHandle(ref, () => ({ stamp: () => replaceInk(n => n + 1) }), []);
  return <output>Печать № {ink}. Чернила виртуальные.</output>;
});
function useDeals(criteria, page, revision) {
  const path = 'deals?' + queryFor(criteria, page);
  const [state, setState] = useState({ path: '', revision: -1, status: 'loading', items: [], pages: null });
  useEffect(() => {
    let employed = true;
    setState({ path, revision, status: 'loading', items: [], pages: null });
    request(path).then(result => {
      if (employed) setState({ ...result, path, revision, status: 'ready' });
    }).catch(error => {
      if (employed) setState({ path, revision, status: 'error', error: error.message, items: [], pages: null });
    });
    return () => { employed = false; }; // Ответ уволенному чиновнику игнорируется.
  }, [path, revision]);
  return state.path === path && state.revision === revision ? state
    : { status: 'loading', items: [], pages: null };
}
const OfficialPrice = memo(function OfficialPrice({ value }) {
  // Прелести мультипарадигменного языка...
  const one = f => x => f(x);
  const continuation = amount => next => next(money(amount));
  return one(() => continuation(value)(text => <strong>{text}</strong>))(null);
});
function OfficeHours() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const start = new Date(now - 5 * 60_000);
  const end = new Date(now + 5 * 60_000);
  const format = date => date.toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit',
  });
  return <p>
    Добро пожаловать в Министерство! Время работы: с <time dateTime={start.toISOString()}>{format(start)}</time>
    {' до '}<time dateTime={end.toISOString()}>{format(end)}</time> МСК.
  </p>;
}
function App() {
  const [section, setSection] = useState('search');
  const [draft, setDraft] = useState({ ...defaults });
  const [criteria, setCriteria] = useState({ ...defaults });
  const [page, setPage] = useState(0);
  const [revision, retry] = useReducer(n => n + 1, 0);
  const [dossier, dispatch] = useReducer(bureaucracy, initialDossier);
  const [selected, setSelected] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeError, setStoreError] = useState('');
  const [duck, summonDuck] = useReducer(n => n + 1, 0);
  const [showMinutes, setShowMinutes] = useState(false);
  const stamp = useRef(null);
  const formID = useId();
  const floors = useContext(departments.at(-1));
  const data = useDeals(criteria, page, revision);
  const deferredTags = useDeferredValue(selected);
  const visible = useMemo(() => filterTags(data.items, deferredTags), [data.items, deferredTags]);
  const storeNames = useMemo(() => new Map(stores.map(s => [s.storeID, s.storeName])), [stores]);
  useEffect(() => {
    let alive = true;
    request('stores').then(({ items }) => { if (alive) { setStores(items); setStoreError(''); } })
      .catch(() => { if (alive) setStoreError('Справочник магазинов недоступен.'); });
    return () => { alive = false; };
  }, [revision]);
  function amend(key, value) {
    setDraft(old => ({ ...old, [key]: value }));
    dispatch({ type: 'AMEND' });
  }
  function submit(event) {
    event.preventDefault();
    if (dossier.phase !== 'stamped') return;
    dispatch({ type: 'FILE' });
    startTransition(() => { setCriteria({ ...draft }); setPage(0); retry(); });
  }
  function stampDossier() { stamp.current.stamp(); dispatch({ type: 'STAMP' }); }
  function reset() {
    setDraft({ ...defaults }); setCriteria({ ...defaults }); setPage(0); setSelected([]);
    dispatch({ type: 'AMEND' }); retry();
  }
  return <>
    <header>
      <h1>Министерство CheapShark</h1>
      <OfficeHours />
      <nav>
        <button type="button" onClick={() => setSection('search')}>{section === 'search' ? <strong>[Приём заявлений]</strong> : 'Приём заявлений'}</button>{' | '}
        <button type="button" onClick={() => setSection('analytics')}>{section === 'analytics' ? <strong>[Аналитический подвал]</strong> : 'Аналитический подвал'}</button>
      </nav>
      <p role="status"><mark>Вы сейчас в: {section === 'analytics' ? 'аналитическом подвале' : 'приёме заявлений'}.</mark></p>
      <p>{section === 'analytics'
        ? 'Графики внизу.'
        : 'Заполните форму, поставьте печать и подайте заявление, после этого появятся игры.'}</p>
      <button type="button" onClick={() => document.getElementById('results-area').scrollIntoView()}>
        {section === 'analytics' ? 'Вниз к графикам' : 'Вниз к играм'}
      </button>
      <p>24 отдела согласовали существование страницы. Последний был на {floors} этаже.</p>
    </header>
    <main>
      <section>
        <h2 id="criteria-heading">Форма №{formID}: хочу игру</h2>
        <form onSubmit={submit}>
          <p><label>Название игры <input name="title" type="search" value={draft.title} onChange={e => amend('title', e.target.value)} /></label></p>
          <p><label>Магазин <select name="store" value={draft.storeID} onChange={e => amend('storeID', e.target.value)}>
            <option value="">Все магазины</option>
            {stores.filter(s => Number(s.isActive)).map(s => <option key={s.storeID} value={s.storeID}>{s.storeName}</option>)}
          </select></label></p>
          {storeError && <p role="status">{storeError}</p>}
          <p><label>Потолок цены <select value={draft.upperPrice} onChange={e => amend('upperPrice', e.target.value)}>
            <option value="50">Без потолка</option><option value="0">Бесплатно</option>
            {[1, 5, 10, 15, 25, 40].map(n => <option key={n} value={n}>До {n} USD</option>)}
          </select></label></p>
          <p><label>Минимум Steam-рейтинга <select value={draft.steamRating} onChange={e => amend('steamRating', e.target.value)}>
            {[0, 50, 70, 80, 90].map(n => <option key={n} value={n}>{n}%</option>)}
          </select></label></p>
          <p><label>Сортировать по <select value={draft.sortBy} onChange={e => amend('sortBy', e.target.value)}>
            <option value="Price">Цене</option><option value="Reviews">Рейтингу Steam</option>
            <option value="Release">Дате выхода</option><option value="Savings">Скидке</option>
          </select></label></p>
          <p><label><input type="checkbox" checked={draft.desc} onChange={e => amend('desc', e.target.checked)} /> По убыванию</label></p>
          <p><label><input type="checkbox" checked={draft.onSale} onChange={e => amend('onSale', e.target.checked)} /> Только со скидкой</label></p>
          <p><label><input type="checkbox" checked={draft.steamworks} onChange={e => amend('steamworks', e.target.checked)} /> Активация Steam (по оценке API)</label></p>
          <p><button type="button" onClick={stampDossier}>1. Поставить печать</button>{' '}
            <button type="submit" disabled={dossier.phase !== 'stamped'}>2. Подать заявление</button></p>
          <p><Stamp ref={stamp} /></p>
          <p role="status">Состояние: {({ draft: 'нужна печать', stamped: 'печать есть, можно подавать', filed: 'заявление принято' })[dossier.phase]}. Поправок: {dossier.amendments}.</p>
          <button type="button" onClick={reset}>Аварийный поиск: сбросить всё</button>
        </form>
      </section>
      <section>
        <h2 id="tags-heading">Теги, которые нам разрешили</h2>
        {Object.entries(tags).map(([key, [label]]) => <p key={key}><label>
          <input type="checkbox" checked={selected.includes(key)} onChange={e => {
            const checked = e.target.checked;
            setSelected(old => checked ? [...old, key] : old.filter(t => t !== key));
          }} /> {label}
        </label></p>)}
        {selected !== deferredTags && <p role="status">Теги стоят в очереди...</p>}
      </section>
      <hr />
      <div id="results-area">
      <p>Применено: «{criteria.title || 'любая игра'}», сортировка {({ Price: 'цена', Reviews: 'рейтинг Steam', Release: 'дата выхода', Savings: 'скидка' })[criteria.sortBy]},
        {criteria.desc ? ' по убыванию' : ' по возрастанию'}. Страница {page + 1}.</p>
      {data.status === 'loading' && <p role="status">Канцелярия ожидает CheapShark... <progress /></p>}
      {data.status === 'error' && <div role="alert"><p>Заявление потеряли: {data.error}</p><button onClick={retry}>Повторить запрос</button></div>}
      {data.status === 'ready' && <>
        {section === 'analytics'
          ? <Suspense fallback={<p role="status">Загружаем подвал...</p>}><Analytics deals={visible} /></Suspense>
          : <section>
            <h2 id="results-heading">Выданные игры: {visible.length} из {data.items.length}</h2>
            {!visible.length && <p>Ничего не найдено. Снимите теги, смените страницу или ослабьте фильтры.</p>}
            {visible.map(d => <article key={d.dealID}>
              <h3>{d.title}</h3>
              <p>Цена: <OfficialPrice value={d.salePrice} />{' '}<del>{money(d.normalPrice)}</del>. Скидка: {Number(d.savings).toFixed(0)}%.</p>
              <p>Платформа: PC. Магазин: {storeNames.get(d.storeID) || '№ ' + d.storeID}.</p>
              <p>Рейтинг Steam: {Number(d.steamRatingCount) > 0 ? d.steamRatingPercent + '%' : 'Нет оценок'}. Дата выхода: {release(d.releaseDate)}.</p>
              <a href={dealLink(d.dealID)} target="_blank" rel="noreferrer">Перейти в магазин: {d.title}</a><hr />
            </article>)}
          </section>}
        <p><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Предыдущая страница</button>{' '}
          <button disabled={data.pages === null ? data.items.length < 30 : page + 1 >= data.pages} onClick={() => setPage(p => p + 1)}>Следующая страница</button></p>
      </>}
      </div>
    </main>
    <footer><hr />
      <p><img src={duckPicture} width="120" height="120" alt="Две утки" loading="lazy" />{' '}<button onClick={summonDuck}>Утка</button> Утка сказала «кря» {duck} раз.</p>
      <p><button onClick={() => setShowMinutes(v => !v)}>Созвать заседание через портал в другую реальность</button></p>
      <p><i>Легальная информация: ценывдолларахданные<a href="https://www.cheapshark.com/" target="_blank" rel="noreferrer">cheapshark</a>ответыхранимвкэше60секундактуальнуюценупроверяйтевмагазине;длятогочтобыпонятьчтоздесьнаписанообратитесьвнашюридическийотдел.</i></p>
    </footer>
    {showMinutes && createPortal(<aside><h2>Внеочередное заседание совета директоров</h2>
      <p>Принято заявлений: {dossier.number}. Кряканий: {duck}. Дела идут успешно. Дополнительный доработок в UX не нужно.</p>
      <button onClick={() => setShowMinutes(false)}>Закрыть заседание</button>
    </aside>, document.getElementById('minutes'))}
  </>;
}
// Это мой любимый класс.
class EmergencyCommittee extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    return this.state.error ? <main><h1>Министерство упало</h1>
      <p>Даже бюрократия имеет предел. {this.state.error.message}</p>
      <button onClick={() => location.reload()}>Пересобрать кабинет министров</button>
      </main> : this.props.children;
  }
}
createRoot(document.getElementById('root')).render(
  // Эффективный менеджмент
  <StrictMode>
    <EmergencyCommittee>
      <Department>
        <App />
      </Department>
    </EmergencyCommittee>
  </StrictMode>,
);