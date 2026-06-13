// The gate. SignalFusion tells you WHAT direction. EntryTiming tells you
// WHETHER this is the right moment to enter.
// Prevents entering mid-trend, at exhaustion, or in bad vol conditions.

export class EntryTiming {

  evaluate(fusionResult, features, cfg) {
    if (fusionResult.signal === 'NO_TRADE') {
      return { approved: false, entryType: 'NONE', reason: fusionResult.reason };
    }
    const { rvr, cusum, tic, zmr, vrt } = features;

    // PATH A: REVERSAL ENTRY
    // Price at extreme + mean-reversion confirmed + run has stalled
    if (Math.abs(zmr.z) >= 2.5 && vrt.interpretation.includes('MEAN_REVERTING')) {
      const cususmExhausted = Math.abs(cusum.acceleration) < 0.08 ||
        Math.sign(cusum.acceleration) !== Math.sign(cusum.normalizedCusum);
      if (!cususmExhausted) {
        return { approved: false, entryType: 'NONE',
                 reason: 'REVERSAL_RUN_STILL_ACCELERATING' };
      }
      return {
        approved: true, entryType: 'REVERSAL_PEAK',
        confidence: Math.min(fusionResult.confidence + 10, 95),
        reason: `z=${zmr.z.toFixed(2)}_extreme_reversal`,
      };
    }

    // PATH B: TREND RIDE ENTRY
    // Fresh trend birth: CUSUM just inflected, TIC just crossed, vol calm, room to run

    // Condition 1: Fresh CUSUM inflection
    if (!cusum.recentlyInflected) {
      const strongAndFresh = Math.abs(cusum.normalizedCusum) > 0.15 &&
        Math.abs(cusum.acceleration) > 0.08;
      if (!strongAndFresh) {
        return { approved: false, entryType: 'NONE',
                 reason: 'TREND_NOT_FRESH_NO_RECENT_INFLECTION' };
      }
    }

    // Condition 2: TIC strong enough
    const ticValid = tic.freshCross || Math.abs(tic.imbalance) >= 0.47;
    if (!ticValid) {
      return { approved: false, entryType: 'NONE', reason: 'TIC_NOT_STRONG_ENOUGH' };
    }

    // Condition 3: Vol regime acceptable
    if (rvr.regime === 'HIGH_EXPANSION' || rvr.regime === 'DEEP_COMPRESSION') {
      return { approved: false, entryType: 'NONE', reason: `RVR_REGIME_${rvr.regime}` };
    }

    // Condition 4: Price has room to run (not at extreme)
    if (Math.abs(zmr.z) >= 2.0) {
      return { approved: false, entryType: 'NONE',
               reason: 'PRICE_ALREADY_AT_EXTREME_USE_REVERSAL' };
    }

    // Condition 5: CUSUM and TIC agree on direction
    if ((cusum.normalizedCusum > 0) !== (tic.imbalance > 0)) {
      return { approved: false, entryType: 'NONE', reason: 'CUSUM_TIC_DIRECTION_CONFLICT' };
    }

    return {
      approved: true, entryType: 'TREND_RIDE',
      confidence: fusionResult.confidence,
      reason: 'ALL_ENTRY_CONDITIONS_MET',
    };
  }

  buildSignal(fusionResult, entryDecision, buffer, cfg) {
    if (!entryDecision.approved) {
      return {
        signal: 'NO_TRADE', entryPrice: buffer.currentPrice,
        confidence: 0, regime: fusionResult.regime,
        entryType: entryDecision.entryType, reason: entryDecision.reason,
        timestamp: Date.now(), pRise: fusionResult.pRise, components: null,
      };
    }
    const entryPrice = buffer.currentPrice;
    const expectedRange = cfg.expectedContractRange(entryPrice);
    const dir = fusionResult.signal === 'RISE' ? 1 : -1;
    return {
      signal:              fusionResult.signal,
      entryPrice,
      confidence:          entryDecision.confidence,
      regime:              fusionResult.regime,
      entryType:           entryDecision.entryType,
      reason:              entryDecision.reason,
      pRise:               fusionResult.pRise,
      expectedExitPrice:   entryPrice + dir * expectedRange,
      expectedRangePoints: expectedRange.toFixed(5),
      durationSeconds:     120,
      timestamp:           Date.now(),
      components:          fusionResult.components,
    };
  }
}
