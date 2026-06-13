export class TIC {
  compute(deltas, windowSize) {
    if (deltas.length < windowSize) {
      return { imbalance: 0, upTicks: 0, downTicks: 0,
               signal: 'NEUTRAL', freshCross: false };
    }
    const window = deltas.slice(-windowSize);
    const upTicks   = window.filter(d => d > 0).length;
    const downTicks = window.filter(d => d < 0).length;
    const active    = upTicks + downTicks;
    if (active === 0) return { imbalance: 0, upTicks: 0, downTicks: 0,
                               signal: 'NEUTRAL', freshCross: false };
    const imbalance = (upTicks - downTicks) / active;

    let signal = 'NEUTRAL';
    if      (imbalance >  0.47) signal = 'STRONG_RISE';
    else if (imbalance >  0.27) signal = 'WEAK_RISE';
    else if (imbalance < -0.47) signal = 'STRONG_FALL';
    else if (imbalance < -0.27) signal = 'WEAK_FALL';

    let freshCross = false;
    if (deltas.length >= windowSize + 3) {
      const prevWindow = deltas.slice(-(windowSize + 3), -3);
      const prevUp   = prevWindow.filter(d => d > 0).length;
      const prevDown = prevWindow.filter(d => d < 0).length;
      const prevAct  = prevUp + prevDown;
      if (prevAct > 0) {
        const prevImbalance = (prevUp - prevDown) / prevAct;
        freshCross = (Math.abs(imbalance) > 0.47 && Math.abs(prevImbalance) <= 0.47);
      }
    }
    return { imbalance, upTicks, downTicks, signal, freshCross };
  }
}
