import React from 'react';

export function AutoModeToggle({ autoMode, onToggle, stats, stakeAmount, onStakeChange }) {
  const cooldownSec = stats ? Math.ceil((stats.cooldownRemaining ?? 0) / 1000) : 0;
  return (
    <div className="auto-mode-wrap">
      <div className="stake-row">
        <label className="stake-label">Stake (USD)</label>
        <input
          type="number" min="0.35" step="0.5"
          value={stakeAmount}
          onChange={e => onStakeChange(parseFloat(e.target.value))}
          className="stake-input"
          disabled={autoMode}
        />
      </div>
      <button onClick={onToggle} className={`auto-btn ${autoMode ? 'auto-btn-on' : 'auto-btn-off'}`}>
        <span className={`auto-dot ${autoMode ? 'auto-dot-on' : ''}`} />
        AUTO MODE: {autoMode ? 'ON' : 'OFF'}
      </button>
      {autoMode && cooldownSec > 0 && (
        <div className="cooldown-bar">Next entry in {cooldownSec}s</div>
      )}
      {autoMode && <div className="auto-warning">⚡ Live auto-trading active</div>}
      {stats && stats.total > 0 && (
        <div className="stats-row">
          <span>Trades: {stats.total}</span>
          <span>Win rate: {stats.winRate}</span>
          <span>Open: {stats.open}</span>
        </div>
      )}
    </div>
  );
}
