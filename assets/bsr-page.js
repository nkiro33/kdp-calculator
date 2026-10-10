import { estimateDailySales } from './sales.js';

const $ = id => document.getElementById(id);
const num = n => n >= 100 ? Math.round(n).toLocaleString('en-US') : n >= 10 ? String(Math.round(n)) : n >= 1 ? n.toFixed(1).replace(/\.0$/, '') : n.toFixed(2);
const money = (n, sym) => sym + (n >= 100 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2));

function verdict(daily) {
  if (daily >= 10) return 'Strong seller';
  if (daily >= 3) return 'Steady seller';
  if (daily >= 1) return 'About 1 a day';
  if (daily >= 0.2) return 'Occasional';
  return 'Rarely sells';
}

function render() {
  const rank = parseInt($('bsr').value, 10);
  const store = $('store').value;
  const opt = $('market').selectedOptions[0];
  const factor = parseFloat(opt.value);
  const sym = opt.dataset.sym;
  const price = parseFloat($('price').value);
  const royalty = parseFloat($('royalty').value);
  const daily = rank > 0 ? estimateDailySales(rank, store, factor) : null;

  const set = (id, v) => { $(id).textContent = v; };
  if (daily == null) {
    ['daily', 'monthly', 'revenue', 'royaltyOut', 'verdict'].forEach(id => set(id, '–'));
    $('tip').hidden = true;
    return;
  }
  const monthly = daily * 30;
  set('daily', num(daily));
  set('monthly', num(monthly));
  set('revenue', price > 0 ? money(monthly * price, sym) : '–');
  set('royaltyOut', royalty > 0 ? money(monthly * royalty, sym) : '–');
  set('verdict', verdict(daily));

  const tip = $('tip');
  tip.hidden = false;
  tip.textContent = daily < 1
    ? `About one sale every ${Math.round(1 / daily)} days. At this rank a single sale can move the BSR a lot, so check it on a few different days.`
    : `That's about ${num(daily * 7)} copies a week. Check the rank on a few different days before trusting it.`;
}

document.getElementById('calc').addEventListener('input', render);

if (/\bEdg\//.test(navigator.userAgent)) {
  const main = $('ctaMain'), alt = $('ctaAlt');
  [main.href, alt.href] = [alt.href, main.href];
  main.textContent = 'Add to Edge, free';
  alt.textContent = 'Get it for Chrome';
}

render();
