import React from 'react';

export function SignalPanel({ signal, features, engineReady, tickCount, symbolConfig }) {
  if (!engineReady) {
    const needed = symbolConfig?.minWarmupTicks ?? 60;
    const pct    = symbolConfig ? Math.round((tickCount / needed) * 100) : 0;
    return (
      <div className="signal-panel signal-loading">
        <div className="warmup-label">Collecting ticks… {tickCount} / {needed}</div>
        <div className="warmup-track">
          <div className="warmup-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  if (!signal) return null;

  const isRise    = signal.signal === 'RISE';
  const isFall    = signal.signal === 'FALL';
  const isNoTrade = signal.signal === 'NO_TRADE';
  const color = isRise ? 'var(--color-text-success)'
              : isFall ? 'var(--color-text-danger)'
              : 'var(--color-text-tertiary)';
  const icon  = isRise ? '▲ RISE' : isFall ? '▼ FALL' : '— WAIT';
  const pRise     = signal.pRise ?? 0.5;
  const barDir    = pRise >= 0.5 ? 'right' : 'left';
  const barWidth  = Math.abs(pRise - 0.5) * 200;

  return (
    <div className="signal-panel">
      <div className="signal-main" style={{ color }}>{icon}</div>
      {!isNoTrade && (
        <div className="signal-meta-row">
          <span>Entry: {signal.entryPrice?.toFixed(4)}</span>
          <span className="signal-type-badge">{signal.entryType}</span>
        </div>
      )}
      {!isNoTrade && (
        <div className="conf-track">
          <div className="conf-fill" style={{ width: `${signal.confidence}%`, background: color }} />
          <span className="conf-label">Confidence {signal.confidence}%</span>
        </div>
      )}
      <div className="mlp-row">
        <span className="mlp-tag">FALL</span>
        <div className="mlp-track">
          <div className="mlp-center" />
          <div className="mlp-fill" style={{
            [barDir === 'right' ? 'left' : 'right']: '50%',
            width: `${barWidth}%`,
            background: isRise ? 'var(--color-text-success)' : 'var(--color-text-danger)',
          }} />
        </div>
        <span className="mlp-tag">RISE</span>
      </div>
      <div className="mlp-prob">P(Rise) = {(pRise * 100).toFixed(1)}%</div>
      <div className="regime-row">
        <span className="regime-label">Regime</span>
        <span className="regime-value">{signal.regime}</span>
      </div>
      {isNoTrade && (
        <div className="no-trade-reason">{signal.reason?.replace(/_/g,' ')}</div>
      )}
      {signal.components && (
        <div className="components">
          {Object.entries(signal.components).map(([key, val]) => (
            <div key={key} className="comp-row">
              <span className="comp-key">{key}</span>
              <div className="comp-bar-track">
                <div className="comp-bar-center" />
                <div className="comp-bar-fill" style={{
                  left:  val >= 0 ? '50%' : `${50 + val * 100}%`,
                  width: `${Math.abs(val) * 100}%`,
                  background: val >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)',
                }} />
              </div>
              <span className="comp-val">{val >= 0 ? '+' : ''}{val.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
