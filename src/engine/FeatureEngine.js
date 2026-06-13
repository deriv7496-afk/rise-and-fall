import { RVR }   from './features/RVR.js';
import { CUSUM } from './features/CUSUM.js';
import { TIC }   from './features/TIC.js';
import { ZMR }   from './features/ZMR.js';
import { VRT }   from './features/VRT.js';
import { RAC }   from './features/RAC.js';

export class FeatureEngine {
  constructor() {
    this.rvr   = new RVR();
    this.cusum = new CUSUM();
    this.tic   = new TIC();
    this.zmr   = new ZMR();
    this.vrt   = new VRT();
    this.rac   = new RAC();
  }

  run(cfg, buffer, normalizer, normReturns) {
    const w30 = normalizer.scaleWindow(30);  // 30 seconds of ticks
    const w60 = normalizer.scaleWindow(60);  // 60 seconds of ticks
    return {
      rvr:   this.rvr.compute(normReturns, cfg, w60),
      cusum: this.cusum.compute(normReturns, w30),
      tic:   this.tic.compute(buffer.deltas, w30),
      zmr:   this.zmr.compute(buffer, normalizer, w60),
      vrt:   this.vrt.compute(normReturns, 5),
      rac:   this.rac.compute(normReturns, w60),
    };
  }
}
