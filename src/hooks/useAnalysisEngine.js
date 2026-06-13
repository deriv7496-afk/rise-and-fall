import { useState, useEffect, useRef, useCallback } from 'react';
import { SymbolConfig }  from '../engine/SymbolConfig';
import { TickBuffer }    from '../engine/TickBuffer';
import { Normalizer }    from '../engine/Normalizer';
import { FeatureEngine } from '../engine/FeatureEngine';
import { SignalFusion }  from '../engine/SignalFusion';
import { EntryTiming }   from '../engine/EntryTiming';
import { AutoTrader }    from '../engine/AutoTrader';

export function useAnalysisEngine({ websocket, symbol, stakeAmount = 1, currency = 'USD' }) {
  const cfgRef         = useRef(null);
  const bufferRef      = useRef(null);
  const normalizerRef  = useRef(null);
  const featureEngRef  = useRef(new FeatureEngine());
  const fusionRef      = useRef(new SignalFusion());
  const entryTimingRef = useRef(new EntryTiming());
  const autoTraderRef  = useRef(null);

  const [signal,      setSignal]      = useState(null);
  const [features,    setFeatures]    = useState(null);
  const [engineReady, setEngineReady] = useState(false);
  const [tickCount,   setTickCount]   = useState(0);
  const [autoMode,    setAutoMode]    = useState(false);
  const [tradeLog,    setTradeLog]    = useState([]);
  const [stats,       setStats]       = useState(null);

  // Rebuild engine instances when symbol changes
  useEffect(() => {
    if (!symbol || !SymbolConfig.isValid(symbol)) return;
    const cfg        = new SymbolConfig(symbol);
    const buffer     = new TickBuffer(500);
    const normalizer = new Normalizer(cfg);
    cfgRef.current        = cfg;
    bufferRef.current     = buffer;
    normalizerRef.current = normalizer;
    if (websocket) {
      autoTraderRef.current = new AutoTrader(websocket, { stake: stakeAmount, currency });
    }
    setSignal(null);
    setFeatures(null);
    setEngineReady(false);
    setTickCount(0);
  }, [symbol, websocket, stakeAmount, currency]);

  const toggleAutoMode = useCallback(() => {
    setAutoMode(prev => {
      const next = !prev;
      if (autoTraderRef.current) {
        next ? autoTraderRef.current.enable() : autoTraderRef.current.disable();
      }
      return next;
    });
  }, []);

  // CALL THIS FROM YOUR WS MESSAGE HANDLER:
  // if (data.msg_type === 'tick') {
  //   processTick(data.tick.quote, data.tick.epoch * 1000);
  // }
  const processTick = useCallback(async (price, timestamp = Date.now()) => {
    const cfg        = cfgRef.current;
    const buffer     = bufferRef.current;
    const normalizer = normalizerRef.current;
    if (!cfg || !buffer || !normalizer) return;

    buffer.push(price, timestamp);
    setTickCount(buffer.length);

    if (buffer.length < cfg.minWarmupTicks) {
      setEngineReady(false);
      return;
    }
    setEngineReady(true);

    const normReturns   = normalizer.normalizeArray(buffer.logReturns);
    const featureResult = featureEngRef.current.run(cfg, buffer, normalizer, normReturns);
    setFeatures(featureResult);

    const fusionResult  = fusionRef.current.compute(featureResult, normReturns);
    const entryDecision = entryTimingRef.current.evaluate(fusionResult, featureResult, cfg);
    const finalSignal   = entryTimingRef.current.buildSignal(fusionResult, entryDecision, buffer, cfg);
    setSignal(finalSignal);

    if (autoMode && finalSignal.signal !== 'NO_TRADE' && autoTraderRef.current) {
      const result = await autoTraderRef.current.execute(finalSignal, symbol);
      if (result.status === 'SUCCESS') {
        setTradeLog(prev => [result.record, ...prev.slice(0, 49)]);
        setStats({ ...autoTraderRef.current.stats });
      }
    }
  }, [autoMode, symbol]);

  return {
    processTick,
    signal,
    features,
    engineReady,
    tickCount,
    autoMode,
    toggleAutoMode,
    tradeLog,
    stats,
    symbolConfig: cfgRef.current,
  };
}
