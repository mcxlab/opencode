# What's ACTUALLY Useful in OpenCode Ecosystem

Based on real testing and evidence, not marketing claims.

---

## ✅ **Proven Useful**

### 1. **Custom Agents with Good Prompts**

**Evidence:** Your code-reviewer agent found real issues in provider.ts:
- Type safety problems
- Race conditions
- Missing validation

**Why it works:**
- Focused role = better results
- Constraints prevent scope creep
- Structured output = actionable feedback

**Cost:** Zero (just a .md file)
**Effort:** 10 minutes to write
**ROI:** High - use it repeatedly

**Verdict:** ✅ **HIGHLY USEFUL**

---

### 2. **Custom Provider Management** (What YOU Built)

**Evidence:** Working in your custom build
- Easy to add custom models
- No manual JSON editing
- Works with your Bifrost setup

**Why it works:**
- Solves a real pain point
- You understand every line
- Tailored to YOUR workflow

**Cost:** One-time development
**Effort:** Already done
**ROI:** Saves time every time you add a model

**Verdict:** ✅ **HIGHLY USEFUL** (and you own it!)

---

### 3. **Project-Specific Context**

**Agents that know YOUR codebase:**

Example from docs agent:
```markdown
# Project Context Agent

You work on [project name].
Stack: TypeScript, Bun, React
Conventions:
- No 'any' types
- Kebab-case for files
- Tests next to code
```

**Why it works:**
- Consistent with your patterns
- Faster than explaining every time
- No generic boilerplate

**Cost:** 5 minutes to document
**Effort:** Low
**ROI:** High for repeated work

**Verdict:** ✅ **USEFUL**

---

### 4. **Background Tasks for Long Operations**

**When it's useful:**
- Builds (npm run build) while you work
- Test suites running while you code
- Large downloads/clones

**NOT useful for:**
- Quick commands (<5s)
- Most normal coding

**Evidence:** Works but has overhead

**Verdict:** ✅ **USEFUL** (for specific cases)

---

## ⚠️ **Maybe Useful (Situational)**

### 5. **Memory/Context Plugins**

**What they do:** Remember conversation context across sessions

**Useful IF:**
- You work on the same project for weeks
- Need to remember decisions/patterns
- Switch between multiple projects

**Not useful IF:**
- One-off tasks
- Projects have good documentation
- You use git commit messages well

**Cost:** Adds latency
**Effort:** Install + configure
**ROI:** Depends on your workflow

**Verdict:** ⚠️ **TRY IT** (if context loss bugs you)

Example: `opencode-plugin-simple-memory@latest`

---

### 6. **MCP Servers (Model Context Protocol)**

**What they do:** Connect to external data sources

**Useful ones:**
- **Filesystem MCP** - Better file operations
- **Git MCP** - Advanced git operations
- **Database MCP** - If you query DBs a lot

**Hyped but questionable:**
- Web search MCP (bash + curl works)
- Documentation MCP (just use docs directly)

**Verdict:** ⚠️ **EVALUATE CASE-BY-CASE**

Only add if you have a specific pain point.

---

## ❌ **Not Actually Useful (Yet)**

### 7. **LSP Integration**

**Why it exists:** Semantic code understanding

**Why it doesn't help:**
- AI doesn't use it automatically
- Requires manual prompting
- Bash works fine for most cases

**When it MIGHT be useful:**
- Large codebases (10k+ files)
- Type-heavy TypeScript
- If AI tooling improves

**Verdict:** ❌ **SKIP FOR NOW**

---

### 8. **Complex Multi-Agent Orchestration**

**The promise:** "7 specialized agents working in parallel!"

**The reality:**
- More overhead than benefit
- AI doesn't coordinate well
- Debugging is harder
- Costs more tokens

**Evidence:** Our "parallel" test was SLOWER

**When it MIGHT help:**
- Truly independent tasks (rare)
- 10+ minute operations
- If you manually orchestrate

**Verdict:** ❌ **NOT WORTH THE COMPLEXITY**

---

### 9. **Oh-My-OpenCode (Full Suite)**

**What you get:**
- 7 agents
- 21 hooks
- 11 LSP tools
- Multiple MCPs

**What you need:**
- Maybe 1-2 agents
- 1-2 hooks
- 0 LSP tools (for now)
- 0-1 MCPs

**The problem:**
- Complexity you don't need
- Harder to debug
- Don't understand it
- Can't iterate on it

