// Executes Rise/Fall contracts via Deriv WebSocket when Auto Mode is ON.
// cooldownMs = 125s ensures previous contract always settles before next entry.

export class AutoTrader {
  constructor(ws, config) {
    this.ws      = ws;
    this.config  = config;  // { stake, currency }
    this.enabled = false;
    this.lastTradeTime = 0;
    this.cooldownMs    = 125 * 1000;
    this.history = [];
  }

  enable()  { this.enabled = true; }
  disable() { this.enabled = false; }
  canTrade() {
    return this.enabled && (Date.now() - this.lastTradeTime >= this.cooldownMs);
  }

  async execute(signal, symbol) {
    if (!this.canTrade())             return { status: 'SKIPPED', reason: 'DISABLED_OR_COOLDOWN' };
    if (signal.signal === 'NO_TRADE') return { status: 'SKIPPED', reason: 'NO_TRADE_SIGNAL' };

    const contractType = signal.signal === 'RISE' ? 'CALL' : 'PUT';
    const buyRequest = {
      buy: 1,
      price: this.config.stake,
      parameters: {
        contract_type: contractType,
        currency:      this.config.currency || 'USD',
        duration:      2,
        duration_unit: 'm',
        symbol,
        basis:         'stake',
        amount:        this.config.stake,
      },
    };

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.ws.removeEventListener('message', handler);
        resolve({ status: 'TIMEOUT' });
      }, 10_000);

      const handler = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.msg_type !== 'buy') return;
          clearTimeout(timeout);
          this.ws.removeEventListener('message', handler);
          if (data.error) { resolve({ status: 'ERROR', error: data.error.message }); return; }
          const record = {
            contractId: data.buy.contract_id, symbol,
            signal: signal.signal, entryPrice: signal.entryPrice,
            confidence: signal.confidence, entryType: signal.entryType,
            stake: this.config.stake, openedAt: Date.now(), status: 'OPEN',
          };
          this.history.unshift(record);
          if (this.history.length > 100) this.history.pop();
          this.lastTradeTime = Date.now();
          resolve({ status: 'SUCCESS', record });
        } catch (_) {}
      };

      this.ws.addEventListener('message', handler);
      this.ws.send(JSON.stringify(buyRequest));
    });
  }

  get stats() {
    const closed = this.history.filter(t => t.status !== 'OPEN');
    const wins   = closed.filter(t => t.status === 'WIN').length;
    return {
      total:   this.history.length,
      open:    this.history.filter(t => t.status === 'OPEN').length,
      wins,
      losses:  closed.length - wins,
      winRate: closed.length > 0 ? ((wins / closed.length) * 100).toFixed(1) + '%' : 'N/A',
      cooldownRemaining: Math.max(0, this.cooldownMs - (Date.now() - this.lastTradeTime)),
    };
  }
}
