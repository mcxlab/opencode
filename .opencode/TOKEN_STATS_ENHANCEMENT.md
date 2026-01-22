# Token Statistics Enhancement

## Summary

Enhanced the TUI (Terminal UI) to show detailed token statistics in real-time, including input/output breakdown, cache usage, latency, tokens per second, and maximum token window limits.

---

## What Was Added

### 1. Header View (Compact)

**Before:**
```
15,234/45% ($0.02)
```

**After:**
```
15,234/200,000 (45%) [10,123↓/5,111↑ 2,500⚡ 45t/s] ($0.02)
```

**Legend:**
- `15,234` - Total tokens used
- `200,000` - Maximum tokens allowed (context window)
- `45%` - Percentage of context window used
- `10,123↓` - Input tokens
- `5,111↑` - Output tokens
- `2,500⚡` - Cache read tokens (only shown if > 0)
- `45t/s` - Tokens per second (generation speed)
- `$0.02` - Cost

---

### 2. Sidebar View (Detailed)

**Before:**
```
Context
15,234 tokens
45% used
$0.02 spent
```

**After:**
```
Context
15,234 / 200,000 tokens (45% used)
In: 10,123 | Out: 5,111
Reasoning: 0
Cache: 2,500 read / 0 write
$0.02 spent

Performance
Latency: 2.34s
Speed: 45 tok/s
```

**Features:**
- Maximum token window displayed alongside current usage
- Input/Output token breakdown
- Reasoning tokens (shown only if > 0)
- Cache read/write stats (shown only if > 0)
- Performance metrics (shown only when latency data available)
- Latency in seconds
- Generation speed in tokens/sec

---

## Implementation Details

### Files Modified

1. **`packages/opencode/src/cli/cmd/tui/routes/session/header.tsx`**
   - Enhanced `context` computed property
   - Added latency calculation
   - Added tokens/sec calculation
   - Added max token window display
   - Modified display string with symbols (↓ ↑ ⚡)

2. **`packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`**
   - Enhanced `context` computed property
   - Added detailed token breakdown
   - Added max token window display
   - Added performance section
   - Conditional rendering (only show if data exists)

### Calculations

```typescript
// Latency
const latencyMs = last.time.completed - last.time.created
const latencySec = latencyMs / 1000

// Tokens per second (based on output tokens)
const tokensPerSec = latencySec > 0
  ? Math.round(last.tokens.output / latencySec)
  : 0

// Max tokens
const maxTokens = model?.limit.context?.toLocaleString() ?? "Unknown"
```

### Data Sources

All data comes from `AssistantMessage` type:

```typescript
{
  time: {
    created: number      // Start timestamp
    completed?: number   // End timestamp
  },
  tokens: {
    input: number        // Prompt tokens
    output: number       // Generated tokens
    reasoning: number    // Reasoning tokens (for models like o1)
    cache: {
      read: number       // Tokens read from cache
      write: number      // Tokens written to cache
    }
  },
  cost: number          // USD cost
}
```

Max token window from provider model configuration:
```typescript
model?.limit.context  // Maximum tokens allowed
```

---

## Visual Examples

### Example 1: Simple Query (No Cache)

**Header:**
```
5,234/128,000 (12%) [4,123↓/1,111↑ 89t/s] ($0.01)
```

**Sidebar:**
```
Context
5,234 / 128,000 tokens (12% used)
In: 4,123 | Out: 1,111
$0.01 spent

Performance
Latency: 12.50s
Speed: 89 tok/s
```

---

### Example 2: With Cache

**Header:**
```
25,456/200,000 (58%) [20,123↓/5,333↑ 15,000⚡ 120t/s] ($0.03)
```

**Sidebar:**
```
Context
25,456 / 200,000 tokens (58% used)
In: 20,123 | Out: 5,333
Cache: 15,000 read / 0 write
$0.03 spent

Performance
Latency: 44.44s
Speed: 120 tok/s
```

---

### Example 3: Reasoning Model (like o1)

**Header:**
```
8,567/128,000 (19%) [2,000↓/1,567↑ 45t/s] ($0.05)
```

**Sidebar:**
```
Context
8,567 / 128,000 tokens (19% used)
In: 2,000 | Out: 1,567
Reasoning: 5,000
$0.05 spent

Performance
Latency: 34.82s
Speed: 45 tok/s
```

