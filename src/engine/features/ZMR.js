export class ZMR {
  compute(buffer, normalizer, windowSize) {
    if (buffer.prices.length < windowSize) {
      return { z: 0, signal: 'NEUTRAL', strength: 0, extremeLevel: 'NONE' };
    }
    const windowPrices = buffer.last(windowSize, buffer.prices);
    const currentPrice = buffer.currentPrice;
    const z = normalizer.priceZScore(currentPrice, windowPrices);

    const extremeLevel =
      Math.abs(z) >= 3.5 ? 'EXTREME_3.5' :
      Math.abs(z) >= 3.0 ? 'EXTREME_3.0' :
      Math.abs(z) >= 2.5 ? 'EXTREME_2.5' :
      Math.abs(z) >= 2.0 ? 'ELEVATED'    : 'NONE';

    let signal = 'NEUTRAL';
    if      (z >=  3.0) signal = 'STRONG_FALL';
    else if (z >=  2.5) signal = 'FALL';
    else if (z <= -3.0) signal = 'STRONG_RISE';
    else if (z <= -2.5) signal = 'RISE';

    const strength = Math.min(Math.abs(z) / 3.5, 1.0);
    return { z, signal, strength, extremeLevel };
  }
}
