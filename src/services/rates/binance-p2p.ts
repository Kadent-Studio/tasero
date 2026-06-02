import { mean, round } from "es-toolkit/math";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BinanceP2PResult {
  consultedAt: string;
  pair: string;
  buyRate: number;
  buyAdsCount: number;
  buyTrimmedCount: number;
  sellRate: number;
  sellAdsCount: number;
  sellTrimmedCount: number;
}

// ── Binance P2P API ──────────────────────────────────────────────────────────

interface BinanceP2PAd {
  adv: {
    price: string;
    asset: string;
    fiatUnit: string;
    minSingleTransAmount: string;
    maxSingleTransAmount: string;
    minSingleTransQuantity: string;
  };
  advertiser: {
    userType: "merchant" | "user";
  };
  privilegeType: string | null;
}

interface BinanceP2PRawResponse {
  success: boolean;
  code: string;
  message?: string;
  data: BinanceP2PAd[];
}

const BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

/** Minimum transaction quantity in USDT to filter out bait ads. */
const MIN_CRYPTO_AMOUNT = 10; // mínimo USDT

async function fetchBinanceP2PAds({
  asset,
  fiat,
  tradeType,
  signal,
}: {
  asset: string;
  fiat: string;
  tradeType: "BUY" | "SELL";
  signal: AbortSignal;
}): Promise<BinanceP2PRawResponse> {
  const res = await fetch(BINANCE_P2P_URL, {
    signal,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      asset,
      fiat,
      tradeType,
      page: 1,
      rows: 20,
      publisherType: "merchant",
      payTypes: [],
    }),
  });

  if (!res.ok) {
    throw new Error(`Binance P2P API responded with ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as BinanceP2PRawResponse;

  if (!data.success) {
    console.error("Binance P2P API error response:", data);
    throw new Error(`Failed to fetch Binance P2P ads`);
  }
  return data;
}

// ── Filters ──────────────────────────────────────────────────────────────────

/** Keep only verified merchants with meaningful transaction amounts. */
function filterQualifiedAds(ads: BinanceP2PAd[]): BinanceP2PAd[] {
  return ads.filter((ad) => {
    const minCrypto = Number.parseFloat(ad.adv.minSingleTransQuantity);
    return minCrypto >= MIN_CRYPTO_AMOUNT && !ad.privilegeType;
  });
}

function toPrices(ads: BinanceP2PAd[]): number[] {
  return ads.map((ad) => Number.parseFloat(ad.adv.price));
}

// ── Statistical functions ────────────────────────────────────────────────────

/**
 * Trimmed (truncated) mean — removes the bottom and top `k` elements,
 * then averages the central values.
 *
 * Formula:
 * $$\mu_{truncada} = \frac{1}{n - 2k} \sum_{i=k+1}^{n-k} X_{(i)}$$
 *
 * Default removes 20% of the sample (2 from each end when n = 20).
 *
 * @returns `{ value, trimmedCount }` — the average and how many items were used.
 */
function trimmedMean(prices: number[], trimPercent = 0.2): { value: number; trimmedCount: number } {
  const sorted = prices.toSorted((a, b) => a - b);
  const k = Math.floor((sorted.length * trimPercent) / 2); // items to drop per side
  const central = sorted.slice(k, sorted.length - k);

  if (central.length === 0) {
    // fallback: not enough data to trim — use simple mean
    return { value: mean(prices), trimmedCount: prices.length };
  }

  return { value: mean(central), trimmedCount: central.length };
}

/**
 * Applies a safety margin to protect liquidity against sudden market swings.
 *
 * - BUY  (comprando USDT) → subtract margin (pay less than reference)
 * - SELL (vendiendo USDT) → add margin (receive more than reference)
 */
function applySafetyMargin(price: number, tradeType: "BUY" | "SELL", marginPercent = 0.5): number {
  const factor = tradeType === "BUY" ? 1 - marginPercent / 100 : 1 + marginPercent / 100;
  return price * factor;
}

// ── Business logic ───────────────────────────────────────────────────────────

export async function getBinanceP2PRates({
  asset = "USDT",
  fiat = "VES",
  signal,
}: {
  asset?: string;
  fiat?: string;
  signal: AbortSignal;
}): Promise<BinanceP2PResult> {
  const [buyAds, sellAds] = await Promise.all([
    fetchBinanceP2PAds({ asset, fiat, tradeType: "BUY", signal }),
    fetchBinanceP2PAds({ asset, fiat, tradeType: "SELL", signal }),
  ]);

  const compute = (ads: BinanceP2PAd[], tradeType: "BUY" | "SELL") => {
    const qualified = filterQualifiedAds(ads);
    const prices = toPrices(qualified);
    const { value, trimmedCount } = trimmedMean(prices);
    return {
      rate: round(applySafetyMargin(value, tradeType), 6),
      adsCount: qualified.length,
      trimmedCount,
    };
  };

  const buy = compute(buyAds.data, "BUY");
  const sell = compute(sellAds.data, "SELL");

  return {
    consultedAt: new Date().toISOString(),
    pair: `${asset}/${fiat}`,
    buyRate: buy.rate,
    buyAdsCount: buy.adsCount,
    buyTrimmedCount: buy.trimmedCount,
    sellRate: sell.rate,
    sellAdsCount: sell.adsCount,
    sellTrimmedCount: sell.trimmedCount,
  };
}
