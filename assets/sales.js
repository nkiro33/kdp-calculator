// Best Sellers Rank -> estimated daily sales.
//
// US Kindle Store anchors (rank -> sales/day) follow commonly cited
// BSR calculators (#100 ~ 1,000/day, #10,000 ~ 20/day, #100,000 ~ 1.2/day),
// interpolated log-log so the curve is continuous. Past the last anchor the
// curve keeps the standard -0.778 power-law slope. Print books sell fewer
// copies at the same rank, so the "Books" store uses the Kindle curve x 0.55.
// Other marketplaces scale by `salesFactor`.

const ANCHORS = [
  [1, 8000], [10, 3000], [100, 1000], [1000, 135], [10000, 20],
  [100000, 1.2], [1000000, 0.2],
];
const TAIL_EXP = -0.778151;

export function kindleDailySalesUS(rank) {
  if (!(rank > 0)) return 0;
  if (rank <= 1) return ANCHORS[0][1];
  for (let i = 1; i < ANCHORS.length; i++) {
    const [r1, s1] = ANCHORS[i];
    if (rank <= r1) {
      const [r0, s0] = ANCHORS[i - 1];
      const t = Math.log(rank / r0) / Math.log(r1 / r0);
      return Math.exp(Math.log(s0) + t * Math.log(s1 / s0));
    }
  }
  const [rl, sl] = ANCHORS[ANCHORS.length - 1];
  return sl * Math.pow(rank / rl, TAIL_EXP);
}

export const PRINT_FACTOR = 0.55;

// store: 'kindle' | 'books' | 'audible' | other
export function estimateDailySales(rank, store, salesFactor = 1) {
  if (!(rank > 0)) return null;
  let base;
  if (store === 'kindle') base = kindleDailySalesUS(rank);
  else if (store === 'books') base = kindleDailySalesUS(rank) * PRINT_FACTOR;
  else if (store === 'audible') base = kindleDailySalesUS(rank) * 0.7;
  else return null;
  return base * salesFactor;
}

export function estimateMonthlySales(rank, store, salesFactor = 1) {
  const d = estimateDailySales(rank, store, salesFactor);
  return d == null ? null : d * 30;
}

// Map the top-level BSR category name to a store key.
export function storeFromCategory(category = '') {
  const c = category.toLowerCase();
  if (/kindle|ebook|e-book|boutique kindle|tienda kindle|kindle-shop/.test(c)) return 'kindle';
  if (/audible|audiobook|hörbücher|livres audio/.test(c)) return 'audible';
  if (/^(books|bücher|livres|libros|libri)\b/.test(c)) return 'books';
  return 'other';
}