**Verdict:** ❌ **TOO MUCH**

Better to build what YOU need.

---

## 🎯 **The Useful Pattern**

What actually works:

1. **Identify specific pain** - "Code reviews take too long"
2. **Build minimal solution** - Simple agent with focused prompt
3. **Use it for real work** - Not toy examples
4. **Iterate if helpful** - Add complexity only when needed
5. **Skip if not helpful** - Don't force it

---

## 📋 **Recommended Setup**

Based on evidence, here's what's worth having:

### **Core (Keep These):**

```json
{
  "plugin": [
    "@zenobius/opencode-background@latest"  // For long operations
  ]
}
```

### **Agents (Create as needed):**

```
.opencode/agent/
├── code-reviewer.md          ✅ Working, useful
├── research.md               ✅ Ready to use
└── [your-specific-need].md   ← Add when you feel the pain
```

### **Plugins (Build when needed):**

```
.opencode/plugin/
├── task-logger.js            ✅ Helps you understand what's happening
└── [specific-tool].js        ← Only if repetitive task
```

---

## 🚫 **What NOT to Add**

### Don't add because it "sounds cool":
- ❌ Complex agent orchestrators
- ❌ Multiple MCPs you don't use
- ❌ LSP tools (until AI uses them better)
- ❌ "All-in-one" plugin suites

### Only add when:
- ✅ You have a specific problem
- ✅ Simpler solutions don't work
- ✅ You can measure improvement
- ✅ You understand what it does

---

## 💰 **Value Analysis**

| Feature | Setup Time | Ongoing Cost | Actual Benefit | Worth It? |
|---------|-----------|--------------|----------------|-----------|
| Custom agents | 10 min | None | High | ✅ YES |
| Project context | 5 min | None | Medium-High | ✅ YES |
| Background tasks | 0 (npm) | Small | Situational | ✅ YES |
| Provider management | Done | None | High (for you) | ✅ YES |
| Task logger | Done | Tiny | Low-Medium | ⚠️ MAYBE |
| Memory plugin | 5 min | Medium | Depends | ⚠️ TRY IT |
| Oh-My-OpenCode | 1 hour | High | Low | ❌ NO |
| LSP tools | 0 (built-in) | Medium | Currently low | ❌ NO |
| Complex orchestration | Hours | High | Negative | ❌ NO |

---

## 🎓 **Lessons Learned**

### 1. **Marketing ≠ Reality**
"High performance async agents" tested slower in practice.

### 2. **Simple Wins**
Your code-reviewer.md (10 lines) found real bugs.
Oh-My-OpenCode (1000+ lines) is overkill.

### 3. **Ownership Matters**
Features you build and understand > features you install and hope.

### 4. **Measure, Don't Assume**
We tested async. It was slower. Data > hype.

### 5. **Solve Real Problems**
Add features when you feel pain, not because they exist.

---

## ✅ **Your Current Setup (Actually Good)**

What you have now:

1. ✅ Custom provider management (YOUR code)
2. ✅ Code reviewer agent (focused, useful)
3. ✅ Research agent (ready when needed)
4. ✅ Background plugin (available for long tasks)
5. ✅ Task logger (visibility into what's happening)
6. ✅ Your Bifrost setup (local models)

**This is lean, effective, and you own it all.**

---

## 🎯 **Next Useful Thing to Add**

Based on your workflow, consider:

### **Option 1: Project Context Agent**
```markdown
# OpenCode Project Agent

You're working on the OpenCode CLI tool.

Key files:
- provider.ts - Provider management
- index.ts - CLI entry point
- config.ts - Configuration

Never use 'any' types.
Always use const over let.
Tests go next to source files.
```

**Why:** Consistent suggestions, faster responses

### **Option 2: Commit Message Agent**
If you commit often, saves time.

### **Option 3: Error Explainer Plugin**
Intercepts errors, suggests fixes automatically.

### **Option 4: Nothing**
Your setup is already good. Use it and see what you actually need.

---

## 📖 **Bottom Line**

**Actually Useful:**
1. Focused agents with good prompts ✅
2. Project-specific context ✅
3. Background tasks (for long ops) ✅
4. Your own features (provider mgmt) ✅

**Not Useful (Yet):**
1. LSP integration ❌
2. Complex orchestration ❌
3. Kitchen-sink plugins ❌
4. Features you don't understand ❌

**Your approach is right:** Build and iterate on your own.

Start simple, add complexity only when you feel the pain.
