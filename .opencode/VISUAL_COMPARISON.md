# Token Stats - Visual Comparison

## Before vs After

### Header (Top of TUI)

#### BEFORE:
```
┌────────────────────────────────────────────────────────┐
│ # My Session              15,234/45% ($0.02)           │
└────────────────────────────────────────────────────────┘
```
- Just total tokens, percentage, and cost
- No breakdown
- No performance metrics
- No max token window

---

#### AFTER:
```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ # My Session    15,234/200,000 (45%) [10,123↓/5,111↑ 2,500⚡ 45t/s] ($0.02)             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **15,234/200,000** = Current tokens / Max tokens
- **(45%)** = Percentage of context window used
- **10,123↓** = Input tokens
- **5,111↑** = Output tokens
- **2,500⚡** = Cache read (shown only if > 0)
- **45t/s** = Tokens per second
- **$0.02** = Cost

---

### Sidebar (Right Panel)

#### BEFORE:
```
┌─────────────────────────────────┐
│ My Session                      │
│                                 │
│ Context                         │
│ 15,234 tokens                   │
│ 45% used                        │
│ $0.02 spent                     │
│                                 │
│ MCP                             │
│ ...                             │
└─────────────────────────────────┘
```

---

#### AFTER:
```
┌─────────────────────────────────┐
│ My Session                      │
│                                 │
│ Context                         │
│ 15,234 / 200,000 tokens         │
│ (45% used)                      │
│ In: 10,123 | Out: 5,111         │
│ Cache: 2,500 read / 0 write     │
│ $0.02 spent                     │
│                                 │
│ Performance                     │
│ Latency: 2.34s                  │
│ Speed: 45 tok/s                 │
│                                 │
│ MCP                             │
│ ...                             │
└─────────────────────────────────┘
```

**New sections:**
- Max token window alongside current usage
- Detailed input/output breakdown
- Cache statistics (when applicable)
- Performance metrics (latency + speed)

---

## Real-World Examples

### Example 1: Fast Local Model (Bifrost/Ollama)

```
┌────────────────────────────────────────────────────────┐
│ # Code Review   2,345 tokens [1,234↓/1,111↑ 150t/s]   │
│                 ($0.00)                                │
└────────────────────────────────────────────────────────┘

Sidebar:
┌─────────────────────────────────┐
│ Code Review                     │
│                                 │
│ Context                         │
│ 2,345 / Unknown tokens          │
│ (0% used)                       │
│ In: 1,234 | Out: 1,111          │
│ $0.00 spent                     │
│                                 │
│ Performance                     │
│ Latency: 7.41s                  │
│ Speed: 150 tok/s                │
└─────────────────────────────────┘
```

**Insights:**
- ✅ Very fast generation (150 t/s)
- ✅ Free (local model)
- ✅ Low latency (7.4s)
- ℹ️ Max tokens unknown (local model doesn't report limit)

---

### Example 2: Cloud API with Caching (Claude)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ # Large Context   45,678/200,000 (75%) [40,123↓/5,555↑ 35,000⚡ 85t/s] ($0.12)  │
└────────────────────────────────────────────────────────────────────────────────────┘

Sidebar:
┌─────────────────────────────────┐
│ Large Context                   │
│                                 │
│ Context                         │
│ 45,678 / 200,000 tokens         │
│ (75% used)                      │
│ In: 40,123 | Out: 5,555         │
│ Cache: 35,000 read / 40,123 wr  │
│ $0.12 spent                     │
│                                 │
│ Performance                     │
│ Latency: 65.35s                 │
│ Speed: 85 tok/s                 │
└─────────────────────────────────┘
```

**Insights:**
- ⚡ 35,000 tokens cached (huge savings!)
- 💰 Would cost ~$0.50 without cache, only $0.12 with
- 📊 75% context used (getting full)
- ⏱️ Good speed for cloud (85 t/s)
- ⚠️ Consider summarizing or starting new session soon

---

### Example 3: Reasoning Model (o1)

```
┌────────────────────────────────────────────────────────────┐
│ # Complex Problem   8,567/128,000 (19%) [2,000↓/1,567↑   │
│                     45t/s] ($0.05)                         │
└────────────────────────────────────────────────────────────┘

Sidebar:
┌─────────────────────────────────┐
│ Complex Problem                 │
│                                 │
│ Context                         │
│ 8,567 / 128,000 tokens          │
│ (19% used)                      │
│ In: 2,000 | Out: 1,567          │
│ Reasoning: 5,000                │
│ $0.05 spent                     │
│                                 │
│ Performance                     │
│ Latency: 34.82s                 │
│ Speed: 45 tok/s                 │
└─────────────────────────────────┘
```

**Insights:**
- 🧠 5,000 reasoning tokens (model thinking)
- 💭 Actual output only 1,567 tokens
- ⏰ Slower (reasoning takes time)
- 💰 More expensive (reasoning tokens cost more)
- 📊 19% context used (plenty of room)

---

## Symbol Reference

| Symbol | Meaning | Example |
|--------|---------|---------|
| `↓` | Input tokens | `10,123↓` = 10,123 input tokens |
| `↑` | Output tokens | `5,111↑` = 5,111 output tokens |
| `⚡` | Cache read | `2,500⚡` = 2,500 cached tokens |
| `t/s` | Tokens/second | `45t/s` = generating at 45 tokens per second |

---

## What You Can Learn

### Cost Analysis
```
15,234 total tokens
├─ 10,123↓ input ($0.01)
├─ 5,111↑ output ($0.01)
└─ 2,500⚡ cache (saves ~$0.005)
```

### Performance Comparison
```
Local Model:  150 t/s  (very fast)
Claude:        85 t/s  (good)
o1:            45 t/s  (slow, but thinking)
```

### Context Management
```
75% used  ⚠️  Getting full, consider summarizing
45% used  ✅  Healthy
19% used  ✅  Plenty of room
```

---

## Use Cases

### 1. Debugging Slow Responses
**Before:** "Why is this taking so long?"
**After:** "Ah, only 12 t/s - the model is reasoning heavily"

### 2. Cost Optimization
**Before:** "This costs a lot"
**After:** "40k input tokens! Let me enable caching"

### 3. Provider Comparison
**Before:** "Which is faster?"
**After:** "Bifrost: 150 t/s, OpenAI: 85 t/s - clear winner"

### 4. Cache Validation
**Before:** "Is caching working?"
**After:** "35,000⚡ - yes, saving tons of $!"

### 5. Context Planning
**Before:** "Why did my session fail?"
**After:** "198,000/200,000 (99%) - I was at the limit!"

---

## The Difference

**Before:**
- Mysterious numbers
- No context window visibility
- Couldn't tell what's expensive
- No performance visibility
- Hard to plan context usage

**After:**
- Complete transparency
- See current vs max tokens
- Understand every token
- See exactly where money goes
- Real-time performance metrics
- Plan when to summarize/restart

**Result:** Empowered users who can optimize their usage! 🚀
