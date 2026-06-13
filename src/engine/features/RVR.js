export class RVR {
  compute(normalizedReturns, cfg, windowSize) {
    if (normalizedReturns.length < windowSize) {
      return { ratio: 1.0, regime: 'NORMAL', realizedSigma: cfg.sigma };
    }
    const window = normalizedReturns.slice(-windowSize);
    const mean = window.reduce((a,b) => a+b, 0) / window.length;
    const variance = window.reduce((a,b) => a + (b-mean)**2, 0) / window.length;
    // After normalization, expected variance = 1.0
    // ratio = realized variance / expected variance
    const ratio = variance;
    const regime =
      ratio < 0.40 ? 'DEEP_COMPRESSION' :
      ratio < 0.65 ? 'COMPRESSION'      :
      ratio < 1.45 ? 'NORMAL'           :
      ratio < 2.20 ? 'EXPANSION'        : 'HIGH_EXPANSION';
    const realizedSigma = Math.sqrt(variance) * Math.sqrt(1 / cfg.dt);
    return { ratio, regime, realizedSigma, theoreticalSigma: cfg.sigma };
  }
}
