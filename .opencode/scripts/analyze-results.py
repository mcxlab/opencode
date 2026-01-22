#!/usr/bin/env python3
"""
Analyze OpenCode effectiveness test results
"""
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

def extract_time(filepath):
    """Extract execution time from test output"""
    try:
        with open(filepath) as f:
            content = f.read()
            # Look for 'real 0m12.345s' pattern
            match = re.search(r'real\s+(\d+)m([\d.]+)s', content)
            if match:
                minutes = int(match.group(1))
                seconds = float(match.group(2))
                return minutes * 60 + seconds
    except:
        pass
    return None

def count_output_size(filepath):
    """Count output size (proxy for tokens)"""
    try:
        with open(filepath) as f:
            content = f.read()
            # Remove timing lines
            content = re.sub(r'real\s+\d+m[\d.]+s.*', '', content)
            # Estimate tokens (rough: ~4 chars per token)
            return len(content) // 4
    except:
        pass
    return None

def count_specific_items(filepath):
    """Count specific items mentioned (file paths, issues, etc.)"""
    try:
        with open(filepath) as f:
            content = f.read()
            # Count file paths mentioned
            paths = len(re.findall(r'packages/[\w/.-]+\.ts', content))
            # Count issue markers
            issues = len(re.findall(r'\b(CRITICAL|HIGH|MEDIUM|LOW)\b', content, re.IGNORECASE))
            return {'paths': paths, 'issues': issues}
    except:
        pass
    return {'paths': 0, 'issues': 0}

def analyze_test_results(results_dir):
    results_path = Path(results_dir)

    print("=" * 60)
    print("OpenCode Agent Effectiveness Analysis")
    print("=" * 60)
    print()

    # Get latest timestamp
    all_files = list(results_path.glob("test*_*.txt"))
    if not all_files:
        print("No test results found!")
        return

    # Extract timestamps
    timestamps = set()
    for f in all_files:
        match = re.search(r'_(\d{8}_\d{6})\.txt$', f.name)
        if match:
            timestamps.add(match.group(1))

    latest_ts = max(timestamps) if timestamps else None
    print(f"Latest test run: {latest_ts}")
    print()

    # Group by test number
    tests = defaultdict(dict)
    for f in all_files:
        if latest_ts not in f.name:
            continue

        # Parse filename: test1_baseline_20251224_123456.txt
        match = re.match(r'test(\d+)_(\w+)_', f.name)
        if match:
            test_num = int(match.group(1))
            variant = match.group(2)
            tests[test_num][variant] = f

    # Analyze each test
    for test_num in sorted(tests.keys()):
        variants = tests[test_num]

        if test_num == 1:
            print("┌─ Test 1: Code Review Accuracy")
        elif test_num == 2:
            print("┌─ Test 2: Project Context (aggregated)")
        elif test_num == 3:
            print("┌─ Test 3: Context Preservation")
        elif test_num == 4:
            print("┌─ Test 4: Research Quality")

        print("│")

        # Show metrics for each variant
        results = {}
        for variant, filepath in sorted(variants.items()):
            time_val = extract_time(filepath)
            tokens = count_output_size(filepath)
            specifics = count_specific_items(filepath)

            results[variant] = {
                'time': time_val,
                'tokens': tokens,
                'specifics': specifics
            }

            print(f"│  {variant:15s} → Time: {time_val:6.1f}s  |  Tokens: ~{tokens:4d}  |  Paths: {specifics['paths']}  Issues: {specifics['issues']}")

        # Calculate improvements
        if 'baseline' in results and 'agent' in results:
            baseline = results['baseline']
            agent = results['agent']

            if baseline['time'] and agent['time']:
                time_improvement = ((baseline['time'] - agent['time']) / baseline['time']) * 100
                print(f"│")
                print(f"│  ⚡ Time: {time_improvement:+.1f}% ({'faster' if time_improvement > 0 else 'slower'})")

            if baseline['tokens'] and agent['tokens']:
                token_improvement = ((baseline['tokens'] - agent['tokens']) / baseline['tokens']) * 100
                print(f"│  💰 Tokens: {token_improvement:+.1f}% ({'fewer' if token_improvement > 0 else 'more'})")

            if test_num == 1:  # Code review
                if agent['specifics']['issues'] > baseline['specifics']['issues']:
                    print(f"│  🎯 Issues: Agent found MORE issues ({agent['specifics']['issues']} vs {baseline['specifics']['issues']})")
                else:
                    print(f"│  🎯 Issues: Similar count ({agent['specifics']['issues']} vs {baseline['specifics']['issues']})")

            if test_num == 2:  # Project context
                if agent['specifics']['paths'] > baseline['specifics']['paths']:
                    print(f"│  📁 Specificity: Agent gave MORE specific paths ({agent['specifics']['paths']} vs {baseline['specifics']['paths']})")

        print("└─" + "─" * 58)
        print()

    # Overall summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print()
    print("Review individual files for qualitative analysis:")
    print(f"  ls -lh {results_dir}/*{latest_ts}*")
    print()
    print("Check for:")
    print("  ✓ Accuracy: Did agent give correct answers?")
    print("  ✓ Specificity: File paths vs generic answers?")
    print("  ✓ Completeness: Found all issues?")
    print("  ✓ False positives: Reported non-issues?")
    print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: analyze-results.py <results_directory>")
        print("Example: analyze-results.py .opencode/test-results")
        sys.exit(1)

    analyze_test_results(sys.argv[1])
