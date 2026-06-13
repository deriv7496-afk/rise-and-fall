export class CUSUM {
  compute(normalizedReturns, windowSize) {
    if (normalizedReturns.length < windowSize) {
      return { cusum: 0, acceleration: 0, normalizedCusum: 0,
               signal: 'NEUTRAL', recentlyInflected: false };
    }
    const window = normalizedReturns.slice(-windowSize);
    const half = Math.floor(windowSize / 2);
    const cusum = window.reduce((a, r) => a + r, 0);
    const firstHalf  = window.slice(0, half).reduce((a, r) => a + r, 0);
    const secondHalf = window.slice(half).reduce((a, r) => a + r, 0);
    const acceleration = secondHalf - firstHalf;
    const normalizedCusum = cusum / windowSize;

    let signal = 'NEUTRAL';
    if      (normalizedCusum >  0.15 && acceleration >  0) signal = 'STRONG_RISE';
    else if (normalizedCusum >  0.08 && acceleration >= 0) signal = 'WEAK_RISE';
    else if (normalizedCusum < -0.15 && acceleration <  0) signal = 'STRONG_FALL';
    else if (normalizedCusum < -0.08 && acceleration <= 0) signal = 'WEAK_FALL';
    else if (normalizedCusum >  0.08)                      signal = 'FADING_RISE';
    else if (normalizedCusum < -0.08)                      signal = 'FADING_FALL';

    const recentWindow = 5;
    let recentlyInflected = false;
    if (normalizedReturns.length >= windowSize + recentWindow) {
      const prevCusum = normalizedReturns
        .slice(-(windowSize + recentWindow), -recentWindow)
        .reduce((a, r) => a + r, 0) / windowSize;
      recentlyInflected =
        (Math.sign(normalizedCusum) !== Math.sign(prevCusum)) ||
        (Math.abs(normalizedCusum - prevCusum) > 0.12 &&
         Math.abs(normalizedCusum) > 0.10);
    }
    return { cusum, normalizedCusum, acceleration, signal, recentlyInflected };
  }
}
