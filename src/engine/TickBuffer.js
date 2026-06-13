export class TickBuffer {
  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    this.prices     = [];
    this.times      = [];
    this.deltas     = [];
    this.logReturns = [];
  }

  push(price, timestamp = Date.now()) {
    if (this.prices.length > 0) {
      const prev = this.prices[this.prices.length - 1];
      this.deltas.push(price - prev);
      this.logReturns.push(Math.log(price / prev));
    }
    this.prices.push(price);
    this.times.push(timestamp);
    if (this.prices.length > this.maxSize)     this.prices.shift();
    if (this.times.length > this.maxSize)      this.times.shift();
    if (this.deltas.length > this.maxSize)     this.deltas.shift();
    if (this.logReturns.length > this.maxSize) this.logReturns.shift();
  }

  last(n, arr) { return arr.slice(-Math.min(n, arr.length)); }
  get length() { return this.prices.length; }
  get currentPrice() { return this.prices[this.prices.length - 1] ?? 0; }

  reset() {
    this.prices = []; this.times = [];
    this.deltas = []; this.logReturns = [];
  }
}
