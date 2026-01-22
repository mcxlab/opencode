# Quick Start: Testing Agent Effectiveness

Run this to see if your agents are actually better than baseline.

---

## 🚀 Run Tests (5 minutes)

```bash
# From opencode root directory
cd /home/michaelc/Development/cli_agent_tools/opencode

# Run all effectiveness tests
./.opencode/scripts/run-tests.sh
```

**What it tests:**
1. Code review accuracy
2. Project context knowledge (5 questions)
3. Context preservation with delegation
4. Research quality

**Time:** ~5 minutes total

---

## 📊 View Results

```bash
# Analyze results
python3 .opencode/scripts/analyze-results.py .opencode/test-results
```

**Shows:**
- ⏱️ Time: Agent vs baseline speed
- 💰 Tokens: Efficiency comparison
- 🎯 Quality: Issues found, specificity
- 📁 Details: Paths mentioned, etc.

---

## 🔍 Manual Review (Important!)

Numbers don't tell the whole story. Check manually:

```bash
# Find latest results
ls -lht .opencode/test-results/ | head -20

# Read specific test
cat .opencode/test-results/test1_agent_*.txt
cat .opencode/test-results/test1_baseline_*.txt
```

**Questions to ask:**
- ✓ Did agent find ALL the issues?
- ✓ Were there false positives?
- ✓ Are answers specific (file paths) or generic?
- ✓ Are sources recent (2024-2025)?
- ✓ Can you act on the suggestions?

---

## 📋 Quick Manual Test

Don't have 5 minutes? Try one question:

```bash
# Test project context
time bun run dev run --agent opencode-project "Where do CLI commands go?"

# vs baseline
time bun run dev run "Where do CLI commands go?"
```

**Compare:**
- Which is faster?
- Which gives specific paths?
- Which references actual code?

---

## 🎯 Expected Results

If agents are working correctly:

**Test 1 (Code Review):**
- ✅ Agent finds 3 issues (type safety, validation, race condition)
- ✅ All marked with correct severity
- ✅ 10-30% faster than baseline

**Test 2 (Project Context):**
- ✅ 5/5 correct answers
- ✅ Specific file paths (packages/opencode/src/cli/cmd/)
- ✅ 40-60% faster (context preloaded)

**Test 3 (Delegation):**
- ✅ Main output is clean and focused
- ✅ Fewer tokens in main context
- ✅ Easy to find the refactoring suggestions

**Test 4 (Research):**
- ✅ References from 2024-2025
- ✅ 3+ specific recommendations
- ✅ Cites sources

---

## ❌ Red Flags

Agent might NOT be effective if:

- ❌ Slower than baseline
- ❌ Generic answers (no file paths)
- ❌ Misses known issues
- ❌ Many false positives
- ❌ Outdated information (2023 or older)
- ❌ Vague recommendations

---

## 🔧 Troubleshooting

**Agent gives generic answers:**
→ Update agent prompt with more specific context

**Agent is slower:**
→ Agent might be overthinking, simplify the prompt

**Agent misses issues:**
→ Add examples of what to look for in the prompt

**Results directory empty:**
→ Check you're in opencode root directory
→ Make sure scripts are executable: `chmod +x .opencode/scripts/*`

---

## 📈 Tracking Improvements

Run tests periodically:

```bash
# Week 1: Initial baseline
./.opencode/scripts/run-tests.sh

# Week 2: After refining prompts
./.opencode/scripts/run-tests.sh

# Compare
python3 .opencode/scripts/analyze-results.py .opencode/test-results
```

Results are timestamped - you can track improvements over time!

---

## 💡 Tips

1. **Read the actual output** - Numbers lie, quality matters
2. **Test on real tasks** - Not just these synthetic tests
3. **Iterate on prompts** - If results are bad, refine and retest
4. **Know your baseline** - Is it actually better than just asking?

---

## 🎯 Bottom Line

**Good test results:**
- Agent is 20%+ faster
- Gives specific, accurate answers
- Finds issues baseline misses
- Uses recent sources

**If you see this → Keep the agents!**

**Bad test results:**
- Slower or same speed
- Generic or wrong answers
- Misses issues
- Outdated info

**If you see this → Refine or remove the agent!**

---

## 📝 Next Steps

After running tests:

1. **Good results?** → Start using agents in real work
2. **Mixed results?** → Refine prompts, retest
3. **Bad results?** → Debug or remove ineffective agents
4. **No clear winner?** → Use what feels better to YOU

**Measure. Iterate. Trust the data.**
