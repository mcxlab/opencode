# Building Your Own OpenCode Extensions

Guide for iterating on custom agents, plugins, and async workflows.

## 🎯 Philosophy

- **Start simple** - Add complexity only when you feel the pain
- **Measure first** - Know what you're optimizing before you optimize
- **Own your code** - Understand every line you add
- **Iterate fast** - Small changes, quick feedback

---

## 📁 Directory Structure

```
.opencode/
├── agent/              # Custom agent definitions
│   ├── code-reviewer.md
│   └── research.md
├── plugin/             # Local plugins (auto-loaded)
│   └── task-logger.js
├── command/            # Slash commands
├── skill/              # Reusable skills
└── mcp/                # MCP server configs
```

---

## 🤖 Custom Agents

### Quick Start

Create a `.md` file in `.opencode/agent/`:

```markdown
# Agent Name

Brief description of what this agent does.

## Your Role
What the agent should focus on

## Guidelines
- How to approach tasks
- What to avoid

## Output Format
How to structure responses
```

### Agent Configuration (Optional)

Add frontmatter for advanced config:

```markdown
---
model: bifrost-ollama/devstral-small-2-100k
temperature: 0.2
tools:
  write: false
  edit: false
---

# Agent Name
...
```

### Tips for Writing Agents

1. **Be specific about role** - "Code reviewer" not "helpful assistant"
2. **Define constraints** - What NOT to do is as important as what to do
3. **Structure output** - Templates make responses consistent
4. **Use examples** - Show don't tell when possible

---

## 🔌 Custom Plugins

### Basic Plugin Template

```javascript
export const MyPlugin = async ({ project, client, $, directory, worktree }) => {
  // Initialize once
  console.log("Plugin loaded!")

  return {
    // Hook into events
    event: async ({ event }) => {
      if (event.type === "session.start") {
        // Do something on session start
      }
    },

    // Add custom tools
    tool: {
      mytool: {
        description: "What this tool does",
        args: {
          input: "string"  // Zod schema shorthand
        },
        async execute(args, ctx) {
          return \`Result: \${args.input}\`
        }
      }
    },

    // Hook into tool execution
    "tool.execute.before": async (input, output) => {
      // Modify or validate before tools run
      console.log(\`About to run: \${input.tool}\`)
    }
  }
}
```

### Available Hooks

- `event` - All OpenCode events
- `tool.execute.before` - Before any tool runs
- `tool.execute.after` - After tool completes
- `config` - Access/modify config
- `auth` - Custom authentication

### Useful Event Types

```javascript
event.type === "session.start"    // New session
event.type === "session.idle"     // Session waiting
event.type === "tool.execute"     // Tool running
event.type === "message.complete" // AI response done
```

---

## 🚀 Building Async Workflows

### Approach 1: Use Background Plugin

Already in your config! Use it like:

```javascript
// In your plugin
const backgroundTask = await client.backgroundTask.create({
  command: "npm run build",
  tag: "build"
})

// Check later
const status = await client.backgroundTask.get(backgroundTask.id)
```

### Approach 2: Custom Async Plugin

```javascript
export const AsyncWorkflow = async ({ client }) => {
  const runningTasks = new Set()

  return {
    tool: {
      async_task: {
        description: "Run a task asynchronously",
        args: { command: "string" },
        async execute(args) {
          const taskId = Math.random().toString(36)
          runningTasks.add(taskId)

          // Start async work
          const process = Bun.spawn({
            cmd: args.command.split(" "),
            stdout: "pipe"
          })

          // Don't await - return immediately
          process.exited.then(() => runningTasks.delete(taskId))

          return \`Task \${taskId} started in background\`
        }
      },

      check_tasks: {
        description: "Check running async tasks",
        args: {},
        async execute() {
          return \`\${runningTasks.size} tasks running\`
        }
      }
    }
  }
}
```

---

## 🔬 Iteration Workflow

### 1. Start with One Thing

Pick ONE pain point:
- "Reviews take too long" → Code reviewer agent
- "I forget context" → Session note-taking plugin
- "Repetitive commands" → Custom slash command

### 2. Build Minimal Version

- Agent: Just the system prompt, no config
- Plugin: Just the event hook you need
- Test with real work, not toy examples

### 3. Measure Impact

Before/after comparison:
- Time saved?
- Quality improved?
- Less frustration?

### 4. Iterate

Only add complexity if you're still feeling pain:
- Add tool restrictions to agents
- Add custom tools to plugins
- Add async if sequential is slow

---

## 📊 Ideas Worth Trying

### High Impact, Low Effort

1. **Project Context Agent**
   - Reads your README, package.json
   - Understands your stack
   - Gives context-aware advice

2. **Error Explainer Plugin**
   - Intercepts error output
   - Automatically searches for solutions
   - Suggests fixes

3. **Review Checklist Command**
   - `/review` runs your custom checks
   - Security, performance, style
   - Consistent every time

### Medium Effort

4. **Multi-Agent Research**
   - Spawn parallel research tasks
   - Web search + docs + code examples
   - Synthesize results

5. **Smart Test Generator**
   - Analyzes function complexity
   - Generates edge cases
   - Uses your testing patterns

### Advanced

6. **Continuous Context**
   - Background agent watches file changes
   - Maintains understanding of codebase
   - Proactive suggestions

7. **Task Decomposition**
   - Breaks large tasks into subtasks
   - Assigns to specialized agents
   - Tracks progress across all

---

## 🎓 Learning from Oh-My-OpenCode

What's actually useful to copy:

### ✅ Take These Ideas:

1. **Focused system prompts** - Clear role definitions
2. **Tool restrictions** - Prevent hallucinated edits
3. **Effort estimates** - "Quick/Short/Medium/Large" labels
4. **Evidence-based responses** - Require links/sources
5. **Parallel execution** - Multiple calls at once

### ❌ Skip the Bloat:

1. Complex agent orchestration (build up to it)
2. 20+ hooks (add when you need them)
3. Multi-model switching (unless you have the budget)
4. "Certified Verified" marketing speak

---

## 🛠️ Quick Commands

```bash
# Test your custom agent
opencode run --agent code-reviewer "Review this file"

# See what agents you have
ls .opencode/agent/

# Check if plugins load
opencode run "echo test" --print-logs

# Debug plugin issues
opencode run "test" --log-level DEBUG
```

---

## 📚 Next Steps

1. **Try the agents I created** - Use code-reviewer and research
2. **Monitor with task-logger** - See what's actually happening
3. **Add your first custom tool** - Something you do repeatedly
4. **Share what you build** - Help others iterate too

Remember: The best tool is the one you actually use. Start small!
