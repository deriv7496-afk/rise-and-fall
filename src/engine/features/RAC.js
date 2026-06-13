export class RAC {
  compute(normalizedReturns, windowSize, maxLag = 5) {
    if (normalizedReturns.length < windowSize) {
      return { lag1: 0, lag2: 0, lag3: 0, character: 'NEUTRAL', consistent: false };
    }
    const window = normalizedReturns.slice(-windowSize);
    const n = window.length;
    const mean = window.reduce((a,b) => a+b, 0) / n;
    const variance = window.reduce((a,b) => a + (b-mean)**2, 0) / n;
    if (variance === 0) return { lag1: 0, lag2: 0, lag3: 0, character: 'NEUTRAL', consistent: false };

    const acf = {};
    for (let lag = 1; lag <= maxLag; lag++) {
      let cov = 0;
      for (let i = lag; i < n; i++) {
        cov += (window[i] - mean) * (window[i - lag] - mean);
      }
      acf[`lag${lag}`] = cov / ((n - lag) * variance);
    }
    const signs = [acf.lag1, acf.lag2, acf.lag3].map(Math.sign);
    const consistent = signs[0] === signs[1] && signs[1] === signs[2];

    let character = 'NEUTRAL';
    if (Math.abs(acf.lag1) > 0.05) {
      character = acf.lag1 > 0
        ? (consistent ? 'STRONG_MOMENTUM'  : 'MOMENTUM')
        : (consistent ? 'STRONG_REVERSION' : 'REVERSION');
    }
    return { ...acf, character, consistent };
  }
}
