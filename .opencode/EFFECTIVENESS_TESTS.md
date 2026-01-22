# OpenCode Agent Effectiveness Testing Framework

Rigorous, measurable tests to evaluate agent performance vs baseline.

---

## 🎯 Testing Methodology

### Principles

1. **Measurable outcomes** - Time, accuracy, token usage
2. **Realistic tasks** - Real work, not toy examples
3. **Controlled comparison** - Agent vs no-agent vs manual
4. **Repeatable** - Same test multiple times
5. **Documented** - Track all results

### What We Measure

- ⏱️ **Time to completion** (wall clock time)
- 🎯 **Accuracy** (correct vs incorrect suggestions)
- 💰 **Token usage** (cost efficiency)
- 🔄 **Iterations needed** (how many back-and-forth)
- ✅ **Completeness** (did it catch everything?)

---

## 📋 Test Suite

### Test 1: Code Review Accuracy

**Task:** Review a file with known issues

**Setup:**
1. Take provider.ts (has known issues we found earlier)
2. Count actual issues: 3 (type safety, validation, race condition)

**Tests:**

**A. Baseline (No Agent):**
```bash
time opencode run "Review provider.ts and list all issues"
```

**B. With Code Reviewer Agent:**
```bash
time opencode run --agent code-reviewer "Review provider.ts and list all issues"
```

**C. Manual Review:**
Your own review as ground truth

**Metrics:**
- Time: Seconds
- Issues found: Count
- False positives: Count
- Severity accuracy: Correct/Total

**Success Criteria:**
- Agent finds ≥90% of real issues
- Agent has <20% false positive rate
- Agent is faster than baseline

---

### Test 2: Project Context Effectiveness

**Task:** Answer codebase structure questions

**Questions (Known Answers):**
1. "Where do CLI commands go?" → `cli/cmd/`
2. "What's the naming convention for files?" → kebab-case
3. "Where is provider management implemented?" → `cli/cmd/provider.ts`
4. "What TypeScript practices should be avoided?" → `any` types
5. "Where do I register a new command?" → `src/index.ts`

**Tests:**

**A. Baseline (No Agent):**
```bash
time opencode run "Where do CLI commands go in this codebase?"
```

**B. With Project Agent:**
```bash
time opencode run --agent opencode-project "Where do CLI commands go in this codebase?"
```

**Metrics:**
- Correctness: Right/Wrong
- Specificity: Generic/Specific (with file paths)
- Time: Seconds
- Token usage: Count

**Success Criteria:**
- 100% correct answers
- Specific file paths included
- Faster than baseline
- Uses fewer tokens

---

### Test 3: Task Delegation Context Preservation

**Task:** Multi-step task with reviews

**Baseline (No Delegation):**
```bash
time opencode run "Review provider.ts, then suggest refactorings,
then explain where to add tests"
```

**With Delegation:**
```bash
time opencode run "Delegate review of provider.ts to code-reviewer.
Based on the results, suggest refactorings. Then tell me where to add tests."
```

**Metrics:**
- Total time: Seconds
- Main context tokens used: Count
- Clarity of final response: 1-5 scale
- Can you easily find the refactoring suggestions? Yes/No

**Success Criteria:**
- Main context stays focused
- Final answer is clear and actionable
- Similar or faster time
- Lower token usage in main context

---

### Test 4: Research Task Quality

**Task:** Find best practices for a technology

**Question:** "What are the best practices for CLI argument parsing in 2025?"

**Tests:**

**A. Baseline:**
```bash
time opencode run "What are the best practices for CLI argument parsing in 2025?"
```

**B. With Research Agent:**
```bash
time opencode run --agent research "What are the best practices for CLI argument parsing in 2025?"
```

**Metrics:**
- Recency: References from 2024-2025? Yes/No
- Sources: Number of cited sources
- Actionability: Can you implement from this? Yes/No
- Time: Seconds

**Success Criteria:**
- Recent sources (2024+)
- ≥3 specific recommendations
- Actionable (not vague)
- Cites sources

---

### Test 5: Iteration Speed