---

### Example 4: Unknown Max Tokens (Local Model)

**Header:**
```
2,345 tokens [1,234↓/1,111↑ 150t/s] ($0.00)
```

**Sidebar:**
```
Context
2,345 / Unknown tokens (0% used)
In: 1,234 | Out: 1,111
$0.00 spent

Performance
Latency: 7.41s
Speed: 150 tok/s
```

---

## Benefits

### For Users

1. **Better Cost Understanding**
   - See exactly where tokens are used
   - Understand cache savings
   - Track input vs output costs

2. **Performance Visibility**
   - Know how fast models generate
   - Identify slow responses
   - Compare model speeds

3. **Context Management**
   - See current usage vs maximum allowed
   - Understand how much room is left
   - Plan when to summarize or start new session

4. **Debugging**
   - Understand why context fills up
   - See cache effectiveness
   - Identify expensive operations

### For Development

1. **Model Comparison**
   - Compare different providers
   - Evaluate local vs cloud performance
   - Benchmark changes

2. **Optimization**
   - Identify caching opportunities
   - Find inefficient prompts
   - Track improvements

---

## Symbol Legend

- `↓` - Input tokens (going in)
- `↑` - Output tokens (coming out)
- `⚡` - Cache read (fast/free tokens)
- `t/s` - Tokens per second

---

## Technical Notes

### Tokens/Sec Calculation

- Based on **output tokens only** (not total)
- Calculated from `time.created` to `time.completed`
- Rounded to nearest integer
- Only shown when latency > 0

### Cache Display

- Only shown when `cache.read > 0` or `cache.write > 0`
- Helps keep display clean for non-cached requests
- Critical for understanding Anthropic's prompt caching

### Reasoning Tokens

- Only shown when > 0
- Used by models like OpenAI o1
- Represents internal "thinking" tokens
- Often not counted toward output limits

### Max Token Window

- Displayed as "Unknown" if model doesn't provide limit
- Used to calculate percentage
- Helps users understand context constraints

---

## Future Enhancements (Optional)

1. **Average Stats**
   - Show avg tokens/sec for session
   - Show total cache savings
   - Compare against model specs

2. **Color Coding**
   - Green for fast responses (>100 t/s)
   - Yellow for medium (50-100 t/s)
   - Red for slow (<50 t/s)

3. **Historical Graph**
   - Mini sparkline of tokens/sec over time
   - Visual trend of context usage

4. **Cost Breakdown**
   - Show input vs output cost separately
   - Display cache savings in $

---

## Testing

```bash
# Start TUI
bun run dev

# Check header - should show: tokens/max (%) [in↓/out↑ speed] (cost)
# Check sidebar - should show detailed breakdown with max tokens

# Test with different models:
# - Fast model (local ollama) - high t/s
# - Slow model (reasoning) - low t/s
# - Cached request - see ⚡ symbol
# - Unknown limit model - see "Unknown" max tokens
```

---

## Example Output

Here's what you'll see in a real session:

**Fast Local Model (Bifrost/Ollama):**
```
Header: 2,345 tokens [1,234↓/1,111↑ 150t/s] ($0.00)

Sidebar:
Context
2,345 / Unknown tokens (0% used)
In: 1,234 | Out: 1,111
$0.00 spent

Performance
Latency: 7.41s
Speed: 150 tok/s
```

**Claude with Cache:**
```
Header: 45,678/200,000 (75%) [40,123↓/5,555↑ 35,000⚡ 85t/s] ($0.12)

Sidebar:
Context
45,678 / 200,000 tokens (75% used)
In: 40,123 | Out: 5,555
Cache: 35,000 read / 40,123 write
$0.12 spent

Performance
Latency: 65.35s
Speed: 85 tok/s
```

---

## Status

✅ **Implemented and Type-Checked**

- Header enhancement: Complete
- Sidebar enhancement: Complete
- Max token window display: Complete
- TypeScript compilation: Pass
- Ready for testing in TUI

---

## Impact

**Before:** Only saw total tokens and percentage
**After:** See complete breakdown with max limits and performance metrics

This gives users full visibility into:
- What they're paying for
- How fast their models run
- How effective caching is
- Where context is being used
- How much context space remains

All in real-time, right in the UI! 🚀
