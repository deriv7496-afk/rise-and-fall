// THE CRITICAL LAYER.
// Divides every return by tickSigma so all thresholds are
// universal across V10 through V100.

export class Normalizer {
  constructor(symbolConfig) {
    this.cfg = symbolConfig;
  }

  normalize(rawReturn) {
    return rawReturn / this.cfg.tickSigma;
  }

  normalizeArray(rawReturns) {
    return rawReturns.map(r => r / this.cfg.tickSigma);
  }

  // GBM-correct z-score: uses theoretical sigma, not empirical std
  priceZScore(price, windowPrices) {
    if (windowPrices.length < 2) return 0;
    const mean = windowPrices.reduce((a, b) => a + b, 0) / windowPrices.length;
    const theoreticalSD = mean * this.cfg.sigma *
      Math.sqrt(windowPrices.length * this.cfg.dt);
    if (theoreticalSD === 0) return 0;
    return (price - mean) / theoreticalSD;
  }

  // Convert real seconds to tick count for this index
  scaleWindow(seconds) {
    return Math.max(5, Math.round(seconds / this.cfg.tickInterval));
  }
}