**Task:** Refine a solution through multiple iterations

**Scenario:** "Write a function to validate email addresses"

**Baseline:**
```bash
Iteration 1: "Write email validator"
Iteration 2: "Add RFC 5322 compliance"
Iteration 3: "Add tests"
Iteration 4: "Handle edge cases"
```

**With Context Agent:**
```bash
opencode run --agent opencode-project "Write email validator following our conventions"
# Should already include: TypeScript types, no 'any', tests, etc.
```

**Metrics:**
- Iterations needed: Count
- Total time: Seconds
- Quality of first attempt: 1-5 scale
- Follows project conventions: Yes/No

**Success Criteria:**
- Fewer iterations needed
- First attempt includes project patterns
- Faster total time

---

## 🧪 How to Run Tests

### Single Test

```bash
# Create test results directory
mkdir -p .opencode/test-results

# Run test with timing
time opencode run --agent code-reviewer "Review provider.ts" \
  > .opencode/test-results/test1-agent-$(date +%s).txt 2>&1

time opencode run "Review provider.ts" \
  > .opencode/test-results/test1-baseline-$(date +%s).txt 2>&1
```

### Full Test Suite

```bash
# Run the automated test suite
./run-effectiveness-tests.sh
```

---

## 📊 Results Template

### Test Results: [Date]

**Test 1: Code Review Accuracy**

| Metric | Baseline | Agent | Manual | Winner |
|--------|----------|-------|--------|--------|
| Time | 15.2s | 12.3s | 120s | Agent |
| Issues found | 2/3 | 3/3 | 3/3 | Agent |
| False positives | 1 | 0 | 0 | Agent |
| Severity correct | 1/2 | 3/3 | 3/3 | Agent |

**Conclusion:** Agent found all issues, no false positives, 19% faster

---

**Test 2: Project Context**

| Question | Baseline Correct? | Agent Correct? | Agent Faster? | Winner |
|----------|-------------------|----------------|---------------|--------|
| CLI location | ❌ Generic | ✅ Specific | ✅ | Agent |
| Naming convention | ✅ | ✅ | ✅ | Agent |
| Provider location | ❌ Wrong | ✅ Exact path | ✅ | Agent |
| Anti-patterns | ❌ Vague | ✅ Specific | ✅ | Agent |
| Register command | ❌ Generic | ✅ Exact file | ✅ | Agent |

**Conclusion:** 5/5 correct with specific paths vs 1/5 for baseline

---

**Test 3: Context Preservation**

| Metric | Baseline | With Delegation | Winner |
|--------|----------|-----------------|--------|
| Total time | 24.5s | 18.2s | Delegation |
| Main tokens | 1200 | 400 | Delegation |
| Final clarity | 2/5 | 4/5 | Delegation |
| Easy to find info | No | Yes | Delegation |

**Conclusion:** Delegation preserved context, easier to parse results

---

## 🔬 Advanced Tests

### Test 6: Token Efficiency

**Measure:** Tokens used per task completion

```bash
# Enable token tracking
opencode run --log-level DEBUG "task" 2>&1 | grep tokens
```

**Compare:**
- Baseline: Full context every time
- Project agent: Context pre-loaded
- Delegation: Context isolated

**Expected:** Project agent uses fewer tokens for repeated questions

---

### Test 7: Multi-Task Parallel Effectiveness

**Task:** 3 independent analyses

**Sequential:**
```bash
time (
  opencode run "Analyze auth.ts" && \
  opencode run "Analyze provider.ts" && \
  opencode run "Analyze config.ts"
)
```

**With Delegation (Pseudo-Parallel):**
```bash
time opencode run "Delegate analysis of auth.ts, provider.ts, and config.ts to code-reviewer. Run them and collect results."
```

**Metrics:**
- Total time: Seconds
- Actual parallelism: Yes/No (check process spawns)
- Results quality: Same/Different

---

### Test 8: Long-Term Context Memory

**Test over multiple sessions:**

Session 1:
```bash
opencode run "We're using yargs for CLI parsing"
```

Session 2 (next day):
```bash
opencode run "What CLI library are we using?"
```

