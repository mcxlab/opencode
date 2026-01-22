# Task Delegation Guide

How to use project context and subagent delegation effectively.

---

## 🎯 Project Context Agent

### What It Does

Knows YOUR OpenCode codebase:
- File structure and key files
- Code conventions and patterns
- Recent work (provider management)
- Custom setup (Bifrost, local models)
- Anti-patterns to avoid

### When to Use

**Instead of:**
```
"Create a new CLI command following the patterns used in this codebase"
```

**Use the project agent:**
```bash
opencode run --agent opencode-project "Create a new CLI command for managing agents"
```

The agent already knows:
- Where commands go (`cli/cmd/`)
- How to structure them (`cmd()` helper)
- Where to register them (`src/index.ts`)
- Naming conventions (kebab-case)
- TypeScript patterns (no `any`)

### Benefits

✅ No repeating project context every time
✅ Consistent with your patterns
✅ Faster responses (less context to process)
✅ References actual file paths

---

## 🔀 Task Delegation Plugin

### What It Does

Delegate focused subtasks to specialized agents while keeping your main conversation clean.

**The Problem:**
```
Main conversation:
- You: "Refactor the provider management code"
- AI: "Let me analyze the code..."
- AI: [reads 10 files]
- AI: [does research]
- AI: [analyzes patterns]
- You: [your context is now buried in noise]
```

**The Solution:**
```
Main conversation:
- You: "Refactor the provider management code"
- AI: [delegates analysis to code-reviewer]
- AI: "Code review completed. Found 3 issues..."
- Your main context: Clean and preserved!
```

### How to Use

#### Manual Delegation

Prompt the AI to delegate:
```
"Delegate to code-reviewer: analyze provider.ts for improvements"
"Ask research agent to find best practices for CLI design"
"Have opencode-project agent suggest where to add the new feature"
```

#### Tool-Based Delegation

The plugin provides a `delegate_task` tool:
```javascript
delegate_task({
  agent: "code-reviewer",
  task: "Analyze provider.ts for type safety issues",
  context: "Focus on the ProviderAddCommand function"
})
```

### Example Workflows

#### Workflow 1: Code Review During Refactor

```
You: "I'm refactoring provider.ts. Delegate a code review to code-reviewer
     while I continue planning the changes."

AI: [Uses delegate_task tool]
    Delegating to code-reviewer...

AI: "Code review complete. Found:
     - 3 type safety issues
     - 1 race condition

     Meanwhile, here's my refactoring plan..."
```

Your main context stays clean!

#### Workflow 2: Research While Coding

```
You: "I'm implementing a new feature. Have the research agent find
     best practices for CLI progress indicators while I write the basic structure."

AI: [Delegates to research agent]
    Researching CLI progress indicators...

AI: "Research complete: Recommends using ora or cli-spinners.

     Now, here's the basic structure for your feature..."
```

#### Workflow 3: Multiple Parallel Subtasks

```
You: "I need to:
     1. Review the auth.ts code
     2. Research OAuth best practices
     3. Check how the config system works

     Delegate these tasks to appropriate agents."

AI: [Delegates to code-reviewer, research, and opencode-project]
    All tasks delegated...

AI: "Results from all three agents:
     1. Auth code review: [summary]
     2. OAuth research: [findings]
     3. Config system: [explanation]"
```

---

## 🎓 When to Delegate vs When Not To

### ✅ Good for Delegation:

1. **Code reviews** - Focused analysis without cluttering main thread
2. **Research** - Find info while continuing other work
3. **Specific questions** - "How does X work in this codebase?"
4. **Repetitive checks** - Security review, style check, etc.

### ❌ Don't Delegate:

1. **Conversational context needed** - "Based on what we discussed..."
2. **Iterative refinement** - "Now adjust that to..."
3. **Simple questions** - Overhead > benefit
4. **Requires main context** - Agent needs to know the full conversation

---

## 💡 Best Practices

### 1. Be Specific in Delegated Tasks

**Bad:**
```
"Review the code"
```

**Good:**
```
"Delegate to code-reviewer: Analyze provider.ts lines 140-150
 for the type safety issue we discussed. Focus on the finalNpmPackage variable."
```

### 2. Provide Context When Needed

