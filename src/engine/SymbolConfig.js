const SECONDS_PER_YEAR = 31_536_000;

const SYMBOLS = {
  'R_10':    { sigma: 0.10, tickInterval: 2, label: 'Volatility 10 Index' },
  'R_25':    { sigma: 0.25, tickInterval: 2, label: 'Volatility 25 Index' },
  'R_50':    { sigma: 0.50, tickInterval: 2, label: 'Volatility 50 Index' },
  'R_75':    { sigma: 0.75, tickInterval: 2, label: 'Volatility 75 Index' },
  'R_100':   { sigma: 1.00, tickInterval: 2, label: 'Volatility 100 Index' },
  '1HZ10V':  { sigma: 0.10, tickInterval: 1, label: 'Volatility 10 (1s) Index' },
  '1HZ25V':  { sigma: 0.25, tickInterval: 1, label: 'Volatility 25 (1s) Index' },
  '1HZ50V':  { sigma: 0.50, tickInterval: 1, label: 'Volatility 50 (1s) Index' },
  '1HZ75V':  { sigma: 0.75, tickInterval: 1, label: 'Volatility 75 (1s) Index' },
  '1HZ100V': { sigma: 1.00, tickInterval: 1, label: 'Volatility 100 (1s) Index' },
};

export class SymbolConfig {
  constructor(symbol) {
    const p = SYMBOLS[symbol];
    if (!p) throw new Error(`Unknown symbol: ${symbol}`);
    this.symbol = symbol;
    this.sigma = p.sigma;
    this.tickInterval = p.tickInterval;
    this.label = p.label;
    this.dt = p.tickInterval / SECONDS_PER_YEAR;
    this.tickSigma = p.sigma * Math.sqrt(this.dt);
    this.ticksPerMinute = 60 / p.tickInterval;
    this.ticksPerContract = 120 / p.tickInterval;
    this.contractSigma = p.sigma * Math.sqrt(120 / SECONDS_PER_YEAR);
    this.minWarmupTicks = this.ticksPerContract;
  }

  expectedContractRange(currentPrice) {
    return currentPrice * this.contractSigma;
  }

  static getAll() { return Object.keys(SYMBOLS); }
  static isValid(symbol) { return symbol in SYMBOLS; }
}