**Baseline:** Won't remember → wrong answer
**With memory plugin:** Should remember → correct answer

---

## 📈 Benchmark Tracking

### Results Database

Track results over time in CSV:

```csv
Date,Test,Variant,Time,Accuracy,Tokens,Notes
2025-12-24,CodeReview,Baseline,15.2,66%,1200,Found 2/3 issues
2025-12-24,CodeReview,Agent,12.3,100%,980,Found 3/3 issues
2025-12-24,ProjectContext,Baseline,18.1,20%,1400,Generic answers
2025-12-24,ProjectContext,Agent,8.5,100%,600,Specific paths
```

### Visualization

```bash
# Generate comparison charts
python3 scripts/analyze-effectiveness.py .opencode/test-results/
```

---

## 🎯 Success Metrics

### Overall Agent Effectiveness

Agent is **EFFECTIVE** if:
- ✅ ≥80% accuracy on known tasks
- ✅ ≥20% time savings vs baseline
- ✅ ≥30% token savings (context efficiency)
- ✅ Higher quality first attempts (fewer iterations)

Agent is **INEFFECTIVE** if:
- ❌ <60% accuracy
- ❌ Slower than baseline
- ❌ More tokens used
- ❌ More iterations needed

---

## 🔧 Automated Test Runner

Create `.opencode/scripts/run-tests.sh`:

```bash
#!/bin/bash
# Automated effectiveness test suite

RESULTS_DIR=".opencode/test-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Running OpenCode Effectiveness Tests - $TIMESTAMP"

# Test 1: Code Review
echo "Test 1: Code Review Accuracy"
echo "Baseline..."
time opencode run "Review packages/opencode/src/cli/cmd/provider.ts for issues" \
  > "$RESULTS_DIR/test1_baseline_$TIMESTAMP.txt" 2>&1

echo "With Agent..."
time opencode run --agent code-reviewer "Review packages/opencode/src/cli/cmd/provider.ts for issues" \
  > "$RESULTS_DIR/test1_agent_$TIMESTAMP.txt" 2>&1

# Test 2: Project Context
echo "Test 2: Project Context"
QUESTIONS=(
  "Where do CLI commands go?"
  "What is the file naming convention?"
  "Where is provider management implemented?"
)

for i in "${!QUESTIONS[@]}"; do
  echo "Question $((i+1)): ${QUESTIONS[$i]}"

  echo "Baseline..."
  time opencode run "${QUESTIONS[$i]}" \
    > "$RESULTS_DIR/test2_q${i}_baseline_$TIMESTAMP.txt" 2>&1

  echo "With Agent..."
  time opencode run --agent opencode-project "${QUESTIONS[$i]}" \
    > "$RESULTS_DIR/test2_q${i}_agent_$TIMESTAMP.txt" 2>&1
done

# Test 3: Delegation
echo "Test 3: Context Preservation"
echo "Baseline..."
time opencode run "Review provider.ts, then suggest refactorings based on the issues found" \
  > "$RESULTS_DIR/test3_baseline_$TIMESTAMP.txt" 2>&1

echo "With Delegation..."
time opencode run "Delegate provider.ts review to code-reviewer, then suggest refactorings based on the results" \
  > "$RESULTS_DIR/test3_delegation_$TIMESTAMP.txt" 2>&1

echo ""
echo "Tests complete! Results in $RESULTS_DIR"
echo "Analyze with: python3 scripts/analyze-results.py $RESULTS_DIR"
```

---

## 📊 Analysis Script

Create `.opencode/scripts/analyze-results.py`:

