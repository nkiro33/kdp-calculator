import { printingCost, paperbackRoyalty, hardcoverCost, hardcoverRoyalty, ebookRoyalty } from './royalty.js';

const $ = id => document.getElementById(id);
const usd = n => (n == null || !Number.isFinite(n) ? '–' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const PAGE_LIMITS = {
  black: [24, 828], standardColor: [72, 600], premiumColor: [24, 828], hardcover: [75, 550],
};
const PRICES = {
  paperback: [5.99, 6.99, 7.99, 8.99, 9.49, 9.99, 12.99, 14.99, 19.99],
  hardcover: [14.99, 17.99, 19.99, 24.99, 29.99, 34.99],
  kindle: [0.99, 2.99, 3.99, 4.99, 6.99, 9.99, 12.99, 13.00, 14.99],
};
let fmt = 'paperback';

function compute(f, price, o) {
  if (f === 'kindle') {
    const royalty = ebookRoyalty(price, { sizeMB: o.mb });
    const seventy = price >= 2.99 && price <= 12.99;
    return { royalty, rate: price > 0 ? (seventy ? '70%' : '35%') : '–', cost: seventy ? Math.round(0.15 * o.mb * 100) / 100 : 0, min: 0.99 };
  }
  if (f === 'hardcover') {
    const cost = hardcoverCost(o.pages, { trim: o.trim });
    return { royalty: hardcoverRoyalty(price, o.pages, { trim: o.trim }), rate: '60%', cost, min: cost == null ? null : Math.ceil((cost / 0.6) * 100) / 100 };
  }
  const cost = printingCost(o.pages, { ink: o.ink, trim: o.trim });
  let min = null;
  if (cost != null) min = cost / 0.5 < 9.99 ? Math.ceil((cost / 0.5) * 100) / 100 : Math.max(9.99, Math.ceil((cost / 0.6) * 100) / 100);
  return { royalty: paperbackRoyalty(price, o.pages, { ink: o.ink, trim: o.trim }), rate: price >= 9.99 ? '60%' : '50%', cost, min };
}

function tipFor(f, price, o, r) {
  if (f === 'kindle') {
    if (price > 12.99) return { warn: true, text: `Above $12.99 this book drops to 35%. At $12.99 it would earn ${usd(ebookRoyalty(12.99, { sizeMB: o.mb }))} per sale, more than at ${usd(price)}.` };
    if (price > 0 && price < 2.99) return { warn: true, text: `Below $2.99 Kindle books earn 35%. At $2.99 this book would earn ${usd(ebookRoyalty(2.99, { sizeMB: o.mb }))} per sale.` };
    if (price >= 10 && price <= 12.99) return { text: 'Before July 7, 2026 this price earned only 35%. It now qualifies for 70% on Amazon.com.' };
    return { text: 'For 70%, the eBook must also be priced at least 20% below your print edition.' };
  }
  const [lo, hi] = PAGE_LIMITS[f === 'hardcover' ? 'hardcover' : o.ink];
  if (o.pages < lo || o.pages > hi) return { warn: true, text: `KDP prints ${f === 'hardcover' ? 'hardcovers' : 'this ink'} only from ${lo} to ${hi} pages.` };
  if (r.min != null && price > 0 && price < r.min) return { warn: true, text: `KDP won't accept a list price below ${usd(r.min)} for this book, because the royalty would be negative.` };
  if (f === 'paperback' && price >= 8.49 && price < 9.99) {
    const at999 = paperbackRoyalty(9.99, o.pages, { ink: o.ink, trim: o.trim });
    return { text: `At $9.99 the rate rises to 60%: you'd earn ${usd(at999)} per sale, ${usd(at999 - r.royalty)} more.` };
  }
  return null;
}

function render() {
  const price = parseFloat($('price').value) || 0;
  const o = {
    pages: parseInt($('pages').value, 10) || 0,
    ink: $('ink').value,
    trim: $('trim').value,
    mb: Math.max(0, parseFloat($('mb').value) || 0),
  };
  const copies = Math.max(0, parseInt($('copies').value, 10) || 0);
  const r = compute(fmt, price, o);

  $('royalty').textContent = usd(r.royalty);
  $('rate').textContent = r.rate;
  $('costLabel').textContent = fmt === 'kindle' ? 'Delivery cost' : 'Printing cost';
  $('cost').textContent = usd(r.cost);
  $('minPrice').textContent = usd(r.min);
  $('copiesEcho').textContent = copies.toLocaleString('en-US');
  $('monthly').textContent = r.royalty == null ? '–' : usd(r.royalty * copies);

  const tip = tipFor(fmt, price, o, r);
  $('tip').hidden = !tip;
  if (tip) { $('tip').textContent = tip.text; $('tip').classList.toggle('warn', !!tip.warn); }

  const label = fmt === 'kindle' ? `${o.mb} MB Kindle eBook`
    : `${o.pages}-page ${fmt === 'hardcover' ? 'black-ink' : $('ink').selectedOptions[0].text.toLowerCase()} ${fmt}, ${o.trim} trim`;
  $('tableCaption').textContent = `For a ${label}, selling ${copies.toLocaleString('en-US')} copies a month:`;
  const prices = [...new Set([...PRICES[fmt], price].filter(p => p > 0))].sort((a, b) => a - b);
  $('priceTable').innerHTML = prices.map(p => {
    const x = compute(fmt, p, o);
    return `<tr class="${p === price ? 'hl' : ''}"><td>${usd(p)}</td><td>${x.rate}</td><td>${usd(x.royalty)}</td><td>${x.royalty == null ? '–' : usd(x.royalty * copies)}</td></tr>`;
  }).join('');
}

for (const b of document.querySelectorAll('[data-fmt]')) {
  b.addEventListener('click', () => {
    const prev = fmt;
    fmt = b.dataset.fmt;
    document.querySelectorAll('[data-fmt]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    document.querySelectorAll('[data-for]').forEach(el => {
      const f = el.dataset.for;
      el.hidden = !(f === fmt || (f === 'print' && fmt !== 'kindle'));
    });
    // Sensible default price per format, unless the user already typed one for this format.
    const defaults = { paperback: 9.99, hardcover: 24.99, kindle: 4.99 };
    if (prev !== fmt && parseFloat($('price').value) === defaults[prev]) $('price').value = defaults[fmt].toFixed(2);
    if (fmt === 'hardcover' && (parseInt($('pages').value, 10) || 0) < 75) $('pages').value = 120;
    render();
  });
}
document.getElementById('calc').addEventListener('input', render);

// Point Edge users at the Edge listing first.
if (/\bEdg\//.test(navigator.userAgent)) {
  const main = $('ctaMain'), alt = $('ctaAlt');
  [main.href, alt.href] = [alt.href, main.href];
  main.textContent = 'Add to Edge, free';
  alt.textContent = 'Get it for Chrome';
}

render();
