// MLP: Majority Lean Probability
// P(Rise) = 0.5 + weighted sum of 5 normalized sub-signals
// RISE if P > 0.65, FALL if P < 0.35, NO_TRADE otherwise

export class SignalFusion {

  static WEIGHTS = {
    momentum:  0.28,  // CUSUM — strongest short-term predictor
    tickImb:   0.24,  // TIC  — direct majority-direction evidence
    meanRev:   0.22,  // ZMR  — highest-confidence reversal setup
    vrt:       0.14,  // VRT  — validates trending vs reverting mode
    autocorr:  0.12,  // RAC  — momentum vs reversion character
  };

  static HARD_FILTERS = {
    maxRVR:        2.10,  // Storm conditions — no trade
    minRVR:        0.30,  // Deep compression — no trade
    minPRise:      0.65,  // RISE threshold
    maxPRise:      0.35,  // FALL threshold
    minConfidence: 60,    // Minimum confidence % to fire
  };

  compute(features, normReturns) {
    const { rvr, cusum, tic, zmr, vrt, rac } = features;
    const F = SignalFusion.HARD_FILTERS;

    if (rvr.ratio > F.maxRVR)
      return this._noTrade('STORM_CONDITIONS', rvr.regime, 0);
    if (rvr.ratio < F.minRVR)
      return this._noTrade('DEEP_COMPRESSION', rvr.regime, 0);

    // Each sub-signal normalized to [-0.5, +0.5]
    // Positive = RISE lean, negative = FALL lean
    const momentum = Math.max(-0.5, Math.min(0.5, cusum.normalizedCusum * 3.0));
    const tickImb  = Math.max(-0.5, Math.min(0.5, tic.imbalance * 0.5));
    const meanRev  = Math.max(-0.5, Math.min(0.5, -zmr.z / 5.0));
    const cususmDir = Math.sign(cusum.normalizedCusum);
    const vrtLean   = (vrt.vr - 1.0) * cususmDir;
    const vrtSignal = Math.max(-0.5, Math.min(0.5, vrtLean * 1.5));
    const lastDir   = normReturns.length > 0
      ? Math.sign(normReturns[normReturns.length - 1]) : 0;
    const autocorr  = Math.max(-0.5, Math.min(0.5, rac.lag1 * lastDir * 4.0));

    const W = SignalFusion.WEIGHTS;
    const pRise = 0.5
      + W.momentum * momentum
      + W.tickImb  * tickImb
      + W.meanRev  * meanRev
      + W.vrt      * vrtSignal
      + W.autocorr * autocorr;

    const pClamped = Math.max(0.01, Math.min(0.99, pRise));

    let signal = 'NO_TRADE';
    let confidence = 0;
    if (pClamped > F.minPRise) {
      signal = 'RISE';
      confidence = Math.round((pClamped - 0.5) / 0.5 * 100);
    } else if (pClamped < F.maxPRise) {
      signal = 'FALL';
      confidence = Math.round((0.5 - pClamped) / 0.5 * 100);
    }
    if (confidence < F.minConfidence)
      return this._noTrade('BELOW_CONFIDENCE', rvr.regime, pClamped);

    return {
      signal, pRise: pClamped, confidence, regime: rvr.regime,
      reason: 'MLP_THRESHOLD_MET',
      components: { momentum, tickImb, meanRev, vrtSignal, autocorr },
    };
  }

  _noTrade(reason, regime, pRise) {
    return { signal: 'NO_TRADE', pRise, confidence: 0, regime, reason, components: null };
  }
}