```python
#!/usr/bin/env python3
"""
Analyze OpenCode effectiveness test results
"""
import os
import re
import sys
from pathlib import Path
from datetime import datetime

def extract_time(filename):
    """Extract execution time from test output"""
    with open(filename) as f:
        content = f.read()
        # Look for 'real 0m12.345s' pattern
        match = re.search(r'real\s+(\d+)m([\d.]+)s', content)
        if match:
            minutes = int(match.group(1))
            seconds = float(match.group(2))
            return minutes * 60 + seconds
    return None

def count_tokens(filename):
    """Estimate token count from output"""
    with open(filename) as f:
        content = f.read()
        # Rough estimate: ~4 chars per token
        return len(content) // 4

def analyze_test_results(results_dir):
    results_path = Path(results_dir)

    print("=== OpenCode Effectiveness Analysis ===\n")

    # Group files by test
    tests = {}
    for f in results_path.glob("test*_*.txt"):
        match = re.match(r'test(\d+)_(\w+)_', f.name)
        if match:
            test_num = match.group(1)
            variant = match.group(2)
            if test_num not in tests:
                tests[test_num] = {}
            tests[test_num][variant] = f

    # Analyze each test
    for test_num in sorted(tests.keys()):
        print(f"Test {test_num} Results:")
        variants = tests[test_num]

        for variant, filepath in variants.items():
            time = extract_time(filepath)
            tokens = count_tokens(filepath)

            print(f"  {variant:15} - Time: {time:6.2f}s  Tokens: {tokens:5}")

        # Calculate improvements
        if 'baseline' in variants and 'agent' in variants:
            baseline_time = extract_time(variants['baseline'])
            agent_time = extract_time(variants['agent'])

            if baseline_time and agent_time:
                improvement = ((baseline_time - agent_time) / baseline_time) * 100
                print(f"  → Agent is {improvement:+.1f}% faster")

        print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: analyze-results.py <results_directory>")
        sys.exit(1)

    analyze_test_results(sys.argv[1])
```

---

## 🎯 How to Use This Framework

### 1. Initial Baseline

```bash
# Run tests to establish baseline
chmod +x .opencode/scripts/run-tests.sh
./.opencode/scripts/run-tests.sh
```

### 2. Analyze Results

```bash
# View analysis
python3 .opencode/scripts/analyze-results.py .opencode/test-results/
```

### 3. Iterate

If agents underperform:
- Refine prompts
- Adjust agent configurations
- Re-run tests
- Compare improvements

### 4. Track Over Time

```bash
# Run weekly/monthly
./.opencode/scripts/run-tests.sh

# Compare trends
python3 scripts/compare-trends.py .opencode/test-results/
```

---

## 📝 Manual Evaluation Checklist

Some things need human judgment:

### Code Review Quality (1-5 scale)

- [ ] Found critical bugs? (5 = all, 1 = none)
- [ ] False positives? (5 = none, 1 = many)
- [ ] Actionable suggestions? (5 = very, 1 = not)
- [ ] Correct severity? (5 = accurate, 1 = wrong)

### Project Context Accuracy (Yes/No)

- [ ] Gave correct file paths?
- [ ] Referenced actual code patterns?
- [ ] Followed project conventions?
- [ ] Specific vs generic answers?

### Delegation Clarity (1-5 scale)

- [ ] Main context stayed clean? (5 = very, 1 = not)
- [ ] Results easy to parse? (5 = easy, 1 = hard)
- [ ] Actionable final output? (5 = very, 1 = not)

---

## 🎓 Expected Results

Based on design, we expect:

**Project Context Agent:**
- ✅ 90-100% accuracy on codebase questions
- ✅ 30-50% faster (context already loaded)
- ✅ More specific answers (file paths, patterns)

**Code Reviewer Agent:**
- ✅ 80-95% issue detection
- ✅ <10% false positive rate
- ✅ Consistent severity assessment

**Task Delegation:**
- ✅ 40-60% token savings in main context
- ✅ Clearer final results
- ⚠️ Similar total time (overhead exists)

**Research Agent:**
- ✅ Recent sources (2024-2025)
- ✅ Multiple specific recommendations
- ✅ Cited sources

If results don't match expectations → investigate and iterate!

---

## 💡 Key Insight

**Measure what matters to YOU:**
- If you value speed → optimize for time
- If you value accuracy → optimize for correctness
- If you value cost → optimize for tokens
- If you value clarity → optimize for output structure

**This framework lets you measure all of them objectively.**

No more guessing if something is "better" - you'll have data!
