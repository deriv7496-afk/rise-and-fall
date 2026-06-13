# DERIV Synthetic Analysis Engine — Integration Guide

## Quick Start

All 15 engine files have been created in `src/engine/`, `src/hooks/`, and `src/components/`.

### Step 1: Import the hook

In your main trading component:

```jsx
import { useAnalysisEngine } from './hooks/useAnalysisEngine';
import { SignalPanel }       from './components/SignalPanel';
import { AutoModeToggle }    from './components/AutoModeToggle';
```

### Step 2: Initialize with WebSocket

```jsx
const [stakeAmount, setStakeAmount] = useState(1);

const {
  processTick,
  signal,
  features,
  engineReady,
  tickCount,
  autoMode,
  toggleAutoMode,
  tradeLog,
  stats,
  symbolConfig,
} = useAnalysisEngine({
  websocket:   ws,              // your existing Deriv WS
  symbol:      selectedSymbol,  // e.g. '1HZ75V'
  stakeAmount,
  currency:    'USD',
});
```

### Step 3: Feed ticks from WebSocket

Add ONE line to your WS message handler:

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // ... your existing code ...
  
  // ADD THIS:
  if (data.msg_type === 'tick') {
    processTick(data.tick.quote, data.tick.epoch * 1000);
  }
};
```

### Step 4: Render UI components

```jsx
<SignalPanel
  signal={signal}
  features={features}
  engineReady={engineReady}
  tickCount={tickCount}
  symbolConfig={symbolConfig}
/>

<AutoModeToggle
  autoMode={autoMode}
  onToggle={toggleAutoMode}
  stats={stats}
  stakeAmount={stakeAmount}
  onStakeChange={setStakeAmount}
/>
```

### Step 5: Add CSS

Append the contents of `src/styles.css` to your existing stylesheet. Do NOT replace—append only.

## Symbol Codes

| Symbol | Name |
|--------|------|
| `R_10` | Volatility 10 Index |
| `R_25` | Volatility 25 Index |
| `R_50` | Volatility 50 Index |
| `R_75` | Volatility 75 Index |
| `R_100` | Volatility 100 Index |
| `1HZ10V` | Volatility 10 (1s) Index |
| `1HZ25V` | Volatility 25 (1s) Index |
| `1HZ50V` | Volatility 50 (1s) Index |
| `1HZ75V` | Volatility 75 (1s) Index |
| `1HZ100V` | Volatility 100 (1s) Index |

## Signal Output

Every tick generates a signal object:

```javascript
{
  signal:              'RISE' | 'FALL' | 'NO_TRADE',
  entryPrice:          number,
  confidence:          0-100,
  regime:              'NORMAL' | 'COMPRESSION' | 'EXPANSION' | ...,
  entryType:           'TREND_RIDE' | 'REVERSAL_PEAK' | 'NONE',
  reason:              string,
  pRise:               0.0-1.0,
  components: {
    momentum:          number,
    tickImb:           number,
    meanRev:           number,
    vrtSignal:         number,
    autocorr:          number,
  }
}
```

## Architecture

**Layer 0:** SymbolConfig — loads volatility parameters  
**Layer 1:** TickBuffer — rolling price history  
**Layer 2:** Normalizer — volatility-adaptive normalization  
**Layer 3:** FeatureEngine — orchestrates 6 probes  
**Layer 4:** SignalFusion — MLP probability model  
**Layer 5:** EntryTiming — trade type validation  
**Layer 6:** AutoTrader — WebSocket contract execution  

## Key Numbers

- **Confidence threshold:** 60%
- **RISE signal:** P(Rise) > 0.65
- **FALL signal:** P(Rise) < 0.35
- **Storm filter (RVR):** ratio > 2.10
- **Compression filter (RVR):** ratio < 0.30
- **Reversal trigger (ZMR):** |z| ≥ 2.5
- **Trend entry max ZMR:** |z| < 2.0
- **Auto mode cooldown:** 125 seconds

## No Changes Required to Existing Code

The engine is 100% self-contained. No modifications to your existing Deriv WS connection, trade execution, or React structure are needed. Just:

1. Create the 15 files (done)
2. Add 4 lines to your component imports and JSX
3. Add 3 lines to your WS handler
4. Append CSS

Done.
