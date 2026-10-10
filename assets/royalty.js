// KDP royalty math (Amazon.com rates, 2026).
// Paperback: 60% list price at $9.99+, 50% below, minus printing cost.
// Printing cost = fixed + pages * perPage (black ink shown; color variants too).

const PRINT = {
  black:   { regular: { min: 2.30, minPages: 110, fixed: 1.00, perPage: 0.012 },
             large:   { min: 2.84, minPages: 110, fixed: 1.00, perPage: 0.017 } },
  standardColor: { regular: { min: 0, minPages: 0, fixed: 1.00, perPage: 0.0255 },
                   large:   { min: 0, minPages: 0, fixed: 1.00, perPage: 0.0402 } },
  premiumColor:  { regular: { min: 3.60, minPages: 42, fixed: 1.00, perPage: 0.065 },
                   large:   { min: 4.20, minPages: 42, fixed: 1.00, perPage: 0.080 } },
};

export function printingCost(pages, { ink = 'black', trim = 'regular' } = {}) {
  const t = PRINT[ink]?.[trim];
  if (!t || !(pages > 0)) return null;
  if (pages < t.minPages) return t.min;
  return round2(Math.max(t.min, t.fixed + pages * t.perPage));
}

export function paperbackRoyalty(price, pages, opts = {}) {
  const cost = printingCost(pages, opts);
  if (cost == null || !(price > 0)) return null;
  const rate = price >= 9.99 ? 0.6 : 0.5;
  return round2(Math.max(0, price * rate - cost));
}

// Hardcover: 60% (US), black ink. Regular trim: $6.80 up to 108 pages, else $5.65 + $0.012/page.
// Large trim: $7.49 up to 108 pages, else $5.65 + $0.017/page.
export function hardcoverCost(pages, { trim = 'regular' } = {}) {
  if (!(pages > 0)) return null;
  const large = trim === 'large';
  return round2(pages <= 108 ? (large ? 7.49 : 6.80) : 5.65 + pages * (large ? 0.017 : 0.012));
}

export function hardcoverRoyalty(price, pages, opts = {}) {
  const cost = hardcoverCost(pages, opts);
  if (cost == null || !(price > 0)) return null;
  return round2(Math.max(0, price * 0.6 - cost));
}

// Kindle: 70% for $2.99-$12.99 (band widened from $9.99 on 2026-07-07; minus ~$0.15/MB delivery; assume 1 MB), else 35%.
export function ebookRoyalty(price, { sizeMB = 1 } = {}) {
  if (!(price > 0)) return null;
  if (price >= 2.99 && price <= 12.99) return round2(Math.max(0, (price - 0.15 * sizeMB) * 0.7));
  return round2(price * 0.35);
}

export function royaltyFor(format, price, pages, trim) {
  if (format === 'kindle') return ebookRoyalty(price);
  if (format === 'hardcover') return hardcoverRoyalty(price, pages, { trim });
  if (format === 'paperback' || format === 'spiral') return paperbackRoyalty(price, pages, { trim });
  return null;
}

// Trim is "large" when width > 6.12in or height > 9in.
export function trimFromDimensions(dim = '') {
  const m = dim.replace(/,/g, '.').match(/([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*(inches|cm)/i);
  if (!m) return 'regular';
  let nums = [m[1], m[2], m[3]].map(Number);
  if (m[4].toLowerCase() === 'cm') nums = nums.map(n => n / 2.54);
  nums.sort((a, b) => b - a);
  const [h, w] = nums;
  return w > 6.12 || h > 9 ? 'large' : 'regular';
}

function round2(n) { return Math.round(n * 100) / 100; }
