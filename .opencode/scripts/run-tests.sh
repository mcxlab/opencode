#!/bin/bash
# Automated OpenCode Effectiveness Test Suite

set -e

RESULTS_DIR=".opencode/test-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "======================================"
echo "OpenCode Effectiveness Tests"
echo "Timestamp: $TIMESTAMP"
echo "======================================"
echo ""

# Test 1: Code Review Accuracy
echo "▶ Test 1: Code Review Accuracy"
echo "  Testing: Can the agent find known issues in provider.ts?"
echo ""

echo "  [1/2] Baseline (no agent)..."
{ time bun run dev run "Review packages/opencode/src/cli/cmd/provider.ts and list all issues with severity" ; } \
  > "$RESULTS_DIR/test1_baseline_$TIMESTAMP.txt" 2>&1
echo "  ✓ Baseline complete"

echo "  [2/2] With code-reviewer agent..."
{ time bun run dev run --agent code-reviewer "Review packages/opencode/src/cli/cmd/provider.ts and list all issues with severity" ; } \
  > "$RESULTS_DIR/test1_agent_$TIMESTAMP.txt" 2>&1
echo "  ✓ Agent complete"
echo ""

# Test 2: Project Context Effectiveness
echo "▶ Test 2: Project Context (5 questions)"
echo "  Testing: Does project agent give specific, accurate answers?"
echo ""

QUESTIONS=(
  "Where do CLI commands go in this codebase?"
  "What is the file naming convention used?"
  "Where is the provider management feature implemented?"
  "What TypeScript practices should be avoided?"
  "Where do I register a new CLI command?"
)

for i in "${!QUESTIONS[@]}"; do
  echo "  Question $((i+1))/5: ${QUESTIONS[$i]}"

  echo "    [Baseline]..."
  { time bun run dev run "${QUESTIONS[$i]}" ; } \
    > "$RESULTS_DIR/test2_q${i}_baseline_$TIMESTAMP.txt" 2>&1

  echo "    [Agent]..."
  { time bun run dev run --agent opencode-project "${QUESTIONS[$i]}" ; } \
    > "$RESULTS_DIR/test2_q${i}_agent_$TIMESTAMP.txt" 2>&1

  echo "    ✓ Complete"
done
echo ""

# Test 3: Context Preservation with Delegation
echo "▶ Test 3: Context Preservation"
echo "  Testing: Does delegation keep main context clean?"
echo ""

echo "  [1/2] Baseline (no delegation)..."
{ time bun run dev run "Review provider.ts for issues, then based on those issues suggest 3 specific refactorings" ; } \
  > "$RESULTS_DIR/test3_baseline_$TIMESTAMP.txt" 2>&1
echo "  ✓ Baseline complete"

echo "  [2/2] With delegation..."
{ time bun run dev run "Delegate a review of provider.ts to code-reviewer. Then based on the review results, suggest 3 specific refactorings." ; } \
  > "$RESULTS_DIR/test3_delegation_$TIMESTAMP.txt" 2>&1
echo "  ✓ Delegation complete"
echo ""

# Test 4: Research Quality
echo "▶ Test 4: Research Quality"
echo "  Testing: Does research agent find recent, specific info?"
echo ""

echo "  [1/2] Baseline..."
{ time bun run dev run "What are best practices for CLI error handling in TypeScript (2024-2025)?" ; } \
  > "$RESULTS_DIR/test4_baseline_$TIMESTAMP.txt" 2>&1
echo "  ✓ Baseline complete"

echo "  [2/2] With research agent..."
{ time bun run dev run --agent research "What are best practices for CLI error handling in TypeScript (2024-2025)?" ; } \
  > "$RESULTS_DIR/test4_agent_$TIMESTAMP.txt" 2>&1
echo "  ✓ Agent complete"
echo ""

# Summary
echo "======================================"
echo "✓ All tests complete!"
echo "======================================"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "Next steps:"
echo "  1. Review results: ls $RESULTS_DIR/*$TIMESTAMP*"
echo "  2. Analyze: python3 .opencode/scripts/analyze-results.py $RESULTS_DIR"
echo "  3. Manual review: Check accuracy of answers"
echo ""
