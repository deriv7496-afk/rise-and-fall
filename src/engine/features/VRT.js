// Lo-MacKinlay Variance Ratio Test
// VR < 1 = mean-reverting, VR > 1 = trending, VR = 1 = random walk

export class VRT {
  compute(normalizedReturns, k = 5) {
    const minLen = k * 12;
    if (normalizedReturns.length < minLen) {
      return { vr: 1.0, interpretation: 'INSUFFICIENT_DATA', confidence: 0 };
    }
    const n = normalizedReturns.length;
    const mean1 = normalizedReturns.reduce((a,b) => a+b, 0) / n;
    const var1  = normalizedReturns.reduce((a,b) => a + (b-mean1)**2, 0) / n;
    if (var1 === 0) return { vr: 1.0, interpretation: 'FLAT_MARKET', confidence: 0 };

    const kReturns = [];
    for (let i = 0; i + k <= n; i += k) {
      kReturns.push(normalizedReturns.slice(i, i + k).reduce((a,b) => a+b, 0));
    }
    if (kReturns.length < 6) return { vr: 1.0, interpretation: 'INSUFFICIENT_DATA', confidence: 0 };

    const meanK = kReturns.reduce((a,b) => a+b, 0) / kReturns.length;
    const varK  = kReturns.reduce((a,b) => a + (b-meanK)**2, 0) / kReturns.length;
    const vr = varK / (k * var1);

    const deviation = Math.abs(vr - 1.0);
    const confidence = Math.min(deviation / 0.40, 1.0);
    const interpretation =
      vr < 0.78 ? 'STRONG_MEAN_REVERTING' :
      vr < 0.92 ? 'MEAN_REVERTING'        :
      vr < 1.08 ? 'RANDOM_WALK'           :
      vr < 1.22 ? 'TRENDING'              : 'STRONG_TRENDING';

    return { vr, interpretation, confidence };
  }
}