```javascript
delegate_task({
  agent: "code-reviewer",
  task: "Review the new authentication flow",
  context: "We're migrating from API keys to OAuth. Focus on security concerns."
})
```

### 3. Use Project Agent for Codebase Questions

**Instead of:**
```
"Where should I add a new command?"
```

**Better:**
```
opencode run --agent opencode-project "Where should I add a command for managing MCP servers?"
```

The agent knows the structure and will give you exact paths.

### 4. Chain Delegations for Complex Work

```
Main: "Refactor auth system"
 ├─> Delegate to code-reviewer: "Analyze current auth.ts"
 ├─> Delegate to research: "Find OAuth 2.1 best practices"
 └─> Delegate to opencode-project: "Show me where auth hooks into the system"

Main: [Synthesizes results and plans refactor]
```

---

## 📊 Delegation Patterns

### Pattern 1: Review-Then-Refactor

```
1. Delegate code review
2. Get issues list
3. Refactor based on issues (in main context)
4. Delegate another review
5. Iterate
```

Keeps your refactoring work in main context, reviews are separate.

### Pattern 2: Research-Then-Implement

```
1. Delegate research to gather info
2. Get recommendations
3. Implement in main context (where you can iterate)
4. Delegate review of implementation
```

### Pattern 3: Parallel Information Gathering

```
1. Delegate 3 research tasks
2. All run independently
3. Collect results
4. Synthesize and decide in main context
```

---

## 🔍 Monitoring Delegations

### Check Task History

```
"Show me the task history"
```

The delegator plugin tracks:
- Task ID
- Agent used
- Task description
- Status (running/completed)
- Duration
- Result

### Session Summary

At session end:
```
[Delegator] Session completed 4 delegated task(s)
```

---

## 🛠️ Technical Details

### How It Preserves Context

1. **Separate session** - Subagent runs in its own session
2. **No conversation mixing** - Results returned as data, not messages
3. **Main context intact** - Your conversation continues uninterrupted
4. **Clean results** - Just the answer, not the agent's thinking process

### Under the Hood

```javascript
// Main session continues
client.run({
  prompt: "Your ongoing conversation...",
  sessionID: "main-session-123"
})

// Subagent runs separately
client.run({
  prompt: "Focused subtask...",
  agent: "code-reviewer",
  sessionID: undefined  // New session
})

// Result returns to main session as data
```

---

## 🎯 Quick Reference

| Goal | Command |
|------|---------|
| Use project context | `--agent opencode-project "question"` |
| Delegate code review | `"Delegate to code-reviewer: ..."` |
| Delegate research | `"Delegate to research: ..."` |
| Check task history | `"Show task history"` |
| Multiple delegations | Prompt AI to delegate multiple tasks |

---

## 🚀 Getting Started

### Test Project Context

```bash
opencode run --agent opencode-project "Where should I add a new CLI command?"
```

Should reference actual directories and patterns from YOUR codebase.

### Test Delegation

```bash
opencode run "Delegate to code-reviewer: Quick review of provider.ts for obvious issues"
```

Should run review without cluttering your conversation.

### Test in Workflow

```bash
opencode run "I'm adding a new feature. First, delegate to opencode-project
to understand where it should go, then I'll implement it."
```

---

## 💭 Why This Matters

**Without delegation:**
- Main context gets polluted with review details
- Hard to maintain conversation thread
- Lots of scrolling to find relevant info
- Context window fills up faster

**With delegation:**
- Main context stays clean and focused
- Reviews/research happen "off to the side"
- Results come back concise
- Better use of context window

**Like having a team:** You (main context) stay focused on architecture and decisions. Your teammates (subagents) handle specific tasks and report back.

---

## 📝 Summary

**Two new powerful features:**

1. **Project Context Agent** (`opencode-project.md`)
   - Knows your codebase
   - Saves repeating context
   - Gives specific, relevant answers

2. **Task Delegation Plugin** (`task-delegator.js`)
   - Preserves main conversation context
   - Runs focused subtasks separately
   - Clean results, no clutter

**Start using them:**
- Use project agent for codebase questions
- Delegate reviews and research
- Keep your main context clean and focused

Your workflow just got significantly more efficient! 🚀
